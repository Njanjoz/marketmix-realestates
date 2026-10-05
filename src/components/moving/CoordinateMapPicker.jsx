import React from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const pinIcon = L.divIcon({
  className: 'marketmix-map-marker',
  html: '<span class="marketmix-map-marker__dot marketmix-map-marker__dot--pickup">•</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function PickOnClick({ onPick }) {
  useMapEvents({ click: (event) => onPick({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  return null;
}

const CoordinateMapPicker = ({ point, onPick }) => <div className="overflow-hidden rounded-2xl border border-slate-200">
  <div className="h-64 sm:h-72">
    <MapContainer center={point ? [point.lat, point.lng] : [-0.0236, 37.9062]} zoom={point ? 14 : 6} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <PickOnClick onPick={onPick} />
      {point && <Marker position={[point.lat, point.lng]} icon={pinIcon} />}
    </MapContainer>
  </div>
  <p className="bg-white px-3 py-2 text-[11px] text-slate-500">Tap or click the map to place a private trip pin. Map © OpenStreetMap contributors.</p>
</div>;

export default CoordinateMapPicker;
