// src/App.jsx - COMPLETE WITH ADMIN DASHBOARD
import React, { Suspense, lazy, useEffect, useLayoutEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import { SearchProvider } from './context/SearchContext';
import { StyledComponentsProvider } from './components/StyledComponentsProvider';
import { Toaster } from 'react-hot-toast';
import { WifiOff, RotateCcw } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import RouteSEO from './components/RouteSEO';
import Footer from './components/Footer';
import { getNetworkStatus, subscribeToNetwork } from './services/networkService';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const MortgageCalculator = lazy(() => import('./components/MortgageCalculator'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Property Pages
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailspage'));
const LuxuryPage = lazy(() => import('./pages/LuxuryPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const TransportPage = lazy(() => import('./pages/TransportPage'));
const TransportDriverPage = lazy(() => import('./pages/TransportDriverPage'));

// Dashboard Router
const DashboardRouter = lazy(() => import('./components/dashboards/DashboardRouter'));

// Admin Dashboard
const AdminDashboard = lazy(() => import('./components/dashboards/AdminDashboard'));
const PropertyModerationPage = lazy(() => import('./pages/admin/PropertyModerationPage'));
const AdminServiceRequestsPage = lazy(() => import('./pages/admin/ServiceRequestsPage'));
const AdminTransportRequestsPage = lazy(() => import('./pages/admin/TransportRequestsPage'));
const MovingPackagesPage = lazy(() => import('./pages/admin/MovingPackagesPage'));

function ScrollToTop() {
  const location = useLocation();
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search]);
  return null;
}

// User Pages
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const FavoritesPage = lazy(() => import('./pages/user/FavoritesPage'));
const MessagesPage = lazy(() => import('./pages/user/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/user/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/user/SettingsPage'));

function App() {
  const [network, setNetwork] = useState({ online: true, status: 'online' });

  useEffect(() => {
    let isMounted = true;

    const syncNetwork = async () => {
      const next = await getNetworkStatus();
      if (isMounted) setNetwork(next);
    };

    syncNetwork();
    const unsubscribe = subscribeToNetwork((nextStatus) => {
      if (isMounted) setNetwork(nextStatus);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <RouteSEO />
      <AuthProvider>
        <PropertyProvider>
          <SearchProvider>
            <StyledComponentsProvider>
              <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
                <Toaster position="top-right" />
                {network.online === false && (
                  <div className="fixed inset-x-0 top-0 z-50 bg-red-600 text-white shadow-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <WifiOff className="h-4 w-4" />
                        <span>No internet connection.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 font-medium transition hover:bg-white/20"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    </div>
                  </div>
                )}
                <Navbar />
                
                <main className="pt-16">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/mortgage" element={<MortgageCalculator />} />
                      <Route path="/agents" element={<AgentsPage />} />
                      <Route path="/properties" element={<PropertiesPage />} />
                      <Route path="/property/:id" element={<PropertyDetailsPage />} />
                      <Route path="/luxury" element={<LuxuryPage />} />
                      <Route path="/explore" element={<ExplorePage />} />
                      <Route path="/roommates" element={<ExplorePage />} />
                      <Route path="/transport" element={<TransportPage />} />
                      <Route path="/transport/driver" element={
                        <ProtectedRoute><TransportDriverPage /></ProtectedRoute>
                      } />
                      <Route path="/move-in" element={<Navigate to="/transport" replace />} />
                      
                      {/* User Dashboard */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <DashboardRouter />
                        </ProtectedRoute>
                      } />
                      
                      {/* Admin Dashboard - Only accessible by admin */}
                      <Route path="/admin/dashboard" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } />

                      <Route path="/admin/properties" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <PropertyModerationPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/service-requests" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminServiceRequestsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/transport-requests" element={
                        <ProtectedRoute allowedRoles={['admin']}><AdminTransportRequestsPage /></ProtectedRoute>
                      } />
                      <Route path="/admin/moving-packages" element={
                        <ProtectedRoute allowedRoles={['admin']}><MovingPackagesPage /></ProtectedRoute>
                      } />

                      {/* User Profile Routes */}
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/favorites" element={
                        <ProtectedRoute>
                          <FavoritesPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/messages" element={
                        <ProtectedRoute>
                          <MessagesPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/notifications" element={
                        <ProtectedRoute>
                          <NotificationsPage />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="/settings" element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* 404 Route */}
                      <Route path="/404" element={<NotFoundPage />} />
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                  </Suspense>
                </main>
                
                <Footer />
                <MobileBottomNav />
              </div>
            </StyledComponentsProvider>
          </SearchProvider>
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
