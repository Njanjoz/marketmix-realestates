// src/pages/RegisterPage.jsx — FINAL (driver option, phone, validation, shared roles)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Home, Building, Briefcase, TrendingUp, Truck, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { SIGNUP_ROLES } from '../constants/roles';
import toast from 'react-hot-toast';

const iconFor = (name) => {
  const cls = 'w-4 h-4';
  if (name === 'home') return <Home className={cls} />;
  if (name === 'building') return <Building className={cls} />;
  if (name === 'briefcase') return <Briefcase className={cls} />;
  if (name === 'trending') return <TrendingUp className={cls} />;
  if (name === 'truck') return <Truck className={cls} />;
  return null;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'buyer',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const userTypes = SIGNUP_ROLES;

  const formatKenyanPhone = (raw) => {
    let d = String(raw || '').replace(/\D/g, '');
    // strip leading country code form
    if (d.startsWith('0')) d = '254' + d.slice(1);
    if (d && !d.startsWith('254')) d = '254' + d;
    return d.slice(0, 12);
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed up with Google!');
      // onAuthStateChanged will create the user doc with defaults (buyer).
      // Users who want a different role can switch from Profile.
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Google sign-up failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptTerms) return toast.error('Accept terms');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!formData.name.trim()) return toast.error('Enter your name');
    if (!formData.email.includes('@')) return toast.error('Enter a valid email');

    const phoneDigits = formatKenyanPhone(formData.phone);
    if (!/^(2547|2541)\d{8}$/.test(phoneDigits)) {
      return toast.error('Enter phone as 2547XXXXXXXX');
    }

    try {
      const chosen = userTypes.find((t) => t.value === formData.userType) || userTypes[0];
      const isDriverIntent = chosen.value === 'driver';

      const userData = {
        name: formData.name.trim(),
        phone: phoneDigits,
        userType: chosen.userType,
        role: chosen.storedRole,
        ...(isDriverIntent
          ? { driverIntent: true, driverStatus: 'pending', driverApproved: false }
          : {}),
      };

      await register(formData.email, formData.password, userData);

      toast.success('Account created!');
      if (isDriverIntent) {
        navigate('/driver/onboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <motion.div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C41 35.6 44 30.3 44 24c0-1.2-.1-2.3-.4-3.5z"/>
          </svg>
          {googleLoading ? 'Signing up…' : 'Continue with Google'}
        </button>

        <div className="flex items-center my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone (2547XXXXXXXX)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatKenyanPhone(e.target.value) })}
              inputMode="numeric"
              className="w-full p-2 pl-9 border rounded"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2 pl-9 pr-9 border rounded"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full p-2 pl-9 pr-9 border rounded"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {userTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, userType: type.value })}
                className={`flex items-center justify-center gap-1 p-2 border rounded text-sm ${
                  formData.userType === type.value ? 'bg-emerald-100 border-emerald-500' : ''
                }`}
              >
                {iconFor(type.icon)}
                {type.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            Accept Terms
          </label>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700"
          >
            Create Account
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Already have account? <Link to="/login" className="text-emerald-600">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
