import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './TransportTrackingMap.css';
import { MapPin } from 'lucide-react';
import { getPoint } from '../../services/transportService';

const markerIcon = (kind) => L.divIcon({
  className: 'marketmix-map-marker',
  html: `<span class="marketmix-map-marker__dot marketmix-map-marker__dot--${kind}">${kind === 'driver' ? 'M' : kind === 'pickup' ? 'P' : 'D'}</span>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
const ROUTE_BASE_URL = import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org';
const TILE_URL = import.meta.env.VITE_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const pickupIcon = markerIcon('pickup');
const destinationIcon = markerIcon('destination');
const driverIcon = markerIcon('driver');

function AnimatedDriverMarker({ point }) {
  const markerRef = useRef(null);
  const initialPositionRef = useRef(point ? [point.lat, point.lng] : null);

  useEffect(() => {
    if (!point || !markerRef.current) return undefined;
    const target = L.latLng(point.lat, point.lng);
    const start = markerRef.current.getLatLng();
    const startedAt = Date.now();
    const duration = 1800;
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = progress * (2 - progress);
      markerRef.current?.setLatLng([
        start.lat + (target.lat - start.lat) * eased,
        start.lng + (target.lng - start.lng) * eased,
      ]);
      if (progress === 1) window.clearInterval(timer);
    }, 40);
    return () => window.clearInterval(timer);
  }, [point?.lat, point?.lng]);

  if (!point) return null;
  return <Marker ref={markerRef} position={initialPositionRef.current || [point.lat, point.lng]} icon={driverIcon} />;
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [36, 36], maxZoom: 15 });
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 14);
  }, [map, points]);
  return null;
}

const TransportTrackingMap = ({ pickupLocation, destinationLocation, driverLocation, className = '' }) => {
  const pickup = getPoint(pickupLocation);
  const destination = getPoint(destinationLocation);
  const driver = getPoint(driverLocation);
  const [route, setRoute] = useState([]);
  const [routeStatus, setRouteStatus] = useState('');
  const lastRouteRequestRef = useRef(0);
  const origin = driver || pickup;

  useEffect(() => {
    let cancelled = false;
    const requestRoute = async () => {
      if (!origin || !destination) {
        setRoute([]);
        setRouteStatus('');
        return;
      }
      const now = Date.now();
      if (now - lastRouteRequestRef.current < 60000) return;
      lastRouteRequestRef.current = now;
      setRouteStatus('Updating route…');
      try {
        const pair = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
        const response = await fetch(`${ROUTE_BASE_URL}/route/v1/driving/${pair}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(10000) });
        const data = await response.json();
        const points = data.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })) || [];
        if (!response.ok || !points.length) throw new Error('Route unavailable');
        if (!cancelled) {
          setRoute(points);
          const minutes = Math.max(1, Math.ceil((data.routes[0].duration || 0) / 60));
          const km = Math.max(0.1, data.routes[0].distance / 1000);
          setRouteStatus(`${minutes} min · ${km.toFixed(1)} km driving estimate`);
        }
      } catch {
        if (!cancelled) {
          setRoute([]);
          setRouteStatus('Route estimate unavailable right now');
        }
      }
    };
    requestRoute();
    return () => { cancelled = true; };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  const points = useMemo(() => [pickup, destination, driver].filter(Boolean), [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng, driver?.lat, driver?.lng]);
  if (!points.length) {
    return <div className={`flex min-h-64 items-center justify-center rounded-3xl border border-white/50 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 text-center ${className}`}><div><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white shadow"><MapPin className="mx-auto h-5 w-5 text-emerald-800"/></div><p className="font-semibold text-slate-800">Map pin waiting for locations</p><p className="mt-1 max-w-sm text-sm text-slate-500">Add a pickup pin and select a property with map coordinates to see the live trip.</p></div></div>;
  }

  return <div className={`overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_20px_60px_rgba(25,50,43,.13)] ${className}`}>
    <div className="relative h-64 sm:h-80">
      <MapContainer center={[points[0].lat, points[0].lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={TILE_URL} />
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}
        {driver && <AnimatedDriverMarker point={driver} />}
        {route.length > 1 && <Polyline positions={route.map((point) => [point.lat, point.lng])} pathOptions={{ color: '#28745d', weight: 5, opacity: 0.86, dashArray: driver ? undefined : '8 9' }} />}
        <FitBounds points={points} />
      </MapContainer>
      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">{driver ? 'Live driver location' : 'Trip route'}</div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-slate-600"><span>{routeStatus || (driver ? 'Driver location sharing' : 'Route preview')}</span><span>Map © OpenStreetMap · Route by OSRM</span></div>
  </div>;
};

export default TransportTrackingMap;
