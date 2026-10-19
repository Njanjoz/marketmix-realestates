import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CheckCheck, Copy, MessageCircle, Phone, Save, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth, db } from '../../firebase/config';
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
  status: request.status || 'REQUESTED',
  quote: request.quotedPrice == null ? '' : String(request.quotedPrice),
  driverUserId: request.driverUserId || '',
  driverName: request.driverName || '',
  driverPhone: request.driverPhone || '',
  vehicleLabel: request.vehicleLabel || '',
  etaMinutes: request.etaMinutes == null ? '' : String(request.etaMinutes),
});

const TransportRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [capacityAlerts, setCapacityAlerts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [approvingWithdrawal, setApprovingWithdrawal] = useState('');
  const [usersById, setUsersById] = useState({});
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const appealsLoaded = useRef(false);
  const seenPendingAppeals = useRef(new Set());
  const seenCapacityAlerts = useRef(false);

  useEffect(() => onSnapshot(collection(db, 'transportRequests'), (snapshot) => {
    const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    next.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const pendingAppeals = next.filter((request) => request.quoteAppeal?.status === 'PENDING');
    const pendingIds = new Set(pendingAppeals.map((request) => request.id));
    if (appealsLoaded.current && pendingAppeals.some((request) => !seenPendingAppeals.current.has(request.id))) {
      toast('A customer submitted a transport quote appeal.', { icon: '🔔' });
    }
    seenPendingAppeals.current = pendingIds;
    appealsLoaded.current = true;
    setRequests(next);
    setDrafts((current) => Object.fromEntries(next.map((request) => [request.id, current[request.id] || draftFrom(request)])));
  }, (error) => {
    console.error('Could not load transport requests:', error);
    toast.error('Could not load transport requests. Check admin access and Firestore rules.');
  }), []);

  useEffect(() => onSnapshot(collection(db, 'transportCapacityAlerts'), (snapshot) => {
    const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    next.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    const pending = next.filter((alert) => alert.status === 'PENDING');
    if (pending.length && (!seenCapacityAlerts.current || pending.some((alert) => !seenCapacityAlerts.current.has(alert.id)))) {
      toast('A move request has no compatible driver match. Open the pending alert to review nearby contacts.', { icon: '📣' });
    }
    seenCapacityAlerts.current = new Set(pending.map((alert) => alert.id));
    setCapacityAlerts(next);
  }, (error) => {
    console.error('Could not load transport capacity alerts:', error);
    toast.error('Could not load moving capacity alerts. Check admin access and Firestore rules.');
  }), []);

  useEffect(() => onSnapshot(collection(db, 'transportWithdrawals'), (snapshot) => {
    const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    next.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    setWithdrawals(next);
  }, (error) => console.error('Could not load transport payout requests:', error)), []);

  const approvePayout = async (withdrawal) => {
    if (!window.confirm(`Send KSh ${Number(withdrawal.netAmount).toLocaleString()} to ${withdrawal.sellerName} at ${withdrawal.phone}? This starts an M-Pesa payout.`)) return;
    setApprovingWithdrawal(withdrawal.id);
    try {
      const token = await auth.currentUser?.getIdToken?.();
      const response = await fetch(`${BACKEND}/api/moving/payments/withdrawals/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ withdrawalId: withdrawal.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not start payout.');
      toast.success(`M-Pesa payout sent to IntaSend for processing (${data.trackingId}).`);
    } catch (error) { toast.error(error.message || 'Could not approve payout.'); }
    finally { setApprovingWithdrawal(''); }
  };

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

  const visible = useMemo(
    () => statusFilter === 'all' ? requests : requests.filter((request) => request.status === statusFilter),
    [requests, statusFilter]
  );

  const setDraft = (id, key, value) =>
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));

  const save = async (request) => {
    const draft = drafts[request.id] || draftFrom(request);
    const { email: contactEmail, phone: contactPhone } = resolveContact(request, usersById);
    setSavingId(request.id);
    try {
      const payload = {
        status: draft.status,
        quotedPrice: draft.quote === '' ? null : Number(draft.quote),
        driverUserId: draft.driverUserId.trim(),
        driverName: draft.driverName.trim().slice(0, 120),
        driverPhone: draft.driverPhone.trim().slice(0, 32),
        vehicleLabel: draft.vehicleLabel.trim().slice(0, 40),
        etaMinutes: draft.etaMinutes === '' ? null : Number(draft.etaMinutes),
        updatedAt: serverTimestamp(),
      };
      if (request.quoteAppeal?.status === 'PENDING') {
        payload.quoteDecision = 'PENDING';
        payload.quoteAppeal = { ...request.quoteAppeal, status: 'RESOLVED', resolvedAt: serverTimestamp(), resolvedPrice: draft.quote === '' ? null : Number(draft.quote) };
      }
      if (!request.userEmail && contactEmail) payload.userEmail = contactEmail;
      if (!request.userPhone && contactPhone) payload.userPhone = contactPhone;

      await updateDoc(doc(db, 'transportRequests', request.id), payload);

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

  const resolveCapacityAlert = async (alert) => {
    try {
      await updateDoc(doc(db, 'transportCapacityAlerts', alert.id), { status: 'REVIEWED', resolvedAt: serverTimestamp() });
      toast.success('Capacity alert marked reviewed.');
    } catch (error) {
      toast.error(error.message || 'Could not update capacity alert.');
    }
  };

  return (
    <main className="mmx-liquid-canvas min-h-screen px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="mmx-glass-surface flex flex-wrap items-end justify-between gap-4 rounded-[2rem] p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">MarketMix admin</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Moving requests</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review private locations, confirm the provider quote, assign a driver account and send the customer updates.
            </p>
          </div>
          <button type="button" onClick={copyDriverPage} className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white">
            <Copy className="h-4 w-4" />Copy driver mode link
          </button>
        </header>

        <section className="mmx-glass-surface rounded-3xl border border-emerald-200 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-emerald-800">Seller payouts</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">Transport withdrawals</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-900">{withdrawals.filter((item) => item.status === 'PENDING_APPROVAL').length} awaiting review</span></div>
          {withdrawals.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No driver payouts have been requested.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{withdrawals.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-slate-900">{item.sellerName || 'Driver'}</p><p className="mt-1 text-xs text-slate-600">{item.phone} · Move {item.requestId}</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-900">{item.status}</span></div><p className="mt-3 text-xs text-slate-700">Gross KSh {Number(item.grossAmount).toLocaleString()} · 8% fee KSh {Number(item.commissionAmount).toLocaleString()} · payout KSh <strong>{Number(item.netAmount).toLocaleString()}</strong></p>{item.status === 'PENDING_APPROVAL' ? <button type="button" onClick={() => approvePayout(item)} disabled={approvingWithdrawal === item.id} className="mt-3 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{approvingWithdrawal === item.id ? 'Starting payout…' : 'Approve M-Pesa payout'}</button> : item.trackingId && <p className="mt-2 text-[11px] text-slate-500">IntaSend reference: {item.trackingId} · {item.providerStatus}</p>}</article>)}</div>}
        </section>

        {requests.some((request) => request.quoteAppeal?.status === 'PENDING') && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4"><h2 className="font-extrabold text-amber-950">Customer quote appeals · {requests.filter((request) => request.quoteAppeal?.status === 'PENDING').length} pending</h2><p className="mt-1 text-sm text-amber-900">Review each appeal below. Driver name, contact and the buyer’s counter-offer are attached to its transport request.</p></section>}

        {capacityAlerts.some((alert) => alert.status === 'PENDING') && <section className="space-y-4 rounded-2xl border border-orange-300 bg-orange-50 p-4 sm:p-5">
          <div><h2 className="font-extrabold text-orange-950">No listed vehicle can carry this load · {capacityAlerts.filter((alert) => alert.status === 'PENDING').length} pending</h2><p className="mt-1 text-sm text-orange-900">Review the customer’s items and contact nearby drivers to negotiate a suitable vehicle or arrangement.</p></div>
          {capacityAlerts.filter((alert) => alert.status === 'PENDING').map((alert) => <article key={alert.id} className="rounded-2xl border border-orange-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold text-slate-900">{alert.customerName || 'Customer'} · {alert.pickupLabel || 'Pickup not specified'}</h3><p className="mt-1 text-xs text-slate-600">To: {alert.destinationLabel || 'Destination not specified'} · Requested vehicle: {alert.vehicleLabel || 'Any suitable vehicle'}</p><p className="mt-2 text-sm font-semibold text-slate-800">Items: {(alert.items || []).map(({ id, quantity }) => `${id} × ${quantity}`).join(' · ') || 'Not listed'}</p><p className="mt-1 text-xs text-slate-500">{alert.nearbyDriverCount || 0} nearby registered driver(s) found.</p></div><button type="button" onClick={() => resolveCapacityAlert(alert)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><CheckCheck className="h-4 w-4"/>Mark reviewed</button></div>
            {alert.nearbyDrivers?.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{alert.nearbyDrivers.map((driver) => <div key={driver.driverId} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-slate-900">{driver.name} · {driver.vehicleLabel}{driver.plate ? ` (${driver.plate})` : ''}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${driver.online ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>{driver.online ? 'Online' : 'Registered'}</span></div><p className="mt-1 text-xs text-slate-600">{driver.driverDistanceKm != null ? `${driver.driverDistanceKm} km from pickup` : driver.workArea || 'Distance unavailable'} · Capacity: {Object.entries(driver.cargoCapacity || {}).map(([item, count]) => `${item} × ${count}`).join(', ') || driver.canCarryItems?.join(', ') || 'No cargo list yet'}</p>{driver.phone ? <div className="mt-2 flex gap-2"><a href={`tel:${encodeURIComponent(driver.phone)}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><Phone className="h-3.5 w-3.5"/>Call {driver.phone}</a><a href={`https://wa.me/${driver.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><MessageCircle className="h-3.5 w-3.5"/>WhatsApp</a></div> : <p className="mt-2 text-xs font-semibold text-rose-700">No phone number listed.</p>}</div>)}</div> : <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600">No drivers were registered in the pickup area. Admin can contact providers in neighbouring areas.</p>}
          </article>)}
        </section>}

        <div className="flex flex-wrap gap-2">
          {['all', ...TRANSPORT_STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-3 py-2 text-xs font-bold ${statusFilter === status ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              {status === 'all'
                ? `All · ${requests.length}`
                : `${TRANSPORT_STATUS_LABELS[status]} · ${requests.filter((item) => item.status === status).length}`}
            </button>
          ))}
        </div>

        {!visible.length && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Truck className="mx-auto h-9 w-9 text-slate-400" />
            <p className="mt-3 font-bold text-slate-800">No transport requests in this status</p>
          </div>
        )}

        <div className="space-y-5">
          {visible.map((request) => {
            const draft = drafts[request.id] || draftFrom(request);
            const { email: contactEmail, phone: contactPhone } = resolveContact(request, usersById);
            const noContact = !contactEmail && !contactPhone;
            return (
              <article key={request.id} className="mmx-glass-surface overflow-hidden rounded-[2rem] border shadow-[0_18px_60px_rgba(20,50,40,.08)]">
                <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900">
                        {TRANSPORT_STATUS_LABELS[request.status] || request.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {request.createdAt?.toDate?.().toLocaleString?.() || 'Recently'}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-extrabold text-slate-950">
                      {request.destinationTitle || request.destinationLabel}
                    </h2>
                    <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      <p>
                        <strong>Customer:</strong> {request.userName || 'Unknown'}{' · '}
                        {contactEmail
                          ? <a className="text-emerald-800 underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
                          : <span className="text-rose-600">no email</span>}
                        {' · '}
                        {contactPhone ? <span>{contactPhone}</span> : <span className="text-rose-600">no phone</span>}
                      </p>
                      <p><strong>Pickup:</strong> {request.pickupLabel}</p>
                      <p>
                        <strong>Destination:</strong> {request.destinationLabel}
                        {request.destinationPrecision === 'approximate-area' ? ' (area pin)' : ''}
                      </p>
                      <p>
                        <strong>Items:</strong> {Object.entries(request.items || {}).map(([id, quantity]) => `${id} × ${quantity}`).join(' · ')}
                      </p>
                      <p><strong>Customer vehicle preference:</strong> {request.vehicleLabel}</p>
                      {request.packageTitle && <p><strong>Package selected:</strong> {request.packageTitle}</p>}
                      {noContact && (
                        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                          No contact info — WhatsApp + email will be skipped.
                        </p>
                      )}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-amber-800">
                      Exact trip pins are private to the customer, assigned driver and admins.
                    </p>
                  </div>

                  <div className="border-t border-slate-100 p-5 lg:border-l lg:border-t-0 sm:p-6">
                    {request.quoteAppeal?.status === 'PENDING' && <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-extrabold">Buyer appealed this quote</p><p className="mt-1">Driver: {request.quoteAppeal.driverName} · {request.quoteAppeal.driverVehicle}</p><p>Driver contact: {request.quoteAppeal.driverPhone || 'Not provided'}</p><p>Original quote: KSh {Number(request.quoteAppeal.originalQuote || 0).toLocaleString()} · Buyer offers: KSh {Number(request.quoteAppeal.customerOffer || 0).toLocaleString()}</p>{request.quoteAppeal.message && <p className="mt-1">Message: {request.quoteAppeal.message}</p>}<p className="mt-1 text-xs">Set the agreed admin price below and save; the buyer can then accept or decline it.</p></div>}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-slate-600">Request status
                        <select
                          value={draft.status}
                          onChange={(event) => setDraft(request.id, 'status', event.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
                        >
                          {TRANSPORT_STATUSES.map((status) => (
                            <option key={status} value={status}>{TRANSPORT_STATUS_LABELS[status]}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-bold text-slate-600">Admin price override (KSh)
                        <input
                          type="number" min="1" step="50"
                          value={draft.quote}
                          onChange={(event) => setDraft(request.id, 'quote', event.target.value)}
                          placeholder={`Estimate: KSh ${Number(request.estimatedPrice || 0).toLocaleString()} · enter final price`}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900"
                        />
                        <span className="mt-1 block font-normal">Enter your amount to replace the estimate on customer and driver screens. Leave blank to use the estimate.</span>
                      </label>
                      <label className="text-xs font-bold text-slate-600 sm:col-span-2">Driver account ID
                        <input
                          value={draft.driverUserId}
                          onChange={(event) => setDraft(request.id, 'driverUserId', event.target.value)}
                          placeholder="Paste the driver UID from Driver Mode"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
                        />
                        <span className="mt-1 block font-normal">The driver copies their UID from <code>/transport/driver</code>.</span>
                      </label>
                      <label className="text-xs font-bold text-slate-600">Driver name
                        <input
                          value={draft.driverName}
                          onChange={(event) => setDraft(request.id, 'driverName', event.target.value)}
                          maxLength={120}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-600">Driver phone
                        <input
                          value={draft.driverPhone}
                          onChange={(event) => setDraft(request.id, 'driverPhone', event.target.value)}
                          maxLength={32}
                          placeholder="For call or WhatsApp"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-600">Vehicle assigned
                        <input
                          value={draft.vehicleLabel}
                          onChange={(event) => setDraft(request.id, 'vehicleLabel', event.target.value)}
                          maxLength={40}
                          placeholder="Pickup · plate if appropriate"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-600">Driver ETA (minutes)
                        <input
                          type="number" min="0"
                          value={draft.etaMinutes}
                          onChange={(event) => setDraft(request.id, 'etaMinutes', event.target.value)}
                          placeholder="Provider-confirmed only"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => save(request)}
                      disabled={savingId === request.id}
                      className="mmx-liquid-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {savingId === request.id ? 'Saving…' : 'Save and notify customer'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default TransportRequestsPage;
