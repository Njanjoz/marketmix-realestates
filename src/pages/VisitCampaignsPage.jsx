import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { ArrowRight, CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import { db } from '../firebase/config';

export default function VisitCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const offCampaigns = onSnapshot(collection(db, 'visitCampaigns'), (snapshot) => {
      const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setCampaigns(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.active !== false && item.endDate >= today).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate))));
      setLoading(false);
    }, (error) => { console.error('Could not load visit campaigns:', error); setLoading(false); });
    const offStats = onSnapshot(collection(db, 'visitCampaignStats'), (snapshot) => {
      const result = {};
      snapshot.docs.forEach((item) => { result[item.id] = Number(item.data()?.registeredCount) || 0; });
      setCounts(result);
    });
    return () => { offCampaigns(); offStats(); };
  }, []);

  return <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
    <section className="mx-auto max-w-6xl">
      <Link to="/" className="text-sm font-bold text-emerald-800 underline">← Home</Link>
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-emerald-800">MarketMix group visits</p>
      <h1 className="mt-2 text-3xl font-extrabold text-slate-950 sm:text-4xl">Visit campaigns</h1>
      <p className="mt-3 max-w-2xl text-slate-600">See upcoming group outings, check the price and registration count, and reserve your place with M-Pesa.</p>
      {loading ? <p className="py-16 text-center text-slate-500">Loading campaigns…</p> : campaigns.length === 0 ? <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">There are no open visit campaigns at the moment.</p> : <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => {
          const count = campaign.registrationCountOverride != null ? Number(campaign.registrationCountOverride) || 0 : (Number(counts[campaign.id]) || 0) + (Number(campaign.offlineRegistrationCount) || 0);
          return <Link key={campaign.id} to={`/visit-campaigns/${encodeURIComponent(campaign.id)}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            {campaign.coverImage && <img src={campaign.coverImage} alt="" className="h-48 w-full object-cover" />}
            <div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">{campaign.location}</p><div className="mt-1 flex items-start justify-between gap-3"><h2 className="text-xl font-extrabold text-slate-950">{campaign.title}</h2><span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-900">KSh {Number(campaign.price).toLocaleString('en-KE')}</span></div><p className="mt-2 line-clamp-3 text-sm text-slate-600">{campaign.summary}</p>
              <div className="mt-4 space-y-2 text-xs font-semibold text-slate-600"><p className="flex items-center gap-2"><CalendarDays size={14} />{campaign.startDate} – {campaign.endDate}</p>{campaign.duration && <p className="flex items-center gap-2"><Clock3 size={14} />{campaign.duration}</p>}<p className="flex items-center gap-2"><Users size={14} />{count} registered{campaign.campaignTarget ? ` of ${campaign.campaignTarget} planned` : ''}</p><p className="flex items-center gap-2"><MapPin size={14} />{campaign.location}</p></div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800">Campaign details and registration <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </div>
          </Link>;
        })}
      </div>}
    </section>
  </main>;
}
