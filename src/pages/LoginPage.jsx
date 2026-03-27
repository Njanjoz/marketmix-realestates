// src/pages/LoginPage.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  FaGoogle, 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaPhone, 
  FaEye, 
  FaEyeSlash, 
  FaCheckCircle, 
  FaHome,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    currentUser, 
    loading: authLoading, 
    profileLoading,
    login, 
    loginWithGoogle, 
    register: signup,
    resetPassword 
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [showPopupWarning, setShowPopupWarning] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [redirecting, setRedirecting] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'user'
  });

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set active tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  // ✅ FIXED: Only redirect when BOTH auth and profile are ready
  useEffect(() => {
    if (authLoading || profileLoading || redirecting) {
      return;
    }
    
    if (currentUser) {
      console.log('LoginPage: User logged in, redirecting to dashboard');
      setRedirecting(true);
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, profileLoading, navigate, redirecting]);

  // Show loading while checking auth
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If already logged in and not redirecting yet, don't show form
  if (currentUser && !redirecting) {
    return null;
  }

  const handleOfflineLogin = () => {
    toast.error('You are offline. Please check your internet connection.', {
      icon: '📶',
      duration: 5000,
    });
    setFormError('No internet connection. Please check your network and try again.');
  };

  const validateLoginForm = () => {
    if (isOffline) {
      handleOfflineLogin();
      return false;
    }
    
    if (!loginForm.email.trim()) {
      setFormError('Please enter your email address');
      return false;
    }
    
    if (!loginForm.password.trim()) {
      setFormError('Please enter your password');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    setFormError('');
    return true;
  };

  const validateRegisterForm = () => {
    if (isOffline) {
      handleOfflineLogin();
      return false;
    }
    
    if (!registerForm.name.trim()) {
      setFormError('Please enter your full name');
      return false;
    }
    
    if (!registerForm.email.trim()) {
      setFormError('Please enter your email address');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }
    
    if (!registerForm.password.trim()) {
      setFormError('Please enter a password');
      return false;
    }
    
    if (registerForm.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return false;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }
    
    setFormError('');
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) return;

    setFormLoading(true);
    setFormError('');
    setSuccessMessage('');
    
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back to MarketMix!', {
        icon: '👋',
        style: {
          borderRadius: '10px',
          background: '#363636',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      setFormError(error.message);
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;

    setFormLoading(true);
    setFormError('');
    setSuccessMessage('');
    
    try {
      const userData = {
        name: registerForm.name,
        phone: registerForm.phone || '',
        userType: registerForm.userType || 'user'
      };
      
      await signup(registerForm.email, registerForm.password, userData);
      
      toast.success('Account created successfully! Welcome to MarketMix!', {
        icon: '🎉',
        duration: 6000,
        style: {
          borderRadius: '10px',
          background: '#363636',
          color: '#fff',
        },
      });
      
      setSuccessMessage(`Registration successful! Welcome ${registerForm.name}!`);
      
      setRegisterForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        userType: 'user'
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      setFormError(error.message);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    if (isOffline) {
      handleOfflineLogin();
      return;
    }
    
    setGoogleLoading(true);
    setFormError('');
    setSuccessMessage('');
    setShowPopupWarning(false);
    
    try {
      await loginWithGoogle();
      toast.success('Successfully logged in with Google!', {
        icon: '✅',
        style: {
          borderRadius: '10px',
          background: '#363636',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Google login error:', error);
      
      if (error.message.includes('popup') || error.code === 'auth/popup-blocked') {
        setShowPopupWarning(true);
        setFormError('Popup blocked. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setFormError('Network error. Please check your internet connection and try again.');
      } else {
        setFormError(error.message || 'Google login failed. Please try again.');
      }
      
      toast.error(error.message || 'Google login failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      setFormError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    setFormLoading(true);
    setFormError('');
    
    try {
      await resetPassword(forgotPasswordEmail);
      setForgotPasswordSent(true);
      setSuccessMessage(`Password reset email sent to ${forgotPasswordEmail}. Please check your inbox.`);
      toast.success('Password reset email sent! Check your inbox.', {
        icon: '📧',
        duration: 5000,
      });
    } catch (error) {
      console.error('Reset password error:', error);
      setFormError(error.message);
      toast.error(error.message || 'Failed to send reset email.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTestPopup = () => {
    const testPopup = window.open('', '_blank', 'width=100,height=100,top=100,left=100');
    if (testPopup && !testPopup.closed) {
      testPopup.close();
      setShowPopupWarning(false);
      setFormError('');
      toast.success('Popups enabled! Try Google login again.', {
        icon: '👍',
      });
    } else {
      toast.error('Popups still blocked. Check your browser settings.', {
        icon: '⚠️',
      });
    }
  };

  const isLoading = formLoading || authLoading || googleLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="md:flex">
            {/* Left Side - Form */}
            <div className="md:w-1/2 p-8 md:p-12">
              {/* Logo */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                  <HiOutlineBuildingOffice2 size={28} className="text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  MarketMix
                </span>
              </div>
              
              {/* Success Message */}
              {successMessage && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-emerald-800">{successMessage}</p>
                </div>
              )}
              
              {/* Error Message */}
              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="text-red-600 mt-0.5" />
                    <p className="text-red-800">{formError}</p>
                  </div>
                </div>
              )}
              
              {/* Popup Warning */}
              {showPopupWarning && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 mb-2">
                    <strong>Popup blocked:</strong> Google login requires popups. Please allow popups for this site.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTestPopup}
                      className="px-3 py-1 bg-amber-600 text-white rounded text-sm"
                    >
                      Test Popups
                    </button>
                    <button
                      onClick={() => {
                        setShowPopupWarning(false);
                        setFormError('');
                      }}
                      className="px-3 py-1 border border-amber-600 text-amber-800 rounded text-sm"
                    >
                      Continue without Google
                    </button>
                  </div>
                </div>
              )}
              
              {/* Forgot Password Form */}
              {showForgotPassword && !forgotPasswordSent ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Reset Password</h3>
                  <p className="text-gray-600 mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <form onSubmit={handleForgotPassword}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                          <FaEnvelope className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                          disabled={isLoading}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isLoading || isOffline}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {formLoading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                          setFormError('');
                          setSuccessMessage('');
                        }}
                        className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : forgotPasswordSent ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Check Your Email</h3>
                  <p className="text-gray-600 mb-6">
                    We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>. 
                    Please check your inbox and follow the instructions.
                  </p>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setForgotPasswordSent(false);
                    }}
                    className="w-full px-4 py-3 border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50"
                  >
                    Back to Login
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Tab Switcher */}
                  <div className="flex border-b border-gray-200 mb-6">
                    <button
                      className={`flex-1 py-3 font-semibold ${activeTab === 'login' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('login')}
                    >
                      Log In
                    </button>
                    <button
                      className={`flex-1 py-3 font-semibold ${activeTab === 'register' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('register')}
                    >
                      Create Account
                    </button>
                  </div>
                  
                  {/* Google Login Button */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading || isOffline}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg mb-6 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FaGoogle className="text-blue-600" />
                    <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                  </button>
                  
                  <div className="flex items-center my-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="px-4 text-gray-500 text-sm">or continue with email</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* Forms */}
                  {activeTab === 'login' ? (
                    <form onSubmit={handleLogin}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaEnvelope className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                            required
                            placeholder="you@example.com"
                            disabled={isLoading || isOffline}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaLock className="text-gray-400" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={loginForm.password}
                            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                            required
                            placeholder="Enter your password"
                            disabled={isLoading || isOffline}
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-emerald-600 hover:text-emerald-700 mt-2"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isLoading || isOffline}
                        className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {formLoading ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Logging In...
                          </>
                        ) : 'Log In'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaUser className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={registerForm.name}
                            onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                            required
                            placeholder="John Doe"
                            disabled={isLoading || isOffline}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaEnvelope className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            value={registerForm.email}
                            onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                            required
                            placeholder="you@example.com"
                            disabled={isLoading || isOffline}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaPhone className="text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            value={registerForm.phone}
                            onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                            placeholder="+254 7XX XXX XXX"
                            disabled={isLoading || isOffline}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          I am looking to...
                        </label>
                        <select
                          value={registerForm.userType}
                          onChange={(e) => setRegisterForm({...registerForm, userType: e.target.value})}
                          disabled={isLoading || isOffline}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                        >
                          <option value="user">Regular User</option>
                          <option value="buyer">Buy a Property</option>
                          <option value="renter">Rent a Property</option>
                          <option value="seller">Sell/List a Property</option>
                          <option value="agent">Work as an Agent</option>
                          <option value="investor">Invest in Real Estate</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaLock className="text-gray-400" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={registerForm.password}
                            onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                            required
                            placeholder="At least 6 characters"
                            disabled={isLoading || isOffline}
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaLock className="text-gray-400" />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={registerForm.confirmPassword}
                            onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                            required
                            placeholder="Confirm your password"
                            disabled={isLoading || isOffline}
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                          </button>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isLoading || isOffline}
                        className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {formLoading ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Creating Account...
                          </>
                        ) : 'Create Account'}
                      </button>
                    </form>
                  )}
                  
                  <p className="text-sm text-gray-500 text-center mt-6">
                    By continuing, you agree to MarketMix's{' '}
                    <Link to="/terms" className="text-emerald-600 hover:text-emerald-700">Terms of Service</Link> and{' '}
                    <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700">Privacy Policy</Link>.
                  </p>
                </>
              )}
              
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  {activeTab === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    {activeTab === 'login' ? 'Sign up here' : 'Sign in here'}
                  </button>
                </p>
              </div>
            </div>

            {/* Right Side - Benefits */}
            <div className="md:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 md:p-12">
              <div className="h-full flex flex-col justify-center">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-4">Why Join MarketMix?</h2>
                  <p className="text-emerald-100 text-lg">
                    Become part of Kenya's fastest growing real estate community
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  {[
                    { icon: <FaCheckCircle className="w-6 h-6" />, title: 'Verified Properties', desc: 'All listings are thoroughly verified for authenticity' },
                    { icon: <FaCheckCircle className="w-6 h-6" />, title: 'Expert Agents', desc: 'Connect with certified real estate professionals' },
                    { icon: <FaCheckCircle className="w-6 h-6" />, title: 'Secure Transactions', desc: 'Safe and transparent buying/selling process' },
                    { icon: <FaCheckCircle className="w-6 h-6" />, title: 'Wide Selection', desc: '10,000+ properties across Kenya' },
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{benefit.title}</h3>
                        <p className="text-emerald-100 mt-1">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-emerald-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <FaHome className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">50,000+</p>
                      <p className="text-emerald-100">Happy Homeowners</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;