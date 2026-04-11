// src/components/dashboards/ModeratorDashboard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, CheckCircle, XCircle, Clock, Eye, Shield } from 'lucide-react';

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
const purple = '#7c3aed';
const purpleLight = 'rgba(124,58,237,0.12)';

export default function ModeratorDashboard() {
  const [reportedItems] = useState([
    { id: 1, type: 'property', title: 'Suspicious Listing', reportedBy: 'John Doe', reason: 'Fake listing', date: '2 hours ago', status: 'pending' },
    { id: 2, type: 'user', title: 'Spam Account', reportedBy: 'Sarah Smith', reason: 'Spam messages', date: '5 hours ago', status: 'pending' },
    { id: 3, type: 'review', title: 'Inappropriate Review', reportedBy: 'Mike Johnson', reason: 'Harassment', date: '1 day ago', status: 'reviewing' },
  ]);

  const stats = [
    { label: 'Pending Reports', value: '12', icon: Flag, change: '+3' },
    { label: 'Resolved Today', value: '8', icon: CheckCircle, change: '+5' },
    { label: 'Active Reviews', value: '24', icon: Eye, change: '+2' },
    { label: 'Actions Taken', value: '156', icon: Shield, change: '+12%' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(145deg, #f3e8ff 0%, #e9d5ff 30%, #fae8ff 60%, #e9d5ff 100%)',
      minHeight: '100vh',
      padding: '32px 40px 56px',
      fontFamily: sans,
      fontWeight: 300,
      color: ink,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(139,92,246,0.08)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
            Moderator <em style={{ fontStyle: 'italic', color: purple }}>Control</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: purple, opacity: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ fontFamily: sans, fontSize: 11, color: ink2, background: 'rgba(255,255,255,0.18)', border: `1px solid ${rule}`, borderRadius: 20, padding: '7px 16px' }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </nav>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{ ...glass, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ background: purpleLight, borderRadius: 12, padding: '8px' }}>
                  <stat.icon size={20} color={purple} />
                </div>
                <span style={{ fontSize: 11, color: up }}>{stat.change}</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 32, fontWeight: 300 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: ink2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Reported Items */}
        <div style={{ ...glass, padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 14px', borderBottom: `1px solid ${rule}` }}>
            <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Reported Content</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ fontSize: 10, color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>Filter</button>
              <button style={{ fontSize: 10, color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>Export</button>
            </div>
          </div>

          {reportedItems.map((item, i) => (
            <motion.div key={item.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < reportedItems.length - 1 ? `1px solid ${rule}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: item.type === 'property' ? 'rgba(59,130,246,0.1)' : item.type === 'user' ? 'rgba(245,158,11,0.1)' : purpleLight, borderRadius: 12, padding: '10px' }}>
                  {item.type === 'property' ? <Eye size={18} color="#3b82f6" /> : item.type === 'user' ? <Flag size={18} color="#f59e0b" /> : <Shield size={18} color={purple} />}
                </div>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 500, color: ink }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: ink2 }}>Reported by {item.reportedBy} • {item.date}</div>
                  <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Reason: {item.reason}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ fontSize: 11, color: up, background: 'rgba(30,110,66,0.1)', border: `1px solid ${up}40`, borderRadius: 20, padding: '6px 14px', cursor: 'pointer' }}>Approve</button>
                <button style={{ fontSize: 11, color: '#dc2626', background: 'rgba(220,38,38,0.1)', border: '1px solid #dc262640', borderRadius: 20, padding: '6px 14px', cursor: 'pointer' }}>Remove</button>
                <button style={{ fontSize: 11, color: purple, background: purpleLight, border: `1px solid ${purple}40`, borderRadius: 20, padding: '6px 14px', cursor: 'pointer' }}>Review</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}