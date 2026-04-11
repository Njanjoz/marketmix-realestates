// src/components/dashboards/AdminDashboard.jsx - WITH GLASS THEME
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building, BarChart, TrendingUp, DollarSign, Eye, 
  RefreshCw, Settings, Upload, Trash2, Edit, Plus, MapPin, 
  Bed, Bath, Square, Home, Tag, Star, Layout, 
  Globe, Mail, Phone, Award, CheckCircle, XCircle,
  Save, AlertCircle, Crown, Shield, Image as ImageIcon, 
  Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle,
  Maximize2, Crop, Loader, UserCog, UserCheck, UserX, Filter, Search,
  Briefcase, User, Shield as ShieldIcon, UserMinus
} from 'lucide-react';
import { db } from '../../firebase/config';
import { 
  collection, getDocs, query, orderBy, deleteDoc, doc, 
  addDoc, serverTimestamp, setDoc, getDoc, updateDoc, where
} from 'firebase/firestore';
import toast from 'react-hot-toast';

// Glassmorphism styles
const glass = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderRadius: 20,
};

const glassCard = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.3)',
  borderRadius: 16,
  padding: '20px',
};

const serif = "'Cormorant Garamond', 'Georgia', serif";
const sans = "'Inter', system-ui, sans-serif";
const ink = '#1c1c1e';
const ink2 = '#4a4a52';
const ink3 = '#8e8e99';
const rule = 'rgba(255,255,255,0.2)';
const red = '#dc2626';
const redLight = 'rgba(220,38,38,0.12)';

