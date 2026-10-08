// src/pages/RegisterPage.jsx - FINAL CLEAN VERSION (NO ROLE CONFUSION)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  Home, User, Mail, Lock, Phone, Eye, EyeOff, 
  CheckCircle, Building, Briefcase, TrendingUp,
  ArrowRight, Shield, Star
} from 'lucide-react';
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

  // ✅ ROLE MAP (SINGLE SOURCE OF TRUTH)
  const roleMap = {
    buyer: 'user',
    seller: 'seller',
    landlord: 'seller',
    agent: 'agent',
    investor: 'investor'
  };

  const userTypes = [
    { value: 'buyer', label: 'Buyer/Tenant', icon: <Home className="w-4 h-4" /> },
    { value: 'seller', label: 'Seller/Landlord', icon: <Building className="w-4 h-4" /> },
    { value: 'agent', label: 'Real Estate Agent', icon: <Briefcase className="w-4 h-4" /> },
    { value: 'investor', label: 'Investor', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptTerms) return toast.error('Accept terms');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    try {
      const userData = {
        name: formData.name,
        phone: formData.phone,
        userType: formData.userType,
        role: roleMap[formData.userType] || 'user'
      };

      await register(formData.email, formData.password, userData);

      toast.success('Account created!');
      navigate('/dashboard');

    } catch (err) {
      toast.error(err.message);
    }
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

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          />

          {/* USER TYPE */}
          <div className="grid grid-cols-2 gap-2">
            {userTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({...formData, userType: type.value})}
                className={`p-2 border rounded ${formData.userType === type.value ? 'bg-emerald-100' : ''}`}
              >
                {type.label}
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