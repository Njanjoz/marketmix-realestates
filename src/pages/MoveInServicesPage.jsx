import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  KeyRound,
  LoaderCircle,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';

const MOVING_PACKAGES = [
  {
    id: 'essential_move',
    name: 'Essential move',
    description: 'Help with loading and transport for a straightforward move.',
    icon: Truck,
  },
  {
    id: 'pack_and_move',
    name: 'Pack and move',
    description: 'Packing support alongside loading and transport.',
    icon: PackageCheck,
  },
  {
    id: 'full_move_in',
    name: 'Full move-in help',
    description: 'Ask for packing, transport, and help settling in.',
    icon: KeyRound,
  },
];

const formatDate = (value) => {
  if (!value) return 'Just submitted';
  const date = value.toDate?.() || new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just submitted' : date.toLocaleDateString();
};

const STATUS_LABELS = {
  new: 'Received',
  contacted: 'Contacted',
  matched: 'Match in progress',
  completed: 'Completed',
  closed: 'Closed',
};

const MoveInServicesPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId') || '';
  const [requestType, setRequestType] = useState('moving');
  const [packageId, setPackageId] = useState(MOVING_PACKAGES[0].id);
  const [form, setForm] = useState({ area: '', preferredDate: '', budget: '', details: '' });
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPackage = useMemo(
    () => MOVING_PACKAGES.find((item) => item.id === packageId) || MOVING_PACKAGES[0],
    [packageId],
  );

  const loadRequests = useCallback(async () => {
    if (!currentUser?.uid) {
      setRequests([]);
      return;
    }
    setLoadingRequests(true);
    try {
      const requestQuery = query(collection(db, 'serviceRequests'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(requestQuery);
      const ownRequests = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      ownRequests.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRequests(ownRequests);
    } catch (error) {
      console.error('Could not load move-in requests:', error);
      toast.error('Could not load your move-in requests.');
    } finally {
      setLoadingRequests(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      toast.error('Sign in to send your request.');
      return;
    }

    const area = form.area.trim();
    if (!area) {
      toast.error('Add the neighborhood or area you have in mind.');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'serviceRequests'), {
        userId: currentUser.uid,
        userName: (userProfile?.name || currentUser.displayName || 'MarketMix user').slice(0, 120),
        userEmail: (currentUser.email || '').slice(0, 256),
        requestType,
        packageId: requestType === 'moving' ? packageId : 'roommate_match',
        area,
        preferredDate: form.preferredDate,
        budget: form.budget.trim(),
        details: form.details.trim(),
        propertyId,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(requestType === 'moving' ? 'Moving request sent.' : 'Roommate match request sent.');
      setForm({ area: '', preferredDate: '', budget: '', details: '' });
      await loadRequests();
    } catch (error) {
      console.error('Could not submit move-in request:', error);
      toast.error('Could not send your request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
              <KeyRound className="h-3.5 w-3.5" /> Make your next move easier
            </p>
            <h1 className="mt-5 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">A smoother move starts with the right support.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Request help with moving or ask MarketMix to help you find a roommate. Share what you need and our team can follow up with next steps.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Your request stays private</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-300" /> Track follow-up in your account</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-8">
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRequestType('moving')} className={`rounded-2xl p-4 text-left transition ${requestType === 'moving' ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/15'}`}>
                <Truck className="h-6 w-6" />
                <span className="mt-4 block font-bold">Moving packages</span>
                <span className={`mt-1 block text-xs ${requestType === 'moving' ? 'text-slate-800' : 'text-slate-300'}`}>Ask for a move quote</span>
              </button>
              <button type="button" onClick={() => setRequestType('roommate')} className={`rounded-2xl p-4 text-left transition ${requestType === 'roommate' ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/15'}`}>
                <Users className="h-6 w-6" />
                <span className="mt-4 block font-bold">Find a roommate</span>
                <span className={`mt-1 block text-xs ${requestType === 'roommate' ? 'text-slate-800' : 'text-slate-300'}`}>Request a private match</span>
              </button>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">{requestType === 'moving' ? 'Choose the kind of support you need. We will collect your details and follow up about availability and a quote.' : 'Tell us your preferred area, budget, and move date. Your contact details are only shared with the MarketMix team.'}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-14">
        <div className="space-y-6">
          {requestType === 'moving' && (
            <section aria-labelledby="package-heading">
              <div className="mb-4">
                <p className="text-sm font-semibold text-emerald-700">Moving support</p>
                <h2 id="package-heading" className="mt-1 text-2xl font-bold text-slate-900">Choose a package to get started</h2>
                <p className="mt-1 text-sm text-slate-600">These describe the help you can request. The team will confirm availability and pricing with you.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {MOVING_PACKAGES.map((item) => {
                  const Icon = item.icon;
                  const selected = packageId === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => setPackageId(item.id)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-300'}`}>
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}><Icon className="h-5 w-5" /></span>
                      <span className="mt-3 block font-bold text-slate-900">{item.name}</span>
                      <span className="mt-1 block text-sm leading-5 text-slate-600">{item.description}</span>
                      {selected && <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-800"><Check className="h-3.5 w-3.5" /> Selected</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <form onSubmit={submitRequest} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div>
              <p className="text-sm font-semibold text-emerald-700">{requestType === 'moving' ? selectedPackage.name : 'Roommate matching'}</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Tell us a little about what you need</h2>
              <p className="mt-1 text-sm text-slate-600">Please share a neighborhood or general area. You do not need to enter an exact address.</p>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Preferred neighborhood or area <span className="text-red-600">*</span>
              <span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 px-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <input required maxLength={160} value={form.area} onChange={(event) => updateForm('area', event.target.value)} placeholder="e.g. Kilimani, Nairobi" className="w-full border-0 py-3 text-sm font-normal outline-none" />
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Preferred move date
                <span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 px-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                  <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                  <input type="date" value={form.preferredDate} onChange={(event) => updateForm('preferredDate', event.target.value)} className="w-full border-0 py-3 text-sm font-normal outline-none" />
                </span>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {requestType === 'roommate' ? 'Monthly budget (KES)' : 'Budget range (KES)'}
                <input inputMode="text" maxLength={40} value={form.budget} onChange={(event) => updateForm('budget', event.target.value)} placeholder={requestType === 'roommate' ? 'e.g. 20,000–35,000' : 'e.g. 10,000–25,000'} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              {requestType === 'roommate' ? 'Roommate preferences or extra details' : 'What should we know about your move?'}
              <textarea rows={4} maxLength={1200} value={form.details} onChange={(event) => updateForm('details', event.target.value)} placeholder={requestType === 'roommate' ? 'Share details such as the kind of place you are looking for, household size, or preferred move timing.' : 'For example: approximate number of boxes, furniture, or any help you would like at your destination.'} className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </label>

            {propertyId && <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">This request is linked to the property you were viewing.</p>}

            {currentUser ? (
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {saving ? 'Sending request…' : requestType === 'moving' ? 'Request a moving quote' : 'Request a roommate match'}
              </button>
            ) : (
              <div className="flex flex-col gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                <span>Sign in to send a request and track replies.</span>
                <Link to="/login" className="inline-flex items-center gap-2 font-bold text-emerald-800 hover:text-emerald-900">Sign in <ArrowRight className="h-4 w-4" /></Link>
              </div>
            )}
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-emerald-950 p-6 text-white">
            <ShieldCheck className="h-6 w-6 text-emerald-300" />
            <h2 className="mt-4 text-lg font-bold">Your details stay private</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-100">Only you and the MarketMix team can see your request. We do not publish roommate profiles or expose your contact details publicly.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Your activity</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Move-in requests</h2>
              </div>
              {currentUser && <button type="button" onClick={loadRequests} disabled={loadingRequests} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Refresh requests"><LoaderCircle className={`h-4 w-4 ${loadingRequests ? 'animate-spin' : ''}`} /></button>}
            </div>
            {!currentUser ? (
              <p className="mt-4 text-sm text-slate-600">Sign in to see request updates here.</p>
            ) : loadingRequests ? (
              <div className="mt-5 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading requests…</div>
            ) : requests.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">Requests you send will appear here with their current status.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {requests.map((request) => (
                  <article key={request.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{request.requestType === 'roommate' ? 'Roommate match' : MOVING_PACKAGES.find((item) => item.id === request.packageId)?.name || 'Moving help'}</h3>
                        <p className="mt-1 text-xs text-slate-500">{request.area} · {formatDate(request.createdAt)}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">{STATUS_LABELS[request.status] || request.status}</span>
                    </div>
                    {request.adminNote && <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-700">{request.adminNote}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
};

export default MoveInServicesPage;
