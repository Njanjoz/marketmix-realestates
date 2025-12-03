// src/App.jsx - COMPLETE VERSION
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-white">
          {/* Navbar component (make sure to remove duplicate nav from HomePage) */}
          <Navbar />
          
          {/* Main content area with padding to account for fixed navbar */}
          <div className="pt-16 lg:pt-20">
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Add more routes as you create them */}
              {/* <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/property/:id" element={<PropertyDetailsPage />} /> */}
            </Routes>
          </div>

          {/* Optional: Footer can be added here */}
          {/* <Footer /> */}
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;