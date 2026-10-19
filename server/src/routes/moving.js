// server/src/routes/moving.js
import express from 'express';
import admin from 'firebase-admin';

const router = express.Router();

const getAuthUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authHeader.split('Bearer ')[1];
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded;
};

const normalizeArea = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

function driverMatchesPickup(driver, request) {
  const profile = driver.driverProfile || {};
  const pickup = {
    county: request.pickupCounty,
    subCounty: request.pickupSubCounty,
    ward: request.pickupWard,
    area: request.pickupArea,
  };
  const keys = ['county', 'subCounty', 'ward', 'area'];
  const driverKeys = ['workCounty', 'workSubCounty', 'workWard', 'workArea'];
  const registeredCounty = normalizeArea(profile.workCounty || driver.workCounty);
  const requestedCounty = normalizeArea(pickup.county);
  if (registeredCounty && requestedCounty && registeredCounty !== requestedCounty) return false;

  let hasComparableDetail = false;
  for (let index = 1; index < keys.length; index += 1) {
    const registered = normalizeArea(profile[driverKeys[index]] || driver[driverKeys[index]]);
    const requested = normalizeArea(pickup[keys[index]]);
    if (!registered || !requested) continue;
    hasComparableDetail = true;
    // More specific text fields can differ even when the driver is nearby
    // (for example, a registered estate name versus a pickup landmark). Keep
    // looking for a match at another level before rejecting the driver.
    if (registered === requested) return true;
  }

  if (hasComparableDetail) {
    // Names did not match at any shared level; use the saved map pin as the
    // fallback so nearby registered drivers can still receive the request.
    return driverWithinPickupRadius(profile, driver, request);
  }

  // County is the best available match when either side has no finer area.
  if (registeredCounty && requestedCounty && registeredCounty === requestedCounty) return true;

  return driverWithinPickupRadius(profile, driver, request);
}

function driverWithinPickupRadius(profile, driver, request) {
  const home = profile.workCoordinates || driver.workCoordinates;
  const pickupPoint = request.pickupCoordinates;
  if (!home || !pickupPoint || !Number.isFinite(Number(home.lat)) || !Number.isFinite(Number(home.lng))) return false;
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(Number(pickupPoint.lat) - Number(home.lat));
  const dLng = radians(Number(pickupPoint.lng) - Number(home.lng));
  const lat1 = radians(Number(home.lat));
  const lat2 = radians(Number(pickupPoint.lat));
  const haversine = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)) <= 35;
}

function driverCanCarryRequest(driver, request) {
  const profile = driver.driverProfile || {};
  const supported = Array.isArray(profile.canCarryItems) ? profile.canCarryItems : [];
  const capacity = profile.cargoCapacity && typeof profile.cargoCapacity === 'object' ? profile.cargoCapacity : {};
  const requested = Object.entries(request.items || {}).filter(([, quantity]) => Number(quantity) > 0);
  return requested.length > 0 && requested.every(([item, quantity]) => {
    const max = Number(capacity[item] ?? (supported.includes(item) ? 1 : 0));
    return max > 0 && max >= Number(quantity);
  });
}

