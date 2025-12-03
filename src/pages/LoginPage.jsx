// src/pages/LoginPage.jsx - STYLED COMPONENTS VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext'; // Assuming context exists
import { FaGoogle, FaEnvelope, FaLock, FaUser, FaPhone, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

// --- COLOR AND STYLE CONSTANTS ---
const PRIMARY_BLUE = '#0284c7'; 
const PRIMARY_DARK = '#0c4a6e';
const WHITE = '#ffffff';
const BG_LIGHT = '#f9fafb';
const GRAY_300 = '#d1d5db';
const GRAY_500 = '#6b7280';
const GRAY_700 = '#374151';

// --- STYLED COMPONENTS ---

const PageWrapper = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: ${BG_LIGHT};
`;

const LoginContainer = styled(motion.div)`
    display: flex;
    max-width: 72rem; /* max-w-6xl */
    width: 100%;
    border-radius: 1.5rem;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    min-height: 40rem; /* h-auto on mobile, fixed height on desktop */
`;

const ImagePanel = styled.div`
    display: none;
    @media (min-width: 1024px) {
        display: block;
        flex: 1;
        background: linear-gradient(to bottom right, ${PRIMARY_DARK}, ${PRIMARY_BLUE});
        padding: 3rem;
        color: ${WHITE};
        position: relative;
        background-image: url('https://images.unsplash.com/photo-1549517045-bc93de0e0293?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
        background-size: cover;
        background-position: center;
        
        &::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom right, rgba(12, 74, 110, 0.8), rgba(2, 132, 199, 0.8));
        }
    }
`;

const FormPanel = styled.div`
    flex: 1;
    background-color: ${WHITE};
    padding: 2rem;
    @media (min-width: 1024px) {
        padding: 4rem;
    }
`;

const TabSwitcher = styled.div`
    display: flex;
    border-bottom: 2px solid ${GRAY_300};
    margin-bottom: 2rem;
`;

const TabButton = styled.button`
    flex: 1;
    padding: 1rem 0;
    text-align: center;
    font-weight: 600;
    transition: all 200ms;
    
    ${props => props.active ? `
        color: ${PRIMARY_BLUE};
        border-bottom: 2px solid ${PRIMARY_BLUE};
    ` : `
        color: ${GRAY_500};
        border-bottom: 2px solid transparent;
        &:hover {
            color: ${GRAY_700};
        }
    `}
`;

const SocialButton = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.75rem;
    transition: background-color 200ms;
    margin-bottom: 1.5rem;
    
    &:hover {
        background-color: ${BG_LIGHT};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .icon {
        color: #ef4444; /* red-500 for Google */
        font-size: 1.25rem;
    }
    
    .text {
        font-weight: 500;
    }
`;

const FormGroup = styled.div`
    margin-bottom: 1rem;
`;

const InputWrapper = styled.div`
    position: relative;
`;

const Icon = styled.div`
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af; /* gray-400 */
`;

const FormInput = styled.input`
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 3rem; /* pl-12 */
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    background-color: #f9fafb; /* gray-50 */
    
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
        box-shadow: 0 0 0 1px ${PRIMARY_BLUE};
        background-color: ${WHITE};
    }
`;

const UserTypeSelect = styled.select`
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    background-color: #f9fafb;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1.5em 1.5em;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
        box-shadow: 0 0 0 1px ${PRIMARY_BLUE};
        background-color: ${WHITE};
    }
`;

