// src/pages/driver/DriverDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Loader2, ArrowRight, RefreshCw, MapPin, PackageCheck, Settings2 } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { listDriverOffers, setDriverOnline } from '../../services/driverService';
import DriverOfferCard from '../../components/driver/DriverOfferCard';

export default function DriverDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [offersError, setOffersError] = useState('');
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const fetchOffers = async () => {
      try {
        const data = await listDriverOffers();
        setOffers(data);
        setOffersError('');
      } catch (err) {
        console.error('Error listing offers:', err);
        setOffersError(err.message || 'Could not refresh move offers.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
    const refreshTimer = window.setInterval(fetchOffers, 20000);

    // Keep already-dispatched offers live. The server refresh above also
    // attaches this driver to older, still-open area requests.
    const offersQuery = query(
      collection(db, 'transportRequests'),
      where('offerDriverIds', 'array-contains', currentUser.uid)
    );
    const unsubOffers = onSnapshot(offersQuery, (snapshot) => {
      const liveOffers = snapshot.docs
        .map((offerDoc) => ({ id: offerDoc.id, requestId: offerDoc.id, ...offerDoc.data() }))
        .filter((offer) => ['QUOTED', 'REQUESTED'].includes(offer.status) && !offer.driverUserId);
      setOffers(liveOffers);
      setLoading(false);
    }, (error) => {
      console.error('Error listening for move offers:', error);
      setOffersError(error.message || 'Could not listen for move offers.');
      setLoading(false);
    });

    // Listen to active assigned trips
    const q = query(
      collection(db, 'transportRequests'),
      where('driverUserId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveTrips(trips.filter(t => ['ACCEPTED', 'DRIVER_ASSIGNED', 'PAID', 'PICKUP_READY', 'ON_THE_WAY', 'LOADING', 'IN_TRANSIT'].includes(t.status)));
    });

    return () => {
      window.clearInterval(refreshTimer);
      unsubOffers();
      unsub();
    };
  }, [currentUser, refreshKey]);

  const cargoCapacity = userProfile?.driverProfile?.cargoCapacity || {};
  const cargoItems = Object.entries(cargoCapacity).length
    ? Object.entries(cargoCapacity).map(([item, count]) => `${item} × ${count}`)
    : (Array.isArray(userProfile?.driverProfile?.canCarryItems) ? userProfile.driverProfile.canCarryItems.map((item) => `${item} × 1`) : []);

  useEffect(() => {
    if (!currentUser || userProfile?.driverApproved !== true) return undefined;
    let stopped = false;
    const heartbeat = async () => {
      try { if (!stopped) await setDriverOnline(true); }
      catch (error) { console.warn('Could not update driver availability:', error); }
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 60000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      setDriverOnline(false).catch((error) => console.warn('Could not clear driver availability:', error));
    };
  }, [currentUser, userProfile?.driverApproved]);

  if (userProfile?.driverApproved !== true) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white p-8 text-center shadow-2xl">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50"><ShieldCheck className="h-9 w-9 text-amber-500" /></span>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Driver verification pending</h2>
          <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Your driver account is under review. We’ll show incoming move offers once MarketMix approves your profile.</p>
          <button
            onClick={() => navigate('/driver/onboard')}
            className="w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white hover:bg-emerald-900"
          >
            Update Onboarding Details
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6f4] px-4 py-6 pb-28 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#10231d] p-6 text-white shadow-[0_24px_80px_rgba(16,35,29,.25)] sm:p-9">
          <div className="absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div><span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"/>Driver workspace · Online</span><h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Good to see you, {userProfile?.name || 'Driver'}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Your moves, new customer requests, and vehicle availability in one place.</p></div>
            <button onClick={() => navigate('/driver/onboard')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"><Settings2 className="h-4 w-4"/>Vehicle & service settings</button>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-semibold text-white/55">Incoming offers</p><p className="mt-1 text-2xl font-extrabold">{offers.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-semibold text-white/55">Active trips</p><p className="mt-1 text-2xl font-extrabold">{activeTrips.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-semibold text-white/55">Cargo types listed</p><p className="mt-1 text-2xl font-extrabold">{cargoItems.length}</p></div></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3"><p className="inline-flex items-center gap-2 text-xs text-white/70"><MapPin className="h-4 w-4 text-emerald-300"/>{userProfile?.driverProfile?.workArea || userProfile?.driverProfile?.workSubCounty || userProfile?.driverProfile?.workCounty || 'Add your service area'}<span className="text-white/25">·</span><PackageCheck className="h-4 w-4 text-emerald-300"/>{cargoItems.length ? cargoItems.join(', ') : 'Cargo list needed for matching'}</p><button type="button" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1); }} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-300 px-3 py-2 text-xs font-extrabold text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/>Refresh offers</button></div>
        </header>

        {/* Active Trips */}
        <section className="space-y-4 rounded-[1.7rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,35,25,.045)] sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-800">On the road</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">Active trips <span className="text-slate-400">({activeTrips.length})</span></h2></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Truck className="h-5 w-5"/></span></div>
          {activeTrips.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">No active trips right now. Accepted moves will show here.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeTrips.map(trip => (
                <div key={trip.id} className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">{trip.status}</span>
                    <span className="text-xs font-extrabold text-emerald-700">KSh {Number(trip.quotedPrice || 0).toLocaleString()}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate">{trip.destinationLabel || 'Trip destination'}</h3>
                  <p className="text-xs text-slate-500 mt-1">Pickup: {trip.pickupLabel}</p>
                  <button
                    onClick={() => navigate(`/driver/trip/${trip.id}`)}
                    className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2"
                  >
                    <span>Manage Trip</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Incoming Offers */}
        <section className="space-y-4 rounded-[1.7rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,35,25,.045)] sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-800">New work</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">Incoming move offers</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-900">{offers.length} available</span></div>
          {!cargoItems.length && <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-amber-950">List what your vehicle can carry</p><p className="mt-1 text-xs leading-5 text-amber-900">Move offers are matched against your cargo list. Add item types in service settings so compatible requests can reach you.</p></div><button type="button" onClick={() => navigate('/driver/onboard')} className="shrink-0 rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-bold text-white">Update service listing</button></div>}
          {offersError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Offer refresh issue: {offersError}. Open jobs will retry automatically.</p>}
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
              <><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-800 shadow-sm"><Truck className="h-6 w-6"/></span><p className="mt-3 font-bold text-slate-800">No matching move offers right now</p><p className="mt-1 text-xs leading-5">We check for compatible open requests every 20 seconds. Keep your service area and cargo list up to date.</p></>
            </div>
          ) : (
            <div className="grid gap-4">
              {offers.map(offer => (
                <DriverOfferCard key={offer.id || offer.requestId} offer={offer} onActionComplete={() => { setLoading(true); setRefreshKey((key) => key + 1); }} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
