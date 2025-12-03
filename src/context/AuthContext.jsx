// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile // Used for updating user display name/photo
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"; // Added arrayUnion/arrayRemove
import { auth, db } from "../firebase"; // Assuming you have a file that exports auth and db instances

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper function to create or update user profile in Firestore
  const createOrUpdateUserProfile = useCallback(async (user, profileData = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    const baseProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || profileData.name || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || profileData.photoURL || 'https://i.pravatar.cc/150',
      userType: profileData.userType || 'buyer', // default to 'buyer'
      phone: profileData.phone || '',
      savedProperties: [],
      createdAt: userDoc.exists() ? userDoc.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    if (userDoc.exists()) {
      // Update existing profile (e.g., last login, photoURL from social login)
      await updateDoc(userRef, {
        photoURL: baseProfile.photoURL,
        lastLogin: baseProfile.lastLogin,
        updatedAt: baseProfile.updatedAt,
      });
      setUserProfile({...userDoc.data(), ...baseProfile}); // Merge data
    } else {
      // Create new profile
      await setDoc(userRef, baseProfile);
      setUserProfile(baseProfile);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch/create user profile when auth state changes to logged in
        await createOrUpdateUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, [createOrUpdateUserProfile]);

  // --- Auth Actions ---

  const signup = async ({ name, email, password, phone, userType }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await createOrUpdateUserProfile(user, { name, phone, userType });

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: getFirebaseErrorMessage(error) };
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: getFirebaseErrorMessage(error) };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // The useEffect handler will handle profile creation/update
      // But we can eagerly call it to ensure data is set immediately
      await createOrUpdateUserProfile(user); 
      
      return { success: true };
    } catch (error) {
      console.error("Google login error:", error);
      return { success: false, error: getFirebaseErrorMessage(error) };
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error("User not logged in.");

    // Update Firebase Auth profile
    if (updates.displayName || updates.photoURL) {
      await updateProfile(currentUser, { 
        displayName: updates.displayName, 
        photoURL: updates.photoURL 
      });
    }

    // Update Firestore profile
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    // Update local state
    setUserProfile(prev => ({
      ...prev,
      ...updates
    }));
  };

  const saveProperty = async (propertyId) => {
    if (!currentUser) throw new Error("Authentication required to save properties.");

    const userRef = doc(db, 'users', currentUser.uid);
    const isSaved = userProfile.savedProperties?.includes(propertyId);
    let action = '';
    
    try {
      if (isSaved) {
        await updateDoc(userRef, {
          savedProperties: arrayRemove(propertyId)
        });
        action = 'removed';
        // Update local state
        setUserProfile(prev => ({
            ...prev,
            savedProperties: prev.savedProperties.filter(id => id !== propertyId)
        }));
      } else {
        await updateDoc(userRef, {
          savedProperties: arrayUnion(propertyId)
        });
        action = 'added';
        // Update local state
        setUserProfile(prev => ({
            ...prev,
            savedProperties: [...(prev.savedProperties || []), propertyId]
        }));
      }
      
      return { success: true, action };
    } catch (error) {
      console.error("Save property error:", error);
      return { success: false, error: error.message };
    }
  };

  // Helper function to get user-friendly error messages
  const getFirebaseErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'Email is already registered.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    saveProperty,
    // Add a check for user being logged in
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};