const PrimaryButton = styled.button`
    width: 100%;
    background-color: ${PRIMARY_BLUE};
    color: ${WHITE};
    padding: 1rem;
    border-radius: 0.75rem;
    font-weight: 700;
    margin-top: 1rem;
    transition: background-color 200ms;
    
    &:hover {
        background-color: ${PRIMARY_DARK};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

// --- REACT COMPONENT ---

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Mock implementations for useAuth hooks
  const useAuth = () => ({
    login: async (email, password) => {
        // Mock API call
        if (email === 'test@example.com' && password === 'password') {
            return { success: true };
        }
        return { success: false, error: 'Invalid credentials' };
    },
    signup: async (email, password, userData) => {
        // Mock API call
        if (email.includes('error')) {
            return { success: false, error: 'Email already in use' };
        }
        return { success: true };
    },
    loginWithGoogle: async () => ({ success: true }),
    currentUser: null // Mock: assuming user is not logged in initially
  });
    
  const { login, signup, loginWithGoogle, currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
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

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'register') {
      setActiveTab('register');
    }
    
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate, searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(loginForm.email, loginForm.password);
    if (result.success) {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const userData = {
      displayName: registerForm.name,
      userType: registerForm.userType,
      phoneNumber: registerForm.phone
    };
    const result = await signup(registerForm.email, registerForm.password, userData);
    if (result.success) {
      toast.success('Account created successfully! Logging you in...');
      // Auto-login logic (if supported by auth system)
      navigate('/dashboard'); 
    } else {
      toast.error(result.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    if (result.success) {
        toast.success('Logged in with Google!');
        navigate('/dashboard');
    } else {
        toast.error(result.error || 'Google login failed.');
    }
    setLoading(false);
  };

  return (
    <PageWrapper>
      <LoginContainer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <FormPanel>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Welcome to MarketMix</h2>
            <p className="text-gray-500">Your trusted real estate partner</p>
          </div>
          
          {/* Tab Switcher */}
          <TabSwitcher>
            <TabButton active={activeTab === 'login'} onClick={() => setActiveTab('login')}>
              Log In
            </TabButton>
            <TabButton active={activeTab === 'register'} onClick={() => setActiveTab('register')}>
              Create Account
            </TabButton>
          </TabSwitcher>
          
          {/* Google Login */}
          <SocialButton onClick={handleGoogleLogin} disabled={loading}>
            <FaGoogle className="icon" />
            <span className="text">Continue with Google</span>
          </SocialButton>
          
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-4 text-gray-500">or continue with email</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Forms */}
          {activeTab === 'login' ? (
            <motion.form 
              key="login-form" 
              onSubmit={handleLogin} 
              className="space-y-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <InputWrapper>
                  <Icon><FaEnvelope /></Icon>
                  <FormInput 
                    type="email" 
                    value={loginForm.email} 
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})} 
                    required 
                    placeholder="you@example.com"
                  />
                </InputWrapper>
              </FormGroup>
              
              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <InputWrapper>
                  <Icon><FaLock /></Icon>
                  <FormInput 
                    type={showPassword ? 'text' : 'password'} 
                    value={loginForm.password} 
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                    required 
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </InputWrapper>
                <div className="text-right mt-2">
                    <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Forgot Password?</a>
                </div>
              </FormGroup>
              
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Logging In...' : 'Log In'}
              </PrimaryButton>
            </motion.form>
          ) : (
            <motion.form 
              key="register-form" 
              onSubmit={handleRegister} 
              className="space-y-4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <InputWrapper>
                  <Icon><FaUser /></Icon>
                  <FormInput 
                    type="text" 
                    value={registerForm.name} 
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})} 
                    required 
                    placeholder="John Doe"
                  />
                </InputWrapper>
              </FormGroup>
              
              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <InputWrapper>
                  <Icon><FaEnvelope /></Icon>
                  <FormInput 
                    type="email" 
                    value={registerForm.email} 
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} 
                    required 
                    placeholder="you@example.com"
                  />
                </InputWrapper>
              </FormGroup>
              
              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <InputWrapper>
                  <Icon><FaPhone /></Icon>
                  <FormInput 
                    type="tel" 
                    value={registerForm.phone} 
                    onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})} 
                    required 
                    placeholder="+254 7XX XXX XXX"
                  />
                </InputWrapper>
              </FormGroup>
              
              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                <UserTypeSelect 
                    value={registerForm.userType} 
                    onChange={(e) => setRegisterForm({...registerForm, userType: e.target.value})}
                >
                    <option value="buyer">I am a Buyer/Tenant</option>
                    <option value="seller">I am a Seller/Landlord</option>
                    <option value="agent">I am an Agent (Requires verification)</option>
                </UserTypeSelect>
              </FormGroup>

              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password (min 6 characters)</label>
                <InputWrapper>
                  <Icon><FaLock /></Icon>
                  <FormInput 
                    type={showPassword ? 'text' : 'password'} 
                    value={registerForm.password} 
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} 
                    required 
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </InputWrapper>
              </FormGroup>
              
              <FormGroup>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <InputWrapper>
                  <Icon><FaLock /></Icon>
                  <FormInput 
                    type="password" 
                    value={registerForm.confirmPassword} 
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})} 
                    required 
                    placeholder="••••••••"
                  />
                </InputWrapper>
              </FormGroup>
              
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </PrimaryButton>
            </motion.form>
          )}
        </FormPanel>
        
        {/* Decorative Image Panel */}
        <ImagePanel>
          <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
            <h3 className="text-3xl font-bold mb-4">
              {activeTab === 'login' ? 'Welcome Back!' : 'Start Your Journey'}
            </h3>
            <p className="text-white/90 text-xl mb-10">
              {activeTab === 'login'
                  ? 'Sign in to access your saved properties, inquiries, and personalized recommendations.'
                  : 'Create an account to save properties, contact agents, and get personalized property alerts.'}
            </p>
            
            <div className="space-y-4 text-left">
              {[
                "Browse thousands of properties",
                "Save properties to your favorites",
                "Connect with expert agents",
                "Get personalized property alerts"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <FaCheckCircle size={14} className="text-white" />
                  </div>
                  <span className="font-medium text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </ImagePanel>
      </LoginContainer>
    </PageWrapper>
  );
};

export default LoginPage;