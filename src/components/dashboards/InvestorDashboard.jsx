import React, { useState } from 'react';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const portfolioStats = [
  { label: 'Annual return',    value: '24.8%',   delta: '↑ +3.2 pts YoY' },
  { label: 'Positions',        value: '12',       delta: '↑ 2 new'        },
  { label: 'Risk level',       value: 'Medium',   delta: '— Unchanged',   flat: true },
  { label: 'Unrealised gain',  value: '+38M',     delta: '↑ KES YTD'     },
];

const allocation = [
  { name: 'Residential', pct: 49, value: 'KES 120M' },
  { name: 'Commercial',  pct: 35, value: 'KES 85M'  },
  { name: 'Industrial',  pct: 10, value: 'KES 25M'  },
  { name: 'Land',        pct: 6,  value: 'KES 15M'  },
];

const trends = [
  { name: 'Luxury',      desc: 'High-end demand',  pct: '+12.4%', soft: false },
  { name: 'Residential', desc: 'Suburban surge',   pct: '+8.2%',  soft: false },
  { name: 'Commercial',  desc: 'Recovery phase',   pct: '+5.7%',  soft: false },
  { name: 'Rental',      desc: 'Yields stable',    pct: '+2.1%',  soft: true  },
];

const riskPositions = [
  { name: 'Commercial', level: 'low',    width: '100%' },
  { name: 'Westlands',  level: 'medium', width: '80%'  },
  { name: 'Karen',      level: 'medium', width: '80%'  },
  { name: 'Student',    level: 'high',   width: '60%'  },
];

const opportunities = [
  { name: 'Luxury Apartment Complex', location: 'Westlands',   roi: '28%', min: 'KES 10M', risk: 'medium' },
  { name: 'Commercial REIT',          location: 'Nairobi CBD', roi: '22%', min: 'KES 5M',  risk: 'low'    },
  { name: 'Student Housing',          location: 'Kileleshwa',  roi: '32%', min: 'KES 15M', risk: 'high'   },
  { name: 'Mixed-Use Development',    location: 'Karen',       roi: '26%', min: 'KES 20M', risk: 'medium' },
];

/* ─────────────────────────────────────────
   TOKENS / HELPERS
───────────────────────────────────────── */
const riskMeta = {
  low:    { label: 'Low',    bg: 'rgba(30,110,66,0.14)',    color: '#1e6e42', border: 'rgba(30,110,66,0.25)'    },
  medium: { label: 'Medium', bg: 'rgba(122,90,0,0.12)',     color: '#7a5a00', border: 'rgba(122,90,0,0.22)'     },
  high:   { label: 'High',   bg: 'rgba(139,26,26,0.12)',    color: '#8b1a1a', border: 'rgba(139,26,26,0.22)'    },
};

/* ─────────────────────────────────────────
   STYLE CONSTANTS  (inline objects reused)
───────────────────────────────────────── */
const glass = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderRadius: 20,
};

const glassDim = {
  background: 'rgba(255,255,255,0.38)',
  backdropFilter: 'blur(16px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 16,
};

const serif = "'Cormorant Garamond', 'Georgia', serif";
const sans  = "'Inter', system-ui, sans-serif";

const ink  = '#1c1c1e';
const ink2 = '#4a4a52';
const ink3 = '#8e8e99';
const up   = '#1e6e42';
const upS  = 'rgba(30,110,66,0.12)';
const rule = 'rgba(255,255,255,0.2)';

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

function Nav() {
  return (
    <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
      <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
        Investor <em style={{ fontStyle: 'italic', color: ink2 }}>Overview</em>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {[true, false, false].map((active, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: active ? up : ink3, opacity: active ? 1 : 0.35 }} />
        ))}
        <button style={{
          fontFamily: sans, fontSize: 11, fontWeight: 400, color: ink2,
          background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.03em',
        }}>
          + New investment
        </button>
      </div>
    </nav>
  );
}

