import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const BACKEND = import.meta.env.VITE_MOVING_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';

export default function ViewingMeetingDetailsPage() {
  const { bookingId } = useParams();
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ meetingPoint: '', meetingTime: '', estimatedCostPerPerson: '', landmark: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!currentUser) return toast.error('Sign in as the assigned agent or admin.');
    setBusy(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${BACKEND}/api/bookings/site-seeing/${encodeURIComponent(bookingId)}/meeting-details`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not send visit details.');
      setSent(true);
      toast.success(result.customerNotified ? 'Visit details and receipt sent to the customer.' : 'Details saved. Customer WhatsApp could not be queued.');
    } catch (error) { toast.error(error.message || 'Could not send visit details.'); }
    finally { setBusy(false); }
  };

  return <main className="mx-auto max-w-2xl p-4 py-10 sm:p-8">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix Real Estates</p>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-950">Arrange the property visit</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">Submit where and when to meet, landmark directions, and any expected per-person costs. The customer will receive these details and their payment receipt on WhatsApp.</p>
      {sent ? <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Visit details submitted. The customer update and receipt have been queued.</div> : <form onSubmit={submit} className="mt-6 grid gap-4">
        <label className="text-sm font-bold text-slate-700">Meeting place<input required maxLength={240} value={form.meetingPoint} onChange={(e) => setForm({ ...form, meetingPoint: e.target.value })} placeholder="e.g. Main gate, property entrance" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label>
        <label className="text-sm font-bold text-slate-700">Meeting time<input required maxLength={120} value={form.meetingTime} onChange={(e) => setForm({ ...form, meetingTime: e.target.value })} placeholder="e.g. Saturday at 10:30 AM" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label>
        <label className="text-sm font-bold text-slate-700">Major landmark<input required maxLength={240} value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Landmark the customer can find" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label>
        <label className="text-sm font-bold text-slate-700">Estimated extra cost per person (KSh)<input type="number" min="0" step="1" value={form.estimatedCostPerPerson} onChange={(e) => setForm({ ...form, estimatedCostPerPerson: e.target.value })} placeholder="Optional" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label>
        <label className="text-sm font-bold text-slate-700">Other useful information<textarea maxLength={800} rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What the customer should know before meeting" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal" /></label>
        <button disabled={busy} className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Send details and receipt to customer'}</button>
        <p className="text-xs text-slate-500">Booking reference: {bookingId}. If this customer skipped vacancy confirmation, the message will clearly say the vacancy is not guaranteed.</p>
      </form>}
    </section>
  </main>;
}
