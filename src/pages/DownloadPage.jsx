import React, { useState } from 'react';
import { Download, Smartphone, ShieldCheck, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { getPublicAppUrl } from '../utils/publicUrl';

export default function DownloadPage() {
  const [shareMessage, setShareMessage] = useState('');
  const isInstalledApp = Capacitor.isNativePlatform();

  const shareMarketMix = async () => {
    const url = getPublicAppUrl('/');
    const shareData = {
      title: 'MarketMix Real Estates',
      text: 'Find a home, arrange a viewing and plan your move with MarketMix.',
      url,
    };
    try {
      if (isInstalledApp) {
        const { Share } = await import('@capacitor/share');
        await Share.share({ ...shareData, dialogTitle: 'Share MarketMix' });
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage('MarketMix link copied. Send it to your friends.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setShareMessage('Could not share the link. Please try again.');
    }
  };

  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-12 sm:px-6">
      <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Smartphone className="h-7 w-7" /></div>
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">MarketMix for Android</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Take MarketMix with you</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Browse homes, contact sellers, request a move, and follow your bookings from your Android phone.</p>
        {isInstalledApp ? (
          <>
            <button type="button" onClick={shareMarketMix} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800">
              <Share2 className="h-5 w-5" /> Share MarketMix with friends
            </button>
            <p className="mt-2 text-xs text-slate-500">Friends with MarketMix installed can open the shared link in the app. Everyone else can view the website and download the Android app.</p>
          </>
        ) : (
          <>
            <a href="/MarketMix%20Realestate.apk" download="MarketMix Realestate.apk" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white transition hover:bg-emerald-800">
              <Download className="h-5 w-5" /> Download Android APK
            </a>
            <p className="mt-2 text-xs text-slate-500">Download the current Android preview build directly to your device.</p>
            <div className="mt-7 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Android may ask you to allow installation from your browser. Only install MarketMix APK files downloaded from this official website.</p>
            </div>
          </>
        )}
        {shareMessage && <p role="status" className="mt-3 text-sm text-emerald-800">{shareMessage}</p>}
        <p className="mt-5 text-sm text-slate-500">Using an iPhone or computer? <Link to="/" className="font-semibold text-emerald-700 underline">Continue to the website</Link>.</p>
      </section>
    </main>
  );
}
