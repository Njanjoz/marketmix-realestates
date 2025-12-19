import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
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

// --- COLOR AND STYLE CONSTANTS ---
const PRIMARY_EMERALD = '#10B981';
const PRIMARY_EMERALD_DARK = '#059669';
const WHITE = '#ffffff';
const BG_LIGHT = '#f9fafb';
const GRAY_50 = '#f9fafb';
const GRAY_100 = '#f3f4f6'; // ADDED THIS
const GRAY_200 = '#e5e7eb';
const GRAY_300 = '#d1d5db';
const GRAY_400 = '#9ca3af';
const GRAY_500 = '#6b7280';
const GRAY_600 = '#4b5563';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';
const GOOGLE_BLUE = '#4285F4';
const GOOGLE_BLUE_DARK = '#3367D6';

// --- STYLED COMPONENTS ---
const PageWrapper = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
            radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.1) 0%, transparent 50%);
        pointer-events: none;
    }
`;

const LoginContainer = styled(motion.div)`
    display: flex;
    max-width: 72rem;
    width: 100%;
    border-radius: 2rem;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    min-height: 40rem;
    background: ${WHITE};
    position: relative;
    z-index: 1;
`;

const ImagePanel = styled.div`
    display: none;
    @media (min-width: 1024px) {
        display: block;
        flex: 1;
        background: linear-gradient(135deg, ${PRIMARY_EMERALD_DARK}, ${PRIMARY_EMERALD});
        padding: 3rem;
        color: ${WHITE};
        position: relative;
        
        &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(5, 150, 105, 0.9), rgba(16, 185, 129, 0.9));
        }
    }
`;

const FormPanel = styled.div`
    flex: 1;
    background-color: ${WHITE};
    padding: 2rem;
    display: flex;
    flex-direction: column;
    @media (min-width: 1024px) {
        padding: 4rem;
    }
`;

const LogoContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
    
    .logo-icon {
        background: linear-gradient(135deg, ${PRIMARY_EMERALD}, ${PRIMARY_EMERALD_DARK});
        padding: 0.75rem;
        border-radius: 0.75rem;
        color: ${WHITE};
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .logo-text {
        font-size: 1.75rem;
        font-weight: 800;
        background: linear-gradient(135deg, ${PRIMARY_EMERALD}, ${PRIMARY_EMERALD_DARK});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
`;

const TabSwitcher = styled.div`
    display: flex;
    border-bottom: 2px solid ${GRAY_200};
    margin-bottom: 2rem;
    background: ${WHITE};
    border-radius: 0.75rem 0.75rem 0 0;
    overflow: hidden;
`;

const TabButton = styled.button`
    flex: 1;
    padding: 1rem 0;
    text-align: center;
    font-weight: 600;
    transition: all 200ms;
    border: none;
    background: ${props => props.$active ? WHITE : 'transparent'};
    color: ${props => props.$active ? PRIMARY_EMERALD : GRAY_500};
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: ${props => props.$active ? PRIMARY_EMERALD : 'transparent'};
        transition: all 200ms;
    }
    
    &:hover {
        color: ${props => props.$active ? PRIMARY_EMERALD_DARK : GRAY_700};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const GoogleButton = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.75rem;
    transition: all 200ms;
    margin-bottom: 1.5rem;
    background: ${WHITE};
    font-weight: 500;
    color: ${GRAY_700};
    
    &:hover:not(:disabled) {
        background-color: ${GRAY_50};
        border-color: ${GRAY_400};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .google-icon-wrapper {
        background: white;
        border-radius: 2px;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid ${GRAY_300};
    }
    
    .google-icon {
        color: ${GOOGLE_BLUE};
        font-size: 1.25rem;
    }
`;

const Divider = styled.div`
    display: flex;
    align-items: center;
    margin: 2rem 0;
    
    .line {
        flex: 1;
        height: 1px;
        background: ${GRAY_200};
    }
    
    .text {
        padding: 0 1rem;
        color: ${GRAY_500};
        font-size: 0.875rem;
        font-weight: 500;
    }
`;

const FormGroup = styled.div`
    margin-bottom: 1.5rem;
`;

const Label = styled.label`
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${GRAY_700};
    margin-bottom: 0.5rem;
    
    .required {
        color: #ef4444;
        margin-left: 2px;
    }
`;

