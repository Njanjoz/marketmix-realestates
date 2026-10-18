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

// Driver Onboarding
router.post('/api/moving/driver/onboard', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { vehicleId, vehicleTemplate, plate, licenseNumber, phone, photoUrl } = req.body || {};

    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);

    const driverProfile = {
      vehicleId: vehicleId || 'pickup',
      vehicleTemplate: vehicleTemplate || 'fronack',
      plate: plate || '',
      licenseNumber: licenseNumber || '',
      phone: phone || '',
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

    const requestsSnap = await db.collection('transportRequests')
      .where('status', 'in', ['QUOTED', 'REQUESTED'])
      .get();

    const offers = requestsSnap.docs.map(doc => ({ id: doc.id, requestId: doc.id, ...doc.data() }));
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
    const reqDoc = await reqRef.get();
    if (!reqDoc.exists) return res.status(404).json({ success: false, message: 'Request not found' });

    const reqData = reqDoc.data();
    if (reqData.driverUserId) {
      return res.status(400).json({ success: false, message: 'Offer already claimed by another driver' });
    }

    await reqRef.update({
      driverUserId: user.uid,
      driverName: userData.name || userData.displayName || 'Driver',
      driverPhone: userData.phoneNumber || userData.phone || userData.driverProfile?.phone || '',
      vehicleLabel: userData.driverProfile?.vehicleTemplate || userData.driverProfile?.vehicleId || 'Vehicle',
      status: 'DRIVER_ASSIGNED',
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
