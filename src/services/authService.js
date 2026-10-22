import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
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
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (isCapacitor()) {
    await configureAuthPersistence();
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error('Google sign-in did not return an identity token. Check the Android Firebase Google sign-in setup.');
    return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  }
  // Persistence is initialized by AuthProvider on page load. Do not await it
  // here: an async delay before signInWithPopup can make browsers block the
  // popup because it is no longer directly inside the click activation.
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
  if (isCapacitor()) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut();
    } catch (error) {
      console.warn('Native Firebase sign-out was unavailable:', error);
    }
  }
  await signOut(auth);
};

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
