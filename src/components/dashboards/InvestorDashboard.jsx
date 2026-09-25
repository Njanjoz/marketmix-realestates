// src/components/dashboards/InvestorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

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
const purple = '#7c3aed';
const purpleLight = 'rgba(124,58,237,0.12)';

// Mock data for investor
const portfolioStats = [
  { label: 'Annual return', value: '24.8%', delta: '↑ +3.2 pts YoY' },
  { label: 'Positions', value: '12', delta: '↑ 2 new' },
  { label: 'Risk level', value: 'Medium', delta: '— Unchanged', flat: true },
  { label: 'Unrealised gain', value: '+38M', delta: '↑ KES YTD' },
];

const allocation = [
  { name: 'Residential', pct: 49, value: 'KES 120M' },
  { name: 'Commercial', pct: 35, value: 'KES 85M' },
  { name: 'Industrial', pct: 10, value: 'KES 25M' },
  { name: 'Land', pct: 6, value: 'KES 15M' },
];

const trends = [
  { name: 'Luxury', desc: 'High-end demand', pct: '+12.4%', soft: false },
  { name: 'Residential', desc: 'Suburban surge', pct: '+8.2%', soft: false },
  { name: 'Commercial', desc: 'Recovery phase', pct: '+5.7%', soft: false },
  { name: 'Rental', desc: 'Yields stable', pct: '+2.1%', soft: true },
];

const riskPositions = [
  { name: 'Commercial', level: 'low', width: '100%' },
  { name: 'Westlands', level: 'medium', width: '80%' },
  { name: 'Karen', level: 'medium', width: '80%' },
  { name: 'Student', level: 'high', width: '60%' },
];

const opportunities = [
  { name: 'Luxury Apartment Complex', location: 'Westlands', roi: '28%', min: 'KES 10M', risk: 'medium' },
  { name: 'Commercial REIT', location: 'Nairobi CBD', roi: '22%', min: 'KES 5M', risk: 'low' },
  { name: 'Student Housing', location: 'Kileleshwa', roi: '32%', min: 'KES 15M', risk: 'high' },
  { name: 'Mixed-Use Development', location: 'Karen', roi: '26%', min: 'KES 20M', risk: 'medium' },
];

const riskMeta = {
  low: { label: 'Low', bg: 'rgba(30,110,66,0.14)', color: '#1e6e42', border: 'rgba(30,110,66,0.25)' },
  medium: { label: 'Medium', bg: 'rgba(122,90,0,0.12)', color: '#7a5a00', border: 'rgba(122,90,0,0.22)' },
  high: { label: 'High', bg: 'rgba(139,26,26,0.12)', color: '#8b1a1a', border: 'rgba(139,26,26,0.22)' },
};

