import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Building2, CalendarDays, CreditCard, MapPin, Truck } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import '../components/moving/LiquidGlass.css';

const formatDate = (value) => {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
};

const label = (value) => String(value || 'Pending').replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function MyBookingsPage() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedType = searchParams.get('type');
  const type = ['house', 'payments'].includes(requestedType) ? requestedType : 'transport';
  const [transport, setTransport] = useState([]);
  const [houses, setHouses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundBusy, setRefundBusy] = useState('');
  const [refundMessage, setRefundMessage] = useState('');
  const [refundClock, setRefundClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setRefundClock(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setTransport([]);
      setHouses([]);
      setPayments([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    let pending = 3;
    const finishLoad = () => { pending -= 1; if (pending <= 0) setLoading(false); };
    const sortNewest = (docs) => docs.map((entry) => ({ id: entry.id, ...entry.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    const stopTransport = onSnapshot(
      query(collection(db, 'transportRequests'), where('userId', '==', currentUser.uid)),
      (snapshot) => { setTransport(sortNewest(snapshot.docs)); setError(''); finishLoad(); },
      (snapshotError) => { console.error('Could not load transport bookings:', snapshotError); setError('Some bookings could not be loaded. Please try again.'); finishLoad(); }
    );
    const stopHouse = onSnapshot(
      query(collection(db, 'sightseeingBookings'), where('userId', '==', currentUser.uid)),
      (snapshot) => { setHouses(sortNewest(snapshot.docs)); setError(''); finishLoad(); },
      (snapshotError) => { console.error('Could not load house bookings:', snapshotError); setError('Some bookings could not be loaded. Please try again.'); finishLoad(); }
    );
    const stopPayments = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', currentUser.uid)),
      (snapshot) => {
        setPayments(sortNewest(snapshot.docs).filter((entry) => entry.orderType === 'real_estate'));
        setError(''); finishLoad();
      },
      (snapshotError) => { console.error('Could not load payments:', snapshotError); setError('Some bookings could not be loaded. Please try again.'); finishLoad(); }
    );
    return () => { stopTransport(); stopHouse(); stopPayments(); };
  }, [currentUser?.uid]);

  const viewingPayments = useMemo(() => houses.flatMap((booking) => {
    const rows = [];
    const makeRow = (paymentRef, amount, paymentStatus, paymentKind, mpesaReference, createdAt) => {
      if (!paymentRef) return;
      rows.push({
        id: paymentRef, paymentRef, orderType: 'real_estate',
        bookingId: booking.bookingId || booking.id,
        paymentKind, paymentStatus: paymentStatus || booking.paymentStatus || 'pending',
        totalAmount: Number(amount || 0), mpesaReference: mpesaReference || null,
        propertyTitle: booking.propertyTitle, propertyLocation: booking.propertyLocation,
        refundStatus: booking.refundPaymentReference === paymentRef ? booking.refundStatus : null,
        refundTrackingId: booking.refundPaymentReference === paymentRef ? booking.refundTrackingId : null,
        preferredViewingDate: booking.preferredViewingDate, preferredViewingTime: booking.preferredViewingTime,
        createdAt: createdAt || booking.createdAt,
      });
    };
    makeRow(booking.availabilityPaymentReference, booking.availabilityPaymentAmount, booking.availabilityPaymentStatus, 'sightseeing_availability_check', booking.availabilityMpesaReference, booking.availabilityPaymentCreatedAt);
    makeRow(booking.packagePaymentReference || booking.directPaymentReference, booking.packagePaymentAmount || booking.directPaymentAmount, booking.packagePaymentStatus || (booking.directPaymentReference ? booking.paymentStatus : null), 'sightseeing_package', booking.packagePaymentMpesaReference || booking.directMpesaReference, booking.packagePaymentCreatedAt || booking.createdAt);
    // Existing bookings predate the separate payment fields; keep their latest receipt visible.
    if (!rows.length && booking.paymentRef) makeRow(booking.paymentRef, booking.paidAmount || booking.depositAmount, booking.paymentStatus, 'site_seeing_payment', booking.mpesaReference, booking.confirmedAt || booking.createdAt);
    return rows;
  }), [houses]);
  const paymentRows = useMemo(() => {
    const byReference = new Map();
    [...payments, ...viewingPayments].forEach((row) => byReference.set(row.paymentRef || row.id, row));
    return [...byReference.values()].sort((a, b) => (b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime()) - (a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime()));
  }, [payments, viewingPayments]);
  const bookings = useMemo(() => type === 'house' ? houses : type === 'payments' ? paymentRows : transport, [type, houses, paymentRows, transport]);
  const chooseType = (nextType) => setSearchParams({ type: nextType });
  const requestRefund = async (booking) => {
    if (!currentUser || !booking.bookingId) return;
    const grossAmount = Number(booking.totalAmount || 0);
    const maintenanceFee = Math.round(grossAmount * 0.05);
    const afterMaintenance = Math.max(0, grossAmount - maintenanceFee);
    const withdrawalFee = afterMaintenance <= 100 ? 10 : afterMaintenance <= 1000 ? 20 : afterMaintenance <= 3000 ? 30 : afterMaintenance <= 5000 ? 50 : afterMaintenance <= 80000 ? 100 : afterMaintenance <= 120000 ? 500 : 1000;
    const estimatedRefund = Math.max(0, afterMaintenance - withdrawalFee);
    if (!window.confirm(`Submit a refund request for review?\n\nAmount paid: KSh ${grossAmount.toLocaleString('en-KE')}\n5% platform maintenance: KSh ${maintenanceFee.toLocaleString('en-KE')}\nM-Pesa withdrawal fee: KSh ${withdrawalFee.toLocaleString('en-KE')}\nEstimated refund: KSh ${estimatedRefund.toLocaleString('en-KE')}\n\nAn admin will review your request before payout.`)) return;
    setRefundBusy(booking.bookingId);
    setRefundMessage('');
    try {
      const backend = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';
      const response = await fetch(`${backend}/api/bookings/site-seeing/${encodeURIComponent(booking.bookingId)}/refund-request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await currentUser.getIdToken()}` },
        body: JSON.stringify({ paymentRef: booking.paymentRef }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Could not request a refund.');
      setRefundMessage(`Refund request submitted. Estimated refund: KSh ${Number(result.estimatedRefund || 0).toLocaleString('en-KE')} after KSh ${Number(result.maintenanceFee || 0).toLocaleString('en-KE')} maintenance and KSh ${Number(result.withdrawalFee || 0).toLocaleString('en-KE')} withdrawal fees. An admin will review it.`);
    } catch (requestError) {
      setRefundMessage(requestError.message || 'Could not request a refund.');
    } finally {
      setRefundBusy('');
    }
  };

  return <main className="mmx-liquid-canvas min-h-screen px-4 pb-28 pt-6 text-slate-900 sm:px-6 sm:pt-10">
    <div className="mx-auto max-w-4xl">
      <header className="mmx-glass-surface-dark rounded-[2rem] p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-100">Your MarketMix activity</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">My Bookings</h1>
        <p className="mt-2 text-sm text-white/75">View your transport, house viewing and real estate payments in one place.</p>
      </header>

      <div role="tablist" aria-label="Booking type" className="mt-5 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button type="button" role="tab" aria-selected={type === 'transport'} onClick={() => chooseType('transport')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${type === 'transport' ? 'bg-emerald-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><Truck className="h-4 w-4"/>Transport ({transport.length})</button>
        <button type="button" role="tab" aria-selected={type === 'house'} onClick={() => chooseType('house')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${type === 'house' ? 'bg-emerald-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><Building2 className="h-4 w-4"/>Houses ({houses.length})</button>
        <button type="button" role="tab" aria-selected={type === 'payments'} onClick={() => chooseType('payments')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${type === 'payments' ? 'bg-emerald-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><CreditCard className="h-4 w-4"/>Payments ({paymentRows.length})</button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <section className="mt-5 space-y-3" aria-live="polite">
        {loading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Loading your bookings…</p>}
        {!loading && bookings.map((booking) => {
          const isHouse = type === 'house';
          const isPayment = type === 'payments';
          const title = isHouse
            ? booking.packageTitle || booking.packageName || booking.propertyTitle || 'House viewing'
            : isPayment ? booking.packageName || booking.packageTitle || booking.propertyTitle || 'Real estate payment'
              : booking.destinationTitle || booking.packageTitle || booking.vehicleLabel || 'Transport booking';
          const location = isHouse
            ? booking.propertyLocation || booking.location || booking.area
            : isPayment ? booking.propertyLocation : [booking.pickupLabel, booking.destinationLabel].filter(Boolean).join(' → ');
          const date = isHouse
            ? booking.preferredViewingDate || booking.viewingDate || booking.createdAt
            : isPayment ? booking.createdAt : booking.preferredDate || booking.createdAt;
          const status = isPayment ? booking.paymentStatus || booking.state : booking.status || booking.bookingStatus || booking.paymentStatus;
          const paymentFailed = isPayment && ['failed', 'cancelled', 'canceled'].includes(String(status || '').toLowerCase());
          const reference = booking.paymentRef || booking.id;
          const cutoffMs = booking.preferredViewingDate && booking.preferredViewingTime
            ? new Date(`${booking.preferredViewingDate}T${booking.preferredViewingTime}:00+03:00`).getTime() - 24 * 60 * 60 * 1000
            : null;
          const minutesToCutoff = cutoffMs == null ? null : Math.ceil((cutoffMs - refundClock) / 60_000);
          const countdown = minutesToCutoff == null ? null : minutesToCutoff <= 0 ? null : `${Math.floor(minutesToCutoff / 1440)}d ${Math.floor((minutesToCutoff % 1440) / 60)}h ${minutesToCutoff % 60}m`;
          return <article key={booking.id} className="mmx-glass-surface rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{isHouse ? 'House booking' : isPayment ? 'Real estate payment' : 'Transport booking'}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2></div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${paymentFailed ? 'bg-rose-50 text-rose-900' : String(status || '').toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>{label(status)}</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {location && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"/><span>{location}</span></p>}
              {date && <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-emerald-800"/><span>{formatDate(date)}{isHouse && booking.preferredViewingTime ? ` · ${booking.preferredViewingTime}` : ''}</span></p>}
              {isHouse && booking.paymentStatus && <p>Payment: {label(booking.paymentStatus)}</p>}
              {isHouse && booking.availabilityPaymentReference && <p>Vacancy-check payment: KSh {Number(booking.availabilityPaymentAmount || 0).toLocaleString('en-KE')} · {label(booking.availabilityPaymentStatus)}{booking.availabilityMpesaReference ? ` · M-Pesa ${booking.availabilityMpesaReference}` : ''}</p>}
              {isHouse && (booking.packagePaymentReference || booking.directPaymentReference) && <p>Viewing package payment: KSh {Number(booking.packagePaymentAmount || booking.directPaymentAmount || 0).toLocaleString('en-KE')} · {label(booking.packagePaymentStatus || booking.paymentStatus)}{booking.packagePaymentMpesaReference || booking.directMpesaReference ? ` · M-Pesa ${booking.packagePaymentMpesaReference || booking.directMpesaReference}` : ''}</p>}
              {isPayment && <><p>For: {label(booking.paymentKind || booking.paymentType || 'Property payment')}</p><p>Amount: KSh {Number(booking.totalAmount || 0).toLocaleString('en-KE')}</p>{booking.mpesaReference && <p>M-Pesa reference: {booking.mpesaReference}</p>}</>}
              {paymentFailed && <p role="status" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-900"><strong>Payment failed:</strong> {booking.paymentFailureReason || booking.errorMessage || 'The payment provider did not complete this payment.'}</p>}
              {booking.quotedPrice != null && <p>Quote: KSh {Number(booking.quotedPrice).toLocaleString('en-KE')}</p>}
            </div>
            <p className="mt-3 text-xs text-slate-500">{booking.bookingId ? <>Booking ID: <span className="font-mono font-semibold text-slate-700">{booking.bookingId}</span></> : isPayment ? <>Payment reference: <span className="font-mono font-semibold text-slate-700">{reference}</span></> : <>Booking ID: <span className="font-mono font-semibold text-slate-700">{booking.id}</span></>}</p>
            {isPayment && <div className="mt-3 flex flex-wrap gap-2"><Link to={`/receipt/${encodeURIComponent(reference)}`} className="inline-flex rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900">Save receipt</Link>{booking.bookingId && ['sightseeing_booking_completion', 'sightseeing_direct_booking', 'sightseeing_package', 'sightseeing_availability_check'].includes(booking.paymentKind) && booking.paymentStatus === 'paid' && !booking.refundStatus && <button type="button" onClick={() => requestRefund(booking)} disabled={Boolean(refundBusy)} className="inline-flex rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 disabled:opacity-60">{refundBusy === booking.bookingId ? 'Submitting…' : 'Request refund'}</button>}</div>}
            {isPayment && booking.bookingId && ['sightseeing_booking_completion', 'sightseeing_direct_booking', 'sightseeing_package', 'sightseeing_availability_check'].includes(booking.paymentKind) && booking.paymentStatus === 'paid' && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><strong>Refund timing:</strong> {countdown ? <>submit at least 24 hours before the scheduled viewing. The standard cancellation window closes in <strong>{countdown}</strong> (Nairobi time; refreshes every 15 seconds).</> : minutesToCutoff == null ? 'A confirmed viewing date and time are needed to calculate the 24-hour cancellation deadline.' : <strong>The 24-hour standard cancellation window has closed. You may still request a review; late requests are assessed case by case.</strong>}</p>}
            {isPayment && booking.refundStatus && <p className="mt-3 text-xs font-semibold text-amber-900">Refund: {label(booking.refundStatus)}{booking.refundTrackingId ? ` · ${booking.refundTrackingId}` : ''}</p>}
            {!isHouse && !isPayment && <Link to="/transport/updates" className="mt-3 inline-flex text-sm font-bold text-emerald-800 hover:underline">View live updates</Link>}
          </article>;
        })}
        {!loading && !bookings.length && <div className="mmx-glass-surface rounded-3xl border p-8 text-center sm:p-12">
          {type === 'house' ? <Building2 className="mx-auto h-9 w-9 text-emerald-800"/> : type === 'payments' ? <CreditCard className="mx-auto h-9 w-9 text-emerald-800"/> : <Truck className="mx-auto h-9 w-9 text-emerald-800"/>}
          <h2 className="mt-3 text-lg font-bold">No {type === 'house' ? 'house' : type === 'payments' ? 'real estate payments' : 'transport'} bookings yet</h2>
          <p className="mt-1 text-sm text-slate-600">Your bookings will appear here once you make one.</p>
          {type !== 'payments' && <Link to={type === 'house' ? '/site-seeing' : '/transport'} className="mmx-liquid-primary mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold text-white">{type === 'house' ? 'Find a house to view' : 'Get a moving quote'}</Link>}
        </div>}
      </section>
      {refundMessage && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{refundMessage}</p>}
    </div>
  </main>;
}
