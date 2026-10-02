// src/services/propertyService.js
import { db } from "../firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export const getPropertyImage = (property) => {
  const candidates = [
    property?.images,
    property?.publicMedia,
    property?.media,
    property?.coverImage ? [property.coverImage] : []
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;

    for (const item of candidate) {
      if (typeof item === 'string' && item.trim()) return item;
      if (item && typeof item === 'object') {
        const url = item.remoteUrl || item.url || item.src || item.localPreviewUrl || item.preview;
        if (typeof url === 'string' && url.trim()) return url;
      }
    }
  }

  return 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800';
};

/**
 * Fetch public property data
 */
export const getPublicProperty = async (propertyId) => {
  const docRef = doc(db, "properties", propertyId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Fetch protected property data (Requires Auth & Entitlement Check)
 */
export const getProtectedProperty = async (propertyId) => {
  const docRef = doc(db, "properties_protected", propertyId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const savePropertyForUser = async ({ userId, propertyId, title, location }) => {
  if (!userId || !propertyId) return false;
  const ref = doc(db, 'savedProperties', `${userId}_${propertyId}`);
  await setDoc(ref, {
    userId,
    propertyId,
    title: title || '',
    location: location || '',
    createdAt: serverTimestamp(),
  }, { merge: true });
  return true;
};

export const removeSavedProperty = async ({ userId, propertyId }) => {
  if (!userId || !propertyId) return false;
  const ref = doc(db, 'savedProperties', `${userId}_${propertyId}`);
  await deleteDoc(ref);
  return true;
};

export const createInquiry = async ({ propertyId, buyerId, agentId, message, propertyTitle }) => {
  if (!propertyId || !buyerId || !message?.trim()) return null;
  const payload = {
    propertyId,
    buyerId,
    agentId: agentId || null,
    propertyTitle: propertyTitle || '',
    message: message.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'inquiries'), payload);
  return { id: docRef.id, ...payload };
};

export const createSiteVisit = async ({ propertyId, buyerId, agentId, requestedDate, requestedTime, visitFee = 0, transportFee = 0, meetingPoint, notes }) => {
  if (!propertyId || !buyerId || !requestedDate) return null;
  const payload = {
    propertyId,
    buyerId,
    agentId: agentId || null,
    requestedDate,
    requestedTime: requestedTime || '10:00',
    visitFee: Number(visitFee) || 0,
    transportFee: Number(transportFee) || 0,
    meetingPoint: meetingPoint || '',
    notes: notes || '',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'siteVisits'), payload);
  return { id: docRef.id, ...payload };
};
