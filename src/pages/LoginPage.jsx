// src/pages/LoginPage.jsx - FIXED VERSION (Order of declarations fixed)
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { FaGoogle, FaEnvelope, FaLock, FaUser, FaPhone, FaEye, FaEyeSlash, FaCheckCircle, FaHome } from 'react-icons/fa';
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import toast from 'react-hot-toast';

// --- COLOR AND STYLE CONSTANTS ---
const PRIMARY_EMERALD = '#10B981';
const PRIMARY_EMERALD_DARK = '#059669';
const WHITE = '#ffffff';
const BG_LIGHT = '#f9fafb';
const GRAY_50 = '#f9fafb'; // MOVED UP HERE
const GRAY_200 = '#e5e7eb';
const GRAY_300 = '#d1d5db';
const GRAY_400 = '#9ca3af'; // MOVED UP HERE
const GRAY_500 = '#6b7280';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';

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
        background-image: url('https://images.unsplash.com/photo-1549517045-bc93de0e0293?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
        background-size: cover;
        background-position: center;
        
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

const SocialButton = styled.button`
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
    
    .icon {
        color: #ef4444;
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

const ForgotPasswordLink = styled(Link)`
    display: block;
    text-align: right;
    font-size: 0.875rem;
    color: ${PRIMARY_EMERALD};
    font-weight: 500;
    text-decoration: none;
    margin-top: 0.5rem;
    
    &:hover {
        color: ${PRIMARY_EMERALD_DARK};
        text-decoration: underline;
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

// --- REACT COMPONENT ---

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register: signup, loginWithGoogle, currentUser, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
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
      navigate('/');
    }
  }, [currentUser, navigate, searchParams]);

  const validateLoginForm = () => {
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
      toast.error(error.message || 'Login failed. Please check your credentials.');
      setFormError(error.message || 'Login failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateRegisterForm()) return;

    setFormLoading(true);
    try {
      const userData = {
        name: registerForm.name,
        phone: registerForm.phone || '',
        userType: registerForm.userType || 'buyer'
      };
      
      await signup(registerForm.email, registerForm.password, userData);
      toast.success('Account created successfully! Welcome to MarketMix! 🎉', {
        icon: '🏡',
        style: {
          borderRadius: '10px',
          background: '#363636',
          color: '#fff',
        },
      });
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
      setFormError(error.message || 'Registration failed');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setFormLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Logged in with Google!', {
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
      toast.error(error.message || 'Google login failed. Please try again.');
      setFormError(error.message || 'Google login failed');
    } finally {
      setFormLoading(false);
    }
  };

  const isLoading = formLoading || authLoading;

  return (
    <PageWrapper>
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
          
          {/* Error Message */}
          <ErrorMessage $show={!!formError}>
            {formError}
          </ErrorMessage>
          
          {/* Tab Switcher */}
          <TabSwitcher>
            <TabButton 
              $active={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
              disabled={isLoading}
            >
              Log In
            </TabButton>
            <TabButton 
              $active={activeTab === 'register'}
              onClick={() => setActiveTab('register')}
              disabled={isLoading}
            >
              Create Account
            </TabButton>
          </TabSwitcher>
          
          {/* Google Login */}
          <SocialButton onClick={handleGoogleLogin} disabled={isLoading}>
            <FaGoogle className="icon" />
            <span className="text">
              {isLoading ? 'Connecting...' : 'Continue with Google'}
            </span>
          </SocialButton>
          
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
              className="space-y-4"
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
                    disabled={isLoading}
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
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </InputWrapper>
                <ForgotPasswordLink to="/forgot-password">
                  Forgot Password?
                </ForgotPasswordLink>
              </FormGroup>
              
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Log In'}
              </PrimaryButton>
            </motion.form>
          ) : (
            <motion.form 
              key="register-form" 
              onSubmit={handleRegister} 
              className="space-y-4"
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </InputWrapper>
              </FormGroup>
              
              <FormGroup>
                <Label>
                  Phone Number
                </Label>
                <InputWrapper>
                  <div className="icon">
                    <FaPhone />
                  </div>
                  <FormInput 
                    type="tel" 
                    value={registerForm.phone} 
                    onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})} 
                    placeholder="+254 7XX XXX XXX"
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
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
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </InputWrapper>
              </FormGroup>
              
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </PrimaryButton>
            </motion.form>
          )}
          
          <TermsText>
            By continuing, you agree to MarketMix's{' '}
            <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </TermsText>
        </FormPanel>
        
        {/* Decorative Image Panel */}
        <ImagePanel>
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 className="text-4xl font-bold mb-6 leading-tight">
              {activeTab === 'login' ? 'Welcome Back!' : 'Find Your Dream Home'}
            </h3>
            <p className="text-white/95 text-xl mb-10 leading-relaxed">
              {activeTab === 'login'
                  ? 'Access your saved properties, track your inquiries, and get personalized recommendations.'
                  : 'Join thousands of satisfied customers in finding their perfect property.'}
            </p>
            
            <div className="space-y-6">
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
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaCheckCircle size={18} className="text-white" />
                  </div>
                  <span className="font-medium text-lg text-white/95">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center gap-3 text-white/80">
                <FaHome size={20} />
                <span className="text-lg">Trusted by 50,000+ homeowners since 2010</span>
              </div>
            </div>
          </div>
        </ImagePanel>
      </LoginContainer>
    </PageWrapper>
  );
};

export default LoginPage;