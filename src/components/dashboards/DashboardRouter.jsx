// src/components/dashboards/DashboardRouter.jsx
import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Lazy load dashboards
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AgentDashboard = lazy(() => import('./AgentDashboard'));
const SellerDashboard = lazy(() => import('./SellerDashboard'));
const InvestorDashboard = lazy(() => import('./InvestorDashboard'));
const UserDashboard = lazy(() => import('./UserDashboard'));

// Preload all dashboards on component mount
const preloadDashboards = () => {
  const dashboards = [AdminDashboard, AgentDashboard, SellerDashboard, InvestorDashboard, UserDashboard];
  dashboards.forEach(dashboard => {
    if (dashboard && typeof dashboard === 'object') {
      // Trigger lazy load
      dashboard._preload?.();
    }
  });
};

const DashboardRouter = () => {
  const { currentUser, userProfile, authLoading, profileLoading } = useAuth();

  // Preload dashboards immediately
  useEffect(() => {
    preloadDashboards();
  }, []);

  // Minimal loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Get role with fallback
  const role = userProfile?.role || userProfile?.userType || 'user';

  // Render appropriate dashboard
  const renderDashboard = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'agent':
        return <AgentDashboard />;
      case 'seller':
      case 'landlord':
        return <SellerDashboard />;
      case 'investor':
        return <InvestorDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      {renderDashboard()}
    </Suspense>
  );
};

export default DashboardRouter;