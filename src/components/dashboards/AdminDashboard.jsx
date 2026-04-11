// src/components/dashboards/AdminDashboard.jsx - FULL FIXED VERSION
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
  Briefcase, User, Shield as ShieldIcon, UserMinus, Clock, Check, X,
  Eye as EyeIcon, Calendar, Flag
} from 'lucide-react';
import { db } from '../../firebase/config';
import { 
  collection, getDocs, query, orderBy, deleteDoc, doc, 
  addDoc, serverTimestamp, setDoc, getDoc, updateDoc, where,
  limit
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
const green = '#10b981';
const greenLight = 'rgba(16,185,129,0.12)';
const yellow = '#f59e0b';
const yellowLight = 'rgba(245,158,11,0.12)';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('listings');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [approvedListings, setApprovedListings] = useState([]);
  const [rejectedListings, setRejectedListings] = useState([]);
  const [featuredListings, setFeaturedListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    activeListings: 0,
    pendingApproval: 0,
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
    { value: 'admin', label: 'Administrator', icon: <ShieldIcon size={16} />, color: 'red' },
    { value: 'moderator', label: 'Moderator', icon: <CheckCircle size={16} />, color: 'purple' },
    { value: 'agent', label: 'Real Estate Agent', icon: <Briefcase size={16} />, color: 'blue' },
    { value: 'seller', label: 'Seller/Landlord', icon: <Home size={16} />, color: 'orange' },
    { value: 'investor', label: 'Investor', icon: <TrendingUp size={16} />, color: 'green' },
    { value: 'user', label: 'Regular User', icon: <Users size={16} />, color: 'gray' }
  ];

  const userTypes = [
    { value: 'buyer', label: 'Buyer/Tenant', color: 'emerald' },
    { value: 'seller', label: 'Seller/Landlord', color: 'orange' },
    { value: 'investor', label: 'Investor', color: 'green' },
    { value: 'agent', label: 'Real Estate Agent', color: 'blue' },
    { value: 'admin', label: 'Administrator', color: 'red' }
  ];

  // Load properties with different statuses
  const loadProperties = async () => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const querySnapshot = await getDocs(propertiesRef);
      const allProperties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const pending = allProperties.filter(p => p.approvalStatus === 'pending' || !p.approvalStatus);
      const approved = allProperties.filter(p => p.approvalStatus === 'approved');
      const rejected = allProperties.filter(p => p.approvalStatus === 'rejected');
      const featured = allProperties.filter(p => p.featured === true && p.approvalStatus === 'approved');
      
      setPendingListings(pending);
      setApprovedListings(approved);
      setRejectedListings(rejected);
      setFeaturedListings(featured);
      setProperties(allProperties);
      
      setStats(prev => ({ 
        ...prev, 
        totalProperties: allProperties.length,
        activeListings: approved.length,
        pendingApproval: pending.length
      }));
      
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
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
    }
  };

  useEffect(() => {
    loadProperties();
    loadUsers();
  }, []);

  // Approve a listing
  const handleApproveListing = async (listingId) => {
    setLoading(true);
    try {
      const listingRef = doc(db, 'properties', listingId);
      await updateDoc(listingRef, {
        approvalStatus: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: 'admin',
        status: 'active'
      });
      
      const approvedListing = pendingListings.find(p => p.id === listingId);
      setPendingListings(prev => prev.filter(p => p.id !== listingId));
      setApprovedListings(prev => [...prev, { ...approvedListing, approvalStatus: 'approved' }]);
      
      toast.success('Listing approved successfully! It will now appear on the homepage.');
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error('Failed to approve listing');
    } finally {
      setLoading(false);
    }
  };

  // Reject a listing
  const handleRejectListing = async (listingId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;
    
    setLoading(true);
    try {
      const listingRef = doc(db, 'properties', listingId);
      await updateDoc(listingRef, {
        approvalStatus: 'rejected',
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        rejectedBy: 'admin',
        status: 'rejected'
      });
      
      const rejectedListing = pendingListings.find(p => p.id === listingId);
      setPendingListings(prev => prev.filter(p => p.id !== listingId));
      setRejectedListings(prev => [...prev, { ...rejectedListing, approvalStatus: 'rejected', rejectionReason: reason }]);
      
      toast.warning(`Listing rejected: ${reason}`);
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast.error('Failed to reject listing');
    } finally {
      setLoading(false);
    }
  };

  // REVOKE APPROVAL - NEW FUNCTION
  const handleRevokeApproval = async (listingId) => {
    if (window.confirm('Are you sure you want to revoke approval for this listing? It will go back to pending status.')) {
      setLoading(true);
      try {
        const listingRef = doc(db, 'properties', listingId);
        await updateDoc(listingRef, {
          approvalStatus: 'pending',
          revokedAt: serverTimestamp(),
          revokedBy: 'admin',
          featured: false
        });
        
        const revokedListing = approvedListings.find(p => p.id === listingId);
        setApprovedListings(prev => prev.filter(p => p.id !== listingId));
        setPendingListings(prev => [...prev, { ...revokedListing, approvalStatus: 'pending', featured: false }]);
        setFeaturedListings(prev => prev.filter(p => p.id !== listingId));
        
        toast.warning('Listing approval revoked. It is now pending review again.');
      } catch (error) {
        console.error('Error revoking approval:', error);
        toast.error('Failed to revoke approval');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (listingId, currentFeatured) => {
    setLoading(true);
    try {
      const listingRef = doc(db, 'properties', listingId);
      await updateDoc(listingRef, {
        featured: !currentFeatured,
        updatedAt: serverTimestamp()
      });
      
      const updateListings = (list) => 
        list.map(p => p.id === listingId ? { ...p, featured: !currentFeatured } : p);
      
      setApprovedListings(updateListings);
      setFeaturedListings(prev => 
        !currentFeatured 
          ? [...prev, approvedListings.find(p => p.id === listingId)]
          : prev.filter(p => p.id !== listingId)
      );
      
      toast.success(!currentFeatured ? 'Added to featured listings' : 'Removed from featured listings');
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Failed to update featured status');
    } finally {
      setLoading(false);
    }
  };

  // Delete a listing
  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to permanently delete this listing?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'properties', listingId));
        
        setPendingListings(prev => prev.filter(p => p.id !== listingId));
        setApprovedListings(prev => prev.filter(p => p.id !== listingId));
        setRejectedListings(prev => prev.filter(p => p.id !== listingId));
        setFeaturedListings(prev => prev.filter(p => p.id !== listingId));
        
        toast.success('Listing deleted successfully');
      } catch (error) {
        console.error('Error deleting listing:', error);
        toast.error('Failed to delete listing');
      } finally {
        setLoading(false);
      }
    }
  };

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

  // Filter users
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return { bg: yellowLight, color: yellow, label: 'Pending Review', icon: <Clock size={12} /> };
      case 'approved':
        return { bg: greenLight, color: green, label: 'Approved', icon: <Check size={12} /> };
      case 'rejected':
        return { bg: redLight, color: red, label: 'Rejected', icon: <X size={12} /> };
      default:
        return { bg: yellowLight, color: yellow, label: 'Pending', icon: <Clock size={12} /> };
    }
  };

  const statsCards = [
    { label: 'Total Users', value: stats.totalUsers.toString(), delta: '+12%', icon: <Users size={20} /> },
    { label: 'Total Properties', value: stats.totalProperties.toString(), delta: '+8%', icon: <Building size={20} /> },
    { label: 'Active Listings', value: stats.activeListings.toString(), delta: '+5%', icon: <EyeIcon size={20} /> },
    { label: 'Pending Approval', value: stats.pendingApproval.toString(), delta: '+3', icon: <Clock size={20} /> },
  ];

  const sections = [
    { id: 'listings', label: 'Listing Approval', icon: <CheckCircle size={18} /> },
    { id: 'featured', label: 'Featured Properties', icon: <Star size={18} /> },
    { id: 'users', label: 'User Management', icon: <Users size={18} /> },
    { id: 'allProperties', label: 'All Properties', icon: <Building size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart size={18} /> }
  ];

  const getCurrentListings = () => {
    switch(selectedStatus) {
      case 'pending': return pendingListings;
      case 'approved': return approvedListings;
      case 'rejected': return rejectedListings;
      default: return pendingListings;
    }
  };

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
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400 }}>Listing Approval Dashboard</div>
            <div style={{ fontSize: 13, color: ink2, marginTop: 4 }}>Review and approve seller listings before they appear on the homepage</div>
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
                <span style={{ fontSize: 11, color: green }}>{stat.delta}</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: ink2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Section Tabs */}
        <div style={{ ...glass, display: 'flex', gap: 8, padding: '8px', marginBottom: 24, flexWrap: 'wrap' }}>
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

        {/* Listing Approval Section */}
        {activeSection === 'listings' && (
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>Pending Approvals</div>
                <div style={{ fontSize: 12, color: ink2 }}>Review and approve listings from sellers</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedStatus('pending')}
                  style={{ padding: '8px 16px', borderRadius: 20, background: selectedStatus === 'pending' ? yellow : 'transparent', color: selectedStatus === 'pending' ? 'white' : ink2, border: `1px solid ${rule}`, cursor: 'pointer' }}
                >
                  Pending ({pendingListings.length})
                </button>
                <button
                  onClick={() => setSelectedStatus('approved')}
                  style={{ padding: '8px 16px', borderRadius: 20, background: selectedStatus === 'approved' ? green : 'transparent', color: selectedStatus === 'approved' ? 'white' : ink2, border: `1px solid ${rule}`, cursor: 'pointer' }}
                >
                  Approved ({approvedListings.length})
                </button>
                <button
                  onClick={() => setSelectedStatus('rejected')}
                  style={{ padding: '8px 16px', borderRadius: 20, background: selectedStatus === 'rejected' ? red : 'transparent', color: selectedStatus === 'rejected' ? 'white' : ink2, border: `1px solid ${rule}`, cursor: 'pointer' }}
                >
                  Rejected ({rejectedListings.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader size={32} className="animate-spin" style={{ color: red, margin: '0 auto' }} />
              </div>
            ) : getCurrentListings().length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: ink2 }}>
                <CheckCircle size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>No {selectedStatus} listings found</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {getCurrentListings().map((listing) => {
                  const statusBadge = getStatusBadge(listing.approvalStatus || 'pending');
                  return (
                    <div key={listing.id} style={{ background: 'rgba(255,255,255,0.38)', border: `1px solid ${rule}`, borderRadius: 16, padding: '16px' }}>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <img 
                          src={listing.images?.[0] || 'https://placehold.co/120x80'} 
                          alt={listing.title}
                          style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 12 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                              <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{listing.title}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: ink2, flexWrap: 'wrap' }}>
                                <span><MapPin size={12} /> {listing.location}</span>
                                <span><Bed size={12} /> {listing.bedrooms || 0} beds</span>
                                <span><Bath size={12} /> {listing.bathrooms || 0} baths</span>
                                <span><Square size={12} /> {listing.area || 0} sqft</span>
                              </div>
                              <div style={{ fontSize: 11, color: ink3, marginTop: 4 }}>
                                Listed by: {listing.userName || listing.userEmail} | {listing.createdAt ? new Date(listing.createdAt.toDate()).toLocaleDateString() : 'Recently'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, color: red }}>KES {listing.price?.toLocaleString()}</div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, background: statusBadge.bg, color: statusBadge.color, fontSize: 11, marginTop: 4 }}>
                                {statusBadge.icon} {statusBadge.label}
                              </div>
                            </div>
                          </div>
                          
                          {listing.rejectionReason && (
                            <div style={{ marginTop: 8, padding: 8, background: redLight, borderRadius: 8, fontSize: 11, color: red }}>
                              Rejection reason: {listing.rejectionReason}
                            </div>
                          )}
                          
                          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                            {listing.approvalStatus !== 'approved' && (
                              <button
                                onClick={() => handleApproveListing(listing.id)}
                                disabled={loading}
                                style={{ padding: '8px 16px', background: green, color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                              >
                                <Check size={14} /> Approve
                              </button>
                            )}
                            {listing.approvalStatus !== 'rejected' && (
                              <button
                                onClick={() => handleRejectListing(listing.id)}
                                disabled={loading}
                                style={{ padding: '8px 16px', background: red, color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                              >
                                <X size={14} /> Reject
                              </button>
                            )}
                            {listing.approvalStatus === 'approved' && (
                              <button
                                onClick={() => handleRevokeApproval(listing.id)}
                                disabled={loading}
                                style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                              >
                                <AlertCircle size={14} /> Revoke
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              disabled={loading}
                              style={{ padding: '8px 16px', background: 'rgba(107,114,128,0.2)', color: ink2, border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Featured Properties Section */}
        {activeSection === 'featured' && (
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>Featured Properties</div>
              <div style={{ fontSize: 12, color: ink2 }}>Select properties to feature on the homepage</div>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Loader size={32} className="animate-spin" style={{ color: red }} />
              </div>
            ) : approvedListings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: ink2 }}>
                <Star size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p>No approved listings available</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {approvedListings.map((listing) => (
                  <div key={listing.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.38)', border: `1px solid ${rule}`, borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={listing.images?.[0] || 'https://placehold.co/60x60'} alt={listing.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{listing.title}</div>
                        <div style={{ fontSize: 11, color: ink2 }}>{listing.location}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 500, color: red }}>KES {listing.price?.toLocaleString()}</div>
                      <button
                        onClick={() => handleToggleFeatured(listing.id, listing.featured)}
                        style={{ padding: '8px 16px', borderRadius: 20, background: listing.featured ? green : 'rgba(255,255,255,0.5)', color: listing.featured ? 'white' : ink2, border: `1px solid ${rule}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Star size={14} />
                        {listing.featured ? 'Featured' : 'Add to Featured'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>User Management</div>
              <div style={{ fontSize: 12, color: ink2 }}>Manage user roles and permissions</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${rule}` }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>User</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>Contact</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>Role</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: 11, fontWeight: 500, color: ink3 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 10).map((user) => (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${rule}` }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${red}, #ef4444)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{user.name || 'No Name'}</div>
                            <div style={{ fontSize: 11, color: ink3 }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: 11, color: ink2 }}>{user.phone || 'No phone'}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value, user.userType || 'buyer')}
                          style={{ padding: '4px 8px', borderRadius: 12, fontSize: 11, border: `1px solid ${rule}` }}
                        >
                          {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                        </select>
                       </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteUser(user.id, user.name || user.email)} style={{ padding: 6, background: redLight, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                          <Trash2 size={14} color={red} />
                        </button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Properties Section */}
        {activeSection === 'allProperties' && (
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>All Properties</div>
              <div style={{ fontSize: 12, color: ink2 }}>Complete list of all property listings</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {properties.map((property) => (
                <div key={property.id} style={{ background: 'rgba(255,255,255,0.38)', border: `1px solid ${rule}`, borderRadius: 12, overflow: 'hidden' }}>
                  <img src={property.images?.[0] || 'https://placehold.co/400x200'} alt={property.title} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{property.title}</div>
                    <div style={{ fontSize: 11, color: ink2 }}>{property.location}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: red, marginTop: 4 }}>KES {property.price?.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: ink3, marginTop: 4 }}>Status: {property.approvalStatus || 'pending'}</div>
                  </div>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
};

export default AdminDashboard;