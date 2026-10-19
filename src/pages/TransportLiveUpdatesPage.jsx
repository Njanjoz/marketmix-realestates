import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft, Radio, Truck } from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { RequestTrackingCard } from './TransportPage';
import '../components/moving/LiquidGlass.css';

export default function TransportLiveUpdatesPage() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) {
      setRequests([]);
      return undefined;
    }
    const ownRequests = query(collection(db, 'transportRequests'), where('userId', '==', currentUser.uid));
    return onSnapshot(ownRequests, (snapshot) => {
      const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      next.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRequests(next);
      setLoadError('');
      setSelectedRequestId((selected) => next.some((request) => request.id === selected) ? selected : next[0]?.id || '');
    }, (error) => {
      console.error('Could not load live move updates:', error);
      setLoadError('Could not load your move updates. Please try again shortly.');
    });
  }, [currentUser?.uid]);

  const activeCount = requests.filter((request) => !['COMPLETED', 'CANCELLED'].includes(request.status)).length;

  return <main className="mmx-liquid-canvas min-h-screen px-4 pb-28 pt-6 text-slate-900 sm:px-6 sm:pt-10">
    <div className="mx-auto max-w-5xl">
      <Link to="/transport" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800"><ArrowLeft className="h-4 w-4"/> Moving</Link>
      <header className="mmx-glass-surface-dark mt-5 rounded-[2rem] p-6 text-white shadow-xl sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><Radio className="h-4 w-4"/> Live trip centre</span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Live updates</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Follow driver assignment, trip status and shared location for your moves.</p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"><Truck className="h-4 w-4"/>{activeCount} active {activeCount === 1 ? 'move' : 'moves'}</p>
      </header>

      <section className="mt-6 space-y-4">
        {loadError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{loadError}</p>}
        {requests.length ? requests.map((request) => <RequestTrackingCard key={request.id} request={request} selected={request.id === selectedRequestId} showDetails onSelect={() => setSelectedRequestId((selected) => selected === request.id ? '' : request.id)} />) : !loadError && <div className="mmx-glass-surface rounded-3xl border p-8 text-center sm:p-12"><Truck className="mx-auto h-9 w-9 text-emerald-800"/><h2 className="mt-3 text-lg font-bold">No moves to track yet</h2><p className="mt-1 text-sm text-slate-600">When you request transport, your booking and live driver updates will appear here.</p><Link to="/transport" className="mmx-liquid-primary mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold text-white">Get a moving quote</Link></div>}
      </section>
    </div>
  </main>;
}
