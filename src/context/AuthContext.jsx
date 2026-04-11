// src/context/AuthContext.jsx - SIMPLIFIED WITHOUT TIMEOUT ISSUES
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const googleProvider = useMemo(() => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }, []);

  // SIMPLIFIED: Just fetch the profile directly
  const fetchUserProfile = useCallback(async (uid) => {
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const createUserProfile = useCallback(async (user, data = {}) => {
    const ref = doc(db, 'users', user.uid);
    const profile = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || data.name || 'User',
      role: data.role || 'user',
      userType: data.userType || 'user',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    await setDoc(ref, profile, { merge: true });
    return profile;
  }, []);

  const updateUserProfile = useCallback(async (newData) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { ...newData, updatedAt: serverTimestamp() });
      setUserProfile(prev => ({ ...prev, ...newData }));
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [currentUser]);

  // SIMPLIFIED AUTH LISTENER - NO TIMEOUT
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      
      if (user) {
        setCurrentUser(user);
        
        try {
          let profile = await fetchUserProfile(user.uid);
          
          if (!profile) {
            console.log('Creating new profile for:', user.email);
            profile = await createUserProfile(user);
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Profile error:', error);
          // Set fallback profile
          setUserProfile({
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'User',
            role: 'user',
            userType: 'user'
          });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [fetchUserProfile, createUserProfile]);

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    return await signInWithPopup(auth, googleProvider);
  };

  const register = async (email, password, data) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (data?.name) {
      await updateProfile(res.user, { displayName: data.name });
    }
    await createUserProfile(res.user, data);
    return res;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};