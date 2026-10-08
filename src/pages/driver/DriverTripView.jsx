// src/pages/driver/DriverTripView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle, Play, ArrowLeft, Loader2, XCircle } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db } from '../../firebase/config';
import { startTrip, completeTrip } from '../../services/driverService';
import TransportTrackingMap from '../../components/moving/TransportTrackingMap';

export default function DriverTripView() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!requestId) return;
    const unsub = onSnapshot(doc(db, 'transportRequests', requestId), (snap) => {
      if (snap.exists()) {
        setTrip({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [requestId]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startTrip(requestId);
      toast.success('Trip started (In transit)');
    } catch (err) {
      toast.error(err.message || 'Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await completeTrip(requestId);
      toast.success('Trip completed successfully!');
      navigate('/driver/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  const REASONS = [
    { value: 'vehicle', label: 'Vehicle breakdown' },
    { value: 'too_far', label: 'Too far from pickup' },
    { value: 'unreachable', label: 'Customer unreachable' },
    { value: 'other', label: 'Other (describe below)' },
  ];

  const handleCancel = async () => {
    if (!cancelReason) { setCancelError('Choose a reason'); return; }
    setCancelBusy(true);
    setCancelError('');
    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';
      const idToken = await auth.currentUser?.getIdToken?.();
      const res = await fetch(`${BACKEND}/api/moving/driver-cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ requestId, reason: cancelReason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || `Server ${res.status}`);
      toast.success('Cancelled. The request is open for other drivers.');
      setCancelModalOpen(false);
      navigate('/driver/dashboard');
    } catch (e) {
      setCancelError(e.message || 'Could not cancel');
    } finally {
      setCancelBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">Trip not found</h2>
          <button onClick={() => navigate('/driver/dashboard')} className="mt-3 text-xs font-bold text-emerald-700 underline">Back to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                {trip.status}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{trip.destinationLabel || 'Move Trip'}</h1>
              <p className="text-xs text-slate-500 mt-1">Customer: {trip.userName} ({trip.userEmail})</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400">Agreed Quote</p>
              <p className="text-xl font-extrabold text-emerald-700">KSh {Number(trip.quotedPrice || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs text-slate-700">
            <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5">
              <p className="font-bold text-slate-900">Pickup Details</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-600" /> {trip.pickupLabel}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5">
              <p className="font-bold text-slate-900">Destination Details</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-sky-600" /> {trip.destinationLabel}</p>
            </div>
          </div>

          <div className="mt-6 h-64 rounded-2xl overflow-hidden border border-slate-200">
            <TransportTrackingMap pickupLocation={trip.pickupCoordinates} destinationLocation={trip.destinationCoordinates} driverLocation={trip.driverLocation} />
          </div>

          <div className="mt-6 flex gap-3">
            {trip.status === 'DRIVER_ASSIGNED' || trip.status === 'PAID' ? (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-sky-600 py-3 text-xs font-bold text-white hover:bg-sky-700 shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>Start Trip (In Transit)</span>
              </button>
            ) : null}

            {(trip.status === 'DRIVER_ASSIGNED' || trip.status === 'PAID') && (
              <button
                onClick={() => { setCancelModalOpen(true); setCancelReason(''); setCancelError(''); }}
                disabled={actionLoading}
                className="flex-1 rounded-xl border border-rose-300 bg-rose-50 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Job</span>
              </button>
            )}

            {trip.status === 'IN_TRANSIT' && (
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Complete Trip</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {cancelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 420, width: '100%', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 17 }}>Cancel this job?</h3>
              <button onClick={() => setCancelModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#64748b' }}>×</button>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: 13, color: '#475569' }}>
              The customer will be notified and the request reopens for other drivers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {REASONS.map(r => (
                <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `1px solid ${cancelReason === r.value ? '#f43f5e' : '#e5e7eb'}`, borderRadius: 10, background: cancelReason === r.value ? '#fff1f2' : 'white', cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="cancel-reason" value={r.value} checked={cancelReason === r.value} onChange={(e) => setCancelReason(e.target.value)} />
                  {r.label}
                </label>
              ))}
            </div>
            {cancelError && <p style={{ margin: '0 0 10px 0', color: '#e11d48', fontSize: 12 }}>{cancelError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setCancelModalOpen(false)} disabled={cancelBusy} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13 }}>Keep job</button>
              <button onClick={handleCancel} disabled={cancelBusy || !cancelReason} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: cancelBusy || !cancelReason ? 0.5 : 1 }}>
                {cancelBusy ? 'Cancelling…' : 'Cancel job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