function HeroCard() {
  return (
    <div style={{ ...glass, padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
      <div>
        <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>
          Q1 2025 &nbsp;·&nbsp; Nairobi, KE
        </div>
        <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, lineHeight: 1, color: ink, letterSpacing: -2, marginBottom: 6 }}>
          245<sup style={{ fontSize: 22, verticalAlign: 'super', letterSpacing: -0.5, opacity: 0.5, fontWeight: 300 }}>M</sup>
        </div>
        <div style={{ fontFamily: sans, fontSize: 13, color: ink2, fontWeight: 300, lineHeight: 1.5 }}>
          Total portfolio value in KES across 12 active positions.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${rule}` }}>
        <span style={{ fontFamily: sans, fontSize: 11, padding: '4px 10px', borderRadius: 20, background: upS, color: up, border: '1px solid rgba(30,110,66,0.2)' }}>
          ↑ 18.2% this quarter
        </span>
        <span style={{ fontFamily: sans, fontSize: 11, color: ink3 }}>3.2 pts above benchmark</span>
      </div>
    </div>
  );
}

function StatMosaic() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
      gap: 1, borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.45)',
      background: 'rgba(255,255,255,0.45)',
    }}>
      {portfolioStats.map((s) => (
        <div key={s.label} style={{
          background: 'rgba(255,255,255,0.62)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '20px 22px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3 }}>{s.label}</div>
          <div style={{ fontFamily: serif, fontSize: s.value.length > 6 ? 22 : 32, fontWeight: 300, color: ink, letterSpacing: -1, lineHeight: 1, margin: '6px 0 4px' }}>{s.value}</div>
          <div style={{ fontFamily: sans, fontSize: 11, color: s.flat ? ink3 : up }}>{s.delta}</div>
        </div>
      ))}
    </div>
  );
}

function AllocationPanel() {
  return (
    <div style={{ ...glass, padding: '24px 24px 20px' }}>
      <PanelLabel>Allocation</PanelLabel>
      {allocation.map((a) => (
        <div key={a.name} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: sans, fontSize: 13, color: ink }}>{a.name}</span>
            <span style={{ fontFamily: serif, fontSize: 16, color: ink2, fontWeight: 300 }}>{a.pct}%</span>
          </div>
          <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${a.pct}%`, height: '100%', borderRadius: 2, background: ink, opacity: 0.18 + (a.pct / 100) * 0.82 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendsPanel() {
  return (
    <div style={{ ...glass, padding: '24px 24px 20px' }}>
      <PanelLabel>Market trends</PanelLabel>
      {trends.map((t, i) => (
        <div key={t.name} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: `${i === 0 ? 0 : 11}px 0 11px`,
          borderBottom: i < trends.length - 1 ? `1px solid ${rule}` : 'none',
        }}>
          <div>
            <div style={{ fontFamily: sans, fontSize: 13, color: ink }}>{t.name}</div>
            <div style={{ fontFamily: sans, fontSize: 11, color: ink3, marginTop: 1 }}>{t.desc}</div>
          </div>
          <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, letterSpacing: -0.5, color: t.soft ? '#7a5a00' : up }}>{t.pct}</div>
        </div>
      ))}
    </div>
  );
}

function RiskPanel() {
  return (
    <div style={{ ...glass, padding: '24px 24px 20px' }}>
      <PanelLabel>Risk by position</PanelLabel>
      {riskPositions.map((r, i) => {
        const m = riskMeta[r.level];
        return (
          <div key={r.name} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: `${i === 0 ? 0 : 10}px 0 10px`,
            borderBottom: i < riskPositions.length - 1 ? `1px solid ${rule}` : 'none',
          }}>
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
  );
}

function OpportunitiesTable() {
  const colStyle = { fontFamily: sans, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink3 };
  const gridCols = '1fr 70px 96px 80px 60px';

  return (
    <div style={{ ...glass, padding: '0 26px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 14px', borderBottom: `1px solid ${rule}` }}>
        <span style={{ ...colStyle }}>Open opportunities</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Filter', 'Export'].map(btn => (
            <button key={btn} style={{
              fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20,
              padding: '5px 12px', cursor: 'pointer',
            }}>{btn}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 8, padding: '10px 0 8px', borderBottom: `1px solid ${rule}` }}>
        {['Property', 'ROI', 'Min. invest', 'Risk', ''].map((h, i) => (
          <span key={i} style={{ ...colStyle, textAlign: i >= 1 && i <= 2 ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>

      {opportunities.map((o, i) => {
        const m = riskMeta[o.risk];
        return (
          <motion.div
            key={o.name}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
            style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 8, alignItems: 'center', padding: '14px 0', borderBottom: i < opportunities.length - 1 ? `1px solid ${rule}` : 'none' }}
          >
            <div>
              <div style={{ fontFamily: sans, fontSize: 13, color: ink }}>{o.name}</div>
              <div style={{ fontFamily: sans, fontSize: 11, color: ink3, marginTop: 1 }}>{o.location}</div>
            </div>
            <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: ink, letterSpacing: -0.5, textAlign: 'right' }}>{o.roi}</div>
            <div style={{ fontFamily: sans, fontSize: 12, color: ink2, textAlign: 'right' }}>{o.min}</div>
            <div>
              <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, padding: '3px 8px', borderRadius: 20, background: m.bg, color: m.color, border: `1px solid ${m.border}`, letterSpacing: '0.04em' }}>
                {m.label}
              </span>
            </div>
            <button style={{ fontFamily: sans, fontSize: 11, color: ink3, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', letterSpacing: '0.04em' }}>
              Invest →
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

function PanelLabel({ children }) {
  return (
    <div style={{
      fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: ink3, fontWeight: 400, marginBottom: 18, paddingBottom: 12,
      borderBottom: `1px solid ${rule}`,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
export default function InvestorDashboard() {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #d8dde8 0%, #c9cfd9 30%, #dde0e8 60%, #cfd4de 100%)',
      minHeight: '100vh',
      padding: '32px 40px 56px',
      fontFamily: sans,
      fontWeight: 300,
      color: ink,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* background orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(200,210,230,0.35)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <Nav />

        {/* Hero row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
          <HeroCard />
          <StatMosaic />
        </div>

        {/* Mid row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <AllocationPanel />
          <TrendsPanel />
          <RiskPanel />
        </div>

        {/* Opportunities */}
        <OpportunitiesTable />
      </div>
    </div>
  );
}