import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail  // Added this import
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Google Auth Provider with better configuration
  const googleProvider = new GoogleAuthProvider();
  
  // Important: Add these configuration options
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  googleProvider.setCustomParameters({
    prompt: 'select_account',
    display: 'popup'
  });

  // Create user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || additionalData.name || '',
        phone: additionalData.phone || '',
        userType: additionalData.userType || 'buyer',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        favorites: [],
        savedSearches: [],
        profileImage: user.photoURL || null,
        emailVerified: user.emailVerified || false,
        provider: user.providerData?.[0]?.providerId || 'email'
      };

      await setDoc(userRef, userData);
      return userData;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          
          // Fetch user profile from Firestore
          let profile = await fetchUserProfile(user.uid);
          
          // If no profile exists and user is from Google, create one
          if (!profile && user.providerData?.[0]?.providerId === 'google.com') {
            profile = await createUserProfile(user);
          }
          
          setUserProfile(profile);
          
          // Update last login
          if (profile) {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
              lastLogin: serverTimestamp()
            }, { merge: true });
          }
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Email/password login
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Google login with improved error handling
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Check if popups are blocked
      if (window.innerWidth === 0 && window.innerHeight === 0) {
        throw new Error('Popups might be blocked. Please enable popups for this site.');
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists, create if not
      let userProfile = await fetchUserProfile(user.uid);
      if (!userProfile) {
        userProfile = await createUserProfile(user);
      }
      
      return user;
    } catch (error) {
      console.error('Google login error:', error);
      
      let errorMessage = 'Google login failed. Please try again.';
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Google login was cancelled.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Google login was cancelled.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with this email. Try logging in with email/password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        default:
          errorMessage = error.message || 'Google authentication failed. Please try again.';
      }
      
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (email, password, userData) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with name
      if (userData.name) {
        await updateProfile(user, {
          displayName: userData.name
        });
      }
      
      // Create user profile in Firestore
      await createUserProfile(user, userData);
      
      // Send email verification
      await sendEmailVerification(user);
      
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
          break;
        default:
          errorMessage = error.message;
      }
      
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setAuthError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      // Update in Firebase Auth if name is being changed
      if (updates.name) {
        await updateProfile(auth.currentUser, {
          displayName: updates.name
        });
      }
      
      // Update in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Update profile error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to send reset email.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};