import React, { useState } from 'react';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const stats = [
  { label: 'Active listings',  value: '5',     delta: '↑ +1 this month' },
  { label: 'Total views',      value: '1,248', delta: '↑ +42% MTD'      },
  { label: 'Inquiries',        value: '28',    delta: '↑ +8 this week'  },
  { label: 'Offers received',  value: '6',     delta: '↑ +2 new'        },
];

const listings = [
  { title: 'Modern Villa in Karen',      price: 'KES 85M',  status: 'active',  views: 342, inquiries: 12, updated: '2 days ago' },
  { title: '3-Bed Apartment Westlands',  price: 'KES 24M',  status: 'pending', views: 189, inquiries: 8,  updated: '1 week ago' },
  { title: 'Commercial Space CBD',       price: 'KES 120M', status: 'active',  views: 421, inquiries: 18, updated: '3 days ago' },
];

const offers = [
  { buyer: 'John Smith',    property: 'Modern Villa',  amount: 'KES 80M',  status: 'negotiating', date: 'Today'      },
  { buyer: 'Sarah Johnson', property: '3-Bed Apt',     amount: 'KES 23M',  status: 'accepted',    date: '2 days ago' },
  { buyer: 'Mike Wilson',   property: 'Commercial Spc',amount: 'KES 115M', status: 'rejected',    date: '1 week ago' },
];

/* ─────────────────────────────────────────
   TOKENS
───────────────────────────────────────── */
const glass = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderRadius: 20,
};

const serif  = "'Cormorant Garamond', 'Georgia', serif";
const sans   = "'Inter', system-ui, sans-serif";
const ink    = '#1c1c1e';
const ink2   = '#4a4a52';
const ink3   = '#8e8e99';
const up     = '#1e6e42';
const rule   = 'rgba(255,255,255,0.2)';

const statusMeta = {
  active:      { label: 'Active',      bg: 'rgba(30,110,66,0.12)',  color: '#1e6e42', border: 'rgba(30,110,66,0.22)'  },
  pending:     { label: 'Pending',     bg: 'rgba(122,90,0,0.11)',   color: '#7a5a00', border: 'rgba(122,90,0,0.22)'   },
  negotiating: { label: 'Negotiating', bg: 'rgba(122,90,0,0.11)',   color: '#7a5a00', border: 'rgba(122,90,0,0.22)'   },
  accepted:    { label: 'Accepted',    bg: 'rgba(30,110,66,0.12)',  color: '#1e6e42', border: 'rgba(30,110,66,0.22)'  },
  rejected:    { label: 'Rejected',    bg: 'rgba(139,26,26,0.11)',  color: '#8b1a1a', border: 'rgba(139,26,26,0.22)'  },
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
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
  const m = statusMeta[status];
  return (
    <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 400, padding: '3px 9px', borderRadius: 20, background: m.bg, color: m.color, border: `1px solid ${m.border}`, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

/* ─────────────────────────────────────────
   NAV
───────────────────────────────────────── */
function Nav() {
  return (
    <nav style={{ ...glass, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', marginBottom: 24 }}>
      <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 400, color: ink, letterSpacing: -0.2 }}>
        Seller <em style={{ fontStyle: 'italic', color: ink2 }}>Dashboard</em>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {[true, false, false].map((active, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: active ? up : ink3, opacity: active ? 1 : 0.35 }} />
        ))}
        <button style={{ fontFamily: sans, fontSize: 11, color: ink2, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '7px 16px', cursor: 'pointer', letterSpacing: '0.03em' }}>
          + List property
        </button>
      </div>
    </nav>
  );
}

