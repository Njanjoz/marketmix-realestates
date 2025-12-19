// src/App.jsx - COMPLETE REPLACEMENT WITH FIXED IMPORTS
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Main Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy load pages - Using your actual file structure
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Property Pages - From your root pages directory
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailspage')); // Updated to match your filename
const LuxuryPage = lazy(() => import('./pages/LuxuryPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));

// Dashboard Pages - From components/dashboards
const AdminDashboard = lazy(() => import('./components/dashboards/AdminDashboard'));
const AgentDashboard = lazy(() => import('./components/dashboards/AgentDashboard'));
const SellerDashboard = lazy(() => import('./components/dashboards/SellerDashboard'));
const InvestorDashboard = lazy(() => import('./components/dashboards/InvestorDashboard'));
const UserDashboard = lazy(() => import('./components/dashboards/UserDashboard'));

// User Pages - Using dynamic imports with fallbacks
const ProfilePage = lazy(() => 
  import('./pages/user/ProfilePage').catch(() => ({ 
    default: () => <PlaceholderPage title="Profile" message="Profile page coming soon..." />
  }))
);

const FavoritesPage = lazy(() => 
  import('./pages/user/FavoritesPage').catch(() => ({ 
    default: () => <PlaceholderPage title="Favorites" message="Your saved properties will appear here" />
  }))
);

const MessagesPage = lazy(() => 
  import('./pages/user/MessagesPage').catch(() => ({ 
    default: () => <PlaceholderPage title="Messages" message="Your messages will appear here" />
  }))
);

const NotificationsPage = lazy(() => 
  import('./pages/user/NotificationsPage').catch(() => ({ 
    default: () => <PlaceholderPage title="Notifications" message="No new notifications" />
  }))
);

const SettingsPage = lazy(() => 
  import('./pages/user/SettingsPage').catch(() => ({ 
    default: () => <PlaceholderPage title="Settings" message="Account settings coming soon..." />
  }))
);

// Placeholder component for missing pages
const PlaceholderPage = ({ title, message = "Coming soon..." }) => (
  <div className="min-h-screen pt-20 flex items-center justify-center">
    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <button 
        onClick={() => window.history.back()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Admin management pages (placeholders)
const AdminUsersPage = () => <PlaceholderPage title="User Management" message="Admin user management interface" />;
const AdminPropertiesPage = () => <PlaceholderPage title="Property Management" message="Admin property management interface" />;
const AdminAnalyticsPage = () => <PlaceholderPage title="Analytics Dashboard" message="Admin analytics and reports" />;

function App() {
  return (
    <Router>
      <AuthProvider>
        <PropertyProvider>
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
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
                  
                  {/* Property Routes */}
                  <Route path="/properties" element={<PropertiesPage />} />
                  <Route path="/property/:id" element={<PropertyDetailsPage />} />
                  <Route path="/luxury" element={<LuxuryPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  
                  {/* Protected User Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  
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
                  
                  {/* Role-Based Dashboards */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/agent/dashboard" element={
                    <ProtectedRoute requiredRole="agent">
                      <AgentDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/seller/dashboard" element={
                    <ProtectedRoute requiredRole={['seller', 'landlord']}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/investor/dashboard" element={
                    <ProtectedRoute requiredRole="investor">
                      <InvestorDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Management Routes */}
                  <Route path="/admin/users" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminUsersPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/properties" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPropertiesPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/admin/analytics" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminAnalyticsPage />
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
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;