function movingDistanceKm(a, b) {
  if (!a || !b) return null;
  const lat1 = Number(a.lat ?? a.latitude);
  const lng1 = Number(a.lng ?? a.longitude);
  const lat2 = Number(b.lat ?? b.latitude);
  const lng2 = Number(b.lng ?? b.longitude);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const arc = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

// Driver Onboarding
router.post('/api/moving/driver/onboard', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { vehicleId, vehicleTemplate, plate, licenseNumber, phone, photoUrl, ratePerKm, cargoCapacity } = req.body || {};

    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);

    const safeCargoCapacity = cargoCapacity && typeof cargoCapacity === 'object' && !Array.isArray(cargoCapacity)
      ? Object.fromEntries(Object.entries(cargoCapacity).filter(([, count]) => Number(count) > 0).map(([item, count]) => [item, Math.min(99, Math.floor(Number(count)))]))
      : {};
    const driverProfile = {
      vehicleId: vehicleId || 'pickup',
      vehicleTemplate: vehicleTemplate || 'fronack',
      plate: plate || '',
      licenseNumber: licenseNumber || '',
      phone: phone || '',
      ratePerKm: Number(ratePerKm) || 0,
      canCarryItems: Object.keys(safeCargoCapacity).slice(0, 20),
      cargoCapacity: safeCargoCapacity,
      photoUrl: photoUrl || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set({
      driverIntent: true,
      driverStatus: 'pending',
      driverApproved: false,
      phoneNumber: phone || '',
      driverProfile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return res.json({ success: true, message: 'Driver onboarding submitted successfully' });
  } catch (error) {
    console.error('Driver onboard error:', error);
    return res.status(401).json({ success: false, message: error.message || 'Onboarding failed' });
  }
});

// Match and publish a newly created request to eligible drivers in its pickup area.
router.post('/api/moving/dispatch', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'Missing requestId' });
    const db = admin.firestore();
    const requestRef = db.collection('transportRequests').doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    const request = requestDoc.data();
    if (request.userId !== user.uid) return res.status(403).json({ success: false, message: 'Not allowed to dispatch this request' });
    if (!['REQUESTED', 'QUOTED'].includes(request.status) || request.driverUserId) {
      return res.status(409).json({ success: false, message: 'This request is no longer open' });
    }

    const driversSnap = await db.collection('users').where('driverApproved', '==', true).get();
    const nearbyDrivers = driversSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((driver) => driverMatchesPickup(driver, request));
    const areaDrivers = nearbyDrivers.filter((driver) => driverCanCarryRequest(driver, request));
    if (!areaDrivers.length) {
      const alertRef = db.collection('transportCapacityAlerts').doc(requestId);
      const driverContacts = nearbyDrivers.map((driver) => {
        const profile = driver.driverProfile || {};
        const driverDistanceKm = movingDistanceKm(driver.driverLiveLocation || profile.workCoordinates || driver.workCoordinates, request.pickupCoordinates);
        const lastSeen = driver.driverLastSeenAt?.toMillis?.() || 0;
        return {
          driverId: driver.id,
          name: String(driver.name || driver.displayName || 'Driver').slice(0, 80),
          phone: String(driver.phoneNumber || driver.phone || profile.phone || '').slice(0, 32),
          vehicleLabel: String(profile.vehicleTemplate || profile.vehicleId || 'Vehicle').slice(0, 60),
          plate: String(profile.plate || '').slice(0, 20),
          canCarryItems: Array.isArray(profile.canCarryItems) ? profile.canCarryItems : [],
          cargoCapacity: profile.cargoCapacity && typeof profile.cargoCapacity === 'object' ? profile.cargoCapacity : {},
          driverDistanceKm: driverDistanceKm == null ? null : Math.round(driverDistanceKm * 10) / 10,
          online: driver.driverOnline === true && lastSeen >= Date.now() - 5 * 60 * 1000,
          workArea: [profile.workArea, profile.workSubCounty, profile.workCounty].filter(Boolean).join(', '),
        };
      }).sort((a, b) => Number(b.online) - Number(a.online) || (a.driverDistanceKm ?? Infinity) - (b.driverDistanceKm ?? Infinity)).slice(0, 30);
      await alertRef.set({
        requestId,
        status: 'PENDING',
        customerName: String(request.userName || 'Customer').slice(0, 120),
        pickupLabel: String(request.pickupLabel || '').slice(0, 200),
        destinationLabel: String(request.destinationLabel || request.destinationTitle || '').slice(0, 200),
        vehicleLabel: String(request.vehicleLabel || '').slice(0, 60),
        items: Object.entries(request.items || {}).filter(([, quantity]) => Number(quantity) > 0).map(([id, quantity]) => ({ id, quantity: Number(quantity) })),
        nearbyDrivers: driverContacts,
        nearbyDriverCount: nearbyDrivers.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await requestRef.update({
        offerDriverIds: [],
        offerDispatchMode: 'admin-capacity-review',
        offerDispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.json({ success: true, mode: 'admin-capacity-review', drivers: [], capacityAlert: true });
    }
    const onlineCutoff = Date.now() - 5 * 60 * 1000;
    const onlineDrivers = areaDrivers.filter((driver) => {
      const lastSeen = driver.driverLastSeenAt?.toMillis?.() || 0;
      return driver.driverOnline === true && lastSeen >= onlineCutoff;
    });
    const selectedDriverId = String(request.quotedDriverId || '');
    const matchedDrivers = onlineDrivers.length ? onlineDrivers : areaDrivers;
    const selectedDrivers = selectedDriverId
      ? areaDrivers.filter((driver) => driver.id === selectedDriverId && driver.driverProfile?.vehicleId === request.vehicleId)
      : matchedDrivers;
    if (selectedDriverId && !selectedDrivers.length) {
      return res.status(409).json({ success: false, message: 'The selected driver is no longer available for this pickup area.' });
    }
    if (selectedDriverId && !(Number(selectedDrivers[0].driverProfile?.ratePerKm) > 0)) {
      return res.status(409).json({ success: false, message: 'The selected driver needs to add a per-kilometre rate card.' });
    }
    const driverIds = selectedDrivers.map((driver) => driver.id);

    await requestRef.update({
      offerDriverIds: driverIds,
      offerDispatchMode: onlineDrivers.length ? 'online' : 'registered-area',
      ...(selectedDriverId ? {
        quotedPrice: Math.ceil((movingDistanceKm(request.pickupCoordinates, request.destinationCoordinates) * 1.15 * Number(selectedDrivers[0].driverProfile?.ratePerKm || 0)) / 50) * 50,
        quotedRatePerKm: Number(selectedDrivers[0].driverProfile?.ratePerKm || 0),
        quotedRouteKm: Math.round(movingDistanceKm(request.pickupCoordinates, request.destinationCoordinates) * 11.5) / 10,
        quotedDriverName: selectedDrivers[0].name || selectedDrivers[0].displayName || 'Driver',
      } : {}),
      offerDispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.json({
      success: true,
      mode: onlineDrivers.length ? 'online' : 'registered-area',
      drivers: selectedDrivers.map(({ id, phoneNumber, phone, driverProfile }) => ({ id, phoneNumber, phone, driverProfile })),
    });
  } catch (error) {
    console.error('Dispatch transport request error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Driver matching failed' });
  }
});

// Return safe driver cards with per-vehicle rates and trip-specific quotes.
router.get('/api/moving/drivers/quotes', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const vehicleId = String(req.query.vehicleId || '');
    const pickup = { lat: Number(req.query.pickupLat), lng: Number(req.query.pickupLng) };
    const destination = { lat: Number(req.query.destinationLat), lng: Number(req.query.destinationLng) };
    const pickupArea = {
      pickupCounty: String(req.query.pickupCounty || ''),
      pickupSubCounty: String(req.query.pickupSubCounty || ''),
      pickupWard: String(req.query.pickupWard || ''),
      pickupArea: String(req.query.pickupArea || ''),
      pickupCoordinates: pickup,
    };
    const itemTypes = String(req.query.itemTypes || '').split(',').map((item) => item.trim()).filter(Boolean);
    let itemCounts = Object.fromEntries(itemTypes.map((item) => [item, 1]));
    if (req.query.itemCounts) {
      try {
        const parsed = JSON.parse(String(req.query.itemCounts));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) itemCounts = parsed;
      } catch { /* Keep the item type list as a one-of-each fallback. */ }
    }
    if (!['motorbike', 'tuk', 'pickup', 'lorry'].includes(vehicleId) ||
      ![pickup.lat, pickup.lng, destination.lat, destination.lng].every(Number.isFinite)) {
      return res.status(400).json({ success: false, message: 'Choose a vehicle and valid pickup and destination pins.' });
    }
    const routeKm = movingDistanceKm(pickup, destination) * 1.15;
    const db = admin.firestore();
    const driversSnap = await db.collection('users').where('driverApproved', '==', true).get();
    const matching = driversSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
      .filter((driver) => driver.id !== user.uid)
      .filter((driver) => driver.driverProfile?.vehicleId === vehicleId)
      .filter((driver) => driverMatchesPickup(driver, pickupArea))
      .filter((driver) => driverCanCarryRequest(driver, { items: itemCounts }))
      .map((driver) => {
        const profile = driver.driverProfile || {};
        const ratePerKm = Number(profile.ratePerKm || 0);
        const driverDistanceKm = movingDistanceKm(profile.workCoordinates, pickup);
        const quote = Math.ceil((routeKm * ratePerKm) / 50) * 50;
        const lastSeen = driver.driverLastSeenAt?.toMillis?.() || 0;
        const online = driver.driverOnline === true && lastSeen >= Date.now() - 5 * 60 * 1000;
        return {
          id: driver.id,
          name: String(driver.name || driver.displayName || 'Local driver').slice(0, 80),
          vehicleId: profile.vehicleId,
          vehicleTemplate: String(profile.vehicleTemplate || profile.vehicleId || 'Vehicle').slice(0, 60),
          canCarryItems: Array.isArray(profile.canCarryItems) ? profile.canCarryItems : [],
          plate: String(profile.plate || '').slice(0, 20),
          photoUrl: String(profile.photoUrl || '').slice(0, 500),
          ratePerKm,
          driverDistanceKm: driverDistanceKm == null ? null : Math.round(driverDistanceKm * 10) / 10,
          routeKm: Math.round(routeKm * 10) / 10,
          quote: Number.isFinite(quote) ? quote : null,
          online,
          workArea: [profile.workArea, profile.workSubCounty, profile.workCounty].filter(Boolean).join(', '),
        };
      })
      .filter((driver) => driver.ratePerKm > 0 && driver.quote != null)
      .sort((a, b) => Number(b.online) - Number(a.online) || a.quote - b.quote);
    return res.json({ success: true, drivers: matching });
  } catch (error) {
    console.error('Find transport quote drivers error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Could not find matching drivers' });
  }
});