/* ─────────────────────────────────────────
   HERO + STAT MOSAIC
───────────────────────────────────────── */
function HeroCard() {
  return (
    <div style={{ ...glass, padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
      <div>
        <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink3, marginBottom: 12 }}>
          Q1 2025 &nbsp;·&nbsp; Nairobi, KE
        </div>
        <div style={{ fontFamily: serif, fontSize: 56, fontWeight: 300, lineHeight: 1, color: ink, letterSpacing: -2, marginBottom: 6 }}>
          1,248<sup style={{ fontSize: 18, verticalAlign: 'super', letterSpacing: -0.5, opacity: 0.45, fontWeight: 300 }}>views</sup>
        </div>
        <div style={{ fontFamily: sans, fontSize: 13, color: ink2, fontWeight: 300, lineHeight: 1.5 }}>
          Your properties attracted 1,248 views this month across 5 active listings.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${rule}` }}>
        <span style={{ fontFamily: sans, fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(30,110,66,0.12)', color: up, border: '1px solid rgba(30,110,66,0.2)' }}>
          ↑ 42% vs last month
        </span>
        <span style={{ fontFamily: sans, fontSize: 11, color: ink3 }}>28 inquiries · 6 offers</span>
      </div>
    </div>
  );
}

function StatMosaic() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 1, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.45)' }}>
      {stats.map((s) => (
        <div key={s.label} style={{ background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink3 }}>{s.label}</div>
          <div style={{ fontFamily: serif, fontSize: s.value.length > 4 ? 26 : 32, fontWeight: 300, color: ink, letterSpacing: -1, lineHeight: 1, margin: '6px 0 4px' }}>{s.value}</div>
          <div style={{ fontFamily: sans, fontSize: 11, color: up }}>{s.delta}</div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   LISTINGS
───────────────────────────────────────── */
function ListingsPanel() {
  return (
    <div style={{ ...glass, padding: '24px 26px', marginBottom: 16 }}>
      <PanelLabel action="Analytics →">Your listings</PanelLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        {listings.map((l, i) => (
          <motion.div key={i} whileHover={{ backgroundColor: 'rgba(255,255,255,0.72)' }}
            style={{ background: 'rgba(255,255,255,0.38)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: 16, padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 400, color: ink, marginBottom: 4, lineHeight: 1.35 }}>{l.title}</div>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 300, color: ink, letterSpacing: -0.5 }}>{l.price}</div>
              </div>
              <Badge status={l.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { val: l.views,     lbl: 'Views'     },
                { val: l.inquiries, lbl: 'Inquiries'  },
                { val: l.updated,   lbl: 'Updated'    },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: serif, fontSize: lbl === 'Updated' ? 11 : 18, fontWeight: 300, color: ink, letterSpacing: -0.3, lineHeight: 1.1 }}>{val}</div>
                  <div style={{ fontFamily: sans, fontSize: 10, color: ink3, marginTop: 2, letterSpacing: '0.04em' }}>{lbl}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, fontFamily: sans, fontSize: 11, color: ink2, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 20, padding: '7px 0', cursor: 'pointer', letterSpacing: '0.03em' }}>Edit</button>
              <button style={{ flex: 1, fontFamily: sans, fontSize: 11, color: up,   background: 'rgba(30,110,66,0.1)',  border: '1px solid rgba(30,110,66,0.2)',  borderRadius: 20, padding: '7px 0', cursor: 'pointer', letterSpacing: '0.03em' }}>Promote</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   OFFERS
───────────────────────────────────────── */
function OffersPanel() {
  const [offerList, setOfferList] = useState(offers);

  function handleAction(i, action) {
    setOfferList(prev => prev.map((o, idx) => idx === i ? { ...o, status: action } : o));
  }

  const gridCols = '1fr 90px 100px 96px 130px';

  return (
    <div style={{ ...glass, padding: '0 26px 26px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 14px', borderBottom: `1px solid ${rule}` }}>
        <span style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: ink3 }}>Recent offers</span>
        <button style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: ink3, background: 'none', border: `1px solid ${rule}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}>View all buyers</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 8, padding: '10px 0 8px', borderBottom: `1px solid ${rule}` }}>
        {['Buyer', 'Property', 'Offer', 'Status', ''].map((h, i) => (
          <span key={i} style={{ fontFamily: sans, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink3, textAlign: i === 2 ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>

      {offerList.map((o, i) => (
        <motion.div key={i} whileHover={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 }}
          style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 8, alignItems: 'center', padding: '14px 0', borderBottom: i < offerList.length - 1 ? `1px solid ${rule}` : 'none' }}>

          <div>
            <div style={{ fontFamily: sans, fontSize: 13, color: ink }}>{o.buyer}</div>
            <div style={{ fontFamily: sans, fontSize: 11, color: ink3, marginTop: 1 }}>{o.date}</div>
          </div>

          <div style={{ fontFamily: sans, fontSize: 12, color: ink2 }}>{o.property}</div>

          <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 300, color: ink, letterSpacing: -0.5, textAlign: 'right' }}>{o.amount}</div>

          <div><Badge status={o.status} /></div>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {o.status === 'negotiating' ? (
              <>
                <button onClick={() => handleAction(i, 'accepted')}
                  style={{ fontFamily: sans, fontSize: 11, color: up, background: 'rgba(30,110,66,0.1)', border: '1px solid rgba(30,110,66,0.22)', borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}>
                  Accept
                </button>
                <button onClick={() => handleAction(i, 'rejected')}
                  style={{ fontFamily: sans, fontSize: 11, color: '#8b1a1a', background: 'rgba(139,26,26,0.08)', border: '1px solid rgba(139,26,26,0.2)', borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}>
                  Reject
                </button>
              </>
            ) : (
              <span style={{ fontFamily: sans, fontSize: 11, color: ink3, letterSpacing: '0.04em' }}>—</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT
───────────────────────────────────────── */
export default function SellerDashboard() {
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
      <div style={{ position: 'absolute', top: '8%',  left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(200,210,230,0.35)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', position: 'relative', zIndex: 1 }}>
        <Nav />

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16, alignItems: 'stretch' }}>
          <HeroCard />
          <StatMosaic />
        </div>

        <ListingsPanel />
        <OffersPanel />
      </div>
    </div>
  );
}
