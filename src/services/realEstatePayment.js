// src/services/realEstatePayment.js
import { startIntaSendCheckout } from './intasendCheckout';
const BACKEND =
  import.meta.env.VITE_BACKEND_URL || "https://marketmix-api-native.johnnjanjo1.workers.dev";

export async function payRealEstate({
  property,
  landlord,
  buyer,
  idToken = null,
  paymentKind = "rent", // "rent" | "deposit" | "purchase"
}) {
  // 1. Build a unique ref that starts with PROP_ so the backend knows this is real estate
  const ref = `PROP_${property.id}_${Date.now()}`;

  // 2. Seed the order with everything the backend needs to send email + WhatsApp
  const seed = await fetch(`${BACKEND}/api/real-estate/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({
      ref,
      amount: property.price,
      email: buyer.email,
      fullName: buyer.fullName,
      phoneNumber: buyer.phoneNumber,
      paymentKind,
      property: {
        id: property.id,
        title: property.title,
        location: property.location,
        type: property.type,
      },
      landlord: {
        name: landlord.name,
        phone: landlord.phone,
      },
    }),
  }).then((r) => r.json());

  if (!seed.success) throw new Error(seed.message || "Failed to prepare order");

  await startIntaSendCheckout({ amount: property.price, phoneNumber: buyer.phoneNumber, fullName: buyer.fullName, email: buyer.email, apiRef: ref });

  // 4. Poll until paid (or failed)
  const finalTx = await pollUntilPaid(ref);
  return finalTx;
}

function pollUntilPaid(ref, { intervalMs = 4000, timeoutMs = 180000 } = {}) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      if (Date.now() - startedAt > timeoutMs) {
        return reject(new Error("Payment timed out"));
      }
      try {
        const res = await fetch(`${BACKEND}/api/ad-transaction/${ref}`);
        if (res.status === 404) {
          // Doc exists but not paid yet — keep polling
          return setTimeout(tick, intervalMs);
        }
        const j = await res.json();
        const ps = j?.data?.paymentStatus || j?.data?.status;
        if (ps === "paid" || ps === "completed") return resolve(j.data);
        if (ps === "failed" || ps === "cancelled") {
          return reject(new Error(`Payment ${ps}`));
        }
      } catch (_) {
        // network blip — ignore and retry
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}
