// src/services/referralService.js - Property Referral & Reward System Service

import { db } from '../firebase/config';
import { 
  collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp, orderBy 
} from 'firebase/firestore';

// Generate unique IDs and referral codes
const generatePropertyId = () => `MM-RE-${Math.floor(10000 + Math.random() * 90000)}`;
const generateReferralCode = () => `MMR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
const generateTokenCode = () => `MM-TKN-${Math.random().toString(36).substring(2, 7).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;

/**
 * 1. Submit a property referral
 */
export const submitPropertyReferral = async ({ userId, userName, userPhone, propertyData }) => {
  try {
    const propertyId = generatePropertyId();
    const referralCode = generateReferralCode();
    const timestamp = serverTimestamp();

    const newPropertyPayload = {
      ...propertyData,
      propertyId,
      referralCode,
      submittedByUserId: userId,
      submittedByName: userName || 'Anonymous',
      submittedByPhone: userPhone || '',
      submittedAt: timestamp,
      propertyStatus: 'SUBMITTED', // DRAFT, SUBMITTED, UNDER_REVIEW, PUBLISHED, REJECTED, ACQUIRED, REWARD_PENDING, REWARD_PAID
      approvalStatus: 'pending',
      createdAt: timestamp,
    };

    // Check duplicate submission
    const existingQuery = query(
      collection(db, 'properties'),
      where('title', '==', propertyData.title),
      where('location', '==', propertyData.location)
    );
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      // Flag for admin review if property already exists
      newPropertyPayload.duplicateFlag = true;
      newPropertyPayload.adminReviewNote = 'Flagged as potential duplicate property submission.';
    }

    const docRef = await addDoc(collection(db, 'properties'), newPropertyPayload);

    // Create referral tracking record
    await addDoc(collection(db, 'referrals'), {
      propertyId: docRef.id,
      customPropertyId: propertyId,
      referrerId: userId,
      referralCode,
      createdAt: timestamp,
      status: 'SUBMITTED',
    });

    return { success: true, id: docRef.id, propertyId, referralCode };
  } catch (error) {
    console.error('Error submitting property referral:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 2. Fetch user referrals & rewards
 */
export const getUserReferrals = async (userId) => {
  try {
    const q = query(collection(db, 'properties'), where('submittedByUserId', '==', userId));
    const snapshot = await getDocs(q);
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const tokensQuery = query(collection(db, 'rewardTokens'), where('referrerId', '==', userId));
    const tokensSnap = await getDocs(tokensQuery);
    const tokens = tokensSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { properties, tokens };
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    return { properties: [], tokens: [] };
  }
};

/**
 * 3. Create Acquisition Record & Trigger Reward Pending
 */
export const recordAcquisition = async ({ propertyId, customerId, referrerId, agentId, acquisitionType = 'website' }) => {
  try {
    const timestamp = serverTimestamp();
    
    const acquisitionPayload = {
      propertyId,
      customerId,
      referrerId,
      agentId,
      acquisitionType,
      status: 'PENDING_VERIFICATION', // PENDING_VERIFICATION, VERIFIED, SUCCESSFUL, CANCELLED
      acquiredAt: timestamp,
    };

    const acqRef = await addDoc(collection(db, 'acquisitions'), acquisitionPayload);

    // Update property status
    await updateDoc(doc(db, 'properties', propertyId), {
      propertyStatus: 'ACQUIRED',
      acquisitionId: acqRef.id,
      acquiredAt: timestamp,
    });

    return { success: true, acquisitionId: acqRef.id };
  } catch (error) {
    console.error('Error recording acquisition:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 4. Admin / Agent verifies acquisition and generates reward token
 */
export const verifyAcquisitionAndCreateReward = async ({ acquisitionId, propertyId, referrerId, verifiedByAdminId, rewardAmount = 5000 }) => {
  try {
    const timestamp = serverTimestamp();
    const tokenCode = generateTokenCode();

    // Update acquisition status
    await updateDoc(doc(db, 'acquisitions', acquisitionId), {
      status: 'VERIFIED',
      verifiedBy: verifiedByAdminId,
      verifiedAt: timestamp,
    });

    // Create Reward Token
    const tokenPayload = {
      tokenCode,
      propertyId,
      referrerId,
      acquisitionId,
      rewardAmount,
      status: 'PENDING', // PENDING, VERIFIED, APPROVED, PAID, CANCELLED
      createdAt: timestamp,
    };

    const tokenRef = await addDoc(collection(db, 'rewardTokens'), tokenPayload);

    // Update property status to REWARD_PENDING
    await updateDoc(doc(db, 'properties', propertyId), {
      propertyStatus: 'REWARD_PENDING',
      rewardTokenId: tokenRef.id,
    });

    return { success: true, tokenId: tokenRef.id, tokenCode };
  } catch (error) {
    console.error('Error verifying acquisition:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 5. Admin updates reward state (APPROVED, PAID, CANCELLED)
 */
export const updateRewardStatus = async (tokenId, newStatus) => {
  try {
    const timestamp = serverTimestamp();
    const updatePayload = { status: newStatus };
    if (newStatus === 'APPROVED') updatePayload.approvedAt = timestamp;
    if (newStatus === 'PAID') updatePayload.paidAt = timestamp;

    await updateDoc(doc(db, 'rewardTokens', tokenId), updatePayload);
    return { success: true };
  } catch (error) {
    console.error('Error updating reward status:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 6. Fetch all referrals and acquisitions for Admin Dashboard
 */
export const getAllReferralsAndAcquisitions = async () => {
  try {
    const propsSnap = await getDocs(collection(db, 'properties'));
    const properties = propsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const acqSnap = await getDocs(collection(db, 'acquisitions'));
    const acquisitions = acqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const tokensSnap = await getDocs(collection(db, 'rewardTokens'));
    const tokens = tokensSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { properties, acquisitions, tokens };
  } catch (error) {
    console.error('Error fetching admin referral data:', error);
    return { properties: [], acquisitions: [], tokens: [] };
  }
};

/**
 * 7. Record 10% commission when someone books through a referral link/code
 */
export const recordReferralBooking = async ({ referralCode, propertyId, bookingAmount, buyerId }) => {
  if (!referralCode) return;
  try {
    const q = query(collection(db, 'properties'), where('referralCode', '==', referralCode));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const propData = snap.docs[0].data();
    const referrerId = propData.submittedByUserId;
    if (!referrerId || referrerId === buyerId) return;

    const commissionAmount = Number(bookingAmount || 0) * 0.10; // 10% commission
    const tokenCode = `MM-COM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    await addDoc(collection(db, 'rewardTokens'), {
      tokenCode,
      propertyId,
      referrerId,
      buyerId,
      rewardAmount: commissionAmount,
      commissionPercentage: 10,
      status: 'APPROVED',
      createdAt: serverTimestamp(),
      description: `10% commission for booking through referral code ${referralCode}`
    });

    console.log(`✅ Recorded 10% referral commission (KSh ${commissionAmount}) for referrer ${referrerId}`);
  } catch (err) {
    console.error('Error recording referral booking commission:', err);
  }
};