const InputWrapper = styled.div`
    position: relative;
    
    .icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: ${GRAY_500};
        z-index: 1;
    }
    
    .toggle-password {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: ${GRAY_500};
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
            color: ${GRAY_700};
        }
        
        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
`;

const FormInput = styled.input`
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.75rem;
    background-color: ${WHITE};
    font-size: 1rem;
    color: ${GRAY_900};
    transition: all 200ms;
    
    &:focus {
        outline: none;
        border-color: ${PRIMARY_EMERALD};
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    
    &:disabled {
        background-color: ${GRAY_50};
        cursor: not-allowed;
    }
    
    &::placeholder {
        color: ${GRAY_400};
    }
`;

const SelectWrapper = styled.div`
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid ${GRAY_500};
        pointer-events: none;
    }
`;

const Select = styled.select`
    width: 100%;
    padding: 0.875rem 3rem 0.875rem 1rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.75rem;
    background-color: ${WHITE};
    font-size: 1rem;
    color: ${GRAY_900};
    appearance: none;
    cursor: pointer;
    transition: all 200ms;
    
    &:focus {
        outline: none;
        border-color: ${PRIMARY_EMERALD};
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    
    &:disabled {
        background-color: ${GRAY_50};
        cursor: not-allowed;
    }
`;

