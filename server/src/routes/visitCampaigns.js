import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();
const MAX_ATTENDEES = 10;

async function getAuthUser(req) {
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ')) throw new Error('Sign in to register for this campaign.');
  return admin.auth().verifyIdToken(authorization.slice(7));
}

function normalizeKenyanPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  return /^254[17]\d{8}$/.test(digits) ? digits : null;
}

function getPaymentState(invoice = {}) {
  const state = String(invoice.state || '').toUpperCase();
  if (state === 'COMPLETE') return 'paid';
  if (['FAILED', 'CANCELED'].includes(state)) return 'failed';
  return 'pending';
}

async function updatePaymentFromInvoice(paymentRef, payment, invoice) {
  if (!invoice?.invoice_id || invoice.invoice_id !== payment.invoiceId || invoice.api_ref !== paymentRef ||
      Number(invoice.value) !== Number(payment.amount) || String(invoice.currency).toUpperCase() !== 'KES') {
    throw new Error('The IntaSend payment details do not match this campaign registration.');
  }
  const paymentStatus = getPaymentState(invoice);
  if (paymentStatus !== 'pending') {
    await payment.ref.update({
      paymentStatus,
      mpesaReference: invoice.provider_ref || invoice.mpesa_reference || null,
      providerCharges: Number.isFinite(Number(invoice.charges)) ? Number(invoice.charges) : null,
      providerNetAmount: Number.isFinite(Number(invoice.net_amount)) ? Number(invoice.net_amount) : null,
      paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  return paymentStatus;
}

router.post('/api/visit-campaigns/:campaignId/checkout', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const db = admin.firestore();
    const campaignId = String(req.params.campaignId || '');
    const campaignSnap = await db.collection('visitCampaigns').doc(campaignId).get();
    if (!campaignSnap.exists) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    const campaign = campaignSnap.data() || {};
    const eatToday = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (campaign.active === false || !campaign.endDate || campaign.endDate < eatToday) {
      return res.status(409).json({ success: false, message: 'Registration for this campaign is closed.' });
    }
    const attendeeName = String(req.body?.attendeeName || '').trim();
    const phoneNumber = normalizeKenyanPhone(req.body?.phoneNumber);
    const participantCount = Math.floor(Number(req.body?.participantCount));
    const unitPrice = Number(campaign.price);
    if (!attendeeName || attendeeName.length > 120 || !phoneNumber || !Number.isInteger(participantCount) || participantCount < 1 || participantCount > MAX_ATTENDEES || !Number.isInteger(unitPrice) || unitPrice < 1) {
      return res.status(400).json({ success: false, message: 'Enter your name, a valid M-Pesa number, and 1 to 10 attendees.' });
    }
    const paymentRef = `VCP_${campaignId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}_${Date.now()}_${user.uid.slice(0, 8)}`;
    const amount = unitPrice * participantCount;
    await db.collection('visitCampaignPayments').doc(paymentRef).create({
      paymentRef, campaignId, campaignTitle: String(campaign.title || 'Visit campaign').slice(0, 120),
      userId: user.uid, attendeeName, phoneNumber, participantCount, unitPrice, amount, currency: 'KES',
      paymentStatus: 'initiated', provider: 'intasend', createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.json({ success: true, paymentRef, amount, participantCount, currency: 'KES' });
  } catch (error) {
    console.error('Create visit campaign checkout error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not prepare campaign checkout.' });
  }
});

router.post('/api/visit-campaigns/stk-push', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const paymentRef = String(req.body?.paymentRef || '');
    const db = admin.firestore();
    const paymentRefDoc = db.collection('visitCampaignPayments').doc(paymentRef);
    const paymentSnap = await paymentRefDoc.get();
    if (!paymentSnap.exists) return res.status(404).json({ success: false, message: 'Campaign payment not found.' });
    const payment = paymentSnap.data() || {};
    if (payment.userId !== user.uid) return res.status(403).json({ success: false, message: 'This payment belongs to another account.' });
    if (payment.paymentStatus === 'paid') return res.json({ success: true, paymentRef, message: 'This campaign payment is already confirmed.' });
    if (payment.invoiceId) return res.json({ success: true, paymentRef, message: 'The M-Pesa prompt has already been started.' });
    const secretKey = process.env.INTASEND_SECRET_KEY;
    if (!secretKey) return res.status(503).json({ success: false, message: 'M-Pesa payments are temporarily unavailable.' });

    const providerResponse = await fetch('https://api.intasend.com/api/v1/payment/mpesa-stk-push/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: payment.amount, phone_number: payment.phoneNumber, api_ref: paymentRef, mobile_tarrif: 'BUSINESS-PAYS' }),
    });
    const providerData = await providerResponse.json().catch(() => ({}));
    const invoiceId = providerData.invoice?.invoice_id;
    if (!providerResponse.ok || !invoiceId) {
      await paymentRefDoc.update({ paymentStatus: 'failed', paymentError: String(providerData.message || 'IntaSend did not start the M-Pesa prompt.').slice(0, 200), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.status(502).json({ success: false, message: providerData.message || 'Could not start the M-Pesa prompt.' });
    }
    await paymentRefDoc.update({ invoiceId, paymentStatus: 'pending', providerStatus: providerData.invoice?.state || 'PENDING', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ success: true, paymentRef, invoiceId, message: 'M-Pesa payment prompt sent.' });
  } catch (error) {
    console.error('Start visit campaign STK push error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not start the M-Pesa prompt.' });
  }
});

