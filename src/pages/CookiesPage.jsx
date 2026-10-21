import React from 'react';
import { Link } from 'react-router-dom';

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">MarketMix · Cookies</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Cookie Notice</h1>
        <p className="mt-3 text-sm text-slate-500">Updated 20 October 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <p>MarketMix may use browser storage and similar technologies to keep you signed in, remember essential preferences, protect the service, and understand basic site performance. These technologies help pages and account features work as expected.</p>
          <section><h2 className="text-lg font-extrabold text-slate-950">Managing browser storage</h2><p className="mt-2">You can clear or block cookies and site data in your browser settings. Blocking essential storage may sign you out or prevent some features from working correctly.</p></section>
          <section><h2 className="text-lg font-extrabold text-slate-950">Related information</h2><p className="mt-2">See our <Link className="font-bold text-emerald-800 underline" to="/privacy">Privacy Policy</Link> for details about personal information, or visit the <Link className="font-bold text-emerald-800 underline" to="/contact">Contact page</Link> with questions.</p></section>
        </div>
      </article>
    </main>
  );
}
