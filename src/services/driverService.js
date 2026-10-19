// src/services/driverService.js
import { auth, db } from '../firebase/config';
import { doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';

const BACKEND_URL = import.meta.env.VITE_MOVING_BACKEND_URL || import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';

const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export async function listDriverOffers() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/moving/driver/offers`, { headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) {
    throw new Error(`The driver offers API is missing from ${BACKEND_URL}. Deploy the latest server/ backend, then check VITE_BACKEND_URL in the web app.`);
  }
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch offers');
  return data.offers || [];
}

export async function dispatchTransportRequest(requestId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/moving/dispatch`, {
    method: 'POST', headers, body: JSON.stringify({ requestId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to find drivers for this request');
  return data;
}

export async function dispatchTransportQuote(requestId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/moving/dispatch-quote-item-rates`, {
    method: 'POST', headers, body: JSON.stringify({ requestId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || 'Could not send the selected driver quote');
  return data;
}

export async function acceptDriverOffer(requestId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/moving/driver/accept`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requestId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to accept offer');
  return data;
}

export async function declineDriverOffer(requestId, reason = '') {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/moving/driver/decline`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requestId, reason })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to decline offer');
  return data;
}

export async function startTrip(requestId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/moving/driver/start-trip`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requestId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to start trip');
  return data;
}

export async function completeTrip(requestId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/moving/driver/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requestId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to complete trip');
  return data;
}

export async function submitDriverOnboarding(payload) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const { vehicleId, vehicleTemplate, plate, licenseNumber, phone, photoUrl, workCounty, workSubCounty, workWard, workArea, workCoordinates, ratePerKm, cargoCapacity, itemRates, acceptsOnlinePayments } = payload || {};
  const userRef = doc(db, 'users', user.uid);
  const existingUser = await getDoc(userRef);
  const existingData = existingUser.data() || {};
  const alreadyApproved = existingData.driverApproved === true;

  const safeCargoCapacity = cargoCapacity && typeof cargoCapacity === 'object' && !Array.isArray(cargoCapacity)
    ? Object.fromEntries(Object.entries(cargoCapacity).filter(([, count]) => Number(count) > 0).map(([item, count]) => [item, Math.min(99, Math.floor(Number(count)))]))
    : {};
  const safeItemRates = itemRates && typeof itemRates === 'object' && !Array.isArray(itemRates)
    ? Object.fromEntries(Object.entries(itemRates).filter(([item, rate]) => safeCargoCapacity[item] && Number.isFinite(Number(rate)) && Number(rate) >= 0).map(([item, rate]) => [item, Math.min(100000, Math.round(Number(rate)))]))
    : {};
  const driverProfile = {
    vehicleId: vehicleId || 'pickup',
    vehicleTemplate: vehicleTemplate || 'fronack',
    ratePerKm: Number(ratePerKm) || 0,
    canCarryItems: Object.keys(safeCargoCapacity).slice(0, 20),
    cargoCapacity: safeCargoCapacity,
    itemRates: safeItemRates,
    plate: plate || '',
    licenseNumber: licenseNumber || '',
    phone: phone || '',
    acceptsOnlinePayments: acceptsOnlinePayments === true,
    photoUrl: photoUrl || '',
    workCounty: workCounty || '',
    workSubCounty: workSubCounty || '',
    workWard: workWard || '',
    workArea: workArea || '',
    workCoordinates: workCoordinates || null,
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, {
    driverIntent: true,
    driverStatus: alreadyApproved ? (existingData.driverStatus || 'approved') : 'pending',
    driverApproved: alreadyApproved,
    phoneNumber: phone || '',
    driverProfile,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { success: true, message: 'Driver onboarding submitted successfully' };
}

export async function findMatchingTransportDrivers({ vehicleId, pickupCoordinates, destinationCoordinates, pickupArea = {}, itemCounts = {} }) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({
    vehicleId,
    pickupLat: String(pickupCoordinates.lat),
    pickupLng: String(pickupCoordinates.lng),
    destinationLat: String(destinationCoordinates.lat),
    destinationLng: String(destinationCoordinates.lng),
    pickupCounty: pickupArea.county || '',
    pickupSubCounty: pickupArea.subCounty || '',
    pickupWard: pickupArea.ward || '',
    pickupArea: pickupArea.area || '',
    itemTypes: Object.keys(itemCounts).filter((item) => Number(itemCounts[item]) > 0).join(','),
    itemCounts: JSON.stringify(Object.fromEntries(Object.entries(itemCounts).filter(([, count]) => Number(count) > 0))),
  });
  const response = await fetch(`${BACKEND_URL}/api/moving/drivers/quotes-item-rates?${params}`, { headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || 'Could not find matching drivers');
  return data.drivers || [];
}

export async function respondToTransportQuote({ requestId, action, counterOffer, message = '' }) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/moving/quote/respond`, {
    method: 'POST', headers, body: JSON.stringify({ requestId, action, counterOffer, message }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || 'Could not respond to this quote');
  return data;
}

export async function startTransportPayment({ requestId, phoneNumber }) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/moving/payments/checkout`, {
    method: 'POST', headers, body: JSON.stringify({ requestId, phoneNumber }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || 'Could not start website payment');
  return data;
}

export async function requestTransportPayout(requestId) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BACKEND_URL}/api/moving/payments/withdraw`, {
    method: 'POST', headers, body: JSON.stringify({ requestId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || 'Could not request payout');
  return data;
}

export async function setDriverOnline(isOnline) {
  const user = auth.currentUser;
  if (!user) return;
  await updateDoc(doc(db, 'users', user.uid), {
    driverOnline: Boolean(isOnline),
    driverLastSeenAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
