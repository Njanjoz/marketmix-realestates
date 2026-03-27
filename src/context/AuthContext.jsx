// src/context/AuthContext.jsx - DEBUG VERSION
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';

const AuthContext = createContext();
let renderCount = 0;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  renderCount++;
  console.log(`🔐 AuthProvider RENDER #${renderCount}`, new Date().toISOString());
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  const listenerUnsubscribeRef = useRef(null);
  const isListenerSetupRef = useRef(false);
  
  const loading = useMemo(() => authLoading || profileLoading, [authLoading, profileLoading]);

  const googleProvider = useMemo(() => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }, []);

  const createUserProfile = useCallback(async (user, additionalData = {}) => {
    console.log('📝 Creating user profile for:', user.email);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || additionalData.name || 'User',
        phone: additionalData.phone || '',
        userType: additionalData.userType || 'user',
        role: additionalData.role || 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: user.emailVerified || false,
        provider: user.providerData?.[0]?.providerId || 'email'
      };
      await setDoc(userRef, userData, { merge: true });
      console.log('✅ User profile created:', userData);
      return userData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId) => {
    console.log('🔍 Fetching user profile for:', userId);
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const data = userSnap.exists() ? userSnap.data() : null;
      console.log('📋 Profile fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    console.log('🔐 Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('📡 Auth state changed:', user?.email || 'No user');
      try {
        if (user) {
          setCurrentUser(user);
          setAuthLoading(false);
          setProfileLoading(true);
          
          let profile = await fetchUserProfile(user.uid);
          if (!profile) {
            console.log('No profile found, creating one');
            profile = await createUserProfile(user, { userType: 'user', role: 'user' });
          }
          
          console.log('📋 Setting userProfile:', profile);
          setUserProfile(profile);
          setProfileLoading(false);
          
          const userRef = doc(db, 'users', user.uid);
          setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch(() => {});
        } else {
          console.log('No user, clearing state');
          setCurrentUser(null);
          setUserProfile(null);
          setAuthLoading(false);
          setProfileLoading(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setAuthError(error.message);
        setAuthLoading(false);
        setProfileLoading(false);
      }
    });
    
    return () => {
      console.log('🔐 Cleaning up auth state listener');
      unsubscribe();
    };
  }, [fetchUserProfile, createUserProfile]);

  // Real-time profile listener
  useEffect(() => {
    console.log('🔊 Setting up real-time listener effect. currentUser:', currentUser?.email);
    
    if (listenerUnsubscribeRef.current) {
      console.log('🔊 Cleaning up previous listener');
      listenerUnsubscribeRef.current();
      listenerUnsubscribeRef.current = null;
      isListenerSetupRef.current = false;
    }
    
    if (currentUser && !isListenerSetupRef.current) {
      console.log('📡 Setting up real-time profile listener for:', currentUser.uid);
      isListenerSetupRef.current = true;
      
      const userRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const updatedProfile = docSnap.data();
            const oldRole = userProfile?.role;
            const newRole = updatedProfile.role;
            
            console.log('🔄 Profile updated in real-time:', {
              oldRole,
              newRole,
              name: updatedProfile.name,
              hasChanges: JSON.stringify(userProfile) !== JSON.stringify(updatedProfile)
            });
            
            if (JSON.stringify(userProfile) !== JSON.stringify(updatedProfile)) {
              console.log('🔄 Updating userProfile state');
              setUserProfile(updatedProfile);
              
              if (oldRole && oldRole !== newRole) {
                console.log(`🎭 Role changed from ${oldRole} to ${newRole}`);
                toast.success(`Your role has been updated to ${newRole.toUpperCase()}!`, {
                  icon: '🔄',
                  duration: 4000,
                });
              }
            } else {
              console.log('🔄 No changes detected, skipping update');
            }
          }
        },
        (error) => {
          console.error('Error listening to profile changes:', error);
        }
      );
      
      listenerUnsubscribeRef.current = unsubscribe;
      
      return () => {
        console.log('🔊 Cleaning up real-time listener');
        if (listenerUnsubscribeRef.current) {
          listenerUnsubscribeRef.current();
          listenerUnsubscribeRef.current = null;
          isListenerSetupRef.current = false;
        }
      };
    }
  }, [currentUser]); // Only depend on currentUser

  const login = useCallback(async (email, password) => {
    console.log('🔑 Login attempt:', email);
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', result.user.email);
      return result.user;
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password.';
      else if (error.code === 'auth/user-not-found') errorMessage = 'No account found with this email.';
      else if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
      else if (error.code === 'auth/too-many-requests') errorMessage = 'Too many attempts. Try again later.';
      setAuthError(errorMessage);
      console.error('❌ Login error:', error);
      throw new Error(errorMessage);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    console.log('🔑 Google login attempt');
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Google login successful:', result.user.email);
      return result.user;
    } catch (error) {
      let errorMessage = 'Google login failed.';
      if (error.code === 'auth/popup-closed-by-user') errorMessage = 'Login cancelled.';
      else if (error.code === 'auth/popup-blocked') errorMessage = 'Popup blocked. Please allow popups.';
      setAuthError(errorMessage);
      console.error('❌ Google login error:', error);
      throw new Error(errorMessage);
    }
  }, [googleProvider]);

  const register = useCallback(async (email, password, userData) => {
    console.log('📝 Registration attempt:', email);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (userData.name) await updateProfile(user, { displayName: userData.name });
      await createUserProfile(user, {
        name: userData.name,
        phone: userData.phone || '',
        userType: userData.userType || 'user',
        role: userData.userType || 'user'
      });
      await sendEmailVerification(user);
      console.log('✅ Registration successful:', user.email);
      return user;
    } catch (error) {
      let errorMessage = 'Registration failed.';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email already registered.';
      else if (error.code === 'auth/invalid-email') errorMessage = 'Invalid email address.';
      else if (error.code === 'auth/weak-password') errorMessage = 'Password must be at least 6 characters.';
      setAuthError(errorMessage);
      console.error('❌ Registration error:', error);
      throw new Error(errorMessage);
    }
  }, [createUserProfile]);

  const logout = useCallback(async () => {
    console.log('🚪 Logout attempt');
    try {
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }, []);

  const updateUserProfile = useCallback(async (updates) => {
    console.log('📝 Updating user profile:', updates);
    if (!currentUser) throw new Error('No user logged in');
    try {
      if (updates.name) await updateProfile(auth.currentUser, { displayName: updates.name });
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      toast.success('Profile updated successfully!');
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Update profile error:', error);
      throw error;
    }
  }, [currentUser]);

  const resetPassword = useCallback(async (email) => {
    console.log('🔑 Password reset requested for:', email);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Reset password error:', error);
      throw new Error('Failed to send reset email.');
    }
  }, []);

  const value = useMemo(() => ({
    currentUser,
    userProfile,
    loading,
    profileLoading,
    authLoading,
    authError,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile,
    resetPassword
  }), [currentUser, userProfile, loading, profileLoading, authLoading, authError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};