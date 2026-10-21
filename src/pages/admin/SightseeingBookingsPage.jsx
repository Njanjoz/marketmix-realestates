import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { RefreshCw, Send, CheckCircle2, Clock3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';
const toYouTubeEmbedUrl = (value = '') => {
  const match = String(value).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
};

export default function SightseeingBookingsPage() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedBookingId = searchParams.get('bookingId') || '';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'sightseeingBookings'));
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => item.refundStatus === 'REQUESTED' || (['available', 'unavailable'].includes(item.availabilityStatus) && item.adminCustomerUpdateStatus !== 'sent') || (item.bookingMode === 'direct_booking' && item.paymentStatus === 'paid' && item.tourStatus !== 'completed') || item.tourStatus === 'awaiting_admin_tour_review' || ((item.directPaymentReference || item.completionPaymentReference || item.availabilityPaymentReference) && !['PAID', 'PAYOUT_SENT', 'PROCESSING'].includes(item.refundStatus)))
        .sort((a, b) => (b.availabilityCheckedAt?.toMillis?.() || 0) - (a.availabilityCheckedAt?.toMillis?.() || 0));
      setBookings(rows);
    } catch (error) {
      console.error('Could not load viewing approvals:', error);
      toast.error('Could not load viewing requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  const notifyCustomer = async (booking) => {
    if (!currentUser) return toast.error('Sign in as an admin to continue.');
    setSendingId(booking.id);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${BACKEND}/api/bookings/site-seeing/${encodeURIComponent(booking.id)}/admin-notify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not notify customer.');
      toast.success(booking.tourStatus === 'awaiting_admin_tour_review' ? 'Tour evidence approved, agent balance credited, and booking assignment released.' : booking.availabilityStatus === 'available' ? 'Vacancy photos and video approved, KSh 25 payout initiated, and customer WhatsApp update queued.' : 'Customer WhatsApp update queued.');
      setBookings((previous) => previous.filter((item) => item.id !== booking.id));
    } catch (error) {
      toast.error(error.message || 'Could not notify customer.');
    } finally {
      setSendingId('');
    }
  };

  const initiateRefund = async (booking) => {
    if (!currentUser) return toast.error('Sign in as an admin to continue.');
    const amount = Number(booking.refundRequestedAmount || booking.packagePaymentAmount || booking.directPaymentAmount || booking.availabilityPaymentAmount || booking.packagePrice || booking.totalPrice || 0);
    const deduction = Math.round(amount * 0.05);
    const afterMaintenance = Math.max(0, Math.floor(amount - deduction));
    const withdrawalFee = afterMaintenance <= 100 ? 10 : afterMaintenance <= 1000 ? 20 : afterMaintenance <= 3000 ? 30 : afterMaintenance <= 5000 ? 50 : afterMaintenance <= 80000 ? 100 : afterMaintenance <= 120000 ? 500 : 1000;
    const net = Math.max(0, afterMaintenance - withdrawalFee);
    if (net < 1) return toast.error('The payment is too small for the configured maintenance and withdrawal deductions. Contact support for review.');
    if (!window.confirm(`Send a KSh ${net.toLocaleString('en-KE')} refund to the customer's M-Pesa number?\n\nPaid: KSh ${amount.toLocaleString('en-KE')}\n5% platform maintenance: KSh ${deduction.toLocaleString('en-KE')}\nM-Pesa withdrawal fee: KSh ${withdrawalFee.toLocaleString('en-KE')}\nCustomer receives: KSh ${net.toLocaleString('en-KE')}`)) return;
    setSendingId(booking.id);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${BACKEND}/api/bookings/site-seeing/${encodeURIComponent(booking.id)}/refund`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not initiate refund.');
      toast.success(`IntaSend refund initiated: KSh ${Number(result.refund.netAmount).toLocaleString('en-KE')}.`);
      await loadBookings();
    } catch (error) {
      toast.error(error.message || 'Could not initiate refund.');
    } finally { setSendingId(''); }
  };

  return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix Real Estates</p><h1 className="mt-1 text-2xl font-extrabold text-slate-950">Viewing evidence review</h1><p className="mt-1 text-sm text-slate-600">Review live room photos and the YouTube video before confirming availability. Approved evidence is shared with the customer, and the seller receives the KSh 25 vacancy-confirmation payout.</p></div>
      <button type="button" onClick={loadBookings} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
    </header>

    {loading ? <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Loading viewing requests…</p> : bookings.length === 0 ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-900">No agent availability updates are waiting for review.</p> : <section className="grid gap-4">
      {bookings.map((booking) => <article key={booking.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${booking.id === requestedBookingId ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-extrabold text-slate-950">{booking.propertyTitle || 'Property viewing'}</h2><p className="mt-1 text-sm text-slate-600">Customer: {booking.customerName || booking.buyerName || 'Customer'} · {booking.customerPhone || booking.phoneNumber || 'No phone recorded'}</p><p className="mt-1 text-xs text-slate-500">Seller: {booking.sellerName || booking.landlordName || 'Assigned seller'} · {booking.sellerPhone || booking.ownerPhone || booking.landlordPhone || 'No seller number recorded'}</p><p className="mt-1 text-xs text-slate-500">Preferred: {booking.preferredViewingDate || 'Date not set'} at {booking.preferredViewingTime || 'Time not set'} · {booking.packageName || booking.packageTitle || 'Viewing package'}</p>{booking.availabilityNotes && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-700"><strong>Seller notes:</strong> {booking.availabilityNotes}</p>}</div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${booking.tourStatus === 'awaiting_admin_tour_review' ? 'bg-amber-100 text-amber-900' : booking.bookingMode === 'direct_booking' ? 'bg-sky-100 text-sky-900' : booking.availabilityStatus === 'available' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}><Clock3 size={13} /> {booking.tourStatus === 'awaiting_admin_tour_review' ? 'Tour evidence needs review · site-seeing balance' : booking.bookingMode === 'direct_booking' ? 'Visit booked · vacancy not verified' : booking.availabilityStatus === 'available' ? `Agent reports available · ${booking.availableUnits || 1} unit(s)` : 'Agent says unavailable'}</span>
        </div>
        {booking.availabilityStatus === 'available' && <div className="mt-4 space-y-3">{booking.availabilityVideoUrl && <div><p className="mb-2 text-xs font-bold text-slate-700">Live empty-room video evidence</p><a className="text-sm font-bold text-emerald-800 underline" href={booking.availabilityVideoUrl} target="_blank" rel="noreferrer">Open YouTube evidence video</a>{toYouTubeEmbedUrl(booking.availabilityVideoUrl) && <div className="mt-2 aspect-video max-w-2xl overflow-hidden rounded-xl bg-black"><iframe title={`Vacancy evidence for ${booking.propertyTitle || 'property'}`} className="h-full w-full" src={toYouTubeEmbedUrl(booking.availabilityVideoUrl)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}</div>}{(booking.availabilityEvidencePhotoUrls || []).length > 0 && <div><p className="mb-2 text-xs font-bold text-slate-700">Vacancy confirmation photos</p><div className="flex flex-wrap gap-3">{booking.availabilityEvidencePhotoUrls.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Vacancy evidence ${index + 1}`} className="h-28 w-36 rounded-lg border object-cover" /></a>)}</div></div>}</div>}
        {booking.tourStatus === 'awaiting_admin_tour_review' && <div className="mt-4"><p className="mb-2 text-xs font-bold text-slate-700">Tour completion photos</p><div className="flex flex-wrap gap-3">{(booking.tourEvidenceUrls || []).map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Tour evidence ${index + 1}`} className="h-28 w-36 rounded-lg border object-cover" /></a>)}</div></div>}
        {(booking.directPaymentReference || booking.completionPaymentReference || booking.availabilityPaymentReference) && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><p><strong>Site-seeing refund:</strong> KSh {Number(booking.refundRequestedAmount || booking.packagePaymentAmount || booking.directPaymentAmount || booking.availabilityPaymentAmount || booking.packagePrice || booking.totalPrice || 0).toLocaleString('en-KE')} less 5% platform maintenance and the configured M-Pesa withdrawal fee. {booking.refundRequestLate && <strong>Submitted after the 24-hour deadline; review case by case. </strong>}Legally required full refunds are not reduced.</p>{booking.refundStatus ? <p className="mt-1 font-bold">Refund status: {booking.refundStatus}{booking.refundTrackingId ? ` · ${booking.refundTrackingId}` : ''}</p> : <button type="button" onClick={() => initiateRefund(booking)} disabled={sendingId === booking.id} className="mt-2 rounded-lg bg-amber-900 px-3 py-2 font-bold text-white disabled:opacity-60">{sendingId === booking.id ? 'Processing…' : 'Approve & send refund'}</button>}</div>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-600">{booking.tourStatus === 'awaiting_admin_tour_review' ? 'Review tour completion photos and release the booking assignment. The separate site-seeing payment is credited after tour approval.' : booking.bookingMode === 'direct_booking' ? 'The customer skipped vacancy confirmation. The seller has been notified; vacancy is not guaranteed.' : booking.availabilityStatus === 'available' ? 'Confirm the empty-room photos and video. Approval pays the KSh 25 vacancy credit and sends the evidence and visit-booking link to the customer.' : 'Unavailable reports earn no vacancy confirmation credit.'}</p>
          {booking.bookingMode === 'direct_booking' && booking.tourStatus !== 'awaiting_admin_tour_review' ? <span className="text-xs font-bold text-sky-900">Seller notified · no vacancy verification requested</span> : <button type="button" onClick={() => notifyCustomer(booking)} disabled={sendingId === booking.id} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{sendingId === booking.id ? <RefreshCw size={15} className="animate-spin" /> : booking.tourStatus === 'awaiting_admin_tour_review' || booking.availabilityStatus === 'available' ? <CheckCircle2 size={15} /> : <Send size={15} />}{sendingId === booking.id ? 'Processing…' : booking.tourStatus === 'awaiting_admin_tour_review' ? 'Approve tour evidence, credit agent & release booking' : booking.availabilityStatus === 'available' ? 'Approve vacancy evidence, pay KSh 25 & notify customer' : 'Confirm unavailable & notify customer'}</button>}
        </div>
      </article>)}
    </section>}
  </main>;
}
