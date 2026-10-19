import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix · Terms</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-500">Updated 19 October 2026</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700">
          <section><h2 className="text-lg font-extrabold text-slate-950">Marketplace and transport bookings</h2><p className="mt-2">MarketMix helps customers find listings, service providers and transport drivers. A quote becomes a booking only when the customer accepts it. The customer and provider must confirm the pickup, destination, items, timing and any changes before the move begins.</p></section>
          <section><h2 className="text-lg font-extrabold text-slate-950">Optional online payment for transport</h2><p className="mt-2">Drivers may opt in to receive online payments for transport jobs. When a customer pays an accepted quote through the MarketMix website using the available M-Pesa checkout, the displayed quote is the gross booking amount. MarketMix retains an 8% platform fee from that amount and the driver’s payout amount is the remaining 92%. For example, on KSh 1,500, the fee is KSh 120 and the driver payout is KSh 1,380. Payment-provider fees for this checkout are handled by MarketMix and are not deducted from that stated driver payout.</p><p className="mt-2">A driver’s payout can be requested after the job is marked delivered and the online payment is confirmed. Payout requests are reviewed and depend on payment-provider settlement, account verification, and the availability of funds. MarketMix does not represent a pending request as a completed transfer.</p><p className="mt-2">The online payment option is voluntary for drivers. If a driver has not opted in, the customer should agree payment directly with that driver and should not submit an online payment for the job.</p></section>
          <section><h2 className="text-lg font-extrabold text-slate-950">Property viewing booking deposits</h2><p className="mt-2">A customer booking a paid property viewing or search package pays a 20% deposit of the package price through M-Pesa checkout. The booking is queued only after the payment provider confirms the deposit. The deposit is non-refundable once paid. The remaining 80% is due as shown on the booking and should be agreed with the assigned agent before the service is completed. The customer can message MarketMix Customer Help from the booking page for support.</p></section>
          <section><h2 className="text-lg font-extrabold text-slate-950">Payment status, cancellations and disputes</h2><p className="mt-2">A payment is marked paid only after confirmation from the payment provider. A payment prompt or receipt of a prompt is not proof of payment. Contact MarketMix support with the booking reference if a payment, cancellation, refund or service dispute needs review.</p></section>
          <section><h2 className="text-lg font-extrabold text-slate-950">Contact</h2><p className="mt-2">For help with a booking or payment, use the <Link className="font-bold text-emerald-800 underline" to="/contact">MarketMix contact page</Link> and include the booking reference.</p></section>
        </div>
      </article>
    </main>
  );
}
