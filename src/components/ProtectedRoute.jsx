// src/components/ProtectedRoute.jsx - DEBUG VERSION
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading, profileLoading } = useAuth();
  
  console.log('🛡️ ProtectedRoute - RENDERED:', {
    loading,
    profileLoading,
    hasUser: !!currentUser,
    hasProfile: !!userProfile,
    path: window.location.pathname
  });
  
  useEffect(() => {
    console.log('🛡️ ProtectedRoute - EFFECT RAN');
  });
  
  if (loading || profileLoading) {
    console.log('🛡️ ProtectedRoute - SHOWING SPINNER');
    return <LoadingSpinner />;
  }
  
  if (!currentUser || !userProfile) {
    console.log('🛡️ ProtectedRoute - NO USER/PROFILE, REDIRECTING TO LOGIN');
    return <Navigate to="/login" replace />;
  }
  
  console.log('🛡️ ProtectedRoute - ACCESS GRANTED');
  return children;
};

export default ProtectedRoute;