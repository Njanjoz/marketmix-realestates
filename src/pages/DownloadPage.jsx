import React from 'react';
import { Download, Smartphone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DownloadPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Smartphone className="h-7 w-7" /></div>
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">MarketMix for Android</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Take MarketMix with you</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Browse homes, contact sellers, request a move, and follow your bookings from your Android phone.</p>
        <button type="button" disabled className="mt-7 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-300 px-5 py-3 font-bold text-slate-600">
          <Download className="h-5 w-5" /> Android download coming soon
        </button>
        <p className="mt-2 text-xs text-slate-500">The install link will appear here after the website booking flow and release build are verified.</p>
        <div className="mt-7 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Android may ask you to allow installation from your browser. Only install MarketMix APK files downloaded from this official website.</p>
        </div>
        <p className="mt-5 text-sm text-slate-500">Using an iPhone or computer? <Link to="/" className="font-semibold text-emerald-700 underline">Continue to the website</Link>.</p>
      </section>
    </main>
  );
}
