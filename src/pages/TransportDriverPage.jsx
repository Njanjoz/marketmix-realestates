import React, { useCallback, useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { Check, Clipboard, LocateFixed, MapPin, Pause, Play, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import TransportTrackingMap from '../components/moving/TransportTrackingMap';
import { getPoint, TRANSPORT_STATUS_LABELS, updateTransportDriverPosition } from '../services/transportService';
import '../components/moving/LiquidGlass.css';

const distanceMeters = (a, b) => {
  if (!a || !b) return Infinity;
  const radians = (value) => value * Math.PI / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const NEXT_STATUSES = [
  ['PICKUP_READY', 'Arrived at pickup'], ['LOADING', 'Loading'], ['IN_TRANSIT', 'Start delivery'], ['DELIVERED', 'Mark delivered'],
];

const TransportDriverPage = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [trackingId, setTrackingId] = useState('');
  const watchRef = useRef(null);
  const writesRef = useRef({});

  useEffect(() => {
    if (!currentUser?.uid) return undefined;
    const assigned = query(collection(db, 'transportRequests'), where('driverUserId', '==', currentUser.uid));
    return onSnapshot(assigned, (snapshot) => {
      setRequests(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).filter((item) => !['DELIVERED', 'CANCELLED'].includes(item.status)));
    }, (error) => {
      console.error('Could not load assigned moves:', error);
      toast.error('Could not load moves assigned to this account.');
    });
  }, [currentUser?.uid]);

  const stopSharing = useCallback(() => {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setTrackingId('');
  }, []);

  useEffect(() => () => {
    if (watchRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const startSharing = (request) => {
    if (!navigator.geolocation) return toast.error('This device does not provide GPS location.');
    stopSharing();
    const lastKnown = { point: getPoint(request.driverLocation), time: Date.now() };
    setTrackingId(request.id);
    watchRef.current = navigator.geolocation.watchPosition(async (position) => {
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      const elapsed = Date.now() - lastKnown.time;
      if (elapsed < 15000 && distanceMeters(lastKnown.point, point) < 35) return;
      lastKnown.point = point;
      lastKnown.time = Date.now();
      try {
        await updateTransportDriverPosition(request.id, point);
      } catch (error) {
        console.error('Could not send driver position:', error);
        toast.error('Location update could not be sent. Check your connection.');
      }
    }, (error) => {
      console.error('Driver location permission error:', error);
      stopSharing();
      toast.error('Allow location while using this page to share the trip.');
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    if (request.status === 'DRIVER_ASSIGNED' || request.status === 'ACCEPTED') {
      updateDoc(doc(db, 'transportRequests', request.id), { status: 'ON_THE_WAY', updatedAt: serverTimestamp() }).catch((error) => console.error('Could not update driver status:', error));
    }
  };

  const markStatus = async (request, status) => {
    try {
      await updateDoc(doc(db, 'transportRequests', request.id), { status, updatedAt: serverTimestamp() });
      if (status === 'DELIVERED' && trackingId === request.id) stopSharing();
      toast.success(`Status updated: ${TRANSPORT_STATUS_LABELS[status]}.`);
    } catch (error) {
      console.error('Could not update move status:', error);
      toast.error('Could not update the move status.');
    }
  };

  const copyUid = async () => {
    await navigator.clipboard.writeText(currentUser?.uid || '');
    toast.success('Driver account ID copied.');
  };

  return <main className="mmx-liquid-canvas min-h-screen px-4 py-8 pb-24 sm:px-6">
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="mmx-glass-surface-dark rounded-[2rem] p-6 text-white shadow-xl sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-200">MarketMix driver mode</p><h1 className="mt-2 text-3xl font-bold">Your assigned moves</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Open this page during a delivery and share location while it is in progress. Customers see your position and status updates live.</p><button type="button" onClick={copyUid} className="mmx-glass-action mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold text-white"><Clipboard className="h-4 w-4"/>Copy driver account ID for admin assignment</button></header>
      {!requests.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Truck className="mx-auto h-9 w-9 text-slate-400"/><h2 className="mt-3 font-bold text-slate-800">No moves assigned to this account</h2><p className="mt-1 text-sm text-slate-500">Ask the MarketMix move coordinator to add your account ID to a transport request.</p></div>}
      <div className="space-y-5">{requests.map((request) => {
        const sharing = trackingId === request.id;
        return <article key={request.id} className="mmx-glass-surface overflow-hidden rounded-[2rem] border shadow-[0_18px_60px_rgba(20,50,40,.08)]"><div className="grid gap-6 p-5 lg:grid-cols-[1fr_.95fr] lg:p-6"><div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800"><MapPin className="h-4 w-4"/>Move · {TRANSPORT_STATUS_LABELS[request.status] || request.status}</p><h2 className="mt-2 text-2xl font-extrabold text-slate-950">{request.destinationTitle || request.destinationLabel}</h2><div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm"><p><strong>Pickup:</strong> {request.pickupLabel}</p><p><strong>Destination:</strong> {request.destinationLabel}</p><p><strong>Vehicle:</strong> {request.vehicleLabel}</p><p><strong>Belongings:</strong> {Object.entries(request.items || {}).map(([id, quantity]) => `${id} × ${quantity}`).join(' · ')}</p><p><strong>Customer:</strong> {request.userName} · <a href={`mailto:${request.userEmail || ''}`} className="text-emerald-800 underline">{request.userEmail}</a></p></div><div className="mt-4 flex flex-wrap gap-2">{NEXT_STATUSES.map(([status, label]) => <button type="button" key={status} onClick={() => markStatus(request, status)} disabled={request.status === status || request.status === 'DELIVERED'} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-700 hover:bg-emerald-50 disabled:opacity-40">{label}</button>)}</div><button type="button" onClick={() => sharing ? stopSharing() : startSharing(request)} className={`mmx-liquid-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white sm:w-auto ${sharing ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-800 hover:bg-emerald-900'}`}>{sharing ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}{sharing ? 'Stop sharing location' : 'Share live location'}{!sharing && <LocateFixed className="h-4 w-4"/>}</button><p className="mt-2 text-xs leading-5 text-slate-500">Location sends after you allow the browser prompt. Updates are throttled while you remain in the same place.</p></div><TransportTrackingMap pickupLocation={request.pickupCoordinates} destinationLocation={request.destinationCoordinates} driverLocation={request.driverLocation}/></div>{sharing && <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50 px-5 py-3 text-xs font-bold text-emerald-900"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600"/>Sharing this phone’s GPS to the customer’s private move screen</div>}</article>;
      })}</div>
    </section>
  </main>;
};

export default TransportDriverPage;