// Cloudflare R2 upload URL
const CLOUDFLARE_WORKER_URL = 'https://marketmix-uploader.johnnjanjo4.workers.dev';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('users');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    activeListings: 0,
    totalRevenue: 0
  });
  
  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    userType: 'buyer',
    status: 'active'
  });

  // Role options
  const roles = [
    { value: 'admin', label: 'Administrator', icon: <ShieldIcon size={16} />, color: 'red', description: 'Full system access' },
    { value: 'moderator', label: 'Moderator', icon: <CheckCircle size={16} />, color: 'purple', description: 'Content moderation' },
    { value: 'agent', label: 'Real Estate Agent', icon: <Briefcase size={16} />, color: 'blue', description: 'List and sell properties' },
    { value: 'seller', label: 'Seller/Landlord', icon: <Home size={16} />, color: 'orange', description: 'List properties for sale/rent' },
    { value: 'investor', label: 'Investor', icon: <TrendingUp size={16} />, color: 'green', description: 'Investment opportunities' },
    { value: 'user', label: 'Regular User', icon: <Users size={16} />, color: 'gray', description: 'Browse and save properties' }
  ];

  const userTypes = [
    { value: 'buyer', label: 'Buyer/Tenant', color: 'emerald' },
    { value: 'seller', label: 'Seller/Landlord', color: 'orange' },
    { value: 'investor', label: 'Investor', color: 'green' },
    { value: 'agent', label: 'Real Estate Agent', color: 'blue' },
    { value: 'admin', label: 'Administrator', color: 'red' }
  ];

  // Load users from Firestore
  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setFilteredUsers(usersList);
      setStats(prev => ({ ...prev, totalUsers: usersList.length }));
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Load properties
  const loadProperties = async () => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const propertiesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propertiesList);
      setStats(prev => ({ 
        ...prev, 
        totalProperties: propertiesList.length,
        activeListings: propertiesList.filter(p => p.status === 'active').length
      }));
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadProperties();
  }, []);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }
    setFilteredUsers(filtered);
  }, [searchTerm, selectedRole, users]);

  // Update user role
  const handleUpdateUserRole = async (userId, newRole, newUserType) => {
    setUpdatingRole(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        userType: newUserType,
        updatedAt: serverTimestamp(),
        updatedBy: 'admin'
      });
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole, userType: newUserType } : user
      ));
      toast.success(`User role updated to ${roles.find(r => r.value === newRole)?.label}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    } finally {
      setUpdatingRole(null);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(prev => prev.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  // Add/Edit user
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        const userRef = doc(db, 'users', editingUser.id);
        await updateDoc(userRef, { ...userForm, updatedAt: serverTimestamp() });
        setUsers(prev => prev.map(user => user.id === editingUser.id ? { ...user, ...userForm } : user));
        toast.success('User updated successfully');
      } else {
        const newUserRef = doc(db, 'users', userForm.email);
        await setDoc(newUserRef, {
          ...userForm,
          uid: userForm.email,
          createdAt: serverTimestamp(),
          status: 'active'
        });
        setUsers(prev => [...prev, { id: userForm.email, ...userForm }]);
        toast.success('User added successfully');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', phone: '', role: 'user', userType: 'buyer', status: 'active' });
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-purple-100 text-purple-800',
      agent: 'bg-blue-100 text-blue-800',
      seller: 'bg-orange-100 text-orange-800',
      investor: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getUserTypeBadgeColor = (userType) => {
    const colors = {
      buyer: 'bg-emerald-100 text-emerald-800',
      seller: 'bg-orange-100 text-orange-800',
      investor: 'bg-green-100 text-green-800',
      agent: 'bg-blue-100 text-blue-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colors[userType] || 'bg-gray-100 text-gray-800';
  };

  const statsCards = [
    { label: 'Total Users', value: stats.totalUsers.toString(), delta: '+12%', icon: <Users size={20} /> },
    { label: 'Properties', value: stats.totalProperties.toString(), delta: '+8%', icon: <Building size={20} /> },
    { label: 'Active Listings', value: stats.activeListings.toString(), delta: '+5%', icon: <Eye size={20} /> },
    { label: 'Revenue', value: `KES ${stats.totalRevenue}M`, delta: '+23%', icon: <DollarSign size={20} /> },
  ];

  const sections = [
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'properties', label: 'Properties', icon: <Building size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 30%, #fef2f2 60%, #fecaca 100%)',
      minHeight: '100vh',
      padding: '32px 40px 56px',
      fontFamily: sans,
      fontWeight: 300,
      color: ink,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
            Admin <em style={{ fontStyle: 'italic', color: red }}>Control Center</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: red, opacity: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ fontFamily: sans, fontSize: 11, color: ink2, background: 'rgba(255,255,255,0.18)', border: `1px solid ${rule}`, borderRadius: 20, padding: '7px 16px' }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </nav>

        {/* Welcome Section */}
        <div style={{ ...glass, padding: '24px 28px', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400 }}>Admin Dashboard</div>
            <div style={{ fontSize: 13, color: ink2, marginTop: 4 }}>Manage users, properties, and platform settings</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {statsCards.map((stat, idx) => (
            <div key={idx} style={{ ...glass, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ background: redLight, borderRadius: 12, padding: '8px' }}>
                  {stat.icon}
                </div>
                <span style={{ fontSize: 11, color: '#1e6e42' }}>{stat.delta}</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: ink2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Section Tabs */}
        <div style={{ ...glass, display: 'flex', gap: 8, padding: '8px', marginBottom: 24 }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                background: activeSection === section.id ? red : 'transparent',
                color: activeSection === section.id ? 'white' : ink2,
                border: 'none',
                cursor: 'pointer',
                fontFamily: sans,
                fontSize: 13,
                transition: 'all 0.2s'
              }}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>

        {/* Users Management Section */}
        {activeSection === 'users' && (
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>User Management</div>
                <div style={{ fontSize: 12, color: ink2 }}>Manage user roles, permissions, and accounts</div>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', email: '', phone: '', role: 'user', userType: 'buyer', status: 'active' });
                  setShowUserModal(true);
                }}
                style={{ background: red, color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <Plus size={18} /> Add User
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: ink3 }} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: `1px solid ${rule}`, background: 'rgba(255,255,255,0.5)', outline: 'none' }}
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: 12, border: `1px solid ${rule}`, background: 'rgba(255,255,255,0.5)', outline: 'none' }}
              >
                <option value="all">All Roles</option>
                {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </div>

            {/* Users Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader size={32} className="animate-spin" style={{ color: red, margin: '0 auto' }} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: ink2 }}>No users found</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${rule}` }}>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>User</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>Contact</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>Role</th>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>User Type</th>
                      <th style={{ textAlign: 'right', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: `1px solid ${rule}` }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${red}, #ef4444)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                              {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{user.name || 'No Name'}</div>
                              <div style={{ fontSize: 11, color: ink3 }}>ID: {user.id?.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: 13 }}>{user.email}</div>
                          <div style={{ fontSize: 11, color: ink3 }}>{user.phone || 'No phone'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={user.role || 'user'}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value, user.userType || 'buyer')}
                            disabled={updatingRole === user.id}
                            style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, border: `1px solid ${rule}`, background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                          >
                            {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={user.userType || 'buyer'}
                            onChange={(e) => handleUpdateUserRole(user.id, user.role || 'user', e.target.value)}
                            disabled={updatingRole === user.id}
                            style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, border: `1px solid ${rule}`, background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                          >
                            {userTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setUserForm({
                                  name: user.name || '',
                                  email: user.email || '',
                                  phone: user.phone || '',
                                  role: user.role || 'user',
                                  userType: user.userType || 'buyer',
                                  status: user.status || 'active'
                                });
                                setShowUserModal(true);
                              }}
                              style={{ padding: 6, background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#3b82f6' }}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                              style={{ padding: 6, background: 'rgba(220,38,38,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#dc2626' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Properties Section */}
        {activeSection === 'properties' && (
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>Properties</div>
                <div style={{ fontSize: 12, color: ink2 }}>Manage all property listings</div>
              </div>
              <button style={{ background: red, color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Plus size={18} /> Add Property
              </button>
            </div>
            {properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: ink2 }}>
                <Building size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>No properties yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {properties.slice(0, 6).map((property) => (
                  <div key={property.id} style={{ background: 'rgba(255,255,255,0.38)', border: `1px solid ${rule}`, borderRadius: 16, overflow: 'hidden' }}>
                    <img src={property.images?.[0] || 'https://placehold.co/400x250'} alt={property.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{property.title}</div>
                      <div style={{ fontSize: 12, color: ink2, marginBottom: 8 }}>{property.location}</div>
                      <div style={{ fontSize: 18, fontWeight: 500, color: red }}>KES {property.price?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <div style={{ ...glass, padding: '24px', textAlign: 'center' }}>
            <BarChart size={48} style={{ margin: '40px auto 16px', opacity: 0.5 }} />
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Analytics Dashboard</div>
            <div style={{ fontSize: 13, color: ink2 }}>Coming soon - Detailed analytics and reports</div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div style={{ ...glass, padding: '24px', textAlign: 'center' }}>
            <Settings size={48} style={{ margin: '40px auto 16px', opacity: 0.5 }} />
            <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Platform Settings</div>
            <div style={{ fontSize: 13, color: ink2 }}>Coming soon - System configuration and preferences</div>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div style={{ background: 'white', borderRadius: 20, maxWidth: 500, width: '100%', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: serif, fontSize: 20, fontWeight: 500 }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowUserModal(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Full Name *</label>
                <input type="text" required value={userForm.name} onChange={(e) => setUserForm({...userForm, name: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Email *</label>
                <input type="email" required value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} disabled={!!editingUser} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Phone</label>
                <input type="tel" value={userForm.phone} onChange={(e) => setUserForm({...userForm, phone: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Role</label>
                  <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>User Type</label>
                  <select value={userForm.userType} onChange={(e) => setUserForm({...userForm, userType: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    {userTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ background: red, color: 'white', border: 'none', borderRadius: 12, padding: 12, cursor: 'pointer', fontWeight: 500 }}>
                {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;