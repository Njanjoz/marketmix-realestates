// src/context/AuthContext.jsx - SIMPLE WORKING VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Mock users for testing
  const mockUsers = [
    {
      id: '1',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      userType: 'user'
    },
    {
      id: '2',
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      userType: 'admin'
    }
  ];

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('marketmix_user');
    const storedProfile = localStorage.getItem('marketmix_profile');
    
    if (storedUser && storedProfile) {
      setCurrentUser(JSON.parse(storedUser));
      setUserProfile(JSON.parse(storedProfile));
    }
    
    setLoading(false);
  }, []);

  // Email/password login
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock data
      const user = mockUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        const mockUser = {
          uid: user.id,
          email: user.email,
          displayName: user.name
        };
        
        const mockProfile = {
          uid: user.id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          favorites: [],
          savedSearches: [],
          profileImage: null
        };
        
        setCurrentUser(mockUser);
        setUserProfile(mockProfile);
        
        // Save to localStorage
        localStorage.setItem('marketmix_user', JSON.stringify(mockUser));
        localStorage.setItem('marketmix_profile', JSON.stringify(mockProfile));
        
        setLoading(false);
        return mockUser;
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      setAuthError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        uid: 'google_' + Date.now(),
        email: 'googleuser@example.com',
        displayName: 'Google User'
      };
      
      const mockProfile = {
        uid: mockUser.uid,
        email: mockUser.email,
        name: mockUser.displayName,
        userType: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        favorites: [],
        savedSearches: [],
        profileImage: 'https://lh3.googleusercontent.com/a/default-user'
      };
      
      setCurrentUser(mockUser);
      setUserProfile(mockProfile);
      
      // Save to localStorage
      localStorage.setItem('marketmix_user', JSON.stringify(mockUser));
      localStorage.setItem('marketmix_profile', JSON.stringify(mockProfile));
      
      setLoading(false);
      return mockUser;
    } catch (error) {
      setAuthError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Register
  const register = async (email, password, userData) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if email already exists
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser) {
        throw new Error('This email is already registered');
      }
      
      const userId = 'user_' + Date.now();
      const mockUser = {
        uid: userId,
        email: email,
        displayName: userData.name
      };
      
      const mockProfile = {
        uid: userId,
        email: email,
        name: userData.name,
        phone: userData.phone || '',
        userType: userData.userType || 'user',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        favorites: [],
        savedSearches: [],
        profileImage: null
      };
      
      // Add to mock users (in real app, this would be saved to database)
      mockUsers.push({
        id: userId,
        email: email,
        password: password,
        name: userData.name,
        userType: userData.userType || 'user'
      });
      
      setCurrentUser(mockUser);
      setUserProfile(mockProfile);
      
      // Save to localStorage
      localStorage.setItem('marketmix_user', JSON.stringify(mockUser));
      localStorage.setItem('marketmix_profile', JSON.stringify(mockProfile));
      
      setLoading(false);
      return mockUser;
    } catch (error) {
      setAuthError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentUser(null);
      setUserProfile(null);
      setAuthError(null);
      
      // Clear localStorage
      localStorage.removeItem('marketmix_user');
      localStorage.removeItem('marketmix_profile');
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('No user logged in');
    
    try {
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
      
      // Update localStorage
      localStorage.setItem('marketmix_profile', JSON.stringify(updatedProfile));
    } catch (error) {
      setAuthError(error.message);
      throw error;
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
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};