// src/components/AuthGate.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AuthGate = ({ children }) => {
  const { authReady } = useAuth();

  // BLOCK ENTIRE APP UNTIL AUTH IS READY
  if (!authReady) {
    return <LoadingSpinner />;
  }

  return children;
};

export default AuthGate;