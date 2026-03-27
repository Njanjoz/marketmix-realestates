// src/components/dashboards/DashboardRouter.jsx - DEBUG VERSION
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';

import AdminDashboard from './AdminDashboard';
import AgentDashboard from './AgentDashboard';
import SellerDashboard from './SellerDashboard';
import InvestorDashboard from './InvestorDashboard';
import UserDashboard from './UserDashboard';

const DashboardRouter = () => {
  const { currentUser, userProfile, loading, profileLoading } = useAuth();
  
  // Debug logging
  console.log('🎛️ DashboardRouter - RENDERED:', {
    timestamp: new Date().toISOString(),
    loading,
    profileLoading,
    hasUser: !!currentUser,
    userEmail: currentUser?.email,
    hasProfile: !!userProfile,
    userType: userProfile?.userType,
    role: userProfile?.role,
    fullProfile: userProfile
  });
  
  // Track render count
  useEffect(() => {
    console.log('🎛️ DashboardRouter - EFFECT RAN');
    return () => {
      console.log('🎛️ DashboardRouter - EFFECT CLEANUP');
    };
  });
  
  if (loading || profileLoading) {
    console.log('🎛️ DashboardRouter - SHOWING LOADING SPINNER', { loading, profileLoading });
    return <LoadingSpinner />;
  }
  
  if (!currentUser || !userProfile) {
    console.log('🎛️ DashboardRouter - NO USER/PROFILE, REDIRECTING TO LOGIN', {
      hasUser: !!currentUser,
      hasProfile: !!userProfile
    });
    return <Navigate to="/login" replace />;
  }
  
  const userRole = userProfile.userType || userProfile.role;
  console.log('🎛️ DashboardRouter - USER ROLE DETECTED:', userRole);
  
  switch (userRole) {
    case 'admin':
      console.log('🎛️ DashboardRouter - RENDERING ADMIN DASHBOARD');
      return <AdminDashboard />;
    case 'agent':
      console.log('🎛️ DashboardRouter - RENDERING AGENT DASHBOARD');
      return <AgentDashboard />;
    case 'seller':
    case 'landlord':
      console.log('🎛️ DashboardRouter - RENDERING SELLER DASHBOARD');
      return <SellerDashboard />;
    case 'investor':
      console.log('🎛️ DashboardRouter - RENDERING INVESTOR DASHBOARD');
      return <InvestorDashboard />;
    default:
      console.log('🎛️ DashboardRouter - RENDERING USER DASHBOARD (default)', { userRole });
      return <UserDashboard />;
  }
};

export default DashboardRouter;