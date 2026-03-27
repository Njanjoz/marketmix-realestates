// src/pages/user/ProfilePage.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Briefcase, 
  CheckCircle, Home, Save, ArrowLeft, Key,
  Building, TrendingUp, Camera, MapPin, 
  Globe, Bell, Lock, Edit2, X, Users,
  UserCog, UserCheck, UserMinus, Crown, LogOut,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, updateDoc, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, updateUserProfile, loading, logout } = useAuth();
  
  const hasLoadedUsers = useRef(false);
  const isMounted = useRef(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    userType: '',
    bio: '',
    location: '',
    website: '',
    notifications: true,
    emailNotifications: true
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load form data from userProfile
  useEffect(() => {
    if (currentUser && userProfile) {
      setFormData({
        name: userProfile.name || currentUser.displayName || '',
        email: currentUser.email || '',
        phone: userProfile.phone || '',
        role: userProfile.role || 'user',
        userType: userProfile.userType || 'user',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        website: userProfile.website || '',
        notifications: userProfile.notifications !== false,
        emailNotifications: userProfile.emailNotifications !== false
      });
    }
  }, [currentUser, userProfile]);

  // Load all users for admin
  const loadAllUsers = useCallback(async () => {
    if (hasLoadedUsers.current || isLoadingUsers) return;
    
    setIsLoadingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (isMounted.current) {
        setUsers(usersList);
        hasLoadedUsers.current = true;
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      if (isMounted.current) {
        setIsLoadingUsers(false);
      }
    }
  }, [isLoadingUsers]);

  // Load users only if admin
  useEffect(() => {
    const isAdmin = userProfile?.role === 'admin' || userProfile?.userType === 'admin';
    if (isAdmin && !hasLoadedUsers.current && !isLoadingUsers) {
      loadAllUsers();
    }
  }, [userProfile?.role, userProfile?.userType, loadAllUsers, isLoadingUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  // ✅ ADDED: handleLogout function
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleRoleChange = async (userId, newRole, userName) => {
    if (userId === currentUser?.uid) {
      toast.error('You cannot change your own role');
      return;
    }
    
    setUpdatingUser(userId);
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        role: newRole,
        userType: newRole,
        updatedAt: serverTimestamp()
      });
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, role: newRole, userType: newRole }
            : u
        )
      );
      
      toast.success(`${userName || 'User'}'s role updated to ${getRoleLabel(newRole)}`);
      
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleUserTypeChange = async (userId, newUserType, userName) => {
    setUpdatingUser(userId);
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        userType: newUserType,
        updatedAt: serverTimestamp()
      });
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? { ...u, userType: newUserType }
            : u
        )
      );
      
      toast.success(`${userName || 'User'}'s user type updated to ${getUserTypeLabel(newUserType)}`);
      
    } catch (error) {
      console.error('Error updating user type:', error);
      toast.error('Failed to update user type');
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'Administrator';
      case 'agent': return 'Real Estate Agent';
      case 'moderator': return 'Moderator';
      default: return 'Regular User';
    }
  };

  const getUserTypeLabel = (userType) => {
    switch(userType) {
      case 'buyer': return 'Buyer/Tenant';
      case 'seller': return 'Seller/Landlord';
      case 'investor': return 'Investor';
      case 'agent': return 'Agent';
      default: return 'Regular User';
    }
  };

  const roles = [
    { value: 'user', label: 'Regular User', icon: <User className="w-5 h-5" />, color: 'gray', description: 'Basic user with standard permissions' },
    { value: 'agent', label: 'Real Estate Agent', icon: <Briefcase className="w-5 h-5" />, color: 'blue', description: 'Can list properties and manage listings' },
    { value: 'moderator', label: 'Moderator', icon: <CheckCircle className="w-5 h-5" />, color: 'purple', description: 'Can moderate content and users' },
    { value: 'admin', label: 'Administrator', icon: <Shield className="w-5 h-5" />, color: 'red', description: 'Full system access' },
  ];

  const userTypes = [
    { value: 'user', label: 'Regular User', icon: <User className="w-5 h-5" />, color: 'gray' },
    { value: 'buyer', label: 'Buyer/Tenant', icon: <Home className="w-5 h-5" />, color: 'emerald' },
    { value: 'seller', label: 'Seller/Landlord', icon: <Building className="w-5 h-5" />, color: 'orange' },
    { value: 'investor', label: 'Investor', icon: <TrendingUp className="w-5 h-5" />, color: 'green' },
    { value: 'agent', label: 'Agent', icon: <Briefcase className="w-5 h-5" />, color: 'blue' },
  ];

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-purple-100 text-purple-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeBadgeColor = (userType) => {
    switch(userType) {
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'seller': return 'bg-orange-100 text-orange-800';
      case 'investor': return 'bg-green-100 text-green-800';
      default: return 'bg-emerald-100 text-emerald-800';
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please login to view profile</p>
          <Link to="/login" className="mt-4 inline-block text-emerald-600 hover:text-emerald-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <Link to="/dashboard" className="inline-flex items-center text-emerald-600 hover:text-emerald-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-4">Profile Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account information and permissions</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Edit
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Side - Profile Info */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {/* Tabs */}
              <div className="flex space-x-4 border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-4 px-2 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`pb-4 px-2 font-medium whitespace-nowrap ${activeTab === 'security' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`pb-4 px-2 font-medium whitespace-nowrap ${activeTab === 'notifications' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                >
                  Notifications
                </button>
                {(userProfile?.role === 'admin' || userProfile?.userType === 'admin') && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`pb-4 px-2 font-medium whitespace-nowrap ${activeTab === 'admin' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500'}`}
                  >
                    <Users className="w-4 h-4 inline mr-1" />
                    Admin Panel
                  </button>
                )}
              </div>

              {activeTab === 'profile' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Current Role Display */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">Current Account Information</h3>
                        <p className="text-sm text-gray-600">Your current role and permissions</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(formData.role)}`}>
                          {roles.find(r => r.value === formData.role)?.label || 'User'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUserTypeBadgeColor(formData.userType)}`}>
                          {userTypes.find(t => t.value === formData.userType)?.label || 'User'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Email - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        disabled={!isEditing}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="+254 7XX XXX XXX"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Nairobi, Kenya"
                        />
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Tell us about yourself..."
                        rows="3"
                      />
                    </div>
                  )}

                  {isEditing && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </form>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <Lock className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-800">Security Information</h3>
                        <p className="text-sm text-yellow-600 mt-1">Password changes and security settings can be managed here.</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/change-password')}
                    className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Change Password
                  </button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Receive notifications for new listings</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifications}
                        onChange={(e) => setFormData({...formData, notifications: e.target.checked})}
                        className="sr-only peer"
                        disabled={!isEditing}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-500 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive email updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emailNotifications}
                        onChange={(e) => setFormData({...formData, emailNotifications: e.target.checked})}
                        className="sr-only peer"
                        disabled={!isEditing}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (userProfile?.role === 'admin' || userProfile?.userType === 'admin') && (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Crown className="w-8 h-8 text-purple-600 mr-3" />
                        <div>
                          <h3 className="font-bold text-gray-900">Admin Role Management</h3>
                          <p className="text-sm text-gray-600">Manage user roles and permissions across the platform</p>
                          <p className="text-xs text-purple-600 mt-1">Role changes take effect immediately for dashboard routing</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          hasLoadedUsers.current = false;
                          loadAllUsers();
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Refresh user list"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Search Users */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Users List */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {isLoadingUsers ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading users...</p>
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                                {u.name?.charAt(0) || u.email?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{u.name || 'No Name'}</h4>
                                <p className="text-sm text-gray-500">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                                {roles.find(r => r.value === u.role)?.label || u.role || 'user'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeBadgeColor(u.userType)}`}>
                                {userTypes.find(t => t.value === u.userType)?.label || u.userType || 'user'}
                              </span>
                            </div>
                          </div>

                          {/* Role Change Buttons */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-sm font-medium text-gray-700">Change Role:</span>
                              <div className="flex space-x-2 flex-wrap gap-1">
                                {roles.map((role) => (
                                  <button
                                    key={role.value}
                                    onClick={() => handleRoleChange(u.id, role.value, u.name)}
                                    disabled={updatingUser === u.id || u.id === currentUser?.uid}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                      u.role === role.value
                                        ? `bg-${role.color}-100 text-${role.color}-700 border border-${role.color}-200`
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    } ${(updatingUser === u.id || u.id === currentUser?.uid) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={u.id === currentUser?.uid ? "Cannot change your own role" : `Set as ${role.label}`}
                                  >
                                    <div className="flex items-center space-x-1">
                                      {updatingUser === u.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        role.icon
                                      )}
                                      <span>{role.label}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* User Type Change Buttons */}
                          <div className="mt-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-sm font-medium text-gray-700">Change User Type:</span>
                              <div className="flex space-x-2 flex-wrap gap-1">
                                {userTypes.map((type) => (
                                  <button
                                    key={type.value}
                                    onClick={() => handleUserTypeChange(u.id, type.value, u.name)}
                                    disabled={updatingUser === u.id}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                      u.userType === type.value
                                        ? `bg-${type.color}-100 text-${type.color}-700 border border-${type.color}-200`
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    } ${updatingUser === u.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <div className="flex items-center space-x-1">
                                      {updatingUser === u.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        type.icon
                                      )}
                                      <span>{type.label}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <UserMinus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No users found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-bold">
                    {formData.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-2 right-2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900">{formData.name || 'User'}</h2>
                <p className="text-gray-600">{formData.email}</p>

                <div className="flex flex-col items-center space-y-2 mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(formData.role)}`}>
                    {roles.find(r => r.value === formData.role)?.label || 'User'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUserTypeBadgeColor(formData.userType)}`}>
                    {userTypes.find(t => t.value === formData.userType)?.label || 'User'}
                  </span>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Member since {new Date(currentUser?.metadata?.creationTime || Date.now()).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;