import { auth } from '../firebase/config';

const LEGACY_BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';
const BOOKING_BACKEND = import.meta.env.VITE_MOVING_BACKEND_URL
  || LEGACY_BACKEND;

export function getSiteSeeingPackagePrice(pkg = {}) {
  const numeric = Number(pkg.price);
  if (Number.isFinite(numeric) && numeric > 0) return Math.ceil(numeric);
  const match = String(pkg.priceLabel || '').match(/([\d,]+(?:\.\d+)?)/);
  const parsed = match ? Number(match[1].replace(/,/g, '')) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 0;
}

function normalizeMpesaPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  else if (digits.length === 9 && /^[71]/.test(digits)) digits = `254${digits}`;
  return /^254[71]\d{8}$/.test(digits) ? digits : null;
}

async function authenticatedPost(url, body) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to reserve a viewing.');
  const token = await user.getIdToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.message || 'Booking request failed.');
  return data;
}

async function waitForPayment(paymentRef, { timeoutMs = 180000, intervalMs = 4000 } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${LEGACY_BACKEND}/api/ad-transaction/${encodeURIComponent(paymentRef)}`);
      if (response.ok) {
        const result = await response.json();
        const transaction = result?.data || {};
        const status = String(transaction.paymentStatus || transaction.status || '').toLowerCase();
        if (status === 'paid' || status === 'completed') return transaction;
        if (status === 'failed' || status === 'cancelled') throw new Error(`M-Pesa payment ${status}.`);
      }
    } catch (error) {
      if (/M-Pesa payment/.test(error.message)) throw error;
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }
  throw new Error(`Payment timed out. If you paid, contact Customer Help and include reference ${paymentRef} before trying again.`);
}

export async function bookSiteSeeingWithDeposit({ property, properties = [], package: pkg, phoneNumber, buyerName, buyerEmail, preferredViewingDate, preferredViewingTime, bookingNote = '', tourPreferences = null, participantCount = 1, completionBookingId = null, bookingMode = 'availability_check' }) {
  const mpesaPhone = normalizeMpesaPhone(phoneNumber);
  if (!mpesaPhone) throw new Error('Enter a valid Kenyan M-Pesa number, such as 0712345678.');
  const selectedProperties = properties.length ? properties : [property];
  const prepared = await authenticatedPost(`${BOOKING_BACKEND}/api/bookings/site-seeing/checkout`, {
    propertyId: property.id,
    propertyIds: selectedProperties.map((item) => item.id),
    packageId: pkg.id,
    completionBookingId,
    bookingMode,
    phoneNumber: mpesaPhone,
    customerName: buyerName,
    preferredViewingDate,
    preferredViewingTime,
    bookingNote,
    tourPreferences,
    participantCount,
  });
  // The availability check uses a KSh 1 test fee. Keep this
  // explicit so an omitted/legacy amountDue field cannot reach /api/stk-push.
  const amountToCharge = completionBookingId || bookingMode === 'direct_booking'
    ? Number(prepared.amountDue)
    : 1;
  if (!Number.isFinite(amountToCharge) || amountToCharge <= 0) {
    throw new Error('The booking service returned an invalid payment amount. Please try again or contact support.');
  }
  const promptResponse = await fetch(`${LEGACY_BACKEND}/api/stk-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountToCharge,
      phoneNumber: mpesaPhone,
      fullName: buyerName,
      email: buyerEmail,
      orderId: prepared.paymentRef,
    }),
  });
  const prompt = await promptResponse.json().catch(() => ({}));
  if (!promptResponse.ok || !prompt.success) throw new Error(prompt.message || 'Could not send the M-Pesa prompt.');
  await waitForPayment(prepared.paymentRef);
  const confirmed = await authenticatedPost(`${BOOKING_BACKEND}/api/bookings/site-seeing/confirm`, { paymentRef: prepared.paymentRef });
  return { ...prepared, ...confirmed };
}
