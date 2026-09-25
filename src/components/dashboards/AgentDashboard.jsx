// src/components/dashboards/AgentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    inquiries: 0,
    commission: '0'
  });

  useEffect(() => {
    const fetchAgentData = async () => {
      setLoading(true);
      try {
        // Fetch agent's listings
        const listingsRef = collection(db, 'properties');
        const q = query(listingsRef, where('agentId', '==', currentUser?.uid), orderBy('createdAt', 'desc'));
        const listingsSnap = await getDocs(q);
        const listingsData = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(listingsData);

        // Calculate stats
        const totalViews = listingsData.reduce((sum, p) => sum + (p.views || 0), 0);
        const inquiries = listingsData.reduce((sum, p) => sum + (p.inquiries || 0), 0);
        
        setStats({
          activeListings: listingsData.filter(p => p.status === 'active').length,
          totalViews: totalViews,
          inquiries: inquiries,
          commission: '2.4M'
        });

        // Mock leads data (replace with actual Firestore query)
        setLeads([
          { name: 'Emma Davis', property: '3-Bed Apartment', budget: 'KES 8M', status: 'Hot', time: '2 hours ago', phone: '+254 712 345 678' },
          { name: 'Robert Brown', property: 'Commercial Space', budget: 'KES 45M', status: 'Warm', time: '1 day ago', phone: '+254 723 456 789' },
          { name: 'Lisa Taylor', property: 'Luxury Villa', budget: 'KES 120M', status: 'New', time: '2 days ago', phone: '+254 734 567 890' },
        ]);

        setAppointments([
          { time: '10:00 AM', client: 'John Smith', type: 'Property Viewing', location: 'Karen, Nairobi', phone: '+254 745 678 901' },
          { time: '2:00 PM', client: 'Sarah Johnson', type: 'Contract Signing', location: 'Westlands, Nairobi', phone: '+254 756 789 012' },
          { time: '4:30 PM', client: 'Mike Wilson', type: 'Initial Consultation', location: 'Online', phone: '+254 767 890 123' },
        ]);

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
    { label: 'Commission', value: `KES ${stats.commission}`, delta: '+8%', icon: <DollarSign size={20} /> },
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
              <motion.div key={i} whileHover={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
                style={{ background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 16, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: ink }}>{listing.title}</div>
                    <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 300, color: agentBlue }}>KES {listing.price?.toLocaleString()}</div>
                  </div>
                  <span style={{ fontFamily: sans, fontSize: 10, padding: '3px 9px', borderRadius: 20, background: agentBlueLight, color: agentBlue, border: `1px solid ${agentBlue}40` }}>
                    {listing.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: ink2 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {listing.views || 0} views</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} /> {listing.inquiries || 0} inquiries</span>
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < appointments.length - 1 ? `1px solid ${rule}` : 'none' }}>
                <div style={{ background: agentBlueLight, borderRadius: 12, padding: '8px' }}>
                  <Calendar size={18} color={agentBlue} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: ink }}>{apt.time} - {apt.client}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: ink2 }}>{apt.type} • {apt.location}</div>
                </div>
                <button style={{ fontFamily: sans, fontSize: 11, color: agentBlue, background: 'none', border: 'none', cursor: 'pointer' }}>Contact</button>
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
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < leads.length - 1 ? `1px solid ${rule}` : 'none' }}>
                <div style={{ background: lead.status === 'Hot' ? 'rgba(220,38,38,0.1)' : lead.status === 'Warm' ? 'rgba(245,158,11,0.1)' : agentBlueLight, borderRadius: 12, padding: '8px' }}>
                  <Users size={18} color={lead.status === 'Hot' ? '#dc2626' : lead.status === 'Warm' ? '#f59e0b' : agentBlue} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: ink }}>{lead.name}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: ink2 }}>{lead.property} • {lead.budget}</div>
                </div>
                <span style={{ fontFamily: sans, fontSize: 10, padding: '3px 8px', borderRadius: 20, background: lead.status === 'Hot' ? 'rgba(220,38,38,0.1)' : lead.status === 'Warm' ? 'rgba(245,158,11,0.1)' : agentBlueLight, color: lead.status === 'Hot' ? '#dc2626' : lead.status === 'Warm' ? '#f59e0b' : agentBlue }}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;