router.get('/api/visit-campaigns/payment/:paymentRef', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const db = admin.firestore();
    const paymentRef = String(req.params.paymentRef || '');
    const paymentRefDoc = db.collection('visitCampaignPayments').doc(paymentRef);
    const paymentSnap = await paymentRefDoc.get();
    if (!paymentSnap.exists) return res.status(404).json({ success: false, message: 'Campaign payment not found.' });
    let payment = paymentSnap.data() || {};
    if (payment.userId !== user.uid) return res.status(403).json({ success: false, message: 'This payment belongs to another account.' });
    if (payment.paymentStatus !== 'paid' && payment.invoiceId) {
      const secretKey = process.env.INTASEND_SECRET_KEY;
      if (!secretKey) return res.status(503).json({ success: false, message: 'Payment status is temporarily unavailable.' });
      const providerResponse = await fetch('https://api.intasend.com/api/v1/payment/status/', {
        method: 'POST', headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: payment.invoiceId }),
      });
      const providerData = await providerResponse.json().catch(() => ({}));
      if (!providerResponse.ok || !providerData.invoice) return res.status(502).json({ success: false, message: 'Could not verify payment status with IntaSend.' });
      await updatePaymentFromInvoice(paymentRef, { ...payment, ref: paymentRefDoc }, providerData.invoice);
      const refreshed = await paymentRefDoc.get();
      payment = refreshed.data() || payment;
    }
    return res.json({ success: true, paymentStatus: payment.paymentStatus, paymentRef, mpesaReference: payment.mpesaReference || null });
  } catch (error) {
    console.error('Check visit campaign payment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not verify campaign payment.' });
  }
});

router.post('/api/visit-campaigns/confirm', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const paymentRef = String(req.body?.paymentRef || '');
    const db = admin.firestore();
    const paymentDoc = db.collection('visitCampaignPayments').doc(paymentRef);
    const paymentSnap = await paymentDoc.get();
    if (!paymentSnap.exists) return res.status(404).json({ success: false, message: 'Campaign payment not found.' });
    const payment = paymentSnap.data() || {};
    if (payment.userId !== user.uid) return res.status(403).json({ success: false, message: 'This payment belongs to another account.' });
    if (payment.paymentStatus !== 'paid') return res.status(409).json({ success: false, message: 'IntaSend has not confirmed this payment yet.' });
    const registrationRef = db.collection('visitCampaignRegistrations').doc(paymentRef);
    const statsRef = db.collection('visitCampaignStats').doc(payment.campaignId);
    let registration;
    await db.runTransaction(async (transaction) => {
      const [currentPayment, campaignSnap, existingRegistration] = await Promise.all([
        transaction.get(paymentDoc), transaction.get(db.collection('visitCampaigns').doc(payment.campaignId)), transaction.get(registrationRef),
      ]);
      if (!currentPayment.exists || currentPayment.data()?.userId !== user.uid || currentPayment.data()?.paymentStatus !== 'paid') throw new Error('The confirmed campaign payment could not be verified.');
      if (!campaignSnap.exists) throw new Error('Campaign not found.');
      if (existingRegistration.exists) { registration = existingRegistration.data(); return; }
      registration = {
        paymentRef, campaignId: payment.campaignId, campaignTitle: payment.campaignTitle,
        userId: user.uid, attendeeName: payment.attendeeName, phoneNumber: payment.phoneNumber,
        participantCount: payment.participantCount, unitPrice: payment.unitPrice, amount: payment.amount,
        currency: 'KES', paymentStatus: 'paid', mpesaReference: payment.mpesaReference || null,
        registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      transaction.create(registrationRef, registration);
      transaction.set(statsRef, { registeredCount: admin.firestore.FieldValue.increment(payment.participantCount), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      transaction.update(paymentDoc, { registrationConfirmed: true, registrationConfirmedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    return res.json({ success: true, paymentRef, registrationId: paymentRef, participantCount: payment.participantCount });
  } catch (error) {
    console.error('Confirm visit campaign payment error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not confirm campaign registration.' });
  }
});

router.post('/api/visit-campaigns/intasend-webhook', async (req, res) => {
  const challenge = process.env.INTASEND_WEBHOOK_CHALLENGE;
  if (!challenge || String(req.body?.challenge || '') !== challenge || req.body?.topic !== 'collection_event') {
    return res.status(401).json({ success: false, message: 'Invalid payment webhook.' });
  }
  try {
    const invoice = req.body;
    const paymentRef = String(invoice.api_ref || '');
    if (!paymentRef.startsWith('VCP_') || !invoice.invoice_id) return res.json({ success: true, ignored: true });
    const paymentRefDoc = admin.firestore().collection('visitCampaignPayments').doc(paymentRef);
    const paymentSnap = await paymentRefDoc.get();
    if (!paymentSnap.exists) return res.json({ success: true, ignored: true });
    await updatePaymentFromInvoice(paymentRef, { ...paymentSnap.data(), ref: paymentRefDoc }, invoice);
    return res.json({ success: true });
  } catch (error) {
    console.error('Visit campaign payment webhook error:', error);
    return res.status(500).json({ success: false });
  }
});

export default router;
