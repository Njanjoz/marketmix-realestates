// src/services/driverService.js
import { auth } from '../firebase/config';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';

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
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch offers');
  return data.offers || [];
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
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/moving/driver/onboard`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Onboarding submission failed');
  return data;
}
