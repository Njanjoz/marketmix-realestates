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
        paymentKind, paymentStatus: paymentStatus || booking.paymentStatus || 'pending',
        totalAmount: Number(amount || 0), mpesaReference: mpesaReference || null,
        propertyTitle: booking.propertyTitle, propertyLocation: booking.propertyLocation,
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
        <button type="button" role="tab" aria-selected={type === 'payments'} onClick={() => chooseType('payments')} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${type === 'payments' ? 'bg-emerald-800 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}><CreditCard className="h-4 w-4"/>Payments ({payments.length})</button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <section className="mt-5 space-y-3" aria-live="polite">
        {loading && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Loading your bookings…</p>}
        {!loading && bookings.map((booking) => {
          const isHouse = type === 'house';
          const isPayment = type === 'payments';
          const title = isHouse
            ? booking.packageTitle || booking.packageName || booking.propertyTitle || 'House viewing'
            : isPayment ? booking.propertyTitle || 'Real estate payment'
              : booking.destinationTitle || booking.packageTitle || booking.vehicleLabel || 'Transport booking';
          const location = isHouse
            ? booking.propertyLocation || booking.location || booking.area
            : isPayment ? booking.propertyLocation : [booking.pickupLabel, booking.destinationLabel].filter(Boolean).join(' → ');
          const date = isHouse
            ? booking.preferredViewingDate || booking.viewingDate || booking.createdAt
            : isPayment ? booking.createdAt : booking.preferredDate || booking.createdAt;
          const status = isPayment ? booking.paymentStatus || booking.state : booking.status || booking.bookingStatus || booking.paymentStatus;
          return <article key={booking.id} className="mmx-glass-surface rounded-2xl border p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{isHouse ? 'House booking' : isPayment ? 'Real estate payment' : 'Transport booking'}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{title}</h2></div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">{label(status)}</span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {location && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"/><span>{location}</span></p>}
              {date && <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-emerald-800"/><span>{formatDate(date)}{isHouse && booking.preferredViewingTime ? ` · ${booking.preferredViewingTime}` : ''}</span></p>}
              {isHouse && booking.paymentStatus && <p>Payment: {label(booking.paymentStatus)}</p>}
              {isHouse && booking.availabilityPaymentReference && <p>Vacancy-check payment: KSh {Number(booking.availabilityPaymentAmount || 0).toLocaleString('en-KE')} · {label(booking.availabilityPaymentStatus)}{booking.availabilityMpesaReference ? ` · M-Pesa ${booking.availabilityMpesaReference}` : ''}</p>}
              {isHouse && (booking.packagePaymentReference || booking.directPaymentReference) && <p>Viewing package payment: KSh {Number(booking.packagePaymentAmount || booking.directPaymentAmount || 0).toLocaleString('en-KE')} · {label(booking.packagePaymentStatus || booking.paymentStatus)}{booking.packagePaymentMpesaReference || booking.directMpesaReference ? ` · M-Pesa ${booking.packagePaymentMpesaReference || booking.directMpesaReference}` : ''}</p>}
              {isPayment && <><p>For: {label(booking.paymentKind || booking.paymentType || 'Property payment')}</p><p>Amount: KSh {Number(booking.totalAmount || 0).toLocaleString('en-KE')}</p>{booking.mpesaReference && <p>M-Pesa reference: {booking.mpesaReference}</p>}</>}
              {booking.quotedPrice != null && <p>Quote: KSh {Number(booking.quotedPrice).toLocaleString('en-KE')}</p>}
            </div>
            <p className="mt-3 text-xs text-slate-400">Booking ID: {booking.id}</p>
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
    </div>
  </main>;
}
