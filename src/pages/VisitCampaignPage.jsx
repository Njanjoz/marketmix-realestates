import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, LoaderCircle, MapPin, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, db } from '../firebase/config';
import { startIntaSendCheckout } from '../services/intasendCheckout';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://marketmix-api-native.johnnjanjo1.workers.dev';
const EAT_TODAY = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function authenticatedPost(url, body) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to register for this campaign.');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || 'Could not process campaign registration.');
  return data;
}

export default function VisitCampaignPage() {
  const { campaignId = '' } = useParams();
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [paidRegistrations, setPaidRegistrations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const offCampaign = onSnapshot(doc(db, 'visitCampaigns', campaignId), (snapshot) => {
      setCampaign(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      setLoading(false);
    }, (error) => { console.error('Could not load campaign:', error); setLoading(false); });
    const offStats = onSnapshot(doc(db, 'visitCampaignStats', campaignId), (snapshot) => setPaidRegistrations(Number(snapshot.data()?.registeredCount) || 0));
    return () => { offCampaign(); offStats(); };
  }, [campaignId]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setName((current) => current || userProfile?.fullName || userProfile?.name || currentUser.displayName || '');
    setPhone((current) => current || userProfile?.phoneNumber || userProfile?.phone || currentUser.phoneNumber || '');
  }, [currentUser?.uid, userProfile]);

  const openForRegistration = campaign && campaign.active !== false && campaign.endDate >= EAT_TODAY();
  const price = Number(campaign?.price) || 0;
  const total = price * quantity;

  const pay = async (event) => {
    event.preventDefault();
    if (!currentUser) return navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
    if (!/^\+?[0-9 ()-]{9,20}$/.test(phone.trim())) return toast.error('Enter a valid M-Pesa phone number.');
    setPaying(true);
    try {
      const checkout = await authenticatedPost(`${BACKEND}/api/visit-campaigns/${encodeURIComponent(campaignId)}/checkout`, { attendeeName: name, phoneNumber: phone, participantCount: quantity });
      await startIntaSendCheckout({ amount: checkout.amount, phoneNumber: phone, fullName: name, email: auth.currentUser.email, apiRef: checkout.paymentRef });
      const started = Date.now();
      let paid = false;
      while (Date.now() - started < 180000) {
        const user = auth.currentUser;
        const statusResponse = await fetch(`${BACKEND}/api/visit-campaigns/payment/${encodeURIComponent(checkout.paymentRef)}`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
        const statusData = await statusResponse.json().catch(() => ({}));
        if (statusResponse.ok && statusData.paymentStatus === 'paid') { paid = true; break; }
        if (statusResponse.ok && ['failed', 'cancelled'].includes(String(statusData.paymentStatus).toLowerCase())) throw new Error('M-Pesa payment was not completed. You can try registering again.');
        await new Promise((resolve) => window.setTimeout(resolve, 3500));
      }
      if (!paid) throw new Error(`Payment is taking longer than expected. Keep reference ${checkout.paymentRef} and contact support before paying again.`);
      const confirmation = await authenticatedPost(`${BACKEND}/api/visit-campaigns/confirm`, { paymentRef: checkout.paymentRef });
      setComplete(true);
      toast.success('Campaign registration confirmed.');
      return confirmation;
    } catch (error) {
      console.error('Campaign payment error:', error);
      toast.error(error.message || 'Could not collect campaign payment.');
    } finally { setPaying(false); }
  };

  if (loading) return <main className="mx-auto max-w-4xl p-8 text-center text-slate-600">Loading visit campaign…</main>;
  if (!campaign) return <main className="mx-auto max-w-3xl p-8 text-center"><h1 className="text-2xl font-bold">Campaign not found</h1><Link to="/" className="mt-4 inline-block font-bold text-emerald-800 underline">Return home</Link></main>;
  const liveCount = campaign.registrationCountOverride != null
    ? Number(campaign.registrationCountOverride) || 0
    : paidRegistrations + (Number(campaign.offlineRegistrationCount) || 0);

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
    <div className="mx-auto max-w-5xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-900"><ArrowLeft size={17} /> Back to campaigns</Link>
      <article className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        {campaign.coverImage && <img src={campaign.coverImage} alt={`${campaign.title} campaign poster`} className="max-h-[28rem] w-full bg-slate-100 object-cover" />}
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.1fr_.9fr]">
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-800">MarketMix visit campaign</p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-950 sm:text-4xl">{campaign.title}</h1>
            <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-700">{campaign.summary}</p>
            {Array.isArray(campaign.includes) && campaign.includes.length > 0 && <div className="mt-5 rounded-2xl bg-slate-50 p-4"><h2 className="text-sm font-extrabold text-slate-900">Tour package includes</h2><ul className="mt-2 space-y-1.5 text-sm text-slate-700">{campaign.includes.map((item, index) => <li key={`${index}-${item}`} className="flex gap-2"><span className="text-emerald-700">✓</span><span>{item}</span></li>)}</ul></div>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-950"><MapPin size={17} />{campaign.location || 'Location details to follow'}</p>
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-950"><CalendarDays size={17} />{campaign.startDate} – {campaign.endDate}</p>
              {campaign.duration && <p className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-800"><Clock3 size={17} />{campaign.duration}</p>}
              <p className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm font-semibold text-slate-800"><Users size={17} />{liveCount} registered{campaign.campaignTarget ? ` of ${campaign.campaignTarget} planned` : ''}</p>
            </div>
            <p className="mt-6 text-3xl font-black text-emerald-900">KSh {price.toLocaleString('en-KE')} <span className="text-sm font-semibold text-slate-500">per attendee</span></p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            {complete ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" /><h2 className="mt-3 text-xl font-extrabold text-slate-950">You’re registered</h2><p className="mt-2 text-sm text-slate-600">Your payment was confirmed. Keep the M-Pesa message as your receipt.</p></div> : <>
              <h2 className="text-xl font-extrabold text-slate-950">Register for this campaign</h2>
              {!openForRegistration ? <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">Registration is currently closed.</p> : <form onSubmit={pay} className="mt-4 space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Attendee name<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" /></label>
                <label className="block text-sm font-semibold text-slate-700">M-Pesa phone number<input required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" /></label>
                <label className="block text-sm font-semibold text-slate-700">Number of attendees<input required type="number" min="1" max="10" step="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3" /></label>
                <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Campaign total</span><strong className="text-slate-950">KSh {total.toLocaleString('en-KE')}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-600">M-Pesa transaction fee</span><strong className="text-emerald-800">KSh 0</strong></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-bold text-slate-800">Total to pay</span><strong className="text-lg text-slate-950">KSh {total.toLocaleString('en-KE')}</strong></div>
                  <p className="rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-950">No extra M-Pesa transaction fee is added to your payment. MarketMix covers the collection charge. The M-Pesa prompt will show the total above; check it before entering your PIN.</p>
                </div>
                <p className="text-xs leading-5 text-slate-500">You’ll receive an M-Pesa payment prompt. Registration is confirmed only after the payment provider confirms payment. Review the <Link to="/terms" className="font-bold text-emerald-800 underline">Terms</Link> before paying.</p>
                <button disabled={paying || !price} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60">{paying ? <><LoaderCircle className="animate-spin" size={17} />Waiting for M-Pesa payment…</> : 'Pay with M-Pesa'}</button>
                {!currentUser && <p className="text-center text-xs text-slate-500">You’ll be asked to sign in before registering.</p>}
              </form>}
            </>}
          </section>
        </div>
      </article>
    </div>
  </main>;
}
