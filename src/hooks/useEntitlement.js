// src/hooks/useEntitlement.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export const useEntitlement = (propertyId) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [canView, setCanView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessType, setAccessType] = useState(null); // 'admin', 'owner', 'unlock', 'subscription', 'none'

  const checkEntitlement = useCallback(async () => {
    if (!currentUser || !propertyId) {
      setCanView(false);
      setAccessType('none');
      setLoading(false);
      return;
    }

    // 1. Admin bypass
    if (isAdmin) {
      setCanView(true);
      setAccessType('admin');
      setLoading(false);
      return;
    }

    try {
      // 2. Owner check
      const propertyRef = doc(db, 'properties', propertyId);
      const propertySnap = await getDoc(propertyRef);
      
      if (propertySnap.exists()) {
        const propertyData = propertySnap.data();
        if (propertyData.ownerId === currentUser.uid) {
          setCanView(true);
          setAccessType('owner');
          setLoading(false);
          return;
        }
      }

      // 3. Individual Unlock check
      // We use the ID format "uid_propertyId" as planned in firestore rules
      const unlockId = `${currentUser.uid}_${propertyId}`;
      const unlockRef = doc(db, 'property_unlocks', unlockId);
      const unlockSnap = await getDoc(unlockRef);

      if (unlockSnap.exists() && unlockSnap.data().status === 'ACTIVE') {
        setCanView(true);
        setAccessType('unlock');
        setLoading(false);
        return;
      }

      // 4. Subscription check
      const subRef = doc(db, 'subscriptions', currentUser.uid);
      const subSnap = await getDoc(subRef);

      if (subSnap.exists() && subSnap.data().status === 'ACTIVE') {
        setCanView(true);
        setAccessType('subscription');
        setLoading(false);
        return;
      }

      setCanView(false);
      setAccessType('none');
    } catch (error) {
      console.error('Error checking entitlement:', error);
      setCanView(false);
      setAccessType('none');
    } finally {
      setLoading(false);
    }
  }, [currentUser, propertyId, isAdmin]);

  useEffect(() => {
    checkEntitlement();
  }, [checkEntitlement]);

  return { canView, loading, accessType, refreshEntitlement: checkEntitlement };
};
