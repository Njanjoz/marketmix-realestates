// src/components/dashboards/AgentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, getDoc, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import PromotePropertyModal from '../PromotePropertyModal';
import { 
  Building, TrendingUp, DollarSign, Users, Calendar, 
  MessageSquare, CheckCircle, Star, Plus, Eye, Home,
  Phone, Mail, MapPin, Clock, Award, Target, BarChart
} from 'lucide-react';

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
const up = '#1e6e42';
const rule = 'rgba(255,255,255,0.2)';

// Agent specific colors
const agentBlue = '#2563eb';
const agentBlueLight = 'rgba(37,99,235,0.12)';

const AgentDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [listings, setListings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalBusy, setWithdrawalBusy] = useState(false);
  const [withdrawalReceipt, setWithdrawalReceipt] = useState(null);
  const [promoteProperty, setPromoteProperty] = useState(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    inquiries: 0,
    commission: '0'
  });

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    if (typeof timestamp?.toDate === 'function') {
      const date = timestamp.toDate();
      const diffMin = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
      if (diffMin < 60) return `${diffMin} min ago`;
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return `${diffHours} hr ago`;
      const diffDays = Math.round(diffHours / 24);
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    return 'Recently';
  };

  const updateInquiryStatus = async (id, nextStatus) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), {
        status: nextStatus,
        updatedAt: new Date(),
      });
      setInquiries(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
    } catch (error) {
      console.error('Error updating inquiry status:', error);
    }
  };

  const updateSiteVisitStatus = async (id, nextStatus) => {
    try {
      const appointment = appointments.find((item) => item.id === id);
      const collectionName = appointment?.sourceCollection || 'siteVisits';
      await updateDoc(doc(db, collectionName, id), {
        status: nextStatus,
        updatedAt: new Date(),
      });
      setAppointments(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
    } catch (error) {
      console.error('Error updating site visit status:', error);
    }
  };

  const requestViewingWithdrawal = async () => {
    const amount = Number(window.prompt(`Withdrawable balance: KSh ${stats.commission}. Enter a whole-shilling amount to withdraw.`));
    if (!Number.isInteger(amount) || amount <= 0) return;
    const previewFee = amount < 100 ? 10 : amount <= 1000 ? 20 : 30;
    if (amount <= previewFee) return window.alert(`The withdrawal must be greater than its KSh ${previewFee} fee.`);
    const profilePhone = userProfile?.mpesaPhone || userProfile?.phoneNumber || userProfile?.phone || '';
    const phoneNumber = String(window.prompt('M-Pesa number to receive the withdrawal:', profilePhone) || '').trim();
    if (!phoneNumber) return;
    if (!window.confirm(`Booking-package withdrawal\n\nAmount: KSh ${amount.toLocaleString('en-KE')}\nWithdrawal fee: KSh ${previewFee}\nYou receive: KSh ${(amount - previewFee).toLocaleString('en-KE')}\n\nFee schedule: KSh 10 below KSh 100; KSh 20 from KSh 100 to KSh 1,000; KSh 30 above KSh 1,000. Continue?`)) return;
    setWithdrawalBusy(true);
    try {
      const token = await currentUser.getIdToken();
      const backend = import.meta.env.VITE_BACKEND_URL || 'https://marketmix-api-native.johnnjanjo1.workers.dev';
      const response = await fetch(`${backend}/api/site-seeing/agent-withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount, phoneNumber }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not request the withdrawal.');
      setStats((previous) => ({ ...previous, commission: Math.max(0, Number(previous.commission.replace(/,/g, '') || 0) - amount).toLocaleString('en-KE') }));
      setWithdrawalReceipt({ ...result, requestedAmount: result.requestedAmount ?? amount, phoneNumber, createdAt: new Date() });
    } catch (error) { window.alert(error.message || 'Could not request the withdrawal.'); }
    finally { setWithdrawalBusy(false); }
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      setLoading(true);
      try {
        if (!currentUser?.uid) {
          setListings([]);
          setInquiries([]);
          setAppointments([]);
          setLeads([]);
          setLoading(false);
          return;
        }

        const listingsRef = collection(db, 'properties');
        const listingsSnap = await getDocs(listingsRef);
        const allListings = listingsSnap.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
          .filter(item => item.agentId === currentUser.uid || item.ownerId === currentUser.uid || item.sellerId === currentUser.uid);

        setListings(allListings);

        const inquirySnap = await getDocs(query(
          collection(db, 'inquiries'),
          where('agentId', '==', currentUser.uid)
        ));
        const inquiryData = inquirySnap.docs
          .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const siteVisitSnap = await getDocs(query(
          collection(db, 'siteVisits'),
          where('agentId', '==', currentUser.uid)
        ));
        const visitData = siteVisitSnap.docs
          .map(docSnap => ({ id: docSnap.id, sourceCollection: 'siteVisits', ...docSnap.data() }));

        const sightseeingBookingSnap = await getDocs(query(
          collection(db, 'sightseeingBookings'),
          where('agentId', '==', currentUser.uid)
        ));
        const sightseeingBookings = sightseeingBookingSnap.docs
          .map(docSnap => {
            const booking = docSnap.data();
            return {
              id: docSnap.id,
              sourceCollection: 'sightseeingBookings',
              availabilityStatus: booking.availabilityStatus,
              propertyTitle: booking.propertyTitle,
              buyerName: booking.customerName || booking.userEmail?.split('@')[0] || 'Customer',
              type: `${booking.packageName || 'Guided viewing'} · ${booking.propertyLocation || ''}`,
              requestedDate: booking.preferredViewingDate || 'Schedule pending',
              requestedTime: booking.preferredViewingTime || 'Time to confirm',
              status: booking.status,
              createdAt: booking.createdAt,
            };
          });
        const allAppointments = [...visitData, ...sightseeingBookings]
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const activeListings = allListings.filter(item => {
          const candidate = (item.status || item.availabilityStatus || item.approvalStatus || 'active').toLowerCase();
          return ['active', 'available', 'approved', 'verified', 'published'].includes(candidate) || item.verificationStatus === 'verified';
        }).length;

        const totalViews = allListings.reduce((sum, item) => sum + Number(item.views || 0), 0);
        const inquiryCount = inquiryData.length;
        let withdrawableCommission = 0;
        try {
          const walletSnap = await getDoc(doc(db, 'agentViewingWallets', currentUser.uid));
          if (walletSnap.exists()) withdrawableCommission = Number(walletSnap.data().withdrawableBalance || 0);
        } catch (walletError) {
          console.warn('Could not load viewing commission balance:', walletError);
        }

        setInquiries(inquiryData);
        setAppointments(allAppointments);
        setStats({
          activeListings,
          totalViews,
          inquiries: inquiryCount,
          commission: withdrawableCommission.toLocaleString('en-KE')
        });

        setLeads(inquiryData.slice(0, 3).map((item) => ({
          id: item.id,
          name: item.buyerName || item.name || item.buyerEmail?.split('@')[0] || 'Buyer',
          property: item.propertyTitle || 'Property inquiry',
          budget: item.budget || 'Flexible',
          status: item.status === 'pending' ? 'New' : item.status === 'contacted' ? 'Warm' : 'Hot',
          time: formatRelativeTime(item.createdAt),
          phone: item.phone || 'Not shared',
        })));
      } catch (error) {
        console.error('Error fetching agent data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchAgentData();
  }, [currentUser]);

  const statsCards = [
    { label: 'Active Listings', value: stats.activeListings.toString(), delta: '+3', icon: <Building size={20} /> },
    { label: 'Total Views', value: stats.totalViews.toString(), delta: '+12%', icon: <Eye size={20} /> },
    { label: 'Inquiries', value: stats.inquiries.toString(), delta: '+18%', icon: <MessageSquare size={20} /> },
    { label: 'Withdrawable site-seeing balance', value: `KES ${stats.commission}`, delta: 'Package withdrawals: KSh 10 (<100), KSh 20 (100–1,000), KSh 30 (>1,000)', icon: <DollarSign size={20} /> },
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg, #dbeafe 0%, #bfdbfe 30%, #e0e7ff 60%, #c7d2fe 100%)',
      minHeight: '100vh',
      padding: '32px 40px 56px',
      fontFamily: sans,
      fontWeight: 300,
      color: ink,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
            Agent <em style={{ fontStyle: 'italic', color: agentBlue }}>Dashboard</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: agentBlue, opacity: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <button style={{
              fontFamily: sans, fontSize: 11, fontWeight: 400, color: agentBlue,
              background: agentBlueLight, border: `1px solid ${agentBlue}40`,
              borderRadius: 20, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.03em',
            }}>
              + New Listing
            </button>
          </div>
        </nav>

        {/* Hero Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
          {/* Hero Card */}
          <div style={{ ...glass, padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>
                Agent Performance &nbsp;·&nbsp; {new Date().getFullYear()}
              </div>
              <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, lineHeight: 1, color: ink, letterSpacing: -2, marginBottom: 6 }}>
                {stats.activeListings}<sup style={{ fontSize: 22, verticalAlign: 'super', letterSpacing: -0.5, opacity: 0.5, fontWeight: 300 }}>active</sup>
              </div>
              <div style={{ fontFamily: sans, fontSize: 13, color: ink2, fontWeight: 300, lineHeight: 1.5 }}>
                Active listings generating {stats.totalViews} views this month.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${rule}` }}>
              <span style={{ fontFamily: sans, fontSize: 11, padding: '4px 10px', borderRadius: 20, background: agentBlueLight, color: agentBlue, border: `1px solid ${agentBlue}40` }}>
                ↑ 18% conversion rate
              </span>
              <span style={{ fontFamily: sans, fontSize: 11, color: ink3 }}>{stats.inquiries} inquiries this month</span>
            </div>
          </div>

          {/* Stats Mosaic */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.45)' }}>
            {statsCards.map((s, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(20px)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3 }}>{s.label}</div>
                <div style={{ fontFamily: serif, fontSize: s.value.length > 6 ? 22 : 32, fontWeight: 300, color: ink, letterSpacing: -1, lineHeight: 1, margin: '6px 0 4px' }}>{s.value}</div>
                <div style={{ fontFamily: sans, fontSize: 11, color: up }}>{s.delta}</div>
                {idx === 3 && <button type="button" onClick={requestViewingWithdrawal} disabled={withdrawalBusy || Number(stats.commission.replace(/,/g, '') || 0) <= 0} style={{ marginTop: 10, alignSelf: 'flex-start', fontFamily: sans, fontSize: 11, fontWeight: 700, color: '#fff', background: agentBlue, border: 'none', borderRadius: 9, padding: '8px 12px', cursor: withdrawalBusy ? 'wait' : 'pointer', opacity: withdrawalBusy ? 0.65 : 1 }}>{withdrawalBusy ? 'Requesting…' : 'Withdraw to M-Pesa'}</button>}
              </div>
            ))}
          </div>
        </div>

        {/* Active Listings */}
        <div style={{ ...glass, padding: '24px 26px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
            <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Active Listings</span>
            <button style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>View All →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {listings.slice(0, 3).map((listing, i) => (
              <motion.div key={listing.id || i} whileHover={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
                style={{ background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 16, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: ink }}>{listing.title}</div>
                    <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 300, color: agentBlue }}>KES {Number(listing.price || 0).toLocaleString()}</div>
                  </div>
                  <span style={{ fontFamily: sans, fontSize: 10, padding: '3px 9px', borderRadius: 20, background: agentBlueLight, color: agentBlue, border: `1px solid ${agentBlue}40` }}>
                    {(listing.status || listing.availabilityStatus || 'active').toString().charAt(0).toUpperCase() + (listing.status || listing.availabilityStatus || 'active').toString().slice(1) || 'Active'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: ink2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {listing.views || 0} views</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} /> {listing.inquiries || 0} inquiries</span>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setPromoteProperty(listing)}
                    style={{ fontFamily: sans, fontSize: 11, color: agentBlue, background: agentBlueLight, border: `1px solid ${agentBlue}40`, borderRadius: 999, padding: '7px 12px', cursor: 'pointer' }}
                  >
                    Promote
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Appointments & Leads */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Appointments */}
          <div style={{ ...glass, padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 14px', borderBottom: `1px solid ${rule}` }}>
              <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Upcoming Appointments</span>
              <button style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>Calendar →</button>
            </div>
            {appointments.map((apt, i) => (
              <div key={apt.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < appointments.length - 1 ? `1px solid ${rule}` : 'none' }}>
                <div style={{ background: agentBlueLight, borderRadius: 12, padding: '8px' }}>
                  <Calendar size={18} color={agentBlue} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: ink }}>
                    {apt.requestedDate || apt.time || 'Pending'} - {apt.buyerName || apt.client || 'Buyer'}
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: ink2 }}>
                    {apt.meetingPoint || apt.type || 'Property viewing'} • {apt.requestedTime || 'As scheduled'}
                  </div>
                </div>
                {apt.sourceCollection === 'sightseeingBookings' ? (apt.availabilityStatus === 'pending' ? <button type="button" onClick={() => { window.location.href = `/agent/viewing-availability/${encodeURIComponent(apt.id)}`; }} style={{ fontFamily: sans, fontSize: 10, color: '#166534', background: '#dcfce7', border: 'none', borderRadius: 8, padding: '7px 9px', cursor: 'pointer' }}>Submit live availability evidence</button> : <span style={{ fontFamily: sans, fontSize: 10, color: ink2 }}>{apt.status === 'awaiting_admin_confirmation' ? 'Waiting for admin to review photos and video' : apt.status === 'awaiting_admin_customer_update' ? 'Admin to update customer' : apt.availabilityStatus === 'available' ? 'Available' : apt.availabilityStatus === 'unavailable' ? 'Unavailable' : apt.status}</span>) : <button
                  type="button"
                  onClick={() => updateSiteVisitStatus(apt.id, apt.status === 'confirmed' ? 'completed' : 'confirmed')}
                  style={{ fontFamily: sans, fontSize: 11, color: agentBlue, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {apt.status === 'confirmed' ? 'Complete' : apt.status === 'queued' ? 'Accept' : 'Confirm'}
                </button>}
              </div>
            ))}
          </div>

          {/* Leads */}
          <div style={{ ...glass, padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 14px', borderBottom: `1px solid ${rule}` }}>
              <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Recent Leads</span>
              <button style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>Export →</button>
            </div>
            {leads.map((lead, i) => (
              <div key={lead.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < leads.length - 1 ? `1px solid ${rule}` : 'none' }}>
                <div style={{ background: lead.status === 'Hot' ? 'rgba(220,38,38,0.1)' : lead.status === 'Warm' ? 'rgba(245,158,11,0.1)' : agentBlueLight, borderRadius: 12, padding: '8px' }}>
                  <Users size={18} color={lead.status === 'Hot' ? '#dc2626' : lead.status === 'Warm' ? '#f59e0b' : agentBlue} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: ink }}>{lead.name}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: ink2 }}>{lead.property} • {lead.budget}</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateInquiryStatus(lead.id, 'contacted')}
                  style={{ fontFamily: sans, fontSize: 10, padding: '3px 8px', borderRadius: 20, background: lead.status === 'Hot' ? 'rgba(220,38,38,0.1)' : lead.status === 'Warm' ? 'rgba(245,158,11,0.1)' : agentBlueLight, color: lead.status === 'Hot' ? '#dc2626' : lead.status === 'Warm' ? '#f59e0b' : agentBlue, border: 'none', cursor: 'pointer' }}
                >
                  {lead.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {promoteProperty && (
        <PromotePropertyModal
          property={promoteProperty}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setPromoteProperty(null)}
        />
      )}
      {withdrawalReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
          <style>{`@media print { body * { visibility: hidden !important; } .withdrawal-receipt-print, .withdrawal-receipt-print * { visibility: visible !important; } .withdrawal-receipt-print { position: fixed !important; inset: 0 !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; } .withdrawal-receipt-actions { display: none !important; } }`}</style>
          <article className="withdrawal-receipt-print w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <header className="bg-emerald-950 px-6 py-7 text-center text-white">
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-emerald-200">MarketMix Real Estates</p>
              <h2 className="mt-2 text-2xl font-extrabold">Withdrawal receipt</h2>
              <p className="mt-1 text-xs text-emerald-100">Booking package earnings · M-Pesa</p>
              <span className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{withdrawalReceipt.status || 'PAYOUT_INITIATED'}</span>
            </header>
            <div className="space-y-4 p-6 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span className="text-slate-500">Withdrawal reference</span><span className="break-all text-right font-mono text-xs font-bold text-slate-900">{withdrawalReceipt.trackingId || withdrawalReceipt.withdrawalId || 'Pending'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">M-Pesa number</span><span className="font-semibold text-slate-900">{withdrawalReceipt.phoneNumber}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">Amount withdrawn</span><span className="font-semibold text-slate-900">KSh {Number(withdrawalReceipt.requestedAmount || 0).toLocaleString('en-KE')}</span></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">Withdrawal fee</span><span className="font-semibold text-rose-700">− KSh {Number(withdrawalReceipt.withdrawalFee || 0).toLocaleString('en-KE')}</span></div>
              <div className="flex justify-between gap-4 rounded-2xl bg-emerald-50 p-4"><span className="font-bold text-emerald-950">Net payout</span><span className="text-lg font-extrabold text-emerald-900">KSh {Number(withdrawalReceipt.netPayout || 0).toLocaleString('en-KE')}</span></div>
              <p className="text-xs text-slate-500">Requested {withdrawalReceipt.createdAt.toLocaleString('en-KE')}. Keep this receipt as proof of the withdrawal request; payout completion follows the payment provider’s status.</p>
            </div>
            <footer className="withdrawal-receipt-actions flex gap-3 border-t border-slate-100 p-5">
              <button type="button" onClick={() => window.print()} className="flex-1 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Save receipt (PDF)</button>
              <button type="button" onClick={() => setWithdrawalReceipt(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">Close</button>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
