// src/App.jsx - COMPLETE FIXED VERSION (NO CONFLICTING ROUTES)
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import { SearchProvider } from './context/SearchContext';
import { StyledComponentsProvider } from './components/StyledComponentsProvider';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Property Pages
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailspage'));
const LuxuryPage = lazy(() => import('./pages/LuxuryPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));

// Dashboard Router - Handles ALL dashboard routing
const DashboardRouter = lazy(() => import('./components/dashboards/DashboardRouter'));

// User Pages
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const FavoritesPage = lazy(() => import('./pages/user/FavoritesPage'));
const MessagesPage = lazy(() => import('./pages/user/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/user/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/user/SettingsPage'));

function App() {
  return (
    <Router>
      <AuthProvider>
        <PropertyProvider>
          <SearchProvider>
            <StyledComponentsProvider>
              <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <Toaster position="top-right" />
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
                      <Route path="/agents" element={<AgentsPage />} />
                      <Route path="/properties" element={<PropertiesPage />} />
                      <Route path="/property/:id" element={<PropertyDetailsPage />} />
                      <Route path="/luxury" element={<LuxuryPage />} />
                      <Route path="/explore" element={<ExplorePage />} />
                      
                      {/* ✅ ONLY ONE DASHBOARD ROUTE */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <DashboardRouter />
                        </ProtectedRoute>
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
              </div>
            </StyledComponentsProvider>
          </SearchProvider>
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;