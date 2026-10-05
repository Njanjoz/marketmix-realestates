import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const maskName = (name = '') => name
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => `${part[0]}•••`)
  .join(' ') || 'MarketMix member';

export const openPropertyConversation = async ({ property, currentUser, otherUserId, otherUserName = '' }) => {
  if (!property?.id || !currentUser?.uid || !otherUserId || currentUser.uid === otherUserId) {
    throw new Error('A valid property and another account are required to start a conversation.');
  }

  const participantIds = [currentUser.uid, otherUserId].sort();
  const safeOtherName = currentUser.uid === property.userId ? maskName(otherUserName) : otherUserName;
  const conversationId = `${property.id}_${participantIds.join('_')}`;
  const participantNames = {
    [currentUser.uid]: currentUser.displayName || currentUser.email?.split('@')[0] || 'MarketMix member',
    [otherUserId]: safeOtherName || 'MarketMix member',
  };

  await setDoc(doc(db, 'conversations', conversationId), {
    propertyId: property.id,
    propertyTitle: property.title || 'Property listing',
    participantIds,
    participantNames,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return conversationId;
};

export const getConversationMessages = (conversationId) =>
  collection(db, 'conversations', conversationId, 'messages');

export const getConversationRef = (conversationId) => doc(db, 'conversations', conversationId);
