import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const TRANSPORT_STATUSES = [
  'REQUESTED', 'QUOTED', 'ACCEPTED', 'DRIVER_ASSIGNED', 'PICKUP_READY',
  'ON_THE_WAY', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED',
];

export const TRANSPORT_STATUS_LABELS = {
  REQUESTED: 'Request sent', QUOTED: 'Quote ready', ACCEPTED: 'Move accepted',
  DRIVER_ASSIGNED: 'Driver assigned', PICKUP_READY: 'Pickup ready',
  ON_THE_WAY: 'Driver on the way', LOADING: 'Loading', IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

export const TRANSPORT_PROGRESS = ['REQUESTED', 'DRIVER_ASSIGNED', 'ON_THE_WAY', 'LOADING', 'IN_TRANSIT', 'DELIVERED'];

export const getPoint = (value) => {
  const lat = Number(value?.lat ?? value?.latitude);
  const lng = Number(value?.lng ?? value?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
};

export const updateTransportDriverPosition = (requestId, point) => updateDoc(
  doc(db, 'transportRequests', requestId),
  { driverLocation: point, driverLocationUpdatedAt: serverTimestamp() },
);