function PanelLabel({ children, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${rule}` }}>
      <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3, fontWeight: 400 }}>{children}</span>
      {action && (
        <button onClick={onAction} style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>{action}</button>
      )}
    </div>
  );
}

function Badge({ status }) {
  const m = riskMeta[status];
  return (
    <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, padding: '3px 9px', borderRadius: 20, background: m.bg, color: m.color, border: `1px solid ${m.border}`, letterSpacing: '0.04em' }}>
      {m.label}
    </span>
  );
}

export default function InvestorDashboard() {
  const [totalValue, setTotalValue] = useState('245');
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propertiesRef = collection(db, 'properties');
        const snapshot = await getDocs(propertiesRef);
        const total = snapshot.size * 15; // Mock calculation
        setTotalValue(total.toLocaleString());
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(145deg, #f3e8ff 0%, #e9d5ff 30%, #fae8ff 60%, #f3e8ff 100%)',
      minHeight: '100vh',
      padding: '32px 40px 56px',
      fontFamily: sans,
      fontWeight: 300,
      color: ink,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Navigation */}
        <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
            Investor <em style={{ fontStyle: 'italic', color: purple }}>Overview</em>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: purple, opacity: 1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ink3, opacity: 0.35 }} />
            <button style={{ fontFamily: sans, fontSize: 11, fontWeight: 400, color: purple, background: purpleLight, border: `1px solid ${purple}40`, borderRadius: 20, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.03em' }}>
              + New investment
            </button>
          </div>
        </nav>

        {/* Hero row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
          <div style={{ ...glass, padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
            <div>
              <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>
                Q1 2025 &nbsp;·&nbsp; Nairobi, KE
              </div>
              <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, lineHeight: 1, color: ink, letterSpacing: -2, marginBottom: 6 }}>
                {totalValue}<sup style={{ fontSize: 22, verticalAlign: 'super', letterSpacing: -0.5, opacity: 0.5, fontWeight: 300 }}>M</sup>
              </div>
              <div style={{ fontFamily: sans, fontSize: 13, color: ink2, fontWeight: 300, lineHeight: 1.5 }}>
                Total portfolio value in KES across 12 active positions.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${rule}` }}>
              <span style={{ fontFamily: sans, fontSize: 11, padding: '4px 10px', borderRadius: 20, background: purpleLight, color: purple, border: `1px solid ${purple}40` }}>
                ↑ 18.2% this quarter
              </span>
              <span style={{ fontFamily: sans, fontSize: 11, color: ink3 }}>3.2 pts above benchmark</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.45)' }}>
            {portfolioStats.map((s, idx) => (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(20px)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3 }}>{s.label}</div>
                <div style={{ fontFamily: serif, fontSize: s.value.length > 6 ? 22 : 32, fontWeight: 300, color: ink, letterSpacing: -1, lineHeight: 1, margin: '6px 0 4px' }}>{s.value}</div>
                <div style={{ fontFamily: sans, fontSize: 11, color: s.flat ? ink3 : up }}>{s.delta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mid row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Allocation Panel */}
          <div style={{ ...glass, padding: '24px 24px 20px' }}>
            <PanelLabel>Allocation</PanelLabel>
            {allocation.map((a, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontFamily: sans, fontSize: 13, color: ink }}>{a.name}</span>
                  <span style={{ fontFamily: serif, fontSize: 16, color: ink2, fontWeight: 300 }}>{a.pct}%</span>
                </div>
                <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', borderRadius: 2, background: purple, opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Trends Panel */}
          <div style={{ ...glass, padding: '24px 24px 20px' }}>
            <PanelLabel>Market trends</PanelLabel>
            {trends.map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: `${i === 0 ? 0 : 11}px 0 11px`, borderBottom: i < trends.length - 1 ? `1px solid ${rule}` : 'none' }}>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: ink }}>{t.name}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: ink3, marginTop: 1 }}>{t.desc}</div>
                </div>
                <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, letterSpacing: -0.5, color: t.soft ? '#7a5a00' : up }}>{t.pct}</div>
              </div>
            ))}
          </div>

          {/* Risk Panel */}
          <div style={{ ...glass, padding: '24px 24px 20px' }}>
            <PanelLabel>Risk by position</PanelLabel>
            {riskPositions.map((r, i) => {
              const m = riskMeta[r.level];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `${i === 0 ? 0 : 10}px 0 10px`, borderBottom: i < riskPositions.length - 1 ? `1px solid ${rule}` : 'none' }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: ink, minWidth: 64 }}>{r.name}</span>
                  <div style={{ flex: 1, height: 20, background: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: r.width, height: '100%', background: m.bg, borderRadius: 4, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                      <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: m.color }}>{m.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Opportunities Table */}
        <div style={{ ...glass, padding: '0 26px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 14px', borderBottom: `1px solid ${rule}` }}>
            <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Open opportunities</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}>Filter</button>
              <button style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}>Export</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 96px 80px 60px', gap: 8, padding: '10px 0 8px', borderBottom: `1px solid ${rule}` }}>
            {['Property', 'ROI', 'Min. invest', 'Risk', ''].map((h, i) => (
              <span key={i} style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink3, textAlign: i >= 1 && i <= 2 ? 'right' : 'left' }}>{h}</span>
            ))}
          </div>

          {opportunities.map((o, i) => {
            const m = riskMeta[o.risk];
            return (
              <motion.div
                key={i}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 70px 96px 80px 60px', gap: 8, alignItems: 'center', padding: '14px 0', borderBottom: i < opportunities.length - 1 ? `1px solid ${rule}` : 'none' }}
              >
                <div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: ink }}>{o.name}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: ink3, marginTop: 1 }}>{o.location}</div>
                </div>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: ink, letterSpacing: -0.5, textAlign: 'right' }}>{o.roi}</div>
                <div style={{ fontFamily: sans, fontSize: 12, color: ink2, textAlign: 'right' }}>{o.min}</div>
                <div><Badge status={o.risk} /></div>
                <button style={{ fontFamily: sans, fontSize: 11, color: purple, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', letterSpacing: '0.04em' }}>Invest →</button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}