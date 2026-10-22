// src/services/paymentService.js

import { startIntaSendCheckout } from './intasendCheckout';

const BACKEND = import.meta.env.VITE_BACKEND_URL || "https://marketmix-api-native.johnnjanjo1.workers.dev";

export async function payRealEstate({ property, landlord, buyer, paymentKind = "rent" }) {
  const ref = `PROP_${property.id || 'LISTING'}_${Date.now()}`;

  // STEP 1: seed the order doc with all the metadata
  const seedRes = await fetch(`${BACKEND}/api/real-estate/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
        name: landlord?.name || 'Agent/Landlord',
        phone: landlord?.phone || '',
      },
    }),
  }).then((r) => r.json());

  if (!seedRes.success) throw new Error(seedRes.message || "Failed to seed order");

  await startIntaSendCheckout({ amount: property.price, phoneNumber: buyer.phoneNumber, fullName: buyer.fullName, email: buyer.email, apiRef: ref });

  // STEP 3: poll until paid
  const paidData = await pollUntilPaid(ref);
  return { ...paidData, orderId: ref };
}

async function pollUntilPaid(ref, { intervalMs = 4000, timeoutMs = 180000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetch(`${BACKEND}/api/ad-transaction/${ref}`);
    if (res.status === 404) continue;
    const j = await res.json();
    const ps = j?.data?.paymentStatus || j?.data?.status;
    if (ps === "paid" || ps === "completed") return j.data;
    if (ps === "failed" || ps === "cancelled") throw new Error("Payment " + ps);
  }
  throw new Error("Payment timed out");
}

export async function initiateTestPayment(data) {
  const ref = data.orderId || `TEST_${Date.now()}`;
  const result = await startIntaSendCheckout({ ...data, apiRef: ref });
  return { success: true, data: result, orderId: ref };
}

export async function checkTransactionStatus(ref) {
  const res = await fetch(`${BACKEND}/api/ad-transaction/${ref}`);
  if (res.status === 404) return { status: 'pending' };
  const j = await res.json();
  return j?.data || j;
}
