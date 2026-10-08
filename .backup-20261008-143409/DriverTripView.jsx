// src/pages/driver/DriverTripView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, MapPin, CheckCircle, Play, ArrowLeft, Loader2 } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { startTrip, completeTrip } from '../../services/driverService';
import TransportTrackingMap from '../../components/moving/TransportTrackingMap';

export default function DriverTripView() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
    </main>
  );
}
