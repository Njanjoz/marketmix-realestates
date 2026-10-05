// src/components/dashboards/SellerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import SellerPropertyUpload from '../seller/SellerPropertyUpload';
import SellerPropertyEdit from '../seller/SellerPropertyEdit';
import { Building, Eye, MessageSquare, TrendingUp, Plus, Edit, Trash2, MapPin, Bed, Bath, Square, DollarSign, Loader, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { resolvePropertyImage } from '../../utils/propertyMapping';
import PromotePropertyModal from '../PromotePropertyModal';

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
const green = '#10b981';
const greenLight = 'rgba(16,185,129,0.12)';
const red = '#dc2626';
const redLight = 'rgba(220,38,38,0.12)';
const yellow = '#f59e0b';
const yellowLight = 'rgba(245,158,11,0.12)';

function ApprovalBadge({ status }) {
  switch(status) {
    case 'approved':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: greenLight, color: green, fontSize: 11 }}>
          <CheckCircle size={12} /> Approved
        </span>
      );
    case 'rejected':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: redLight, color: red, fontSize: 11 }}>
          <XCircle size={12} /> Rejected
        </span>
      );
    default:
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: yellowLight, color: yellow, fontSize: 11 }}>
          <Clock size={12} /> Pending Review
        </span>
      );
  }
}

function StatusBadge({ status }) {
  const statusMeta = {
    active: { label: 'Active', bg: 'rgba(30,110,66,0.12)', color: '#1e6e42' },
    pending: { label: 'Pending', bg: 'rgba(122,90,0,0.11)', color: '#7a5a00' },
    sold: { label: 'Sold', bg: 'rgba(139,26,26,0.11)', color: '#8b1a1a' },
  };
  const m = statusMeta[status] || statusMeta.active;
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, background: m.bg, color: m.color, fontSize: 10 }}>
      {m.label}
    </span>
  );
}

const maskViewerName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'MarketMix member';
  return parts.map((part) => `${part[0]}•••`).join(' ');
};

const maskViewerEmail = (email = '') => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'Email hidden';
  const domainParts = domain.split('.');
  const topLevelDomain = domainParts.pop() || '';
  const maskedDomain = domainParts.map((part) => `${part[0] || ''}•••`).join('.') || '•••';
  return `${local[0]}•••@${maskedDomain}${topLevelDomain ? `.${topLevelDomain}` : ''}`;
};

function ListingViewers({ listing, views, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const listingViews = views.filter((view) => view.propertyId === listing.id);

  return (
    <section style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${rule}` }}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 4px', border: 0, background: 'transparent', color: ink, textAlign: 'left', cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Eye size={16} color={orange} />
          <span>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>
              {listingViews.length} unique {listingViews.length === 1 ? 'viewer' : 'viewers'}
            </span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 11, color: ink2 }}>
              Signed-in visitors to this property's details; contact info is masked.
            </span>
          </span>
        </span>
        <ChevronDown size={16} style={{ flex: '0 0 auto', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }} />
      </button>

      {expanded && (listingViews.length === 0 ? (
        <p style={{ margin: '8px 4px 2px', color: ink2, fontSize: 12 }}>
          No signed-in visitors have opened this property's details yet.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10, maxHeight: 340, overflowY: 'auto', padding: '8px 2px 2px' }}>
          {listingViews.map((view) => {
            const viewedAt = view.lastViewedAt?.toDate ? view.lastViewedAt.toDate().toLocaleString() : 'Recently';
            return (
              <article key={view.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, padding: 12, background: 'rgba(255,255,255,0.55)', border: `1px solid ${rule}`, borderRadius: 12 }}>
                <div aria-hidden="true" style={{ display: 'grid', placeItems: 'center', flex: '0 0 36px', width: 36, height: 36, borderRadius: '50%', background: orangeLight, color: orange, fontWeight: 700 }}>
                  {(view.viewerName || 'M').trim().charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{maskViewerName(view.viewerName)}</div>
                  <div title="Partially masked for privacy" style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 10, color: ink2, filter: 'blur(0.7px)' }}>
                    {maskViewerEmail(view.viewerEmail)}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 10, color: ink3 }}>{viewedAt}</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/messages?propertyId=${encodeURIComponent(view.propertyId)}&userId=${encodeURIComponent(view.viewerId)}`)}
                  style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 5, border: 0, borderRadius: 9, padding: '7px 9px', background: orange, color: '#fff', fontSize: 10, cursor: 'pointer' }}
                >
                  <MessageSquare size={12} /> Message
                </button>
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}

