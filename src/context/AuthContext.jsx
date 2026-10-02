// src/context/AuthContext.jsx - SIMPLIFIED WITHOUT TIMEOUT ISSUES
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  configureAuthPersistence,
  login,
  loginWithGoogle,
  register,
  logout,
  resetPassword,
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureAuthPersistence().catch((error) => console.warn('Auth persistence init failed:', error));
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

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    return result;
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    return result;
  };

  const handleRegister = async (email, password, data) => {
    const result = await register(email, password, data);
    await createUserProfile(result.user, data);
    return result;
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleResetPassword = (email) => resetPassword(email);

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin: userProfile?.role === 'admin',
    isSeller: userProfile?.role === 'seller' || userProfile?.role === 'agent',
    isAgent: userProfile?.role === 'agent',
    isUser: userProfile?.role === 'user',
    login: handleLogin,
    loginWithGoogle: handleGoogleLogin,
    register: handleRegister,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};