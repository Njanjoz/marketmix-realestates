import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { isCapacitor } from '../utils/platform';

export const configureAuthPersistence = async () => {
  try {
    const persistence = isCapacitor() ? indexedDBLocalPersistence : browserLocalPersistence;
    await setPersistence(auth, persistence);
  } catch (error) {
    if (error?.code !== 'auth/already-initialized') {
      console.warn('Auth persistence configuration failed:', error);
    }
  }
};

export const login = async (email, password) => {
  await configureAuthPersistence();
  return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  await configureAuthPersistence();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
};

export const register = async (email, password, data = {}) => {
  await configureAuthPersistence();
  const result = await createUserWithEmailAndPassword(auth, email, password);

  if (data?.name) {
    await updateProfile(result.user, { displayName: data.name });
  }

  return result;
};

export const logout = async () => {
  await signOut(auth);
};

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
