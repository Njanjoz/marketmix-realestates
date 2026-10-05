import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, LoaderCircle, MapPin, RefreshCw, Save, Search, Users, Truck } from 'lucide-react';
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';

const REQUEST_STATUSES = ['new', 'contacted', 'matched', 'completed', 'closed'];
const STATUS_STYLES = {
  new: 'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  matched: 'bg-violet-100 text-violet-800',
  completed: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-200 text-slate-700',
};
const PACKAGE_NAMES = {
  essential_move: 'Essential move',
  pack_and_move: 'Pack and move',
  full_move_in: 'Full move-in help',
  roommate_match: 'Roommate match',
};

const formatDate = (value) => {
  if (!value) return 'Recently';
  const date = value.toDate?.() || new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString();
};

const ServiceRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'serviceRequests'));
      const nextRequests = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      nextRequests.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRequests(nextRequests);
      setNotes(Object.fromEntries(nextRequests.map((item) => [item.id, item.adminNote || ''])));
    } catch (error) {
      console.error('Could not load move-in requests:', error);
      toast.error('Could not load move-in requests. Check admin access and Firestore rules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = filter === 'all' || (request.status || 'new') === filter;
      const haystack = [request.userName, request.userEmail, request.area, request.details, request.requestType, PACKAGE_NAMES[request.packageId]].join(' ').toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [filter, requests, search]);

  const updateRequest = async (request, status = request.status || 'new') => {
    const adminNote = (notes[request.id] || '').trim().slice(0, 1000);
    setSavingId(request.id);
    try {
      await updateDoc(doc(db, 'serviceRequests', request.id), {
        status,
        adminNote,
        updatedAt: serverTimestamp(),
      });
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status, adminNote } : item));
      toast.success('Request updated.');
    } catch (error) {
      console.error('Could not update move-in request:', error);
      toast.error('Could not update this request.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold text-emerald-700">MarketMix admin</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Move-in requests</h1>
            <p className="mt-1 text-sm text-slate-600">Review private moving and roommate requests, then update the customer on next steps.</p>
          </div>
          <button type="button" onClick={loadRequests} disabled={loading} aria-label="Refresh requests" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', ...REQUEST_STATUSES].map((status) => {
              const count = status === 'all' ? requests.length : requests.filter((item) => (item.status || 'new') === status).length;
              return <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${filter === status ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>{status} {count}</button>;
            })}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, area, email" className="min-w-0 bg-transparent text-sm outline-none" />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading requests…</div>
        ) : visibleRequests.length === 0 ? (
          <div className="border-y border-slate-200 py-14 text-center text-sm text-slate-500">No {filter === 'all' ? '' : `${filter} `}move-in requests found.</div>
        ) : (
          <div className="space-y-4">
            {visibleRequests.map((request) => {
              const isRoommate = request.requestType === 'roommate';
              const Icon = isRoommate ? Users : Truck;
              const status = request.status || 'new';
              return (
                <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Icon className="h-5 w-5" /></span>
                        <h2 className="text-lg font-bold text-slate-900">{PACKAGE_NAMES[request.packageId] || (isRoommate ? 'Roommate match' : 'Moving request')}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLES[status] || STATUS_STYLES.new}`}>{status}</span>
                      </div>
                      <div className="mt-3 grid gap-x-8 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
                        <p><span className="font-semibold text-slate-800">{request.userName || 'MarketMix user'}</span>{request.userEmail ? ` · ${request.userEmail}` : ''}</p>
                        <p className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 shrink-0" />{request.area || 'Area not provided'}</p>
                        <p>Preferred date: {request.preferredDate || 'Flexible'}</p>
                        <p>Budget: {request.budget || 'Not provided'}</p>
                        <p className="text-xs text-slate-500 sm:col-span-2">Received {formatDate(request.createdAt)}{request.propertyId ? ' · linked from a property page' : ''}</p>
                      </div>
                      {request.details && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{request.details}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"><Briefcase className="h-4 w-4" /> Private request</div>
                  </div>
                  <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-[190px_minmax(0,1fr)_auto] md:items-end">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Update status
                      <select value={status} onChange={(event) => updateRequest(request, event.target.value)} disabled={savingId === request.id} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-emerald-600">
                        {REQUEST_STATUSES.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Note for the customer
                      <input maxLength={1000} value={notes[request.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Share an update or next step" className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-emerald-600" />
                    </label>
                    <button type="button" onClick={() => updateRequest(request, status)} disabled={savingId === request.id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                      {savingId === request.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save update
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default ServiceRequestsPage;
