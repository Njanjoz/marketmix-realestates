// src/pages/RegisterPage.jsx - FINAL CLEAN VERSION (NO ROLE CONFUSION)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Home, Building, Briefcase, TrendingUp, Truck, Phone, Lock, Eye, EyeOff, CheckCircle,
} from 'lucide-react';
import { SIGNUP_ROLES } from '../constants/roles';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'buyer'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Roles from shared constant. Driver stays a normal user until approved.
  const userTypes = SIGNUP_ROLES;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptTerms) return toast.error('Accept terms');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!formData.name.trim()) return toast.error('Enter your name');
    if (!formData.email.includes('@')) return toast.error('Enter a valid email');

    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
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
          ? {
              driverIntent: true,
              driverStatus: 'pending',
              driverApproved: false,
            }
          : {}),
      };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <motion.div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">

        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Name"
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />

          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone (2547XXXXXXXX)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 pl-9 border rounded"
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              className="w-full p-2 pl-9 pr-9 border rounded"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
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
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              className="w-full p-2 pl-9 pr-9 border rounded"
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* USER TYPE */}
          <div className="grid grid-cols-2 gap-2">
            {userTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({...formData, userType: type.value})}
                className={`p-2 border rounded ${formData.userType === type.value ? 'bg-emerald-100' : ''}`}
              >
                <span className="flex items-center gap-1 justify-center">
                  {type.icon === 'truck' ? <Truck className="w-4 h-4" /> :
                   type.icon === 'home' ? <Home className="w-4 h-4" /> :
                   type.icon === 'building' ? <Building className="w-4 h-4" /> :
                   type.icon === 'briefcase' ? <Briefcase className="w-4 h-4" /> :
                   type.icon === 'trending' ? <TrendingUp className="w-4 h-4" /> : null}
                  {type.label}
                </span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" onChange={(e)=>setAcceptTerms(e.target.checked)} />
            Accept Terms
          </label>

          <button className="w-full bg-emerald-600 text-white p-2 rounded">
            Create Account
          </button>
        </form>

        <p className="text-center mt-4">
          Already have account? <Link to="/login">Login</Link>
        </p>

      </motion.div>
    </div>
  );
};

export default RegisterPage;