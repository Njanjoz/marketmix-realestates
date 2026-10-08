// src/components/driver/DriverOfferCard.jsx
import React, { useState } from 'react';
import { Truck, MapPin, Package, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { acceptDriverOffer, declineDriverOffer } from '../../services/driverService';

const money = (val) => `KSh ${Number(val || 0).toLocaleString()}`;

export default function DriverOfferCard({ offer, onActionComplete }) {
  const [loading, setLoading] = useState(false);
  const req = offer.requestData || {};

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptDriverOffer(offer.requestId);
      toast.success('Offer accepted! Move assigned to you.');
      onActionComplete?.();
    } catch (err) {
      toast.error(err.message || 'Could not accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await declineDriverOffer(offer.requestId, 'Declined by driver');
      toast.success('Offer declined.');
      onActionComplete?.();
    } catch (err) {
      toast.error(err.message || 'Could not decline offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="mmx-glass-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            {req.vehicleLabel || 'Transport Request'}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-2">{req.destinationTitle || req.destinationLabel || 'Move Request'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{req.itemCount || 1} items · {req.userName || 'Customer'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-slate-400">Offered Quote</p>
          <p className="text-lg font-extrabold text-emerald-700">{money(req.quotedPrice || req.estimatedPrice || 1500)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
          <span><strong>Pickup:</strong> {req.pickupLabel || 'Pickup location'}</span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
          <span><strong>Destination:</strong> {req.destinationLabel || 'Destination location'}</span>
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleDecline}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 text-red-500" />}
          <span>Decline</span>
        </button>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-white" />}
          <span>Accept Move</span>
        </button>
      </div>
    </article>
  );
}
