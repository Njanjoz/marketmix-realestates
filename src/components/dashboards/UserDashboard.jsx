// src/components/dashboards/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Eye, Heart, MessageSquare, Calendar, Search, Home, Star } from 'lucide-react';

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
const rule = 'rgba(255,255,255,0.2)';
const emerald = '#059669';
const emeraldLight = 'rgba(5,150,105,0.12)';

export default function UserDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [stats, setStats] = useState({ viewed: 0, saved: 0, inquiries: 0, viewings: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch user's saved properties
        const favoritesRef = collection(db, 'favorites');
        const q = query(favoritesRef, where('userId', '==', currentUser?.uid));
        const snapshot = await getDocs(q);
        setStats(prev => ({ ...prev, saved: snapshot.size }));
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    if (currentUser) fetchUserStats();
  }, [currentUser]);

  const statCards = [
    { label: 'Properties Viewed', value: stats.viewed.toString(), icon: Eye, color: emerald },
    { label: 'Saved Properties', value: stats.saved.toString(), icon: Heart, color: '#dc2626' },
    { label: 'Inquiries Sent', value: stats.inquiries.toString(), icon: MessageSquare, color: emerald },
    { label: 'Upcoming Viewings', value: stats.viewings.toString(), icon: Calendar, color: '#f59e0b' },
  ];

  const quickActions = [
    { label: 'Search Properties', icon: Search, color: emerald, link: '/properties' },
    { label: 'View Favorites', icon: Heart, color: '#dc2626', link: '/favorites' },
    { label: 'My Messages', icon: MessageSquare, color: '#3b82f6', link: '/messages' },
    { label: 'Edit Profile', icon: Home, color: '#7c3aed', link: '/profile' },
  ];

  const activities = [
    { action: 'Viewed property in Karen', time: '2 hours ago', icon: Eye },
    { action: 'Saved luxury apartment', time: '1 day ago', icon: Heart },
    { action: 'Contacted agent about villa', time: '2 days ago', icon: MessageSquare },
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg, #d1fae5 0%, #a7f3d0 30%, #ecfdf5 60%, #d1fae5 100%)',
      minHeight: '100vh',
      padding: '32px 40px 56px',
      fontFamily: sans,
      fontWeight: 300,
      color: ink,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
            My <em style={{ fontStyle: 'italic', color: emerald }}>Dashboard</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: emerald, opacity: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ fontFamily: sans, fontSize: 11, color: ink2, background: 'rgba(255,255,255,0.18)', border: `1px solid ${rule}`, borderRadius: 20, padding: '7px 16px' }}>
              {userProfile?.name || currentUser?.email?.split('@')[0]}
            </div>
          </div>
        </nav>

        {/* Welcome Section */}
        <div style={{ ...glass, padding: '24px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 400 }}>Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}!</div>
            <div style={{ fontSize: 13, color: ink2, marginTop: 4 }}>Continue your property search or check your saved properties.</div>
          </div>
          <button style={{ background: emerald, color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontFamily: sans, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} /> Search Properties
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {statCards.map((stat, idx) => (
            <div key={idx} style={{ ...glass, padding: '20px' }}>
              <div style={{ background: emeraldLight, borderRadius: 12, padding: '8px', display: 'inline-block', marginBottom: 12 }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: ink2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Quick Actions */}
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
              <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Quick Actions</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {quickActions.map((action, idx) => (
                <button key={idx} style={{ background: 'rgba(255,255,255,0.38)', border: `1px solid ${rule}`, borderRadius: 16, padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ background: `${action.color}15`, borderRadius: 12, padding: '8px', display: 'inline-block', marginBottom: 8 }}>
                    <action.icon size={18} color={action.color} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: ink }}>{action.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
              <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Recent Activity</span>
            </div>
            {activities.map((activity, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: idx < activities.length - 1 ? `1px solid ${rule}` : 'none' }}>
                <div style={{ background: emeraldLight, borderRadius: 12, padding: '8px' }}>
                  <activity.icon size={16} color={emerald} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: ink }}>{activity.action}</div>
                  <div style={{ fontSize: 11, color: ink2 }}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}