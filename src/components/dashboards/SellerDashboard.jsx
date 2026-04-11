// src/components/dashboards/SellerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import SellerPropertyUpload from '../seller/SellerPropertyUpload';
import { Building, Eye, MessageSquare, TrendingUp, Plus, Edit, Trash2, MapPin, Bed, Bath, Square, DollarSign, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const glass = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderRadius: 20,
};

const serif = "'Cormorant Garamond', 'Georgia', serif";
const sans = "'Inter', system-ui, sans-serif";
const ink = '#1c1c1e';
const ink2 = '#4a4a52';
const ink3 = '#8e8e99';
const up = '#1e6e42';
const rule = 'rgba(255,255,255,0.2)';
const orange = '#ea580c';
const orangeLight = 'rgba(234,88,12,0.12)';

const statusMeta = {
  active: { label: 'Active', bg: 'rgba(30,110,66,0.12)', color: '#1e6e42' },
  pending: { label: 'Pending', bg: 'rgba(122,90,0,0.11)', color: '#7a5a00' },
  sold: { label: 'Sold', bg: 'rgba(139,26,26,0.11)', color: '#8b1a1a' },
};

function Badge({ status }) {
  const m = statusMeta[status] || statusMeta.active;
  return (
    <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, padding: '3px 9px', borderRadius: 20, background: m.bg, color: m.color, border: `1px solid ${m.color}40` }}>
      {m.label}
    </span>
  );
}

export default function SellerDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState({ activeListings: 0, totalViews: 0, inquiries: 0, totalValue: 0 });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const listingsRef = collection(db, 'properties');
      const q = query(
        listingsRef, 
        where('userId', '==', currentUser?.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(listingsData);
      
      // Calculate stats
      const active = listingsData.filter(p => p.status === 'active').length;
      const views = listingsData.reduce((sum, p) => sum + (p.views || 0), 0);
      const inquiries = listingsData.reduce((sum, p) => sum + (p.inquiries || 0), 0);
      const totalValue = listingsData.reduce((sum, p) => sum + (p.price || 0), 0);
      
      setStats({
        activeListings: active,
        totalViews: views,
        inquiries: inquiries,
        totalValue: totalValue
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchListings();
    }
  }, [currentUser]);

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'properties', listingId));
        toast.success('Listing deleted successfully');
        fetchListings();
      } catch (error) {
        console.error('Error deleting listing:', error);
        toast.error('Failed to delete listing');
      }
    }
  };

  const statsCards = [
    { label: 'Active listings', value: stats.activeListings.toString(), delta: '↑ Active', icon: <Building size={18} /> },
    { label: 'Total views', value: stats.totalViews.toString(), delta: '↑ Lifetime', icon: <Eye size={18} /> },
    { label: 'Inquiries', value: stats.inquiries.toString(), delta: '↑ Total', icon: <MessageSquare size={18} /> },
    { label: 'Portfolio value', value: `KES ${(stats.totalValue / 1000000).toFixed(1)}M`, delta: '↑ Total', icon: <DollarSign size={18} /> },
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg, #ffedd5 0%, #fed7aa 30%, #fff7ed 60%, #fed7aa 100%)',
      minHeight: '100vh',
      padding: '32px 40px 56px',
      fontFamily: sans,
      fontWeight: 300,
      color: ink,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(234,88,12,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
            Seller <em style={{ fontStyle: 'italic', color: orange }}>Dashboard</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: orange, opacity: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <button 
              onClick={() => setShowUploadModal(true)}
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: orange, background: orangeLight, border: `1px solid ${orange}40`, borderRadius: 20, padding: '7px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> List Property
            </button>
          </div>
        </nav>

        {/* Welcome Section */}
        <div style={{ ...glass, padding: '24px 28px', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400 }}>Welcome back, {userProfile?.name?.split(' ')[0] || 'Seller'}!</div>
            <div style={{ fontSize: 13, color: ink2, marginTop: 4 }}>Manage your property listings, track inquiries, and grow your real estate portfolio.</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {statsCards.map((stat, idx) => (
            <div key={idx} style={{ ...glass, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ background: orangeLight, borderRadius: 12, padding: '8px' }}>
                  {stat.icon}
                </div>
                <span style={{ fontSize: 11, color: up }}>{stat.delta}</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 300 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: ink2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Listings Section */}
        <div style={{ ...glass, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
            <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Your Property Listings</span>
            <button 
              onClick={() => setShowUploadModal(true)}
              style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: orange, background: orangeLight, border: `1px solid ${orange}40`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>
              + Add New
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
              <p style={{ marginTop: 12, color: ink2 }}>Loading your listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Building size={48} style={{ color: ink3, marginBottom: 12 }} />
              <p style={{ color: ink2, marginBottom: 16 }}>You haven't listed any properties yet.</p>
              <button 
                onClick={() => setShowUploadModal(true)}
                style={{ background: orange, color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer' }}>
                List Your First Property
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {listings.map((listing, i) => (
                <motion.div 
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ background: 'rgba(255,255,255,0.38)', border: `1px solid ${rule}`, borderRadius: 16, padding: '16px' }}>
                  
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {/* Image */}
                    <img 
                      src={listing.images?.[0] || 'https://placehold.co/120x80'} 
                      alt={listing.title}
                      style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 12 }}
                    />
                    
                    {/* Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{listing.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: ink2, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {listing.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bed size={12} /> {listing.bedrooms || 0} beds</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Bath size={12} /> {listing.bathrooms || 0} baths</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Square size={12} /> {listing.area || 0} sqft</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 500, color: orange }}>KES {listing.price?.toLocaleString()}</div>
                          <Badge status={listing.status} />
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 24, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${rule}` }}>
                        <span style={{ fontSize: 11, color: ink2, display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {listing.views || 0} views</span>
                        <span style={{ fontSize: 11, color: ink2, display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} /> {listing.inquiries || 0} inquiries</span>
                        <span style={{ fontSize: 11, color: ink2 }}>Listed: {listing.createdAt ? new Date(listing.createdAt.toDate()).toLocaleDateString() : 'Recently'}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button 
                        onClick={() => handleDeleteListing(listing.id)}
                        style={{ padding: '8px', background: 'rgba(220,38,38,0.1)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#dc2626' }}
                        title="Delete listing">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <SellerPropertyUpload 
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchListings();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}