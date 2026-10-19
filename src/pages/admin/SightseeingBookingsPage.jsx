import React, { useCallback, useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { RefreshCw, Send, CheckCircle2, Clock3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

const BACKEND = import.meta.env.VITE_MOVING_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';

export default function SightseeingBookingsPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'sightseeingBookings'));
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => ['available', 'unavailable'].includes(item.availabilityStatus) && item.adminCustomerUpdateStatus !== 'sent')
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
      toast.success('Customer WhatsApp update queued.');
      setBookings((previous) => previous.filter((item) => item.id !== booking.id));
    } catch (error) {
      toast.error(error.message || 'Could not notify customer.');
    } finally {
      setSendingId('');
    }
  };

  return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix Real Estates</p><h1 className="mt-1 text-2xl font-extrabold text-slate-950">Viewing availability review</h1><p className="mt-1 text-sm text-slate-600">Confirm the agent’s landlord check, then send the customer update on WhatsApp.</p></div>
      <button type="button" onClick={loadBookings} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
    </header>

    {loading ? <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Loading viewing requests…</p> : bookings.length === 0 ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-900">No agent availability updates are waiting for review.</p> : <section className="grid gap-4">
      {bookings.map((booking) => <article key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-extrabold text-slate-950">{booking.propertyTitle || 'Property viewing'}</h2><p className="mt-1 text-sm text-slate-600">{booking.customerName || 'Customer'} · {booking.customerPhone || 'No phone recorded'}</p><p className="mt-1 text-xs text-slate-500">Preferred: {booking.preferredViewingDate || 'Date not set'} at {booking.preferredViewingTime || 'Time not set'} · {booking.packageName || 'Viewing package'}</p></div>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${booking.availabilityStatus === 'available' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}><Clock3 size={13} /> {booking.availabilityStatus === 'available' ? `Agent says available · ${booking.availableUnits || 1} unit(s)` : 'Agent says unavailable'}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-600">Agent confirmed availability: KSh 25 withdrawable credit applies when available.</p>
          <button type="button" onClick={() => notifyCustomer(booking)} disabled={sendingId === booking.id} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{sendingId === booking.id ? <RefreshCw size={15} className="animate-spin" /> : booking.availabilityStatus === 'available' ? <CheckCircle2 size={15} /> : <Send size={15} />}{sendingId === booking.id ? 'Sending…' : 'Confirm with agent & notify customer'}</button>
        </div>
      </article>)}
    </section>}
  </main>;
}
