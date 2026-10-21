import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, Clock3, XCircle, ArrowLeft, Printer, MapPin, ReceiptText } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';
const money = (value) => `KSh ${Number(value || 0).toLocaleString('en-KE')}`;

function formatDate(value) {
  if (!value) return '—';
  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : value?.seconds || value?._seconds
      ? new Date(Number(value.seconds || value._seconds) * 1000)
      : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ReceiptPage() {
  const { ref } = useParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ref) return;
    let active = true;
    const fetchReceipt = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND}/api/ad-transaction/${encodeURIComponent(ref)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || 'Transaction or receipt not found.');
        if (active) setTransaction(data.data || data);
      } catch (err) {
        console.error('Receipt error:', err);
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchReceipt();
    return () => { active = false; };
  }, [ref]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f4f7f4] p-4"><div className="text-center"><Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin text-emerald-700"/><p className="text-sm font-medium text-slate-600">Preparing your receipt…</p></div></div>;

  if (error || !transaction) return <div className="flex min-h-screen items-center justify-center bg-[#f4f7f4] p-4"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><XCircle className="mx-auto mb-3 h-12 w-12 text-rose-500"/><h1 className="text-xl font-extrabold text-slate-900">Receipt not found</h1><p className="mb-6 mt-2 text-sm text-slate-500">{error || `Could not locate receipt ${ref}.`}</p><Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"><ArrowLeft className="h-4 w-4"/>Back to dashboard</Link></div></div>;

  const status = String(transaction.paymentStatus || transaction.status || transaction.state || 'pending').toLowerCase();
  const isPaid = ['paid', 'completed', 'complete', 'confirmed'].includes(status);
  const isBooking = transaction.isRealEstate === true || transaction.orderType === 'real_estate' || Boolean(transaction.bookingId);
  const paymentKind = String(transaction.paymentKind || transaction.paymentType || '');
  const isAvailabilityFee = paymentKind === 'sightseeing_consultation_fee'
    || (!paymentKind && transaction.bookingMode === 'availability_check' && Number(transaction.totalAmount) === Number(transaction.consultationFee));
  const amount = Number(transaction.totalAmount ?? transaction.amount ?? 0);
  const mpesaRef = transaction.mpesaReference || transaction.mpesaCode || transaction.displayId || 'Awaiting M-Pesa reference';
  const packageName = transaction.packageName || transaction.description || 'Property viewing package';
  const properties = Array.isArray(transaction.tourProperties) ? transaction.tourProperties : [];
  const propertyTitle = transaction.propertyTitle || properties[0]?.title || transaction.description || 'Property viewing';

  return (
    <main className="receipt-page min-h-screen bg-[#f4f7f4] px-4 py-8 sm:py-12">
      <style>{`@media print { @page { margin: 12mm; } body { background: #fff !important; } .receipt-page { min-height: 0 !important; padding: 0 !important; background: #fff !important; } .receipt-card { max-width: none !important; border: 0 !important; box-shadow: none !important; } .receipt-actions { display: none !important; } }`}</style>
      <article className="receipt-card mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-[0_24px_70px_rgba(15,45,30,.12)]">
        <header className="relative overflow-hidden bg-emerald-950 px-6 py-8 text-white sm:px-9">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border border-white/10"/>
          <div className="relative flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.24em] text-emerald-200">MarketMix Real Estates</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight">Payment receipt</h1><p className="mt-1 text-sm text-emerald-100">Your payment details, all in one place.</p></div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10"><ReceiptText className="h-6 w-6 text-emerald-100"/></div>
          </div>
          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 text-xs">
            <span className="text-emerald-100">Receipt reference</span><span className="max-w-full break-all font-mono font-bold">{ref}</span>
          </div>
        </header>

        <div className="p-6 sm:p-9">
          <div className={`flex items-center gap-3 rounded-2xl border p-4 ${isPaid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            {isPaid ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700"/> : <Clock3 className="h-6 w-6 shrink-0 text-amber-700"/>}
            <div><p className={`text-sm font-extrabold ${isPaid ? 'text-emerald-950' : 'text-amber-950'}`}>{isPaid ? 'Payment confirmed' : 'Payment pending'}</p><p className={`mt-0.5 text-xs ${isPaid ? 'text-emerald-800' : 'text-amber-800'}`}>{isPaid ? 'Payment provider confirmed this transaction.' : 'This receipt will update once the provider confirms payment.'}</p></div>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-500">{isBooking ? 'Booking payment' : 'Transaction'}</p>
            <h2 className="mt-2 text-lg font-extrabold text-slate-950">{isAvailabilityFee ? 'Property availability check' : packageName}</h2>
            <p className="mt-1 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800"/><span>{propertyTitle}</span></p>
            {transaction.customerName && <p className="mt-2 text-sm text-slate-600">Customer: <span className="font-semibold text-slate-800">{transaction.customerName}</span></p>}
            {transaction.packageName && <p className="mt-1 text-sm text-slate-600">Package: <span className="font-semibold text-slate-800">{transaction.packageName}</span>{Number(transaction.participantCount) > 1 ? ` · ${transaction.participantCount} people` : ''}</p>}
            {properties.length > 1 && <p className="mt-1 text-xs leading-5 text-slate-500">Includes {properties.length} selected properties.</p>}
          </section>

          <section className="mt-6 space-y-3 text-sm">
            {transaction.bookingId && <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span className="text-slate-500">Booking ID</span><span className="break-all text-right font-mono text-xs font-bold text-slate-900">{transaction.bookingId}</span></div>}
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span className="text-slate-500">Payment reference</span><span className="break-all text-right font-mono text-xs font-bold text-slate-900">{ref}</span></div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span className="text-slate-500">M-Pesa reference</span><span className="break-all text-right font-mono text-xs font-bold text-emerald-800">{mpesaRef}</span></div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span className="text-slate-500">Date</span><span className="text-right text-slate-800">{formatDate(transaction.updatedAt || transaction.createdAt || transaction.timestamp)}</span></div>
            {isAvailabilityFee && Number(transaction.bookingAmount) > 0 && <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span className="text-slate-500">Selected package value <span className="block text-[11px]">Not charged on this receipt</span></span><span className="font-semibold text-slate-700">{money(transaction.bookingAmount)}</span></div>}
            {isAvailabilityFee && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">The availability-check fee is non-refundable. The package value shown above is not part of this payment.</p>}
          </section>

          <section className="mt-6 rounded-2xl bg-emerald-950 p-5 text-white">
            <div className="flex items-center justify-between gap-4 text-sm"><span className="text-emerald-100">{isAvailabilityFee ? 'Amount paid for availability check' : 'Amount paid'}</span><span className="text-2xl font-extrabold">{money(amount)}</span></div>
            <p className="mt-2 text-xs text-emerald-200">KES · M-Pesa{transaction.phoneNumber ? ` · ${transaction.phoneNumber}` : ''}</p>
          </section>

          <div className="receipt-actions mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => window.print()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900"><Printer className="h-4 w-4"/>Save receipt as PDF</button>
            <Link to="/dashboard" className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">My bookings</Link>
          </div>
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">Keep this receipt and your M-Pesa confirmation for your records. Need help? Contact MarketMix and share the booking ID.</p>
        </div>
      </article>
    </main>
  );
}
