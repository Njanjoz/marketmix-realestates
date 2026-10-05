import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MapPin } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: 'marketmix-map-marker',
  html: '<span class="marketmix-map-marker__dot marketmix-map-marker__dot--pickup">&bull;</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function PickOnClick({ onPick }) {
  useMapEvents({ click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  return null;
}

function CenterOnPoint({ point }) {
  const map = useMap();

  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 14), { duration: 0.5 });
  }, [map, point?.lat, point?.lng]);

  return null;
}

export function PanControls() {
  const map = useMap();
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!controlsRef.current) return undefined;
    L.DomEvent.disableClickPropagation(controlsRef.current);
    L.DomEvent.disableScrollPropagation(controlsRef.current);
    return undefined;
  }, []);

  const pan = (horizontal, vertical) => {
    const size = map.getSize();
    map.panBy([horizontal * size.x * 0.28, vertical * size.y * 0.28], { animate: true, duration: 0.25 });
  };
  const buttonClass = 'grid h-10 w-10 place-items-center rounded-xl border border-white/80 bg-white/85 text-slate-700 shadow-md backdrop-blur-xl transition hover:bg-white active:scale-95';

  return <div ref={controlsRef} role="group" aria-label="Pan map" className="absolute right-3 top-3 z-[1000] grid grid-cols-3 gap-1 rounded-2xl border border-white/70 bg-white/40 p-1.5 shadow-lg backdrop-blur-xl">
    <span />
    <button type="button" aria-label="Pan map north" title="Pan north" onClick={() => pan(0, -1)} className={buttonClass}><ChevronUp className="h-5 w-5" /></button>
    <span />
    <button type="button" aria-label="Pan map west" title="Pan west" onClick={() => pan(-1, 0)} className={buttonClass}><ChevronLeft className="h-5 w-5" /></button>
    <span className="grid h-10 w-10 place-items-center text-emerald-800" aria-hidden="true"><MapPin className="h-4 w-4" /></span>
    <button type="button" aria-label="Pan map east" title="Pan east" onClick={() => pan(1, 0)} className={buttonClass}><ChevronRight className="h-5 w-5" /></button>
    <span />
    <button type="button" aria-label="Pan map south" title="Pan south" onClick={() => pan(0, 1)} className={buttonClass}><ChevronDown className="h-5 w-5" /></button>
    <span />
  </div>;
}

const CoordinateMapPicker = ({ point, onPick }) => <div className="overflow-hidden rounded-2xl border border-slate-200">
  <div className="relative h-72 touch-none sm:h-80">
    <MapContainer center={point ? [point.lat, point.lng] : [-0.0236, 37.9062]} zoom={point ? 14 : 6} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CenterOnPoint point={point} />
      <PickOnClick onPick={onPick} />
      {point && <Marker position={[point.lat, point.lng]} icon={pinIcon} />}
      <PanControls />
    </MapContainer>
  </div>
  <p className="bg-white px-3 py-2 text-[11px] text-slate-500">Drag the map or use the arrows to move around. Tap or click to place a private trip pin. Use + and - to zoom. Map &#169; OpenStreetMap contributors.</p>
</div>;

export default CoordinateMapPicker;
