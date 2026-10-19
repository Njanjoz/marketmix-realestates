// src/components/driver/DriverOfferCard.jsx
import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Package, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { acceptDriverOffer, declineDriverOffer } from '../../services/driverService';
import { estimateTransportQuote } from '../../utils/transportQuote';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const money = (val) => `KSh ${Number(val || 0).toLocaleString()}`;
const ITEM_NAMES = { bed: 'Bed', mattress: 'Mattress', sofa: 'Sofa', table: 'Table', chair: 'Chair', wardrobe: 'Wardrobe', fridge: 'Fridge', tv: 'TV & electronics', washer: 'Washing machine', box: 'Boxes', other: 'Other items' };

const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return +(2 * R * Math.asin(Math.sqrt(x))).toFixed(1);
};

const pickupPointFrom = (offer) => {
  const c = offer?.pickupCoordinates || offer?.pickupLocation || null;
  if (!c) return null;
  const lat = Number(c.lat ?? c.latitude);
  const lng = Number(c.lng ?? c.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

function useDriverDistance(pickup) {
  const [distanceKm, setDistanceKm] = useState(null);
  useEffect(() => {
    setDistanceKm(null);
    if (!pickup) return;
    if (!navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDistanceKm(haversineKm(me, pickup));
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
    );
    return () => { cancelled = true; };
  }, [pickup?.lat, pickup?.lng]);
  return distanceKm;
}

export default function DriverOfferCard({ offer, onActionComplete }) {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  // Offers from the API and Firestore listener are already the request itself;
  // older dispatch payloads may wrap it in requestData.
  const req = offer.requestData || offer;
  const driverRate = Number(userProfile?.driverProfile?.ratePerKm || 0);
  const routeEstimate = req.quotedRouteKm || req.estimatedRouteKm || estimateTransportQuote(req.pickupCoordinates || req.pickupLocation, req.destinationCoordinates || req.destinationLocation)?.estimatedRouteKm;
  const personalizedEstimate = driverRate > 0 && routeEstimate
    ? { estimatedPrice: Math.ceil((driverRate * routeEstimate) / 50) * 50, estimatedRouteKm: routeEstimate }
    : null;
  const quoteEstimate = req.quotedPrice != null
    ? { estimatedPrice: req.quotedPrice, estimatedRouteKm: req.quotedRouteKm || routeEstimate }
    : personalizedEstimate || (req.estimatedPrice != null
      ? { estimatedPrice: req.estimatedPrice, estimatedRouteKm: req.estimatedRouteKm }
      : estimateTransportQuote(req.pickupCoordinates || req.pickupLocation, req.destinationCoordinates || req.destinationLocation));
  const pickup = pickupPointFrom(offer);
  const distanceKm = useDriverDistance(pickup);
  const requestItems = Object.entries(req.items || {}).filter(([, quantity]) => Number(quantity) > 0);

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
    <article className="overflow-hidden rounded-[1.7rem] border border-emerald-100 bg-white shadow-[0_18px_55px_rgba(15,45,32,.08)]">
      <div className="h-1.5 bg-gradient-to-r from-emerald-800 via-emerald-500 to-lime-300" />
      <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            {req.vehicleLabel || 'Transport Request'}
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-2">{req.destinationTitle || req.destinationLabel || 'Move Request'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{req.itemCount || requestItems.reduce((sum, [, quantity]) => sum + Number(quantity), 0) || 1} items · {req.userName || 'Customer'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-slate-400">{req.quotedPrice != null ? 'Confirmed quote' : 'Estimated fare'}</p>
          <p className="text-lg font-extrabold text-emerald-700">{req.quotedPrice != null ? money(req.quotedPrice) : quoteEstimate ? money(quoteEstimate.estimatedPrice) : 'Quote pending'}</p>
          {req.quotedPrice == null && quoteEstimate && <p className="mt-1 text-[10px] text-slate-500">Indicative · {quoteEstimate.estimatedRouteKm} km</p>}
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
          <span><strong>Pickup:</strong> {req.pickupLabel || 'Pickup location'}
        {pickup && (
            <div className="mt-3">
              <div className="h-40 w-full overflow-hidden rounded-2xl border border-slate-200">
                <MapContainer
                  center={[pickup.lat, pickup.lng]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                  dragging={false}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  <Marker
                    position={[pickup.lat, pickup.lng]}
                    icon={L.divIcon({
                      className: 'marketmix-map-marker',
                      html: '<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #dc2626;"></div>',
                      iconSize: [20, 20],
                      iconAnchor: [10, 10],
                    })}
                  />
                </MapContainer>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-600">
                📍 Pickup pinned{distanceKm != null ? ` · ~${distanceKm} km from you` : ''}
              </p>
            </div>
        )}
</span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
          <span><strong>Destination:</strong> {req.destinationLabel || 'Destination location'}</span>
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-emerald-900"><Package className="h-4 w-4"/>Belongings to carry</div>
        {requestItems.length ? <div className="mt-3 flex flex-wrap gap-2">{requestItems.map(([id, quantity]) => <span key={id} className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">{ITEM_NAMES[id] || id} <span className="text-emerald-800">× {quantity}</span></span>)}</div> : <p className="mt-2 text-xs text-slate-500">Item details were not attached to this older request.</p>}
        {req.quotedDriverId && <p className="mt-3 text-[11px] font-semibold text-emerald-900">This request was matched to your vehicle’s listed cargo capability.</p>}
      </div>

      {req.quotedDriverId && req.status === 'QUOTED' ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900">{req.quoteDecision === 'APPEALED' ? 'The customer sent a counter-offer. MarketMix admin is reviewing it.' : req.quoteDecision === 'PENDING' ? 'An updated quote is waiting for the customer.' : 'Your rate card quote has been sent to the customer. You’ll be assigned if they accept.'}</p> : <div className="mt-5 flex items-center gap-3">
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
      </div>}
      </div>
    </article>
  );
}
