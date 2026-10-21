// src/components/dashboards/DashboardRouter.jsx
import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './dashboard-mobile.css';

// Lazy load dashboards
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AgentDashboard = lazy(() => import('./AgentDashboard'));
const SellerDashboard = lazy(() => import('./SellerDashboard'));
const InvestorDashboard = lazy(() => import('./InvestorDashboard'));
const UserDashboard = lazy(() => import('./UserDashboard'));
const DriverDashboard = lazy(() => import('../../pages/driver/DriverDashboard'));

// Preload all dashboards on component mount
const preloadDashboards = () => {
  const dashboards = [AdminDashboard, AgentDashboard, SellerDashboard, InvestorDashboard, UserDashboard, DriverDashboard];
  dashboards.forEach(dashboard => {
    if (dashboard && typeof dashboard === 'object') {
      dashboard._preload?.();
    }
  });
};

const DashboardRouter = () => {
  const { currentUser, userProfile, loading } = useAuth();

  // Preload dashboards immediately
  useEffect(() => {
    preloadDashboards();
  }, []);

  // Minimal loading state
  if (loading) {
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

  // Check if user is a driver (either by role or driver intent/approval)
  // Pending driver applications keep the account role as "user". Treat those
  // accounts as drivers only while they are actually in the user role; stale
  // driver approval metadata must not override a later role switch.
  const isDriver = role === 'driver' || (role === 'user' && userProfile?.driverIntent === true);

  // Render appropriate dashboard
  const renderDashboard = () => {
    if (isDriver) {
      return <DriverDashboard />;
    }
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
      <div className="dashboard-mobile-shell">{renderDashboard()}</div>
    </Suspense>
  );
};

export default DashboardRouter;
