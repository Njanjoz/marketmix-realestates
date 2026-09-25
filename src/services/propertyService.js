// src/services/propertyService.js
import { db } from "../firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

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
