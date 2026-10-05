import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const recordPropertyView = async (property, viewer) => {
  if (!property?.id || !property.userId || !viewer?.uid || property.userId === viewer.uid) return;

  const viewRef = doc(db, 'propertyViews', `${property.id}_${viewer.uid}`);
  const displayName = viewer.displayName || viewer.email?.split('@')[0] || 'MarketMix member';

  await setDoc(viewRef, {
    propertyId: property.id,
    propertyTitle: property.title || 'Property listing',
    sellerId: property.userId,
    viewerId: viewer.uid,
    viewerName: displayName,
    viewerEmail: viewer.email || '',
    lastViewedAt: serverTimestamp(),
  }, { merge: true });
};
