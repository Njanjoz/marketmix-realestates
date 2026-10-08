// src/services/transportNotify.js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';

/**
 * Fire-and-forget notification helper for transport requests.
 * Fails silently so user experience is never blocked.
 */
export const notifyTransportRequest = async ({ requestId, email }) => {
  if (!requestId || !email) return false;
  try {
    const response = await fetch(`${BACKEND_URL}/api/moving/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, email }),
    });
    const data = await response.json();
    return data.success || false;
  } catch (error) {
    console.warn('Non-blocking transport notification warning:', error);
    return false;
  }
};