const PrimaryButton = styled.button`
    width: 100%;
    background: linear-gradient(135deg, ${PRIMARY_EMERALD}, ${PRIMARY_EMERALD_DARK});
    color: ${WHITE};
    padding: 1rem;
    border-radius: 0.75rem;
    font-weight: 700;
    font-size: 1rem;
    border: none;
    cursor: pointer;
    transition: all 200ms;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    
    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
    }
    
    &:active:not(:disabled) {
        transform: translateY(0);
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ForgotPasswordLink = styled.button`
    display: block;
    text-align: right;
    font-size: 0.875rem;
    color: ${PRIMARY_EMERALD};
    font-weight: 500;
    background: none;
    border: none;
    margin-top: 0.5rem;
    cursor: pointer;
    
    &:hover {
        color: ${PRIMARY_EMERALD_DARK};
        text-decoration: underline;
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const TermsText = styled.p`
    font-size: 0.75rem;
    color: ${GRAY_500};
    text-align: center;
    margin-top: 2rem;
    line-height: 1.5;
    
    a {
        color: ${PRIMARY_EMERALD};
        text-decoration: none;
        font-weight: 500;
        
        &:hover {
            text-decoration: underline;
        }
    }
`;

const ErrorMessage = styled.div`
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    display: ${props => props.$show ? 'block' : 'none'};
`;

const SuccessMessage = styled.div`
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #059669;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
    display: ${props => props.$show ? 'block' : 'none'};
`;

const LoadingOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    
    .loading-content {
        background: ${WHITE};
        padding: 2rem;
        border-radius: 1rem;
        text-align: center;
        max-width: 400px;
        width: 90%;
    }
    
    .spinner {
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;

const PopupWarning = styled.div`
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    color: #92400e;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    
    p {
        margin: 0 0 0.5rem 0;
    }
    
    button {
        padding: 0.5rem 1rem;
        background-color: #f59e0b;
        color: white;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.75rem;
        transition: background-color 200ms;
        
        &:hover {
            background-color: #d97706;
        }
    }
`;

// --- REACT COMPONENT ---

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    currentUser, 
    loading: authLoading, 
    authError,
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
    userType: 'buyer'
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

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register') {
      setActiveTab('register');
    }
    
    if (currentUser) {
      navigate('/');
    }
    
    // Clear messages when switching tabs
    setFormError('');
    setSuccessMessage('');
  }, [currentUser, navigate, searchParams]);

  // Handle offline mode
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
      navigate('/');
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
        userType: registerForm.userType || 'buyer'
      };
      
      await signup(registerForm.email, registerForm.password, userData);
      
      // Success - show verification message
      toast.success('Account created successfully! Please check your email to verify your account.', {
        icon: '🎉',
        duration: 6000,
        style: {
          borderRadius: '10px',
          background: '#363636',
          color: '#fff',
        },
      });
      
      setSuccessMessage(`
        Registration successful! Please check your email (${registerForm.email}) 
        to verify your account. After verification, you can log in.
      `);
      
      // Clear form
      setRegisterForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        userType: 'buyer'
      });
      
      // Switch to login tab after 5 seconds
      setTimeout(() => {
        setActiveTab('login');
        setSuccessMessage('');
      }, 5000);
      
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
      // Try popup method first
      await loginWithGoogle();
      toast.success('Successfully logged in with Google!', {
        icon: '✅',
        style: {
          borderRadius: '10px',
          background: '#363636',
          color: '#fff',
        },
      });
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      
      // Handle specific error cases
      if (error.message.includes('popup') || error.code === 'auth/popup-blocked') {
        setShowPopupWarning(true);
        setFormError('Popup blocked. Please allow popups for this site and try again.');
        
        // Show instructions
        toast(
          (t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p>To allow popups:</p>
              <ol style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
                <li>Click the lock icon in your address bar</li>
                <li>Find "Pop-ups and redirects"</li>
                <li>Change to "Allow"</li>
              </ol>
              <button 
                onClick={() => toast.dismiss(t.id)}
                style={{
                  padding: '0.5rem',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Got it
              </button>
            </div>
          ),
          { duration: 10000 }
        );
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

  const isLoading = formLoading || authLoading;

  return (
    <PageWrapper>
      {/* Offline Warning */}
      {isOffline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '0.5rem',
          textAlign: 'center',
          zIndex: 1001,
          fontSize: '0.875rem'
        }}>
          ⚠️ You are offline. Some features may not work properly.
        </div>
      )}
      
      {/* Google Loading Overlay */}
      {googleLoading && (
        <LoadingOverlay>
          <div className="loading-content">
            <FaSpinner className="spinner" size={40} color={GOOGLE_BLUE} />
            <h3 style={{ marginBottom: '0.5rem', color: GRAY_900 }}>Connecting to Google...</h3>
            <p style={{ color: GRAY_600 }}>Please wait while we authenticate with Google.</p>
          </div>
        </LoadingOverlay>
      )}
      
      <LoginContainer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FormPanel>
          {/* Logo */}
          <LogoContainer>
            <div className="logo-icon">
              <HiOutlineBuildingOffice2 size={28} />
            </div>
            <span className="logo-text">MarketMix</span>
          </LogoContainer>
          
          {/* Success Message */}
          <SuccessMessage $show={!!successMessage}>
            {successMessage}
          </SuccessMessage>
          
          {/* Error Message */}
          <ErrorMessage $show={!!formError}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <FaExclamationTriangle style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          </ErrorMessage>
          
          {/* Popup Warning */}
          {showPopupWarning && (
            <PopupWarning>
              <p>
                <strong>Popup blocked:</strong> Google login requires popups. Please allow popups for this site.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={handleTestPopup}>
                  Test Popups
                </button>
                <button
                  onClick={() => {
                    setShowPopupWarning(false);
                    setFormError('');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #f59e0b',
                    color: '#92400e'
                  }}
                >
                  Continue without Google
                </button>
              </div>
            </PopupWarning>
          )}
          
          {/* Forgot Password Form */}
          {showForgotPassword && !forgotPasswordSent ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 style={{ marginBottom: '1rem', color: GRAY_900 }}>Reset Password</h3>
              <p style={{ marginBottom: '1.5rem', color: GRAY_600 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleForgotPassword}>
                <FormGroup>
                  <Label>Email Address <span className="required">*</span></Label>
                  <InputWrapper>
                    <div className="icon">
                      <FaEnvelope />
                    </div>
                    <FormInput 
                      type="email" 
                      value={forgotPasswordEmail} 
                      onChange={(e) => setForgotPasswordEmail(e.target.value)} 
                      required 
                      placeholder="you@example.com"
                      disabled={isLoading || googleLoading}
                    />
                  </InputWrapper>
                </FormGroup>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <PrimaryButton 
                    type="submit" 
                    disabled={isLoading || googleLoading || isOffline}
                    style={{ flex: 1 }}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordEmail('');
                      setFormError('');
                      setSuccessMessage('');
                    }}
                    style={{
                      padding: '1rem',
                      border: `1px solid ${GRAY_300}`,
                      borderRadius: '0.75rem',
                      background: 'transparent',
                      color: GRAY_700,
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                    disabled={isLoading || googleLoading}
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
              <h3 style={{ marginBottom: '1rem', color: GRAY_900 }}>Check Your Email</h3>
              <p style={{ marginBottom: '1.5rem', color: GRAY_600 }}>
                We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>. 
                Please check your inbox and follow the instructions.
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail('');
                  setForgotPasswordSent(false);
                  setFormError('');
                  setSuccessMessage('');
                }}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'transparent',
                  border: `2px solid ${PRIMARY_EMERALD}`,
                  borderRadius: '0.75rem',
                  color: PRIMARY_EMERALD,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <>
              {/* Tab Switcher */}
              <TabSwitcher>
                <TabButton 
                  $active={activeTab === 'login'}
                  onClick={() => {
                    setActiveTab('login');
                    setFormError('');
                    setSuccessMessage('');
                  }}
                  disabled={isLoading || googleLoading}
                >
                  Log In
                </TabButton>
                <TabButton 
                  $active={activeTab === 'register'}
                  onClick={() => {
                    setActiveTab('register');
                    setFormError('');
                    setSuccessMessage('');
                  }}
                  disabled={isLoading || googleLoading}
                >
                  Create Account
                </TabButton>
              </TabSwitcher>
              
              {/* Google Login Button */}
              <GoogleButton 
                onClick={handleGoogleLogin} 
                disabled={isLoading || googleLoading || isOffline}
                style={{
                  backgroundColor: googleLoading ? GRAY_100 : WHITE
                }}
              >
                <div className="google-icon-wrapper">
                  <FaGoogle className="google-icon" />
                </div>
                <span className="text">
                  {googleLoading ? 'Connecting...' : 'Continue with Google'}
                </span>
              </GoogleButton>
              
              <Divider>
                <div className="line"></div>
                <div className="text">or continue with email</div>
                <div className="line"></div>
              </Divider>

              {/* Forms */}
              {activeTab === 'login' ? (
                <motion.form 
                  key="login-form" 
                  onSubmit={handleLogin} 
                  style={{ width: '100%' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <FormGroup>
                    <Label>
                      Email Address <span className="required">*</span>
                    </Label>
                    <InputWrapper>
                      <div className="icon">
                        <FaEnvelope />
                      </div>
                      <FormInput 
                        type="email" 
                        value={loginForm.email} 
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} 
                        required 
                        placeholder="you@example.com"
                        disabled={isLoading || googleLoading || isOffline}
                      />
                    </InputWrapper>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>
                      Password <span className="required">*</span>
                    </Label>
                    <InputWrapper>
                      <div className="icon">
                        <FaLock />
                      </div>
                      <FormInput 
                        type={showPassword ? 'text' : 'password'} 
                        value={loginForm.password} 
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                        required 
                        placeholder="Enter your password"
                        disabled={isLoading || googleLoading || isOffline}
                      />
                      <button 
                        type="button" 
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || googleLoading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </InputWrapper>
                    <ForgotPasswordLink
                      onClick={() => setShowForgotPassword(true)}
                      disabled={isLoading || googleLoading || isOffline}
                    >
                      Forgot Password?
                    </ForgotPasswordLink>
                  </FormGroup>
                  
                  <PrimaryButton 
                    type="submit" 
                    disabled={isLoading || googleLoading || isOffline}
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="spinner" />
                        Logging In...
                      </>
                    ) : 'Log In'}
                  </PrimaryButton>
                </motion.form>
              ) : (
                <motion.form 
                  key="register-form" 
                  onSubmit={handleRegister} 
                  style={{ width: '100%' }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <FormGroup>
                    <Label>
                      Full Name <span className="required">*</span>
                    </Label>
                    <InputWrapper>
                      <div className="icon">
                        <FaUser />
                      </div>
                      <FormInput 
                        type="text" 
                        value={registerForm.name} 
                        onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})} 
                        required 
                        placeholder="John Doe"
                        disabled={isLoading || googleLoading || isOffline}
                      />
                    </InputWrapper>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>
                      Email Address <span className="required">*</span>
                    </Label>
                    <InputWrapper>
                      <div className="icon">
                        <FaEnvelope />
                      </div>
                      <FormInput 
                        type="email" 
                        value={registerForm.email} 
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} 
                        required 
                        placeholder="you@example.com"
                        disabled={isLoading || googleLoading || isOffline}
                      />
                    </InputWrapper>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>
                      Phone Number (Optional)
                    </Label>
                    <InputWrapper>
                      <div className="icon">
                        <FaPhone />
                      </div>
                      <FormInput 
                        type="tel" 
                        value={registerForm.phone} 
                        onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})} 
                        placeholder="+1 (555) 123-4567"
                        disabled={isLoading || googleLoading || isOffline}
                      />
                    </InputWrapper>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>
                      I am looking to...
                    </Label>
                    <SelectWrapper>
                      <Select 
                        value={registerForm.userType} 
                        onChange={(e) => setRegisterForm({...registerForm, userType: e.target.value})}
                        disabled={isLoading || googleLoading || isOffline}
                      >
                        <option value="buyer">Buy a Property</option>
                        <option value="renter">Rent a Property</option>
                        <option value="seller">Sell/List a Property</option>
                        <option value="agent">Work as an Agent</option>
                        <option value="investor">Invest in Real Estate</option>
                      </Select>
                    </SelectWrapper>
                  </FormGroup>

                  <FormGroup>
                    <Label>
                      Password <span className="required">*</span>
                    </Label>
                    <InputWrapper>
                      <div className="icon">
                        <FaLock />
                      </div>
                      <FormInput 
                        type={showPassword ? 'text' : 'password'} 
                        value={registerForm.password} 
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} 
                        required 
                        placeholder="At least 6 characters"
                        disabled={isLoading || googleLoading || isOffline}
                      />
                      <button 
                        type="button" 
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || googleLoading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </InputWrapper>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>
                      Confirm Password <span className="required">*</span>
                    </Label>
                    <InputWrapper>
                      <div className="icon">
                        <FaLock />
                      </div>
                      <FormInput 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        value={registerForm.confirmPassword} 
                        onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})} 
                        required 
                        placeholder="Confirm your password"
                        disabled={isLoading || googleLoading || isOffline}
                      />
                      <button 
                        type="button" 
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading || googleLoading}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </InputWrapper>
                  </FormGroup>
                  
                  <PrimaryButton 
                    type="submit" 
                    disabled={isLoading || googleLoading || isOffline}
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="spinner" />
                        Creating Account...
                      </>
                    ) : 'Create Account'}
                  </PrimaryButton>
                </motion.form>
              )}
              
              <TermsText>
                By continuing, you agree to MarketMix's{' '}
                <Link to="/terms">Terms of Service</Link> and{' '}
                <Link to="/privacy">Privacy Policy</Link>.
              </TermsText>
            </>
          )}
        </FormPanel>
        
        {/* Decorative Image Panel */}
        <ImagePanel>
          <div style={{ 
            position: 'relative', 
            zIndex: 1, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <h3 style={{ 
              fontSize: '2.25rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem', 
              lineHeight: '1.2',
              color: WHITE
            }}>
              {activeTab === 'login' ? 'Welcome Back!' : 'Find Your Dream Home'}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              fontSize: '1.25rem', 
              marginBottom: '2.5rem', 
              lineHeight: '1.6' 
            }}>
              {activeTab === 'login'
                  ? 'Access your saved properties, track your inquiries, and get personalized recommendations.'
                  : 'Join thousands of satisfied customers in finding their perfect property.'}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {activeTab === 'login' ? [
                "Track property inquiries in real-time",
                "Access saved properties anywhere",
                "Get instant price drop alerts",
                "Connect with verified agents"
              ] : [
                "Browse 10,000+ verified properties",
                "Save and compare your favorites",
                "Schedule viewings with one click",
                "Get expert advice from our agents"
              ].map((benefit, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <FaCheckCircle size={18} style={{ color: 'white' }} />
                  </div>
                  <span style={{ fontWeight: '500', fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.95)' }}>
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                <FaHome size={20} />
                <span style={{ fontSize: '1.125rem' }}>Trusted by 50,000+ homeowners since 2010</span>
              </div>
            </div>
          </div>
        </ImagePanel>
      </LoginContainer>
    </PageWrapper>
  );
};

export default LoginPage;