export default function SellerDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [propertyViews, setPropertyViews] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [promoteProperty, setPromoteProperty] = useState(null);
  const [stats, setStats] = useState({ 
    activeListings: 0, 
    totalViews: 0, 
    inquiries: 0, 
    totalValue: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const listingsRef = collection(db, 'properties');
      const q = query(listingsRef, where('userId', '==', currentUser?.uid));
      const snapshot = await getDocs(q);
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const listingsData = allData.filter(p => p.approvalStatus !== 'draft' && p.status !== 'draft');
      const draftsData = allData.filter(p => p.approvalStatus === 'draft' || p.status === 'draft');

      listingsData.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setListings(listingsData);
      setDrafts(draftsData);
      
      const active = listingsData.filter(p => p.status === 'active' && p.approvalStatus === 'approved').length;
      const views = listingsData.reduce((sum, p) => sum + (p.views || 0), 0);
      const inquiries = listingsData.reduce((sum, p) => sum + (p.inquiries || 0), 0);
      const totalValue = listingsData.reduce((sum, p) => sum + (p.price || 0), 0);
      const pendingApproval = listingsData.filter(p => p.approvalStatus === 'pending' || !p.approvalStatus).length;
      const approved = listingsData.filter(p => p.approvalStatus === 'approved').length;
      const rejected = listingsData.filter(p => p.approvalStatus === 'rejected').length;
      
      setStats({
        activeListings: active,
        totalViews: views,
        inquiries: inquiries,
        totalValue: totalValue,
        pendingApproval: pendingApproval,
        approved: approved,
        rejected: rejected
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.uid) return undefined;
    fetchListings();
    const viewsQuery = query(
      collection(db, 'propertyViews'),
      where('sellerId', '==', currentUser.uid)
    );
    return onSnapshot(viewsQuery, (snapshot) => {
      const views = snapshot.docs.map((viewDoc) => ({ id: viewDoc.id, ...viewDoc.data() }));
      views.sort((a, b) => {
        const timeA = a.lastViewedAt?.toDate ? a.lastViewedAt.toDate().getTime() : 0;
        const timeB = b.lastViewedAt?.toDate ? b.lastViewedAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setPropertyViews(views);
    }, (error) => {
      console.error('Error listening for property viewers:', error);
    });
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

  const handleEditClick = (listing) => {
    setEditingProperty(listing);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchListings();
    setShowEditModal(false);
    setEditingProperty(null);
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
        <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
            Seller <em style={{ fontStyle: 'italic', color: orange }}>Dashboard</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: orange, opacity: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <button 
              onClick={() => { setActiveDraft(null); setShowUploadModal(true); }}
              style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: orange, background: orangeLight, border: `1px solid ${orange}40`, borderRadius: 20, padding: '7px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> List Property
            </button>
          </div>
        </nav>

        <div style={{ ...glass, padding: '24px 28px', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400 }}>Welcome back, {userProfile?.name?.split(' ')[0] || 'Seller'}!</div>
            <div style={{ fontSize: 13, color: ink2, marginTop: 4 }}>Manage your property listings, track inquiries, and grow your real estate portfolio.</div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color={yellow} />
              <span style={{ fontSize: 12 }}><strong>{stats.pendingApproval}</strong> Pending Review</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} color={green} />
              <span style={{ fontSize: 12 }}><strong>{stats.approved}</strong> Approved</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={14} color={red} />
              <span style={{ fontSize: 12 }}><strong>{stats.rejected}</strong> Rejected</span>
            </div>
          </div>
        </div>

        {/* Unfinished Drafts Banner */}
        {drafts.map(draft => (
          <div key={draft.id} style={{ ...glass, padding: '20px 24px', marginBottom: 24, border: '1px solid #ea580c40', background: 'rgba(234,88,12,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: orange, fontWeight: 500, letterSpacing: '0.1em' }}>Unfinished Draft</div>
                <div style={{ fontFamily: serif, fontSize: 20, marginTop: 2 }}>{draft.title || draft.propertyName || 'Untitled Property Draft'}</div>
                <div style={{ fontSize: 12, color: ink2, marginTop: 2 }}>You have an unfinished property upload. Continue where you left off.</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setActiveDraft(draft); setShowUploadModal(true); }}
                  style={{ background: orange, color: '#fff', border: 'none', borderRadius: 16, padding: '9px 18px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}
                >
                  Continue Adding Property
                </button>
                <button
                  onClick={() => handleDeleteListing(draft.id)}
                  style={{ background: 'transparent', color: red, border: `1px solid ${red}40`, borderRadius: 16, padding: '9px 14px', fontSize: 12, cursor: 'pointer' }}
                >
                  Delete Draft
                </button>
              </div>
            </div>
          </div>
        ))}

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

        <div style={{ ...glass, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
            <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Your Property Listings</span>
            <button 
              onClick={() => { setActiveDraft(null); setShowUploadModal(true); }}
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
                onClick={() => { setActiveDraft(null); setShowUploadModal(true); }}
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
                    <img 
                      src={resolvePropertyImage(listing) || 'https://placehold.co/120x80'} 
                      alt={listing.title}
                      style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 12 }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{listing.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: ink2, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={12} /> {listing.location || 'Location specified'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <DollarSign size={12} /> KES {listing.price?.toLocaleString()}
                            </span>
                            {listing.bedrooms > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Bed size={12} /> {listing.bedrooms} Beds
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <StatusBadge status={listing.status} />
                          <ApprovalBadge status={listing.approvalStatus} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: `1px solid ${rule}` }}>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: ink2 }}>
                          <span>👁 {listing.views || 0} views</span>
                          <span>💬 {listing.inquiries || 0} inquiries</span>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => setPromoteProperty(listing)}
                            style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.35)', color: green, borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            Promote
                          </button>
                          <button 
                            onClick={() => handleEditClick(listing)}
                            style={{ background: 'rgba(255,255,255,0.8)', border: `1px solid ${rule}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Edit size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteListing(listing.id)}
                            style={{ background: redLight, border: `1px solid ${red}30`, color: red, borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ListingViewers listing={listing} views={propertyViews} navigate={navigate} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <SellerPropertyUpload
          onClose={() => { setShowUploadModal(false); setActiveDraft(null); }}
          onSuccess={() => { fetchListings(); setShowUploadModal(false); setActiveDraft(null); }}
          existingDraft={activeDraft ? { propertyId: activeDraft.id, data: activeDraft, stepIndex: activeDraft.stepIndex || 0 } : null}
        />
      )}

      {showEditModal && editingProperty && (
        <SellerPropertyEdit
          property={editingProperty}
          onClose={() => { setShowEditModal(false); setEditingProperty(null); }}
          onSuccess={handleEditSuccess}
        />
      )}

      {promoteProperty && (
        <PromotePropertyModal
          property={promoteProperty}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setPromoteProperty(null)}
        />
      )}
    </div>
  );
}
