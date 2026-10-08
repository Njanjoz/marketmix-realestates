// src/pages/user/ProfilePage.jsx - FINAL WORKING VERSION
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Shield, Briefcase, Home, Save, ArrowLeft, Building, TrendingUp, MapPin, Edit2, X, LogOut, RefreshCw, AlertTriangle, Repeat, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserProfile, loading, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    userType: '',
    location: '',
  });

  useEffect(() => {
    if (currentUser && userProfile) {
      setFormData({
        name: userProfile.name || currentUser.displayName || '',
        email: currentUser.email || '',
        phone: userProfile.phone || '',
        role: userProfile.role || 'user',
        userType: userProfile.userType || 'user',
        location: userProfile.location || '',
      });
    }
  }, [currentUser, userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile(formData);
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const handleRoleChange = async (newRole, newUserType) => {
    if (!currentUser) {
      toast.error('No user logged in');
      return;
    }
    
    setIsSwitching(true);
    
    try {
      // Direct Firestore update
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        role: newRole,
        userType: newUserType,
        updatedAt: serverTimestamp(),
      });
      
      // Update context
      await updateUserProfile({ role: newRole, userType: newUserType });
      
      toast.success(`Switched to ${getRoleLabel(newRole)}!`);
      setShowRoleModal(false);
      
      // Reload to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      
    } catch (error) {
      console.error('Role change error:', error);
      toast.error(`Failed: ${error.message}`);
      setIsSwitching(false);
    }
  };

  const getRoleLabel = (role) => {
    const roles = { admin: 'Admin', agent: 'Agent', seller: 'Seller', buyer: 'Buyer', investor: 'Investor' };
    return roles[role] || 'User';
  };

  const getRoleColor = (role) => {
    const colors = { 
      admin: 'bg-red-100 text-red-800', 
      agent: 'bg-blue-100 text-blue-800', 
      seller: 'bg-orange-100 text-orange-800', 
      buyer: 'bg-emerald-100 text-emerald-800', 
      investor: 'bg-green-100 text-green-800' 
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const availableRoles = [
    { value: 'buyer', label: 'Buyer/Tenant', userType: 'buyer', icon: <Home size={18} />, desc: 'Browse properties' },
    { value: 'seller', label: 'Seller/Landlord', userType: 'seller', icon: <Building size={18} />, desc: 'List properties' },
    { value: 'investor', label: 'Investor', userType: 'investor', icon: <TrendingUp size={18} />, desc: 'Investment focus' },
    { value: 'agent', label: 'Real Estate Agent', userType: 'agent', icon: <Briefcase size={18} />, desc: 'Professional tools' },
    { value: 'admin', label: 'Administrator', userType: 'admin', icon: <Shield size={18} />, desc: 'Full access' },
  ];

  if (loading) return <LoadingSpinner />;
  
  if (!currentUser) {
    return (
      <div className="text-center p-8">
        Please login <Link to="/login" className="text-emerald-600">Login</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <Link to="/dashboard" className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold mt-1">Profile Settings</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowRoleModal(true)} 
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center gap-1"
            >
              <Repeat size={14} /> Switch Role
            </button>
            <button 
              onClick={handleLogout} 
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
            >
              <LogOut size={14} /> Logout
            </button>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 flex items-center gap-1"
            >
              <Edit2 size={14} /> {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Role Display */}
              <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Current Account</p>
                  <p className="font-semibold text-sm">{getRoleLabel(formData.role)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(formData.role)}`}>
                  {getRoleLabel(formData.role)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  disabled={!isEditing} 
                  required
                  className="w-full p-2 border rounded-lg text-sm disabled:bg-gray-100" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <input type="email" value={formData.email} disabled className="w-full p-2 border rounded-lg text-sm bg-gray-100" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Phone</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-lg text-sm disabled:bg-gray-100" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Location</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  disabled={!isEditing}
                  className="w-full p-2 border rounded-lg text-sm disabled:bg-gray-100" 
                />
              </div>

              {isEditing && (
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="w-full py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin inline" /> : <Save size={14} className="inline mr-1" />} Save Changes
                </button>
              )}
            </form>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow p-5 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold mx-auto">
              {formData.name?.charAt(0) || 'U'}
            </div>
            <h2 className="font-bold mt-3">{formData.name || 'User'}</h2>
            <p className="text-gray-500 text-xs">{formData.email}</p>
            <div className="mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(formData.role)}`}>
                {getRoleLabel(formData.role)}
              </span>
            </div>
            <button 
              onClick={() => setShowRoleModal(true)} 
              className="mt-3 text-xs text-purple-600 hover:text-purple-700"
            >
              Switch Account Type →
            </button>
          </div>
        </div>
      </div>

      {/* Role Switch Modal */}
      {showRoleModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowRoleModal(false)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              padding: '20px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontWeight: 'bold', fontSize: '18px' }}>Switch Account Type</h2>
              <button onClick={() => setShowRoleModal(false)} style={{ padding: '4px', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableRoles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => {
                    if (formData.role !== role.value && !isSwitching) {
                      handleRoleChange(role.value, role.userType);
                    }
                  }}
                  disabled={isSwitching}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `2px solid ${formData.role === role.value ? '#10b981' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: formData.role === role.value ? '#ecfdf5' : 'white',
                    cursor: formData.role === role.value ? 'default' : 'pointer',
                    opacity: isSwitching ? 0.5 : 1
                  }}
                >
                  <div style={{
                    padding: '6px',
                    borderRadius: '6px',
                    backgroundColor: role.value === 'admin' ? '#fee2e2' : 
                                   role.value === 'agent' ? '#dbeafe' : 
                                   role.value === 'seller' ? '#ffedd5' : 
                                   role.value === 'investor' ? '#dcfce7' : '#d1fae5'
                  }}>
                    {role.icon}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{role.label}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{role.desc}</div>
                  </div>
                  {formData.role === role.value && <CheckCircle size={16} style={{ color: '#10b981' }} />}
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fffbeb', borderRadius: '8px', fontSize: '12px', color: '#b45309', textAlign: 'center' }}>
              <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} /> 
              Page will reload after role change
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;