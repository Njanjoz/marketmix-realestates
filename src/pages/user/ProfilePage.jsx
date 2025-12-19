// src/pages/user/ProfilePage.jsx
import React, { useState } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  UserCircle, Mail, Phone, MapPin, Calendar,
  Edit, Save, Camera, Shield, Bell,
  CreditCard, Lock, Globe, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfilePage = () => {
  const { userProfile, currentUser, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: currentUser?.email || '',
    phone: userProfile?.phone || '',
    location: userProfile?.location || '',
    bio: userProfile?.bio || 'Real estate enthusiast looking for the perfect home.',
  });

  const handleSave = async () => {
    try {
      await updateUserProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const accountStats = [
    { label: 'Member Since', value: userProfile?.createdAt ? new Date(userProfile.createdAt).getFullYear() : '2024', icon: <Calendar /> },
    { label: 'Properties Viewed', value: '42', icon: <Eye /> },
    { label: 'Saved Properties', value: '12', icon: <Heart /> },
    { label: 'Inquiries Sent', value: '8', icon: <MessageSquare /> },
  ];

  return (
    <DashboardLayout 
      title="My Profile" 
      subtitle="Manage your personal information and account settings"
    >
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {userProfile?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userProfile?.name || 'User'}</h1>
                <p className="text-gray-600">{userProfile?.userType === 'admin' ? 'Administrator' : 'Premium Member'}</p>
              </div>
            </div>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                isEditing 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" /> Edit Profile
                </>
              )}
            </button>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {accountStats.map((stat, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-white rounded-lg border mr-2">
                    <div className="text-emerald-600">{stat.icon}</div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserCircle className="w-5 h-5 mr-2 text-emerald-600" />
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail className="w-4 h-4 mr-1" /> Email Address
                </label>
                <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email verification required for security</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone className="w-4 h-4 mr-1" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="+254 7XX XXX XXX"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" /> Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.location || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-3 py-2 bg-gray-50 rounded-lg">{formData.bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-6">
            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Security
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Password</p>
                    <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                  </div>
                  <button className="px-3 py-1.5 text-sm bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                    Change
                  </button>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                    Enable
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-amber-600" />
                Preferences
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Email Notifications', enabled: true },
                  { label: 'SMS Alerts', enabled: false },
                  { label: 'Price Drop Alerts', enabled: true },
                  { label: 'New Property Alerts', enabled: true },
                ].map((pref, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{pref.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={pref.enabled} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
                Account Status
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Email Verification</span>
                  <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                    Verified
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Phone Verification</span>
                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                    Pending
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Account Type</span>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {userProfile?.userType === 'admin' ? 'Administrator' : 'Premium'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;