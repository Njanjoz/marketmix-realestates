import express from 'express';
import admin from 'firebase-admin';
import process from 'node:process';

const router = express.Router();
const MIN_VIEWING_NOTICE_DAYS = 24;
const CONSULTATION_FEE = 50;
const AGENT_AVAILABILITY_EARNING = 25;
const DEFAULT_PACKAGES = {
  quick_view: { title: 'Quick View', price: 100 },
  assisted_view: { title: 'Assisted View', price: 250 },
  student_hunt: { title: 'Student Hunt', price: 300 },
  property_hunt: { title: 'Property Hunt', price: 500 },
  premium_hunt: { title: 'Premium Hunt', price: 1000 },
  group_viewing: { title: 'Group Viewing', price: 150 },
};

async function getUser(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) throw new Error('Sign in to reserve a viewing.');
  return admin.auth().verifyIdToken(authHeader.slice(7));
}

async function queueWhatsApp(phone, title, message) {
  if (!phone) return false;
  const backend = process.env.WHATSAPP_NOTIFY_BACKEND || 'https://backened-lt67.onrender.com';
  try {
    const response = await fetch(`${backend}/api/whatsapp/notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, title, message }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Could not queue viewing WhatsApp:', error.message);
    return false;
  }
}

function parsePackagePrice(pkg) {
  const numeric = Number(pkg?.price);
  if (Number.isFinite(numeric) && numeric > 0) return Math.ceil(numeric);
  const match = String(pkg?.priceLabel || '').match(/([\d,]+(?:\.\d+)?)/);
  const parsed = match ? Number(match[1].replace(/,/g, '')) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 0;
}

router.post('/api/bookings/site-seeing/checkout', async (req, res) => {
  try {
    const user = await getUser(req);
    const { propertyId, propertyIds = [], packageId, phoneNumber, customerName, preferredViewingDate, preferredViewingTime, bookingNote = '', tourPreferences = null, participantCount = 1, completionBookingId = null, bookingMode = 'availability_check' } = req.body || {};
    if (!['availability_check', 'direct_booking'].includes(bookingMode) && !completionBookingId) return res.status(400).json({ success: false, message: 'Choose an availability check or continue without availability confirmation.' });
    const needsViewingSlot = bookingMode === 'direct_booking' || !!completionBookingId;
    if (!propertyId || !packageId || !String(customerName || '').trim() || !/^\+?[0-9 ()-]{9,20}$/.test(String(phoneNumber || '')) || (needsViewingSlot && (!/^\d{4}-\d{2}-\d{2}$/.test(String(preferredViewingDate || '')) || !/^\d{2}:\d{2}$/.test(String(preferredViewingTime || ''))))) {
      return res.status(400).json({ success: false, message: needsViewingSlot
        ? 'Choose a property and package, enter your name and M-Pesa number, and select a preferred viewing date and time.'
        : 'Choose a property and package, then enter your name and M-Pesa number.' });
    }
    if (needsViewingSlot) {
      const requestedDate = new Date(`${preferredViewingDate}T00:00:00.000Z`);
      if (!Number.isFinite(requestedDate.getTime()) || requestedDate.toISOString().slice(0, 10) !== preferredViewingDate) {
        return res.status(400).json({ success: false, message: 'Enter a valid viewing date.' });
      }
      const eatNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const minimumDate = new Date(Date.UTC(
        eatNow.getUTCFullYear(), eatNow.getUTCMonth(), eatNow.getUTCDate() + MIN_VIEWING_NOTICE_DAYS
      ));
      if (requestedDate < minimumDate) {
        return res.status(400).json({ success: false, message: 'Choose a viewing date at least 24 days away so we can arrange with the agent.' });
      }
    }
    const db = admin.firestore();
    const uniquePropertyIds = [...new Set((Array.isArray(propertyIds) ? propertyIds : []).map(String).filter(Boolean))];
    if (!uniquePropertyIds.includes(String(propertyId))) uniquePropertyIds.unshift(String(propertyId));
    const isMultiPackage = ['assisted_view', 'student_hunt', 'property_hunt', 'premium_hunt'].includes(String(packageId));
    const maxProperties = String(packageId) === 'assisted_view' ? 2 : String(packageId) === 'premium_hunt' ? 6 : 4;
    if (uniquePropertyIds.length > (isMultiPackage ? maxProperties : 1)) {
      return res.status(400).json({ success: false, message: `This package supports up to ${isMultiPackage ? maxProperties : 1} properties.` });
    }
    const propertySnaps = await Promise.all(uniquePropertyIds.map((id) => db.collection('properties').doc(id).get()));
    if (propertySnaps.some((snap) => !snap.exists)) return res.status(404).json({ success: false, message: 'One or more selected properties could not be found.' });
    const tourProperties = propertySnaps.map((snap) => ({ id: snap.id, ...snap.data() }));
    for (const selected of tourProperties) {
      if (selected.userId === user.uid || selected.ownerId === user.uid || selected.sellerId === user.uid) {
        return res.status(403).json({ success: false, message: 'You cannot book a viewing for your own property.' });
      }
      if (![selected.approvalStatus, selected.verificationStatus].some((status) => String(status || '').toLowerCase() === 'approved')) {
        return res.status(409).json({ success: false, message: 'A selected property is no longer available for booking.' });
      }
    }
    const property = tourProperties.find((item) => item.id === String(propertyId)) || tourProperties[0];

    let pkg = DEFAULT_PACKAGES[String(packageId)];
    if (!pkg) {
      const packageSnap = await db.collection('sightseeingPackages').doc(String(packageId)).get();
      if (!packageSnap.exists || packageSnap.data().active === false) return res.status(404).json({ success: false, message: 'This viewing package is unavailable.' });
      pkg = packageSnap.data();
    }
    if (['quick_view', 'assisted_view'].includes(String(packageId))) {
      pkg = { ...pkg, ...DEFAULT_PACKAGES[String(packageId)] };
    }
    const totalPrice = parsePackagePrice(pkg);
    const groupSize = String(packageId) === 'group_viewing' ? Math.max(1, Math.min(10, Math.floor(Number(participantCount) || 1))) : 1;
    const bookingTotal = totalPrice * groupSize;
    const consultationFee = CONSULTATION_FEE;

    let bookingRef;
    let completion = false;
    if (completionBookingId) {
      bookingRef = db.collection('sightseeingBookings').doc(String(completionBookingId));
      const existing = await bookingRef.get();
      if (!existing.exists || existing.data().userId !== user.uid || existing.data().availabilityStatus !== 'available' || existing.data().availabilityApproved !== true) {
        return res.status(409).json({ success: false, message: 'This booking is not approved to continue yet.' });
      }
      const approvedBooking = existing.data() || {};
      if (String(approvedBooking.packageId) !== String(packageId) || Number(approvedBooking.packagePrice) !== bookingTotal) {
        return res.status(409).json({ success: false, message: 'Continue with the package and participant count saved in your original request.' });
      }
      completion = true;
    } else bookingRef = db.collection('sightseeingBookings').doc();
    const paymentRef = `PROP_${String(propertyId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)}_BOOKING_${Date.now()}_${bookingRef.id.slice(0, 8)}`;
    const userSnap = await db.collection('users').doc(user.uid).get();
    const profile = userSnap.data() || {};
    await db.collection('orders').doc(paymentRef).create({
      orderId: paymentRef,
      orderType: 'real_estate',
      isRealEstate: true,
      paymentKind: completion ? 'sightseeing_booking_completion' : bookingMode === 'direct_booking' ? 'sightseeing_direct_booking' : 'sightseeing_consultation_fee',
      paymentStatus: 'pending',
      state: 'INITIATED',
      totalAmount: completion || bookingMode === 'direct_booking' ? bookingTotal : consultationFee,
      bookingAmount: bookingTotal,
      packageUnitPrice: totalPrice,
      participantCount: groupSize,
      bookingId: bookingRef.id,
      consultationFee,
      nonRefundable: bookingMode !== 'direct_booking',
      bookingMode: completion ? 'availability_check' : bookingMode,
      userId: user.uid,
      userEmail: user.email || profile.email || '',
      buyerEmail: user.email || profile.email || '',
      buyerName: user.name || profile.name || profile.displayName || 'Customer',
      customerName: String(customerName).trim().slice(0, 120),
      preferredViewingDate: preferredViewingDate ? String(preferredViewingDate) : null,
      preferredViewingTime: preferredViewingTime ? String(preferredViewingTime) : null,
      bookingNote: String(bookingNote || '').trim().slice(0, 500),
      phoneNumber: String(phoneNumber).replace(/\D/g, '').replace(/^0/, '254'),
      propertyId: String(propertyId),
      propertyIds: uniquePropertyIds,
      tourProperties: tourProperties.map((item) => ({
        id: item.id,
        title: String(item.title || item.name || 'Property').slice(0, 160),
        location: String(item.location || item.address || '').slice(0, 240),
        type: String(item.type || item.propertyType || item.category || '').slice(0, 80),
        monthlyRent: Number(item.price || item.monthlyRent || item.rentAmount || 0),
      })),
      tourPreferences: isMultiPackage && tourPreferences && typeof tourPreferences === 'object' ? {
        selectionMode: ['browse', 'random'].includes(tourPreferences.selectionMode) ? tourPreferences.selectionMode : 'browse',
        propertyType: String(tourPreferences.propertyType || 'any').slice(0, 80),
        minMonthlyRent: tourPreferences.minMonthlyRent != null && Number.isFinite(Number(tourPreferences.minMonthlyRent)) ? Number(tourPreferences.minMonthlyRent) : null,
        maxMonthlyRent: tourPreferences.maxMonthlyRent != null && Number.isFinite(Number(tourPreferences.maxMonthlyRent)) ? Number(tourPreferences.maxMonthlyRent) : null,
        area: String(tourPreferences.area || '').slice(0, 160),
      } : null,
      agentId: property.agentId || property.userId || property.ownerId || property.sellerId || null,
      propertyTitle: String(property.title || property.name || 'Property').slice(0, 160),
      propertyLocation: String(property.location || property.address || '').slice(0, 240),
      landlordName: String(property.landlordName || property.userName || '').slice(0, 120),
      // Seller contact data is kept off the shared booking record.
      packageId: String(packageId),
      packageName: String(pkg.title || 'Property viewing').slice(0, 120),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.json({ success: true, paymentRef, bookingId: bookingRef.id, totalPrice: bookingTotal, unitPrice: totalPrice, consultationFee, amountDue: completion || bookingMode === 'direct_booking' ? bookingTotal : consultationFee, completion, bookingMode, packageName: pkg.title || 'Property viewing' });
  } catch (error) {
    console.error('Prepare site-seeing checkout error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not prepare this booking.' });
  }
});

router.post('/api/bookings/site-seeing/confirm', async (req, res) => {
  try {
    const user = await getUser(req);
    const { paymentRef } = req.body || {};
    if (!paymentRef || !String(paymentRef).startsWith('PROP_')) return res.status(400).json({ success: false, message: 'Invalid booking payment reference.' });
    const db = admin.firestore();
    const orderRef = db.collection('orders').doc(String(paymentRef));
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ success: false, message: 'Booking payment not found.' });
    const order = orderSnap.data();
    if (order.userId !== user.uid || !['sightseeing_consultation_fee', 'sightseeing_booking_completion', 'sightseeing_direct_booking'].includes(order.paymentKind) || order.paymentStatus !== 'paid') {
      return res.status(403).json({ success: false, message: 'IntaSend has not confirmed this booking payment yet.' });
    }
    const completing = order.paymentKind === 'sightseeing_booking_completion';
    const direct = order.paymentKind === 'sightseeing_direct_booking';
    if ((!completing && !direct && (Number(order.totalAmount) !== CONSULTATION_FEE || Number(order.consultationFee) !== CONSULTATION_FEE)) || ((completing || direct) && Number(order.totalAmount) !== Number(order.bookingAmount))) {
      return res.status(409).json({ success: false, message: 'The payment amount does not match the selected booking option.' });
    }
    const bookingRef = db.collection('sightseeingBookings').doc(String(order.bookingId));
    if (completing) {
      const bookingSnap = await bookingRef.get();
      if (!bookingSnap.exists || bookingSnap.data().userId !== user.uid || bookingSnap.data().availabilityStatus !== 'available') return res.status(409).json({ success: false, message: 'This booking is no longer available to complete.' });
      await bookingRef.update({ status: 'meeting_details_pending', packageId: order.packageId, packageName: order.packageName, packagePrice: order.bookingAmount, totalPrice: order.bookingAmount, remainingBalance: 0, completionPaymentReference: String(paymentRef), completionMpesaReference: order.mpesaReference || null, agentAssignmentLocked: true, assignedAgentId: bookingSnap.data().agentId || null, tourCompleted: false, completedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      const completedBooking = bookingSnap.data() || {};
      const agentFormUrl = `${process.env.REAL_ESTATE_APP_URL || 'https://marketmix-realestates.vercel.app'}/agent/viewing-details/${encodeURIComponent(order.bookingId)}`;
      const agentSnap = completedBooking.agentId ? await db.collection('users').doc(String(completedBooking.agentId)).get() : null;
      const agent = agentSnap?.data() || {};
      const [adminsByRole, adminsByType, adminsByRoles] = await Promise.all([
        db.collection('users').where('role', '==', 'admin').get().catch(() => ({ docs: [] })),
        db.collection('users').where('userType', '==', 'admin').get().catch(() => ({ docs: [] })),
        db.collection('users').where('roles', 'array-contains', 'admin').get().catch(() => ({ docs: [] })),
      ]);
      const adminPhones = new Set([process.env.ADMIN_WHATSAPP_PHONE, ...[...adminsByRole.docs, ...adminsByType.docs, ...adminsByRoles.docs].map((entry) => { const data = entry.data() || {}; return data.phoneNumber || data.phone || data.contactPhone; })].filter(Boolean));
      const alert = `🏠 MarketMix Real Estates\nA viewing package payment has been received.\n\nBooking: ${order.bookingId}\nCustomer: ${completedBooking.customerName || 'Customer'}\nProperty: ${completedBooking.propertyTitle || 'Property'}\nWhat it's for: ${order.packageName} viewing package\nAmount paid: KSh ${Number(order.bookingAmount).toLocaleString()}\nM-Pesa reference: ${order.mpesaReference || 'Not provided'}\n${completedBooking.bookingMode === 'direct_booking' ? 'Vacancy has not been confirmed.' : `Availability confirmed: ${completedBooking.availableUnits || 1} unit(s).`}\n\nPlease coordinate the visit: ${agentFormUrl}`;
      const receipt = `🏠 MarketMix Real Estates\n\nHi ${completedBooking.customerName || 'there'}, thank you for booking with us. Your payment is confirmed.\n\nThis receipt is for your ${order.packageName || 'property viewing'} package at ${completedBooking.propertyTitle || 'your selected property'}.\nAmount paid: KSh ${Number(order.bookingAmount).toLocaleString()}\nM-Pesa reference: ${order.mpesaReference || 'See your M-Pesa confirmation'}\nBooking reference: ${order.bookingId}\n${completedBooking.bookingMode === 'direct_booking' ? 'The property vacancy is not yet confirmed; the agent will coordinate the details with you.' : `Availability confirmed for ${completedBooking.availableUnits || 1} unit(s). The agent will send your visit details on WhatsApp.`}\n\nWe appreciate you choosing MarketMix. If you need help, reply to this message.`;
      await Promise.all([
        ...[...adminPhones].map((phone) => queueWhatsApp(phone, 'Viewing package payment confirmed', alert)),
        queueWhatsApp(agent.phoneNumber || agent.phone || agent.contactPhone, 'Viewing package payment confirmed', alert),
        queueWhatsApp(order.phoneNumber, 'Your MarketMix viewing payment receipt', receipt),
      ]);
      return res.json({ success: true, bookingId: order.bookingId, status: 'meeting_details_pending', totalPrice: order.bookingAmount, consultationFee: CONSULTATION_FEE, completionPayment: order.totalAmount, mpesaReference: order.mpesaReference || null });
    }
    await db.runTransaction(async (transaction) => {
      const currentBooking = await transaction.get(bookingRef);
      if (currentBooking.exists) return;
      if (order.agentId && order.agentId === user.uid) throw new Error('You cannot book a viewing for your own property.');
      transaction.create(bookingRef, {
        propertyId: order.propertyId,
        propertyIds: Array.isArray(order.propertyIds) ? order.propertyIds : [order.propertyId],
        tourProperties: Array.isArray(order.tourProperties) ? order.tourProperties : [],
        tourPreferences: order.tourPreferences || null,
        propertyTitle: order.propertyTitle,
        propertyLocation: order.propertyLocation,
        agentId: order.agentId || null,
        packageId: order.packageId,
        packageName: order.packageName,
        packageUnitPrice: order.packageUnitPrice || order.bookingAmount,
        participantCount: order.participantCount || 1,
        packagePrice: order.bookingAmount,
        totalPrice: order.bookingAmount,
        consultationFee: CONSULTATION_FEE,
        consultationFeeNonRefundable: !direct,
        remainingBalance: direct ? 0 : order.bookingAmount,
        userId: user.uid,
        userEmail: order.userEmail,
        customerName: order.customerName || order.buyerName,
        // Customer contact data is kept off the shared booking record.
        preferredViewingDate: order.preferredViewingDate || null,
        preferredViewingTime: order.preferredViewingTime || null,
        bookingNote: order.bookingNote || '',
        paymentStatus: 'paid',
        paymentReference: String(paymentRef),
        mpesaReference: order.mpesaReference || null,
        status: direct ? 'meeting_details_pending' : 'awaiting_availability',
        bookingMode: direct ? 'direct_booking' : 'availability_check',
        agentAssignmentLocked: direct && !!order.agentId,
        assignedAgentId: direct ? order.agentId || null : null,
        tourCompleted: false,
        availabilityStatus: direct ? 'unconfirmed' : 'pending',
        directPaymentReference: direct ? String(paymentRef) : null,
        directMpesaReference: direct ? order.mpesaReference || null : null,
        adminCustomerUpdateStatus: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        queuedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    const dashboardUrl = `${process.env.REAL_ESTATE_APP_URL || 'https://marketmix-realestates.vercel.app'}/dashboard`;
    const agentFormUrl = `${process.env.REAL_ESTATE_APP_URL || 'https://marketmix-realestates.vercel.app'}/agent/viewing-details/${encodeURIComponent(order.bookingId)}`;
    const details = `🏠 MarketMix Real Estates\nA booking payment has been received.\n\nBooking: ${order.bookingId}\nCustomer: ${order.customerName || order.buyerName}\nPhone: ${order.phoneNumber}\nProperty: ${order.propertyTitle}\nWhat it's for: ${direct ? `${order.packageName} viewing package` : 'Property availability check'}\nAmount paid: KSh ${Number(order.totalAmount).toLocaleString()}${direct ? '' : ' (non-refundable service fee)'}\nM-Pesa reference: ${order.mpesaReference || 'Not provided'}\nPackage value: KSh ${Number(order.bookingAmount).toLocaleString()}\nPreferred date: ${order.preferredViewingDate || 'To be arranged'} ${order.preferredViewingTime || ''}\n${direct ? 'The customer proceeded without vacancy confirmation. Do not promise a vacancy; please arrange the viewing details.' : 'Please check vacancy and units. Admin will update the customer.'}\n\nAgent form: ${agentFormUrl}\nDashboard: ${dashboardUrl}`;
    const agentDetails = `🏠 MarketMix Real Estates\nA booking payment has been received.\n\nBooking: ${order.bookingId}\nCustomer: ${order.customerName || order.buyerName}\nProperty: ${order.propertyTitle}\nWhat it's for: ${direct ? `${order.packageName} viewing package` : 'Property availability check'}\nPreferred date: ${order.preferredViewingDate || 'To be arranged'} ${order.preferredViewingTime || ''}\n${direct ? 'The customer proceeded without vacancy confirmation. Do not promise a vacancy; please coordinate the visit using the website.' : 'Please check vacancy and units, then submit the update using the website.'}\n\nAgent form: ${agentFormUrl}\nDashboard: ${dashboardUrl}`;
    const customerReceipt = `🏠 MarketMix Real Estates\n\nHi ${order.customerName || 'there'}, thank you for choosing MarketMix. Your payment is confirmed.\n\nThis payment is for ${direct ? `${order.packageName || 'your property viewing'} at ${order.propertyTitle || 'your selected property'}` : `a property availability check for ${order.propertyTitle || 'your selected property}'}`}.\nAmount paid: KSh ${Number(order.totalAmount).toLocaleString()}${direct ? '' : ' (non-refundable availability-check service fee)'}\nM-Pesa reference: ${order.mpesaReference || 'See your M-Pesa confirmation'}\nBooking reference: ${order.bookingId}\n${direct ? 'The agent will coordinate your viewing details. Property vacancy has not been confirmed yet.' : `The agent will check availability, and an admin will update you on WhatsApp within 12 hours. Your selected package is ${order.packageName} (KSh ${Number(order.bookingAmount).toLocaleString()}).`}\n\nWe appreciate your trust. Reply here if you need help.`;
    const [adminsByRole, adminsByType, adminsByRoles] = await Promise.all([
      db.collection('users').where('role', '==', 'admin').get().catch(() => ({ docs: [] })),
      db.collection('users').where('userType', '==', 'admin').get().catch(() => ({ docs: [] })),
      db.collection('users').where('roles', 'array-contains', 'admin').get().catch(() => ({ docs: [] })),
    ]);
    const adminPhones = new Set([process.env.ADMIN_WHATSAPP_PHONE, ...[...adminsByRole.docs, ...adminsByType.docs, ...adminsByRoles.docs]
      .map((adminDoc) => { const profile = adminDoc.data() || {}; return profile.phoneNumber || profile.phone || profile.contactPhone; })].filter(Boolean));
    const assignedAgentSnap = order.agentId ? await db.collection('users').doc(String(order.agentId)).get() : null;
    const assignedAgent = assignedAgentSnap?.data() || {};
    await Promise.all([
      ...[...adminPhones].map((phone) => queueWhatsApp(phone, direct ? 'Paid viewing — arrange the visit' : 'Viewing request needs availability check', details)),
      queueWhatsApp(assignedAgent.phoneNumber || assignedAgent.phone || assignedAgent.contactPhone, 'New viewing request — check landlord availability', agentDetails),
      queueWhatsApp(order.phoneNumber, 'Your MarketMix viewing payment receipt', customerReceipt),
    ]);
    return res.json({ success: true, bookingId: order.bookingId, status: direct ? 'meeting_details_pending' : 'awaiting_availability', totalPrice: order.bookingAmount, participantCount: order.participantCount || 1, consultationFee: CONSULTATION_FEE, directPayment: direct, mpesaReference: order.mpesaReference || null });
  } catch (error) {
    console.error('Confirm site-seeing booking error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not confirm the booking.' });
  }
});

router.post('/api/bookings/site-seeing/:bookingId/availability', async (req, res) => {
  try {
    const user = await getUser(req);
    const { available } = req.body || {};
    const evidencePhotoUrls = Array.isArray(req.body?.evidencePhotoUrls) ? req.body.evidencePhotoUrls.filter((url) => typeof url === 'string' && url.startsWith('https://')).slice(0, 5) : [];
    const availabilityVideoUrl = String(req.body?.availabilityVideoUrl || '').trim();
    const availableUnits = Number(req.body?.availableUnits);
    if (typeof available !== 'boolean') return res.status(400).json({ success: false, message: 'Choose whether the property is available.' });
    if (available && (!Number.isInteger(availableUnits) || availableUnits < 1)) return res.status(400).json({ success: false, message: 'Enter the number of available units.' });
    if (available && evidencePhotoUrls.length === 0) return res.status(400).json({ success: false, message: 'Upload current photos of the available unit.' });
    if (available && !/^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}|youtu\.be\/[A-Za-z0-9_-]{11})/.test(availabilityVideoUrl)) return res.status(400).json({ success: false, message: 'Upload the live vacancy video to YouTube before submitting.' });
    const db = admin.firestore();
    const bookingId = String(req.params.bookingId);
    const bookingRef = db.collection('sightseeingBookings').doc(bookingId);
    const initialSnap = await bookingRef.get();
    if (!initialSnap.exists) return res.status(404).json({ success: false, message: 'Viewing request not found.' });
    const initialBooking = initialSnap.data() || {};
    const propertySnap = await db.collection('properties').doc(String(initialBooking.propertyId)).get();
    const property = propertySnap.exists ? propertySnap.data() : {};
    const userSnap = await db.collection('users').doc(user.uid).get();
    const userData = userSnap.data() || {};
    const isAdmin = userData.role === 'admin' || userData.userType === 'admin' || (Array.isArray(userData.roles) && userData.roles.includes('admin'));
    const agentId = initialBooking.agentId || property.agentId || property.userId || property.ownerId || property.sellerId || null;
    const agentIds = [agentId, property.agentId, property.userId, property.ownerId, property.sellerId].filter(Boolean);
    if (!isAdmin && !agentIds.includes(user.uid)) return res.status(403).json({ success: false, message: 'Only the assigned agent or an admin can update availability.' });
    const completionUrl = `${process.env.REAL_ESTATE_APP_URL || 'https://marketmix-realestates.vercel.app'}/site-seeing?propertyId=${encodeURIComponent(initialBooking.propertyId)}&propertyIds=${encodeURIComponent((initialBooking.propertyIds || [initialBooking.propertyId]).join(','))}&bookingId=${encodeURIComponent(bookingId)}&packageId=${encodeURIComponent(initialBooking.packageId || '')}&participantCount=${encodeURIComponent(initialBooking.participantCount || 1)}`;
    const walletRef = agentId ? db.collection('agentViewingWallets').doc(String(agentId)) : null;
    const earningRef = db.collection('agentViewingEarnings').doc(bookingId);
    let booking = initialBooking;
    let credited = false;
    await db.runTransaction(async (transaction) => {
      const [bookingSnap, earningSnap, walletSnap] = await Promise.all([
        transaction.get(bookingRef), transaction.get(earningRef), walletRef ? transaction.get(walletRef) : Promise.resolve(null),
      ]);
      if (!bookingSnap.exists) throw new Error('Viewing request not found.');
      booking = bookingSnap.data() || {};
      const actualAgentId = booking.agentId || agentId;
      if (!isAdmin && actualAgentId !== user.uid) throw new Error('Only the assigned agent can update this booking.');
      transaction.update(bookingRef, {
        agentId: actualAgentId,
        availabilityStatus: available ? 'available' : 'unavailable',
        availableUnits: available ? availableUnits : 0,
        availabilityEvidencePhotoUrls: available ? evidencePhotoUrls : [],
        availabilityVideoUrl: available ? availabilityVideoUrl : null,
        status: available ? 'awaiting_admin_confirmation' : 'awaiting_admin_customer_update',
        adminCustomerUpdateStatus: 'pending',
        availabilityCheckedBy: user.uid,
        availabilityCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
        completionUrl: available ? completionUrl : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    const agentSnap = agentId ? await db.collection('users').doc(String(agentId)).get() : null;
    const agent = agentSnap?.data() || {};
    const details = `Booking ${bookingId}\nProperty: ${booking.propertyTitle || 'Property'}\nAgent: ${agent.fullName || agent.name || agent.displayName || agentId || 'Assigned agent'}\nCustomer: ${booking.customerName || 'Customer'}\nLandlord availability: ${available ? `SELLER REPORTS AVAILABLE — ${availableUnits} unit(s), awaiting admin verification` : 'UNAVAILABLE'}\nVacancy photo evidence: ${available ? `${evidencePhotoUrls.length} photo(s) attached; review in admin queue` : 'none'}\nVacancy video evidence: ${available ? availabilityVideoUrl : 'none'}\nAgent vacancy confirmation credit: KSh ${available && agentId ? AGENT_AVAILABILITY_EARNING + ' after admin approves both photo and video evidence' : 'none'}\nReview evidence and notify the customer from the admin viewing queue.`;
    const [byRole, byType, byRoles] = await Promise.all([
      db.collection('users').where('role', '==', 'admin').get().catch(() => ({ docs: [] })),
      db.collection('users').where('userType', '==', 'admin').get().catch(() => ({ docs: [] })),
      db.collection('users').where('roles', 'array-contains', 'admin').get().catch(() => ({ docs: [] })),
    ]);
    const adminPhones = new Set([process.env.ADMIN_WHATSAPP_PHONE, ...[...byRole.docs, ...byType.docs, ...byRoles.docs].map((entry) => {
      const data = entry.data() || {};
      return data.phoneNumber || data.phone || data.contactPhone;
    })].filter(Boolean));
    await Promise.all([...adminPhones].map((phone) => queueWhatsApp(phone, 'Agent availability update — please review', details)));
    return res.json({ success: true, bookingId, availabilityStatus: available ? 'available' : 'unavailable', status: available ? 'awaiting_admin_confirmation' : 'awaiting_admin_customer_update', agentEarning: 0, credited: false, customerNotified: false });
  } catch (error) {
    console.error('Update viewing availability error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not update availability.' });
  }
});

router.post('/api/bookings/site-seeing/:bookingId/meeting-details', async (req, res) => {
  try {
    const user = await getUser(req);
    const { meetingPoint, meetingTime, estimatedCostPerPerson, landmark, notes = '' } = req.body || {};
    if (![meetingPoint, meetingTime, landmark].every((value) => String(value || '').trim())) return res.status(400).json({ success: false, message: 'Meeting place, meeting time, and a major landmark are required.' });
    const db = admin.firestore();
    const bookingRef = db.collection('sightseeingBookings').doc(String(req.params.bookingId));
    const snap = await bookingRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const booking = snap.data() || {};
    const profileSnap = await db.collection('users').doc(user.uid).get();
    const profile = profileSnap.data() || {};
    const isAdmin = profile.role === 'admin' || profile.userType === 'admin' || (Array.isArray(profile.roles) && profile.roles.includes('admin'));
    const assignedAgentId = booking.assignedAgentId || booking.agentId;
    if (!isAdmin && assignedAgentId !== user.uid) return res.status(403).json({ success: false, message: 'Only the assigned agent or an admin can submit meeting details.' });
    if (booking.paymentStatus !== 'paid' || (booking.bookingMode !== 'direct_booking' && !booking.completionPaymentReference)) return res.status(409).json({ success: false, message: 'The customer has not completed the site-seeing package payment yet.' });
    const agentSnap = booking.agentId ? await db.collection('users').doc(String(booking.agentId)).get() : profileSnap;
    const agent = agentSnap?.data() || profile;
    const cost = estimatedCostPerPerson === '' || estimatedCostPerPerson == null ? null : Number(estimatedCostPerPerson);
    if (cost != null && (!Number.isFinite(cost) || cost < 0)) return res.status(400).json({ success: false, message: 'Estimated cost must be zero or more.' });
    const meeting = { meetingPoint: String(meetingPoint).trim().slice(0, 240), meetingTime: String(meetingTime).trim().slice(0, 120), estimatedCostPerPerson: cost, landmark: String(landmark).trim().slice(0, 240), notes: String(notes).trim().slice(0, 800), submittedBy: user.uid, submittedAt: admin.firestore.FieldValue.serverTimestamp() };
    await bookingRef.update({ meetingDetails: meeting, status: 'confirmed', agentAssignmentLocked: !!assignedAgentId, assignedAgentId: assignedAgentId || null, tourStatus: 'scheduled', meetingDetailsSentAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    const receiptRef = booking.completionPaymentReference || booking.directPaymentReference || booking.paymentReference || '—';
    const packageAmount = Number(booking.totalPrice || booking.packagePrice || 0);
    const consultationAmount = booking.bookingMode === 'direct_booking' ? 0 : Number(booking.consultationFee || CONSULTATION_FEE);
    const receiptAmount = packageAmount + consultationAmount;
    const message = `MARKETMIX SITE SEEING — VISIT DETAILS\nBooking: ${req.params.bookingId}\nProperty: ${booking.propertyTitle || 'Property'}\nPackage: ${booking.packageName || 'Viewing'}\n\nMeet at: ${meeting.meetingPoint}\nTime: ${meeting.meetingTime}\nLandmark: ${meeting.landmark}\nEstimated cost per person: ${cost == null ? 'To be agreed directly' : `KSh ${cost.toLocaleString()}`}\n${meeting.notes ? `Notes: ${meeting.notes}\n` : ''}\nAgent: ${agent.fullName || agent.name || agent.displayName || 'Assigned agent'}\nContact the agent through the MarketMix website if you need help.\n${booking.bookingMode === 'direct_booking' ? 'Vacancy was not confirmed as part of your booking. Please reconfirm with the agent before travelling.' : `Vacancy confirmed for ${booking.availableUnits || 1} unit(s).`}\n\nPAYMENT RECEIPT\nReceipt: ${receiptRef}${consultationAmount ? ` + ${booking.paymentReference || 'availability-check receipt'}` : ''}\nPackage paid: KSh ${packageAmount.toLocaleString()}${consultationAmount ? `\nAvailability-check service: KSh ${consultationAmount.toLocaleString()} (non-refundable)` : ''}\nTotal paid: KSh ${receiptAmount.toLocaleString()}\nM-Pesa ref: ${booking.completionMpesaReference || booking.directMpesaReference || booking.mpesaReference || 'See M-Pesa confirmation'}${consultationAmount && booking.mpesaReference ? `; ${booking.mpesaReference}` : ''}\nPayment status: Paid\nThank you for booking with MarketMix Real Estates.`;
    const paymentSnap = await db.collection('orders').where('bookingId', '==', String(req.params.bookingId)).limit(1).get();
    const customerPhone = paymentSnap.docs[0]?.data()?.phoneNumber;
    const queued = await queueWhatsApp(customerPhone, 'Your property viewing details and receipt', message);
    return res.json({ success: true, bookingId: req.params.bookingId, customerNotified: queued });
  } catch (error) {
    console.error('Submit viewing meeting details error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not send meeting details.' });
  }
});

router.post('/api/bookings/site-seeing/:bookingId/complete-tour', async (req, res) => {
  try {
    const user = await getUser(req);
    const db = admin.firestore();
    const bookingId = String(req.params.bookingId);
    const bookingRef = db.collection('sightseeingBookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) return res.status(404).json({ success: false, message: 'Viewing booking not found.' });
    const booking = bookingSnap.data() || {};
    const profileSnap = await db.collection('users').doc(user.uid).get();
    const profile = profileSnap.data() || {};
    const isAdmin = profile.role === 'admin' || profile.userType === 'admin' || (Array.isArray(profile.roles) && profile.roles.includes('admin'));
    const assignedAgentId = booking.assignedAgentId || booking.agentId;
    if (!isAdmin && (!assignedAgentId || assignedAgentId !== user.uid)) return res.status(403).json({ success: false, message: 'Only the assigned agent or an admin can complete this tour.' });
    if (booking.paymentStatus !== 'paid' || !booking.meetingDetailsSentAt || !booking.meetingDetails) return res.status(409).json({ success: false, message: 'Submit the visit details after the customer has paid before completing the tour.' });
    const evidenceUrls = Array.isArray(req.body?.evidenceUrls) ? req.body.evidenceUrls.filter((url) => typeof url === 'string' && url.startsWith('https://')).slice(0, 5) : [];
    if (evidenceUrls.length === 0) return res.status(400).json({ success: false, message: 'Upload at least one tour photo as evidence.' });
    if (booking.tourStatus === 'awaiting_admin_tour_review' || booking.tourCompleted === true) return res.json({ success: true, bookingId, status: booking.tourStatus, alreadySubmitted: true });
    await bookingRef.update({ status: 'awaiting_admin_tour_review', tourStatus: 'awaiting_admin_tour_review', tourEvidenceUrls: evidenceUrls, tourEvidenceSubmittedBy: user.uid, tourEvidenceSubmittedAt: admin.firestore.FieldValue.serverTimestamp(), tourEvidenceReviewStatus: 'pending_admin_review', agentAssignmentLocked: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    const adminPhones = new Set([process.env.ADMIN_WHATSAPP_PHONE].filter(Boolean));
    const appUrl = process.env.REAL_ESTATE_APP_URL || 'https://marketmix-realestates.vercel.app';
    await Promise.all([...adminPhones].map((phone) => queueWhatsApp(phone, 'Tour evidence needs review', `Booking ${bookingId}\nProperty: ${booking.propertyTitle || 'Property'}\nCustomer: ${booking.customerName || 'Customer'}\nKSh ${AGENT_AVAILABILITY_EARNING} agent payout is pending photo review.\nReview: ${appUrl}/admin/sightseeing-bookings?bookingId=${encodeURIComponent(bookingId)}`)));
    return res.json({ success: true, bookingId, status: 'awaiting_admin_tour_review', assignmentReleased: false });
  } catch (error) {
    console.error('Complete site-seeing tour error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not complete this tour.' });
  }
});

router.post('/api/bookings/site-seeing/:bookingId/admin-notify-customer', async (req, res) => {
  try {
    const user = await getUser(req);
    const db = admin.firestore();
    const userSnap = await db.collection('users').doc(user.uid).get();
    const profile = userSnap.data() || {};
    if (!(profile.role === 'admin' || profile.userType === 'admin' || (Array.isArray(profile.roles) && profile.roles.includes('admin')))) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    const bookingRef = db.collection('sightseeingBookings').doc(String(req.params.bookingId));
    const snap = await bookingRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, message: 'Viewing request not found.' });
    const booking = snap.data() || {};
    const isTourReview = booking.tourStatus === 'awaiting_admin_tour_review';
    if (!isTourReview && !['available', 'unavailable'].includes(booking.availabilityStatus)) return res.status(409).json({ success: false, message: 'Wait for an agent availability update first.' });
    if (!isTourReview && booking.adminCustomerUpdateStatus === 'sent') return res.status(409).json({ success: false, message: 'The customer has already been updated.' });
    if (!isTourReview && booking.availabilityStatus === 'available' && (!booking.availabilityVideoUrl || !(booking.availabilityEvidencePhotoUrls || []).length)) return res.status(409).json({ success: false, message: 'Availability approval requires both submitted photos and a YouTube video.' });
    const message = isTourReview
      ? `Your MarketMix site-seeing visit for ${booking.propertyTitle || 'the property'} is marked complete after admin review of the tour photos. Thank you for using MarketMix.`
      : booking.availabilityStatus === 'available'
      ? `Good news, ${booking.customerName || 'there'} — ${booking.propertyTitle || 'the property'} is available. The agent reports ${booking.availableUnits || 1} available unit(s), confirmed by our admin. Vacancy photos: ${(booking.availabilityEvidencePhotoUrls || []).join(' | ')}. Vacancy video: ${booking.availabilityVideoUrl}. Book your site-seeing visit here: ${booking.completionUrl}`
      : `Update on your viewing request for ${booking.propertyTitle || 'the property'}: it is not available. Your KSh ${CONSULTATION_FEE} consultation fee is non-refundable. Browse other properties and start another booking here: ${process.env.REAL_ESTATE_APP_URL || 'https://marketmix-realestates.vercel.app'}/site-seeing`;
    const paymentSnap = await db.collection('orders').where('bookingId', '==', String(req.params.bookingId)).limit(1).get();
    const customerPhone = paymentSnap.docs[0]?.data()?.phoneNumber;
    const queued = await queueWhatsApp(customerPhone, isTourReview ? 'Site-seeing tour completed' : booking.availabilityStatus === 'available' ? 'Property available — book your visit' : 'Update on your viewing request', message);
    if (!queued) return res.status(502).json({ success: false, message: 'Could not queue the customer WhatsApp update.' });
    let tourEarning = null;
    if (isTourReview) {
      const sellerId = booking.assignedAgentId || booking.agentId;
      const grossAmount = Number(booking.packagePaymentAmount || booking.directPaymentAmount || booking.totalPrice || 0);
      if (!sellerId || !Number.isFinite(grossAmount) || grossAmount <= 0) return res.status(409).json({ success: false, message: 'The assigned agent or paid package amount is missing.' });
      const agencyCommissionAmount = Math.floor(grossAmount * 0.15);
      const collectionFeeAmount = Math.ceil(grossAmount * 0.03);
      const netAmount = Math.max(0, grossAmount - agencyCommissionAmount - collectionFeeAmount);
      const earningRef = db.collection('agentViewingEarnings').doc(`${String(req.params.bookingId)}__tour`);
      const walletRef = db.collection('agentViewingWallets').doc(String(sellerId));
      let credited = false;
      await db.runTransaction(async (transaction) => {
        const [earningSnap, walletSnap] = await Promise.all([transaction.get(earningRef), transaction.get(walletRef)]);
        if (earningSnap.exists && ['tour_approved', 'payout_initiated', 'paid'].includes(earningSnap.data()?.status)) return;
        transaction.set(walletRef, { withdrawableBalance: admin.firestore.FieldValue.increment(netAmount), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        transaction.set(earningRef, { bookingId: String(req.params.bookingId), earningKind: 'site_seeing_tour', sellerId, grossAmount, agencyCommissionRate: 0.15, agencyCommissionAmount, collectionFeeRate: 0.03, collectionFeeAmount, netAmount, currency: 'KES', status: 'tour_approved', creditedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        credited = true;
      });
      tourEarning = { grossAmount, agencyCommissionAmount, collectionFeeAmount, netAmount };
      const sellerSnap = await db.collection('users').doc(String(sellerId)).get();
      const seller = sellerSnap.data() || {};
      if (credited) await queueWhatsApp(seller.phoneNumber || seller.phone || seller.contactPhone, 'Your site-seeing tour was approved', `Package: KSh ${grossAmount}. Agency commission (15%): KSh ${agencyCommissionAmount}. Collection fee (3%): KSh ${collectionFeeAmount}. KSh ${netAmount} has been added to your viewing balance. Withdrawal fees apply when you cash out.`);
    }
    await bookingRef.update({
      adminCustomerUpdateStatus: 'sent', adminCustomerUpdateBy: user.uid,
      adminCustomerUpdateAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(isTourReview ? { tourCompleted: true, tourEvidenceReviewStatus: 'approved', agentAssignmentLocked: false, assignmentReleasedAt: admin.firestore.FieldValue.serverTimestamp() } : booking.availabilityStatus === 'available' ? { availabilityApproved: true, availabilityApprovedAt: admin.firestore.FieldValue.serverTimestamp(), availabilityApprovedBy: user.uid } : {}),
      status: isTourReview ? 'completed' : booking.availabilityStatus === 'available' ? 'awaiting_customer_completion' : 'property_unavailable',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const agentId = booking.assignedAgentId || booking.agentId;
    const agentSnap = agentId ? await db.collection('users').doc(String(agentId)).get() : null;
    const agent = agentSnap?.data() || {};
    await queueWhatsApp(agent.phoneNumber || agent.phone || agent.contactPhone, 'Admin updated the viewing customer', `Admin confirmed the availability update with you and notified the customer about ${booking.propertyTitle || 'the property'}. Booking: ${req.params.bookingId}`);
    return res.json({ success: true, bookingId: req.params.bookingId, customerNotified: true, tourEarning });
  } catch (error) {
    console.error('Admin customer update error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Could not update the customer.' });
  }
});

export default router;