// Customer accepts, declines, or counters the selected driver's quote.
router.post('/api/moving/quote/respond', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId, action, counterOffer, message = '' } = req.body || {};
    if (!requestId || !['accept', 'decline', 'appeal'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Choose a valid quote response.' });
    }
    if (action === 'appeal' && (!Number.isFinite(Number(counterOffer)) || Number(counterOffer) <= 0)) {
      return res.status(400).json({ success: false, message: 'Enter the amount you want to offer.' });
    }
    const db = admin.firestore();
    const requestRef = db.collection('transportRequests').doc(String(requestId));
    await db.runTransaction(async (transaction) => {
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists) throw new Error('Move request not found');
      const request = requestSnap.data();
      if (request.userId !== user.uid) throw new Error('Not allowed to respond to this quote');
      if (request.status !== 'QUOTED' || !request.quotedDriverId || (request.quoteDecision && request.quoteDecision !== 'PENDING')) {
        throw new Error('This quote is no longer awaiting a response');
      }

      if (action === 'decline') {
        transaction.update(requestRef, {
          status: 'CANCELLED', quoteDecision: 'DECLINED',
          quoteRespondedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const driverRef = db.collection('users').doc(request.quotedDriverId);
      const driverSnap = await transaction.get(driverRef);
      if (!driverSnap.exists) throw new Error('The selected driver is no longer available');
      const driver = driverSnap.data();
      if (action === 'accept') {
        if (driver.driverApproved !== true) throw new Error('The selected driver is no longer approved');
        transaction.update(requestRef, {
          driverUserId: request.quotedDriverId,
          driverName: driver.name || driver.displayName || 'Driver',
          driverPhone: driver.phoneNumber || driver.phone || driver.driverProfile?.phone || '',
          vehicleLabel: driver.driverProfile?.vehicleTemplate || request.vehicleLabel || 'Vehicle',
          status: 'DRIVER_ASSIGNED', quoteDecision: 'ACCEPTED',
          driverAcceptsOnlinePayments: driver.driverProfile?.acceptsOnlinePayments === true,
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          quoteRespondedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      transaction.update(requestRef, {
        quoteDecision: 'APPEALED',
        quoteAppeal: {
          status: 'PENDING',
          customerOffer: Math.round(Number(counterOffer)),
          message: String(message || '').slice(0, 500),
          originalQuote: Number(request.quotedPrice || 0),
          driverUserId: request.quotedDriverId,
          driverName: driver.name || driver.displayName || 'Driver',
          driverPhone: driver.phoneNumber || driver.phone || driver.driverProfile?.phone || '',
          driverVehicle: driver.driverProfile?.vehicleTemplate || request.vehicleLabel || 'Vehicle',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        quoteRespondedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    const result = { success: true, message: action === 'appeal' ? 'Your counter-offer was sent to MarketMix admin.' : `Quote ${action}ed.` };
    if (action === 'accept') {
      const acceptedSnap = await requestRef.get();
      const accepted = acceptedSnap.data() || {};
      Object.assign(result, {
        driverName: accepted.driverName || 'Your driver',
        driverPhone: accepted.driverPhone || '',
        driverAcceptsOnlinePayments: accepted.driverAcceptsOnlinePayments === true,
        quotedPrice: Number(accepted.quotedPrice || 0),
        pickupLabel: accepted.pickupLabel || '',
        destinationLabel: accepted.destinationLabel || accepted.destinationTitle || '',
      });
    }
    return res.json(result);
  } catch (error) {
    console.error('Respond to moving quote error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not save quote response' });
  }
});

// Website payments for accepted transport quotes. Kept separate from the
// existing real-estate checkout routes and legacy Render server endpoints.
router.post('/api/moving/payments/checkout', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId, phoneNumber } = req.body || {};
    if (!requestId || !/^\+?[0-9 ()-]{9,20}$/.test(String(phoneNumber || ''))) {
      return res.status(400).json({ success: false, message: 'Enter a valid M-Pesa phone number.' });
    }
    const secretKey = process.env.INTASEND_SECRET_KEY;
    if (!secretKey) return res.status(503).json({ success: false, message: 'Website payments are not configured yet.' });

    const db = admin.firestore();
    const requestRef = db.collection('transportRequests').doc(String(requestId));
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) return res.status(404).json({ success: false, message: 'Move request not found.' });
    const request = requestSnap.data();
    if (request.userId !== user.uid || request.quoteDecision !== 'ACCEPTED' || !['DRIVER_ASSIGNED', 'ACCEPTED'].includes(request.status)) {
      return res.status(403).json({ success: false, message: 'Online payment is available after you accept the driver quote.' });
    }
    const driverSnap = await db.collection('users').doc(request.driverUserId).get();
    if (!driverSnap.exists || driverSnap.data().driverProfile?.acceptsOnlinePayments !== true) {
      return res.status(409).json({ success: false, message: 'This driver has not enabled website payments.' });
    }
    if (request.paymentStatus === 'paid') return res.status(409).json({ success: false, message: 'This move has already been paid.' });
    if (request.paymentStatus === 'pending') return res.status(409).json({ success: false, message: 'An M-Pesa payment prompt is already pending for this move.' });
    const amount = Math.ceil(Number(request.quotedPrice));
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000000) {
      return res.status(400).json({ success: false, message: 'The accepted quote has an invalid amount.' });
    }
    const paymentId = `MOVE_${requestId}_${Date.now()}`;
    await db.runTransaction(async (transaction) => {
      const currentSnap = await transaction.get(requestRef);
      if (!currentSnap.exists) throw new Error('Move request not found.');
      const current = currentSnap.data();
      if (current.userId !== user.uid || current.quoteDecision !== 'ACCEPTED' || current.paymentStatus === 'paid' || current.paymentStatus === 'pending' || current.paymentStatus === 'initiating') {
        throw new Error('A payment is already active or this quote is no longer payable.');
      }
      transaction.update(requestRef, { paymentStatus: 'initiating', paymentId, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    const normalizedPhone = String(phoneNumber).replace(/\D/g, '').replace(/^0/, '254');
    let providerResponse;
    try {
      providerResponse = await fetch('https://api.intasend.com/api/v1/payment/mpesa-stk-push/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phone_number: normalizedPhone, api_ref: paymentId, mobile_tarrif: 'BUSINESS-PAYS' }),
      });
    } catch (providerError) {
      await requestRef.update({ paymentStatus: 'failed', paymentError: 'Could not reach IntaSend. Please retry.', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      throw providerError;
    }
    const providerData = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok || !providerData.invoice?.invoice_id) {
      await requestRef.update({ paymentStatus: 'failed', paymentError: String(providerData.message || 'IntaSend rejected checkout').slice(0, 180), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      console.error('IntaSend transport checkout failed:', providerData.message || providerResponse.status);
      return res.status(502).json({ success: false, message: providerData.message || 'Could not start the M-Pesa prompt.' });
    }
    await db.collection('transportPayments').doc(paymentId).create({
      requestId: String(requestId), buyerId: user.uid, sellerId: request.driverUserId,
      amount, currency: 'KES', commissionRate: 8, commissionAmount: Math.round(amount * 0.08),
      sellerNetAmount: amount - Math.round(amount * 0.08), invoiceId: providerData.invoice.invoice_id,
      status: 'PENDING', createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await requestRef.update({ paymentId, paymentStatus: 'pending', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ success: true, paymentId, invoiceId: providerData.invoice.invoice_id, amount, message: 'M-Pesa payment prompt sent.' });
  } catch (error) {
    console.error('Transport checkout error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not start payment.' });
  }
});

// IntaSend webhook: only verified COMPLETE invoices change a move to paid.
router.post('/api/moving/payments/intasend-webhook', async (req, res) => {
  try {
    const challenge = process.env.INTASEND_WEBHOOK_CHALLENGE;
    if (!challenge || req.body?.challenge !== challenge || req.body?.topic !== 'collection_event') {
      return res.status(401).json({ success: false, message: 'Invalid payment webhook.' });
    }
    const invoice = req.body;
    if (!invoice.api_ref?.startsWith('MOVE_') || !invoice.invoice_id) return res.json({ success: true, ignored: true });
    const db = admin.firestore();
    const paymentRef = db.collection('transportPayments').doc(invoice.api_ref);
    await db.runTransaction(async (transaction) => {
      const paymentSnap = await transaction.get(paymentRef);
      if (!paymentSnap.exists) return;
      const payment = paymentSnap.data();
      if (payment.invoiceId !== invoice.invoice_id || Number(invoice.value) !== Number(payment.amount) || invoice.currency !== 'KES') return;
      const complete = invoice.state === 'COMPLETE';
      const failed = ['FAILED', 'CANCELED'].includes(invoice.state);
      if (!complete && !failed) return;
      transaction.update(paymentRef, { status: complete ? 'PAID' : 'FAILED', providerRef: invoice.provider_ref || invoice.mpesa_reference || null, settledAt: complete ? admin.firestore.FieldValue.serverTimestamp() : null, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.update(db.collection('transportRequests').doc(payment.requestId), { paymentStatus: complete ? 'paid' : 'failed', paymentUpdatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('IntaSend transport webhook error:', error);
    return res.status(500).json({ success: false });
  }
});

// A driver can request their net payout once the paid job is delivered. The
// API creates a withdrawal request; the platform must approve it before funds
// are sent via IntaSend, which supports maker/checker payout approval.
router.post('/api/moving/payments/withdraw', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId } = req.body || {};
    const db = admin.firestore();
    const requestRef = db.collection('transportRequests').doc(String(requestId || ''));
    const withdrawalRef = db.collection('transportWithdrawals').doc(String(requestId || ''));
    const result = await db.runTransaction(async (transaction) => {
      const [requestSnap, withdrawalSnap] = await Promise.all([transaction.get(requestRef), transaction.get(withdrawalRef)]);
      if (!requestSnap.exists) throw new Error('Move request not found.');
      const request = requestSnap.data();
      if (request.driverUserId !== user.uid || request.status !== 'DELIVERED' || request.paymentStatus !== 'paid') throw new Error('Payout is available after an online-paid move is delivered.');
      if (request.driverAcceptsOnlinePayments !== true) throw new Error('This driver did not opt in to online payments for this move.');
      if (withdrawalSnap.exists) throw new Error('A payout request already exists for this move.');
      const amount = Math.ceil(Number(request.quotedPrice));
      const commissionAmount = Math.round(amount * 0.08);
      const driver = await transaction.get(db.collection('users').doc(user.uid));
      if (!driver.exists) throw new Error('Driver account not found.');
      const phone = driver.data().driverProfile?.phone || driver.data().phone || driver.data().phoneNumber;
      if (!phone) throw new Error('Add your M-Pesa number to Driver Settings before requesting payout.');
      transaction.create(withdrawalRef, { requestId: String(requestId), sellerId: user.uid, sellerName: driver.data().name || driver.data().displayName || 'MarketMix Driver', phone, grossAmount: amount, commissionRate: 8, commissionAmount, netAmount: amount - commissionAmount, currency: 'KES', status: 'PENDING_APPROVAL', createdAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.update(requestRef, { withdrawalStatus: 'PENDING_APPROVAL', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return { grossAmount: amount, commissionAmount, netAmount: amount - commissionAmount };
    });
    return res.json({ success: true, ...result, message: 'Payout request sent for approval.' });
  } catch (error) {
    console.error('Transport payout request error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not request payout.' });
  }
});

async function requireMovingAdmin(user) {
  const profile = await admin.firestore().collection('users').doc(user.uid).get();
  if (!profile.exists || !['admin'].includes(profile.data().role) && !['admin'].includes(profile.data().userType)) {
    throw new Error('Admin access required.');
  }
}

router.get('/api/moving/payments/withdrawals', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    await requireMovingAdmin(user);
    const snapshot = await admin.firestore().collection('transportWithdrawals').where('status', 'in', ['PENDING_APPROVAL', 'PROCESSING', 'PAYOUT_SENT', 'PAID', 'PAYOUT_FAILED']).limit(100).get();
    const withdrawals = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    withdrawals.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    return res.json({ success: true, withdrawals });
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message || 'Could not load payout requests.' });
  }
});

router.post('/api/moving/payments/withdrawals/approve', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    await requireMovingAdmin(user);
    const { withdrawalId } = req.body || {};
    const secretKey = process.env.INTASEND_SECRET_KEY;
    if (!secretKey) return res.status(503).json({ success: false, message: 'IntaSend payout credentials are not configured.' });
    if (!withdrawalId) return res.status(400).json({ success: false, message: 'Missing withdrawal reference.' });
    const db = admin.firestore();
    const withdrawalRef = db.collection('transportWithdrawals').doc(String(withdrawalId));
    let withdrawal;
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(withdrawalRef);
      if (!snap.exists) throw new Error('Payout request not found.');
      withdrawal = snap.data();
      if (withdrawal.status !== 'PENDING_APPROVAL') throw new Error('This payout is no longer awaiting approval.');
      transaction.update(withdrawalRef, { status: 'PROCESSING', reviewedBy: user.uid, reviewedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    let apiResponse;
    try {
      apiResponse = await fetch('https://api.intasend.com/api/v1/send-money/initiate/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: 'KES', country: 'KE', provider: 'MPESA-B2C', requires_approval: 'NO',
          batch_reference: `MM-${withdrawalId}`.slice(0, 70),
          transactions: [{ name: String(withdrawal.sellerName || 'MarketMix Driver').replace(/[^a-zA-Z0-9 _:-]/g, '').slice(0, 80), account: String(withdrawal.phone).replace(/\D/g, ''), amount: String(withdrawal.netAmount), narrative: `MarketMix move ${String(withdrawal.requestId).slice(0, 20)}`, idempotency_key: `MM-${withdrawalId}`.slice(0, 70) }],
        }),
      });
    } catch (providerError) {
      await withdrawalRef.update({ status: 'PENDING_APPROVAL', payoutError: 'Provider connection failed; safe to retry with the same idempotency key.', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      throw providerError;
    }
    const payout = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok || !payout.tracking_id) {
      await withdrawalRef.update({ status: 'PENDING_APPROVAL', payoutError: String(payout.message || 'Provider rejected the payout').slice(0, 240), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      throw new Error(payout.message || 'IntaSend did not accept the payout request.');
    }
    await withdrawalRef.update({ status: 'PAYOUT_SENT', trackingId: payout.tracking_id, providerStatus: payout.status || 'Processing', initiatedAt: admin.firestore.FieldValue.serverTimestamp() });
    await db.collection('transportRequests').doc(String(withdrawal.requestId)).update({ withdrawalStatus: 'PAYOUT_SENT', payoutTrackingId: payout.tracking_id, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ success: true, trackingId: payout.tracking_id, providerStatus: payout.status || 'Processing' });
  } catch (error) {
    console.error('Approve transport payout error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not send payout.' });
  }
});

router.post('/api/moving/payments/payout-webhook', async (req, res) => {
  const challenge = process.env.INTASEND_WEBHOOK_CHALLENGE;
  if (!challenge || req.body?.challenge !== challenge || req.body?.topic !== 'send_money_event') {
    return res.status(401).json({ success: false, message: 'Invalid payout webhook.' });
  }
  try {
    const reference = String(req.body.batch_reference || '');
    if (!reference.startsWith('MM-')) return res.json({ success: true, ignored: true });
    const withdrawalId = reference.slice(3);
    const db = admin.firestore();
    const withdrawalRef = db.collection('transportWithdrawals').doc(withdrawalId);
    const snap = await withdrawalRef.get();
    if (!snap.exists || snap.data().trackingId !== req.body.tracking_id) return res.json({ success: true, ignored: true });
    const providerStatus = String(req.body.status || 'Processing');
    const normalized = providerStatus.toLowerCase();
    const status = normalized.includes('complete') || normalized.includes('success') ? 'PAID' : normalized.includes('fail') || normalized.includes('cancel') ? 'PAYOUT_FAILED' : 'PAYOUT_SENT';
    await withdrawalRef.update({ status, providerStatus, providerPayload: { fileId: req.body.file_id || null, trackingId: req.body.tracking_id }, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    await db.collection('transportRequests').doc(String(snap.data().requestId)).update({ withdrawalStatus: status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ success: true });
  } catch (error) {
    console.error('IntaSend payout webhook error:', error);
    return res.status(500).json({ success: false });
  }
});

// List Driver Offers
router.get('/api/moving/driver/offers', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const db = admin.firestore();
    
    // Verify driver approved status
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data()?.driverApproved !== true) {
      return res.status(403).json({ success: false, message: 'Driver account not approved yet' });
    }

    // Older requests may have been created before dispatch was available or
    // while the dispatch service was offline. Offer them to an eligible driver
    // when their dashboard checks in, so open area jobs do not stay stranded.
    const pendingSnap = await db.collection('transportRequests')
      .where('status', 'in', ['QUOTED', 'REQUESTED'])
      .get();
    const repairRefs = [];
    for (const requestDoc of pendingSnap.docs) {
      const request = requestDoc.data();
      if (request.driverUserId || !driverMatchesPickup({ ...userDoc.data(), id: user.uid }, request) || !driverCanCarryRequest(userDoc.data(), request)) continue;
      repairRefs.push(requestDoc.ref);
    }
    for (let offset = 0; offset < repairRefs.length; offset += 450) {
      const batch = db.batch();
      repairRefs.slice(offset, offset + 450).forEach((ref) => batch.update(ref, {
        offerDriverIds: admin.firestore.FieldValue.arrayUnion(user.uid),
        offerDispatchMode: 'registered-area',
        offerDispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }));
      await batch.commit();
    }

    const requestsSnap = await db.collection('transportRequests')
      .where('offerDriverIds', 'array-contains', user.uid)
      .get();

    const offers = requestsSnap.docs
      .map(doc => ({ id: doc.id, requestId: doc.id, ...doc.data() }))
      .filter((offer) => ['QUOTED', 'REQUESTED'].includes(offer.status) && !offer.driverUserId && driverCanCarryRequest(userDoc.data(), offer));
    return res.json({ success: true, offers });
  } catch (error) {
    console.error('List offers error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Accept Offer (First come first served)
router.post('/api/moving/driver/accept', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'Missing requestId' });

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    if (userData.driverApproved !== true) {
      return res.status(403).json({ success: false, message: 'Driver not approved' });
    }

    const reqRef = db.collection('transportRequests').doc(requestId);
    await db.runTransaction(async (transaction) => {
      const reqDoc = await transaction.get(reqRef);
      if (!reqDoc.exists) throw new Error('Request not found');
      const reqData = reqDoc.data();
      if (reqData.driverUserId || !['REQUESTED', 'QUOTED'].includes(reqData.status)) {
        throw new Error('Offer already claimed by another driver');
      }
      if (!Array.isArray(reqData.offerDriverIds) || !reqData.offerDriverIds.includes(user.uid)) {
        throw new Error('This offer is not available to your account');
      }
      if (!driverCanCarryRequest(userData, reqData)) {
        throw new Error('Your vehicle cargo listing does not include all item types in this move');
      }
      transaction.update(reqRef, {
        driverUserId: user.uid,
        driverName: userData.name || userData.displayName || 'Driver',
        driverPhone: userData.phoneNumber || userData.phone || userData.driverProfile?.phone || '',
        vehicleLabel: userData.driverProfile?.vehicleTemplate || userData.driverProfile?.vehicleId || 'Vehicle',
        status: 'DRIVER_ASSIGNED',
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.json({ success: true, message: 'Offer accepted successfully' });
  } catch (error) {
    console.error('Accept offer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Decline Offer
router.post('/api/moving/driver/decline', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId, reason } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'Missing requestId' });

    const db = admin.firestore();
    await db.collection('transportRequests').doc(requestId).update({
      declinedDrivers: admin.firestore.FieldValue.arrayUnion({ driverId: user.uid, reason: reason || 'Declined', at: new Date() }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, message: 'Offer declined' });
  } catch (error) {
    console.error('Decline error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Start Trip
router.post('/api/moving/driver/start-trip', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'Missing requestId' });

    const db = admin.firestore();
    await db.collection('transportRequests').doc(requestId).update({
      status: 'IN_TRANSIT',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, message: 'Trip started' });
  } catch (error) {
    console.error('Start trip error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Additive item-rate quote endpoints. The legacy per-kilometre endpoints remain available.
router.get('/api/moving/drivers/quotes-item-rates', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const vehicleId = String(req.query.vehicleId || '');
    const pickup = { lat: Number(req.query.pickupLat), lng: Number(req.query.pickupLng) };
    const destination = { lat: Number(req.query.destinationLat), lng: Number(req.query.destinationLng) };
    const area = { pickupCounty: String(req.query.pickupCounty || ''), pickupSubCounty: String(req.query.pickupSubCounty || ''), pickupWard: String(req.query.pickupWard || ''), pickupArea: String(req.query.pickupArea || ''), pickupCoordinates: pickup };
    let itemCounts = {};
    try { itemCounts = JSON.parse(String(req.query.itemCounts || '{}')); } catch { /* Empty item list */ }
    if (!['motorbike', 'tuk', 'pickup', 'lorry'].includes(vehicleId) || ![pickup.lat, pickup.lng, destination.lat, destination.lng].every(Number.isFinite) || !itemCounts || typeof itemCounts !== 'object' || Array.isArray(itemCounts)) return res.status(400).json({ success: false, message: 'Choose a vehicle, valid trip pins, and belongings.' });
    const routeKm = Math.round(movingDistanceKm(pickup, destination) * 1.15 * 10) / 10;
    const db = admin.firestore();
    const snapshot = await db.collection('users').where('driverApproved', '==', true).get();
    const drivers = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
      .filter((driver) => driver.id !== user.uid && driver.driverProfile?.vehicleId === vehicleId)
      .filter((driver) => driverMatchesPickup(driver, area))
      .filter((driver) => driverCanCarryRequest(driver, { items: itemCounts }))
      .map((driver) => {
        const profile = driver.driverProfile || {};
        const ratePerKm = Number(profile.ratePerKm || 0);
        const itemRates = profile.itemRates && typeof profile.itemRates === 'object' ? profile.itemRates : {};
        const itemFeeBreakdown = Object.fromEntries(Object.entries(itemCounts).filter(([, count]) => Number(count) > 0).map(([item, count]) => [item, Math.max(0, Number(itemRates[item]) || 0) * Number(count)]));
        const itemFeeTotal = Object.values(itemFeeBreakdown).reduce((sum, fee) => sum + fee, 0);
        const distanceFare = routeKm * ratePerKm;
        const quote = Math.ceil((distanceFare + itemFeeTotal) / 50) * 50;
        const lastSeen = driver.driverLastSeenAt?.toMillis?.() || 0;
        return { id: driver.id, name: String(driver.name || driver.displayName || 'Local driver').slice(0, 80), vehicleId: profile.vehicleId, vehicleTemplate: String(profile.vehicleTemplate || profile.vehicleId || 'Vehicle').slice(0, 60), plate: String(profile.plate || '').slice(0, 20), photoUrl: String(profile.photoUrl || '').slice(0, 500), ratePerKm, itemRates, itemFeeBreakdown, itemFeeTotal, distanceFare, driverDistanceKm: movingDistanceKm(profile.workCoordinates || driver.workCoordinates, pickup), routeKm, quote, online: driver.driverOnline === true && lastSeen >= Date.now() - 300000, workArea: [profile.workArea, profile.workSubCounty, profile.workCounty].filter(Boolean).join(', ') };
      })
      .filter((driver) => driver.ratePerKm > 0 && Number.isFinite(driver.quote))
      .sort((a, b) => Number(b.online) - Number(a.online) || a.quote - b.quote);
    return res.json({ success: true, drivers });
  } catch (error) {
    console.error('Find item-rate transport quotes error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Could not find matching drivers' });
  }
});

router.post('/api/moving/dispatch-quote-item-rates', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'Missing requestId' });
    const db = admin.firestore();
    const ref = db.collection('transportRequests').doc(String(requestId));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    const request = snap.data();
    if (request.userId !== user.uid) return res.status(403).json({ success: false, message: 'Not allowed' });
    if (!request.quotedDriverId || !['REQUESTED', 'QUOTED'].includes(request.status) || request.driverUserId) return res.status(409).json({ success: false, message: 'Request is no longer open' });
    const driverSnap = await db.collection('users').doc(request.quotedDriverId).get();
    const driver = driverSnap.data() || {};
    const profile = driver.driverProfile || {};
    if (!driverSnap.exists || driver.driverApproved !== true || profile.vehicleId !== request.vehicleId || !driverMatchesPickup(driver, request) || !driverCanCarryRequest(driver, request) || !(Number(profile.ratePerKm) > 0)) return res.status(409).json({ success: false, message: 'Selected driver or rate card is no longer available' });
    const straightKm = movingDistanceKm(request.pickupCoordinates, request.destinationCoordinates);
    const routeKm = Math.round(straightKm * 1.15 * 10) / 10;
    const ratePerKm = Number(profile.ratePerKm);
    const itemRates = profile.itemRates && typeof profile.itemRates === 'object' ? profile.itemRates : {};
    const itemFeeBreakdown = Object.fromEntries(Object.entries(request.items || {}).filter(([, count]) => Number(count) > 0).map(([item, count]) => [item, Math.max(0, Number(itemRates[item]) || 0) * Number(count)]));
    const itemFeeTotal = Object.values(itemFeeBreakdown).reduce((sum, fee) => sum + fee, 0);
    const distanceFare = routeKm * ratePerKm;
    const quote = Math.ceil((distanceFare + itemFeeTotal) / 50) * 50;
    await ref.update({ offerDriverIds: [request.quotedDriverId], quotedPrice: quote, quotedRouteKm: routeKm, quotedRatePerKm: ratePerKm, quotedItemRates: itemRates, quotedItemFeeBreakdown: itemFeeBreakdown, quotedItemFeeTotal: itemFeeTotal, quotedDistanceFare: distanceFare, quoteModel: 'driver-distance-plus-item-rates-v2', quotedDriverName: driver.name || driver.displayName || 'Driver', offerDispatchedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return res.json({ success: true, quote, routeKm, ratePerKm, itemFeeTotal, itemFeeBreakdown, driverId: request.quotedDriverId });
  } catch (error) {
    console.error('Dispatch item-rate quote error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Could not send the selected driver quote' });
  }
});

// Complete Trip
router.post('/api/moving/driver/complete', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { requestId } = req.body || {};
    if (!requestId) return res.status(400).json({ success: false, message: 'Missing requestId' });

    const db = admin.firestore();
    await db.collection('transportRequests').doc(requestId).update({
      status: 'DELIVERED',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, message: 'Trip completed' });
  } catch (error) {
    console.error('Complete trip error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
