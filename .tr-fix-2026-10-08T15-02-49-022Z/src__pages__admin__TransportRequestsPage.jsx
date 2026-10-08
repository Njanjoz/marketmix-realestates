import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Copy, RefreshCw, Save, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { TRANSPORT_STATUSES, TRANSPORT_STATUS_LABELS } from '../../services/transportService';
import '../../components/moving/LiquidGlass.css';

const BACKEND =
  import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';

const resolveContact = (request, usersById) => {
  const profile = (usersById && usersById[request.userId]) || {};
  const email = request.userEmail || request.email || request.customerEmail || profile.email || '';
  const phone = request.userPhone || request.phoneNumber || request.customerPhone || profile.phoneNumber || profile.phone || '';
  return { email, phone };
};

const draftFrom = (request) => ({
  status: request.status || 'REQUESTED', quote: request.quotedPrice == null ? '' : String(request.quotedPrice),
  driverUserId: request.driverUserId || '', driverName: request.driverName || '', driverPhone: request.driverPhone || '',
  vehicleLabel: request.vehicleLabel || '', etaMinutes: request.etaMinutes == null ? '' : String(request.etaMinutes),
});

const TransportRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => onSnapshot(collection(db, 'transportRequests'), (snapshot) => {
    const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    next.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    setRequests(next);
    setDrafts((current) => Object.fromEntries(next.map((request) => [request.id, current[request.id] || draftFrom(request)])));
  }, (error) => {
    console.error('Could not load transport requests:', error);
    toast.error('Could not load transport requests. Check admin access and Firestore rules.');
  }), []);

  // Fetch user profiles for every request that carries a userId
  useEffect(() => {
    let cancelled = false;
    const userIds = Array.from(new Set(requests.map((r) => r.userId).filter(Boolean)));
    const missing = userIds.filter((id) => !usersById[id]);
    if (missing.length === 0) return;
    (async () => {
      const found = {};
      await Promise.all(missing.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) found[uid] = snap.data();
        } catch (err) {
          console.warn('user lookup failed:', uid, err.message);
        }
      }));
      if (!cancelled && Object.keys(found).length) {
        setUsersById((current) => ({ ...current, ...found }));
      }
    })();
    return () => { cancelled = true; };
  }, [requests, usersById]);

  const visible = useMemo(() => statusFilter === 'all' ? requests : requests.filter((request) => request.status === statusFilter), [requests, statusFilter]);
  const setDraft = (id, key, value) => setDrafts((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));

  const save = async (request) => {
    const draft = drafts[request.id] || draftFrom(request);
    const { email: contactEmail, phone: contactPhone } = resolveContact(request, usersById);
    setSavingId(request.id);
    try {
      await updateDoc(doc(db, 'transportRequests', request.id), {
        status: draft.status,
        quotedPrice: draft.quote === '' ? null : Number(draft.quote),
        driverUserId: draft.driverUserId.trim(),
        driverName: draft.driverName.trim().slice(0, 120),
        driverPhone: draft.driverPhone.trim().slice(0, 32),
        vehicleLabel: draft.vehicleLabel.trim().slice(0, 40),
        etaMinutes: draft.etaMinutes === '' ? null : Number(draft.etaMinutes),
        ...( !request.userEmail && contactEmail ? { userEmail: contactEmail } : {} ),
        ...( !request.userPhone && contactPhone ? { userPhone: contactPhone } : {} ),
        updatedAt: serverTimestamp(),
      });

      // Fire email + WhatsApp to the customer (non-blocking, fire-and-forget)
      fetch(`${BACKEND}/api/moving/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (!res.success) console.warn('Moving notify failed:', res);
          else if (!res.hasPhone && !res.hasEmail) console.warn('No contact info on request — nothing sent.');
        })
        .catch((err) => console.warn('Moving notify error:', err.message));

      toast.success('Move details sent to the customer.');
    } catch (error) {
      console.error('Could not update transport request:', error);
      toast.error('Could not save the move details.');
    } finally {
      setSavingId('');
    }
  };

  const copyDriverPage = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/transport/driver`);
    toast.success('Driver tracking page link copied.');
  };

  return <main className="mmx-liquid-canvas min-h-screen px-4 py-8 sm:px-6"><section className="mx-auto max-w-7xl space-y-6">
    <header className="mmx-glass-surface flex flex-wrap items-end justify-between gap-4 rounded-[2rem] p-6"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">MarketMix admin</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Moving requests</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Review private locations, confirm the provider quote, assign a driver account and send the customer updates.</p></div><button type="button" onClick={copyDriverPage} className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"><Copy className="h-4 w-4"/>Copy driver mode link</button></header>
    <div className="flex flex-wrap gap-2">{['all', ...TRANSPORT_STATUSES].map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-full border px-3 py-2 text-xs font-bold ${statusFilter === status ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{status === 'all' ? `All · ${requests.length}` : `${TRANSPORT_STATUS_LABELS[status]} · ${requests.filter((item) => item.status === status).length}`}</button>)}</div>
    {!visible.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><Truck className="mx-auto h-9 w-9 text-slate-400"/><p className="mt-3 font-bold text-slate-800">No transport requests in this status</p></div>}
    <div className="space-y-5">{visible.map((request) => {
      const draft = drafts[request.id] || draftFrom(request);
      return <article key={request.id} className="mmx-glass-surface overflow-hidden rounded-[2rem] border shadow-[0_18px_60px_rgba(20,50,40,.08)]"><div className="grid gap-0 lg:grid-cols-[1fr_1fr]"><div className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">{TRANSPORT_STATUS_LABELS[request.status] || request.status}</span><span className="text-xs text-slate-500">{request.createdAt?.toDate?.().toLocaleString?.() || 'Recently'}</span></div><h2 className="mt-3 text-xl font-extrabold text-slate-950">{request.destinationTitle || request.destinationLabel}</h2><div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"><p><strong>Customer:</strong> {request.userName || 'Unknown'}{' · '}{contactEmail ? <a className="text-emerald-800 underline" href={`mailto:${contactEmail}`}>{contactEmail}</a> : <span className="text-rose-600">no email</span>}{' · '}{contactPhone ? <span>{contactPhone}</span> : <span className="text-rose-600">no phone</span>}</p>{noContact && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">No contact info — WhatsApp + email will be skipped.</p>}<p><strong>Pickup:</strong> {request.pickupLabel}</p><p><strong>Destination:</strong> {request.destinationLabel}{request.destinationPrecision === 'approximate-area' ? ' (area pin)' : ''}</p><p><strong>Items:</strong> {Object.entries(request.items || {}).map(([id, quantity]) => `${id} × ${quantity}`).join(' · ')}</p><p><strong>Customer vehicle preference:</strong> {request.vehicleLabel}</p>{request.packageTitle && <p><strong>Package selected:</strong> {request.packageTitle}</p>}</div><p className="mt-3 text-xs font-semibold text-amber-800">Exact trip pins are private to the customer, assigned driver and admins.</p></div>
        <div className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0 sm:p-6"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Request status<select value={draft.status} onChange={(event) => setDraft(request.id, 'status', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900">{TRANSPORT_STATUSES.map((status) => <option key={status} value={status}>{TRANSPORT_STATUS_LABELS[status]}</option>)}</select></label><label className="text-xs font-bold text-slate-600">Confirmed quote (KSh)<input type="number" min="0" value={draft.quote} onChange={(event) => setDraft(request.id, 'quote', event.target.value)} placeholder="Leave empty until confirmed" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900"/></label><label className="text-xs font-bold text-slate-600 sm:col-span-2">Driver account ID<input value={draft.driverUserId} onChange={(event) => setDraft(request.id, 'driverUserId', event.target.value)} placeholder="Paste the driver UID from Driver Mode" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/><span className="mt-1 block font-normal">The driver copies their UID from <code>/transport/driver</code>.</span></label><label className="text-xs font-bold text-slate-600">Driver name<input value={draft.driverName} onChange={(event) => setDraft(request.id, 'driverName', event.target.value)} maxLength={120} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/></label><label className="text-xs font-bold text-slate-600">Driver phone<input value={draft.driverPhone} onChange={(event) => setDraft(request.id, 'driverPhone', event.target.value)} maxLength={32} placeholder="For call or WhatsApp" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/></label><label className="text-xs font-bold text-slate-600">Vehicle assigned<input value={draft.vehicleLabel} onChange={(event) => setDraft(request.id, 'vehicleLabel', event.target.value)} maxLength={40} placeholder="Pickup · plate if appropriate" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/></label><label className="text-xs font-bold text-slate-600">Driver ETA (minutes)<input type="number" min="0" value={draft.etaMinutes} onChange={(event) => setDraft(request.id, 'etaMinutes', event.target.value)} placeholder="Provider-confirmed only" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"/></label></div><button type="button" onClick={() => save(request)} disabled={savingId === request.id} className="mmx-liquid-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><Save className="h-4 w-4"/>{savingId === request.id ? 'Saving…' : 'Save and notify customer'}</button></div>
      </div></article>;
    })}</div>
  </section></main>;
};

export default TransportRequestsPage;