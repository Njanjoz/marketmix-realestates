// src/pages/PropertyDetailspage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Bed, Bath, Square, Heart, Share2,
  MessageCircle, CheckCircle, X, ChevronLeft,
  ChevronRight, Building, Calendar, Eye, Copy, AlertCircle,
  Maximize2, Shield, Clock, Users, Navigation,
  Droplet, Zap, Wifi, Trash2, Car, BookOpen, Utensils, Store,
  Dumbbell, Cross, Church, Landmark, Route, Bus, Footprints,
  GraduationCap, Home, Sparkles, Play, Star, Waves, Sun, DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getPublicProperty,
  savePropertyForUser,
  removeSavedProperty,
  createInquiry,
  createSiteVisit,
} from '../services/propertyService';
import toast from 'react-hot-toast';
import { shareProperty } from '../services/shareService';

// ─── tiny helpers ────────────────────────────────────────
const KSh = (n) => `KSh ${(Number(n) || 0).toLocaleString()}`;
const yesNo = (v) => (v === true ? 'Yes' : v === false ? 'No' : '—');
const val = (v, fallback = '—') =>
  v === undefined || v === null || v === '' ? fallback : v;

const Section = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-emerald-600" />}
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-50 pt-4">{children}</div>}
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0 text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-900 font-medium text-right max-w-[60%] break-words">{val(value)}</span>
  </div>
);

const PrivateRow = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right max-w-[60%] break-words blur-sm select-none" aria-label="Contact seller for this information">
        {value}
      </span>
    </div>
  );
};

const ContactSellerButton = ({ onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 ${className}`}
  >
    <MessageCircle className="h-4 w-4" />
    Contact seller
  </button>
);

const Chip = ({ children, tone = 'emerald' }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium mr-1.5 mb-1.5
      ${tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : ''}
      ${tone === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
      ${tone === 'amber' ? 'bg-amber-50 text-amber-700' : ''}
    `}
  >
    {children}
  </span>
);

const YesNoChip = ({ value }) => {
  if (value === true) return <Chip tone="emerald">Yes</Chip>;
  if (value === false) return <Chip tone="amber">No</Chip>;
  return <Chip tone="gray">Not specified</Chip>;
};

// ─── main component ──────────────────────────────────────
const PropertyDetailspage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [publicProperty, setPublicProperty] = useState(null);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [lightbox, setLightbox] = useState(null); // index or null
  const [saved, setSaved] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const inquiryFormRef = useRef(null);
  const [inquiryText, setInquiryText] = useState('');
  const [siteVisitOpen, setSiteVisitOpen] = useState(false);
  const [siteVisitForm, setSiteVisitForm] = useState({
    date: '',
    time: '10:00',
    visitFee: '0',
    transportFee: '0',
    meetingPoint: '',
    notes: '',
  });

  useEffect(() => {
    if (inquiryOpen) {
      inquiryFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [inquiryOpen]);

  const handleContactSeller = () => setInquiryOpen(true);

  const handleSaveToggle = async () => {
    if (!publicProperty) return;

    if (!currentUser) {
      toast.error('Please log in to save properties');
      return;
    }

    try {
      const idValue = String(publicProperty.id);
      const current = JSON.parse(localStorage.getItem('marketmix-saved-properties') || '[]');
      const exists = current.includes(idValue);

      if (exists) {
        localStorage.setItem('marketmix-saved-properties', JSON.stringify(current.filter((item) => item !== idValue)));
        await removeSavedProperty({ userId: currentUser.uid, propertyId: publicProperty.id });
        setSaved(false);
        toast.success('Property removed from saved list');
      } else {
        const next = [...current, idValue];
        localStorage.setItem('marketmix-saved-properties', JSON.stringify(next));
        await savePropertyForUser({
          userId: currentUser.uid,
          propertyId: publicProperty.id,
          title: publicProperty.title,
          location: publicProperty.location,
        });
        setSaved(true);
        toast.success('Property saved');
      }
    } catch (error) {
      console.error('Save property error:', error);
      toast.error('Could not update saved properties');
    }
  };

  const handleInquirySubmit = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to send an inquiry');
      return;
    }
    if (!inquiryText.trim()) {
      toast.error('Please write your inquiry before sending');
      return;
    }

    try {
      await createInquiry({
        propertyId: publicProperty.id,
        buyerId: currentUser.uid,
        agentId: publicProperty.userId || null,
        message: inquiryText,
        propertyTitle: publicProperty.title,
      });
      setInquiryText('');
      setInquiryOpen(false);
      toast.success('Inquiry sent to the seller');
    } catch (error) {
      console.error('Inquiry error:', error);
      toast.error('Failed to send inquiry');
    }
  };

  const handleSiteVisitSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to request a viewing');
      return;
    }
    if (!siteVisitForm.date) {
      toast.error('Please choose a viewing date');
      return;
    }

    try {
      await createSiteVisit({
        propertyId: publicProperty.id,
        buyerId: currentUser.uid,
        agentId: publicProperty.userId || null,
        requestedDate: siteVisitForm.date,
        requestedTime: siteVisitForm.time,
        visitFee: siteVisitForm.visitFee,
        transportFee: siteVisitForm.transportFee,
        meetingPoint: siteVisitForm.meetingPoint,
        notes: siteVisitForm.notes,
      });
      setSiteVisitForm({
        date: '',
        time: '10:00',
        visitFee: '0',
        transportFee: '0',
        meetingPoint: '',
        notes: '',
      });
      setSiteVisitOpen(false);
      toast.success('Site visit request sent to the agent');
    } catch (error) {
      console.error('Site visit error:', error);
      toast.error('Failed to request site visit');
    }
  };

  // Load public data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingPublic(true);
      const data = await getPublicProperty(id);
      if (cancelled) return;
      if (!data) {
        toast.error('Property not found');
        navigate('/properties');
        return;
      }
      setPublicProperty(data);
      setLoadingPublic(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!publicProperty) return;
    try {
      const savedList = JSON.parse(localStorage.getItem('marketmix-saved-properties') || '[]');
      setSaved(savedList.includes(String(publicProperty.id)));
    } catch (error) {
      setSaved(false);
    }
  }, [publicProperty]);

  if (loadingPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!publicProperty) return null;

  const p = publicProperty;
  const rawMedia = p.media?.length ? p.media : (p.images?.length ? p.images : (p.publicMedia || []));
  const media = (Array.isArray(rawMedia) ? rawMedia : []).map((m) => {
    if (typeof m === 'string') return { url: m, category: 'other' };
    if (!m) return null;
    const url = m.url || m.remoteUrl || m.localPreviewUrl || m.preview || (typeof m.file === 'string' ? m.file : '');
    return {
      url,
      category: m.category || 'other',
    };
  }).filter((m) => m && m.url);
  const cover = media[0]?.url;

  const photosByCategory = media.reduce((acc, m) => {
    const key = m.category || 'other';
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {});

  const costs = {
    rent: p.rentAmount ?? p.price ?? 0,
    deposit:
      p.depositType === "One month's rent" ? Number(p.rentAmount) || 0 : Number(p.depositAmount) || 0,
    recurring: p.recurringCharges || [],
    oneTime: p.oneTimeFees || [],
  };
  const monthlyCost =
    costs.rent + costs.recurring.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const moveInCost =
    costs.rent +
    costs.deposit +
    costs.oneTime.reduce((s, f) => s + (Number(f.amount) || 0), 0);

  const rules = p.houseRules || {};
  const gate = p.gate || {};
  const availability = p.availability || {};
  const approx = p.approxLocation || {};
  const youtubeId = p.youtubeVideoId;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ─── Hero / Gallery ─────────────────────────── */}
      <div className="relative bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={p.title}
            className="w-full h-[320px] sm:h-[420px] object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
            }}
          />
        ) : (
          <div className="w-full h-[320px] bg-gray-200 flex items-center justify-center text-gray-400">
            No image available
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-full p-2 shadow"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          <button className="bg-white/90 backdrop-blur rounded-full p-2 shadow">
            <Heart className="w-5 h-5" />
          </button>
          <button
            className="bg-white/90 backdrop-blur rounded-full p-2 shadow"
            onClick={async () => {
              try {
                const result = await shareProperty(p);
                if (result?.source === 'clipboard') {
                  toast.success('Property details copied');
                } else if (result?.source === 'whatsapp') {
                  toast.success('WhatsApp share opened');
                } else if (result?.shared) {
                  toast.success('Property shared');
                } else {
                  toast.success('Share link ready');
                }
              } catch (error) {
                console.error('Share property error:', error);
                toast.error('Could not share property');
              }
            }}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {media.length > 1 && (
          <button
            onClick={() => setLightbox(0)}
            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-2 shadow flex items-center gap-1.5 text-sm font-medium"
          >
            <Maximize2 className="w-4 h-4" /> View all {media.length} photos
          </button>
        )}

        {/* Thumbnails strip */}
        {media.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 overflow-x-auto bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8">
            <div className="flex gap-2">
              {media.slice(0, 8).map((m, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i)}
                  className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-white/70"
                >
                  <img
                    src={m.url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Title + key facts ──────────────────────── */}
      <div className="container mx-auto px-4 -mt-8 relative">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-[240px]">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {p.availabilityStatus && (
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase">
                    {p.availabilityStatus}
                  </span>
                )}
                {p.verificationStatus && (
                  <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase">
                    {p.verificationStatus}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{val(p.title)}</h1>
              {p.propertyName && (
                <p className="text-sm text-gray-500 mt-0.5">{p.propertyName}</p>
              )}
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="blur-sm select-none" aria-label="Contact seller for location">
                  {[approx.estate, approx.town, approx.county].filter(Boolean).join(', ') || p.location || 'Location not specified'}
                </span>
                <button type="button" onClick={handleContactSeller} className="ml-1 shrink-0 font-semibold text-emerald-700 underline underline-offset-2">
                  Contact seller
                </button>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">{KSh(costs.rent)}</p>
              <p className="text-xs text-gray-500">{val(p.paymentFrequency, 'Monthly')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <Fact icon={Bed} label="Bedrooms" value={val(p.totalBedrooms ?? p.bedrooms, 0)} />
            <Fact icon={Bath} label="Bathrooms" value={val(p.bathrooms, 0)} />
            <Fact icon={Home} label="Type" value={val(p.propertyType)} />
            <Fact icon={Users} label="Occupancy" value={val(p.occupancy || availability.availableUnits)} />
          </div>

          {p.verificationStatus && (
            <div className="mt-4">
              <Chip tone={p.verificationStatus === 'verified' ? 'emerald' : 'amber'}>
                Verification: {p.verificationStatus}
              </Chip>
            </div>
          )}
        </div>
      </div>

      {/* ─── Body ──────────────────────────────────── */}
      <div className="container mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — all the data */}
        <div className="lg:col-span-2">
          {/* Description */}
          {p.description && (
            <Section title="About this property" icon={BookOpen}>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.description}</p>
            </Section>
          )}

          {/* Property / Unit / Room */}
          <Section title="Property, Unit & Room" icon={Building}>
            <Row label="Property type" value={p.propertyType} />
            <Row label="Unit type" value={p.unitType} />
            <Row label="Room type" value={p.roomType} />
            <Row
              label="Rental model"
              value={Array.isArray(p.rentalModel) ? p.rentalModel.join(', ') : p.rentalModel}
            />
            <Row label="Occupancy" value={p.occupancy} />
            <Row label="Furnishing" value={p.furnished} />
            <Row label="Gender accommodation" value={p.genderAccommodation} />
            <Row label="Age restriction" value={p.ageRestriction} />
            {p.suitableFor?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Suitable for</p>
                {p.suitableFor.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            )}
          </Section>

          {/* Student */}
          {(p.institutionName || p.campus || p.distanceToCampus) && (
            <Section title="Student information" icon={GraduationCap}>
              <Row label="Institution" value={p.institutionName} />
              <Row label="Institution type" value={p.institutionType} />
              <Row label="Campus" value={p.campus} />
              <Row label="Nearest campus gate" value={p.nearestCampusGate} />
              <Row label="Distance to campus" value={p.distanceToCampus} />
              <Row label="Walking time" value={p.walkingTimeToCampus} />
              <Row label="Transport time" value={p.transportTimeToCampus} />
              <Row label="Transport fare" value={p.transportFareToCampus} />
              <Row label="Student housing" value={p.studentHousingClassification} />
            </Section>
          )}

          {/* Room details */}
          {(p.roomSize || p.sleepingArrangement || p.roomFurniture?.length > 0) && (
            <Section title="Room details" icon={Bed}>
              <Row label="Room size" value={p.roomSize} />
              {p.roomSize === 'Custom dimensions' && (
                <Row
                  label="Dimensions"
                  value={`${val(p.roomLength)} ft × ${val(p.roomWidth)} ft`}
                />
              )}
              <Row label="Sleeping arrangement" value={p.sleepingArrangement} />
              <Row label="Bathroom" value={p.bathroom} />
              <Row label="Kitchen" value={p.kitchen} />
              {p.roomFurniture?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Furniture included</p>
                  {p.roomFurniture.map((f) => (
                    <Chip key={f}>{f}</Chip>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Rent & costs */}
          <Section title="Rent & Costs" icon={DollarSign}>
            <Row label="Rent" value={KSh(costs.rent)} />
            <Row label="Payment frequency" value={p.paymentFrequency} />
            <Row label="Deposit type" value={p.depositType} />
            {costs.deposit > 0 && <Row label="Deposit amount" value={KSh(costs.deposit)} />}
            <Row label="Deposit refundable" value={p.depositRefundable} />

            {costs.recurring.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-3 mb-1">Recurring charges</p>
                {costs.recurring.map((c, i) => (
                  <Row
                    key={i}
                    label={`${c.label || 'Charge'} (${c.frequency || 'Monthly'})`}
                    value={KSh(c.amount)}
                  />
                ))}
              </>
            )}

            {costs.oneTime.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-3 mb-1">One-time fees</p>
                {costs.oneTime.map((f, i) => (
                  <Row key={i} label={f.label || 'Fee'} value={KSh(f.amount)} />
                ))}
              </>
            )}

            <div className="mt-4 bg-emerald-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-800">Estimated monthly cost</span>
                <span className="font-bold text-emerald-900">{KSh(monthlyCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-800">Total move-in cost</span>
                <span className="font-bold text-emerald-900">{KSh(moveInCost)}</span>
              </div>
            </div>
          </Section>

          {/* Utilities */}
          <Section title="Water & Electricity" icon={Droplet}>
            <Row label="Water source" value={p.waterSource} />
            <Row label="Water included in rent" value={yesNo(p.waterIncluded)} />
            <Row label="Water reliability" value={p.waterReliability} />
            <Row label="Hot water" value={p.hotWater} />
            {p.waterStorage?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Water storage</p>
                {p.waterStorage.map((w) => (
                  <Chip key={w}>{w}</Chip>
                ))}
              </div>
            )}
            <Row label="Electricity type" value={p.electricityType} />
            <Row label="Electricity included" value={yesNo(p.electricityIncluded)} />
          </Section>

          {/* Internet & Garbage */}
          <Section title="Internet & Garbage" icon={Wifi}>
            <Row label="Internet" value={p.internetOption} />
            <Row label="Internet provider" value={p.internetProvider} />
            <Row label="Garbage collection" value={p.garbageCollection} />
            <Row label="Common-area cleaning" value={p.commonCleaning} />
            <Row label="Laundry-area cleaning" value={p.laundryCleaning} />
          </Section>

          {/* Management */}
          <Section title="Management" icon={Users} defaultOpen={false}>
            <Row label="Managed by" value={p.managerType} />
            <PrivateRow label="Name" value={p.managerName} />
            <Row label="Availability" value={p.managementAvailability} />
            <Row label="Handles tenant problems" value={p.problemHandler} />
            <PrivateRow label="On-site person" value={p.onSitePerson} />
            <PrivateRow label="Emergency contact" value={p.emergencyContact} />
            <Row label="Typical response time" value={p.responseTime} />
            <ContactSellerButton onClick={handleContactSeller} className="mt-3 w-full" />
          </Section>

          {/* Security */}
          {p.securityFeatures && Object.keys(p.securityFeatures).length > 0 && (
            <Section title="Security features" icon={Shield} defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {Object.entries(p.securityFeatures).map(([feature, status]) => (
                  <div
                    key={feature}
                    className="flex items-center justify-between gap-2 text-sm py-1"
                  >
                    <span className="text-gray-600">{feature}</span>
                    <YesNoChip value={status === 'Yes' ? true : status === 'No' ? false : null} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* House rules */}
          <Section title="House rules" icon={AlertCircle} defaultOpen={false}>
            <Row label="Parties" value={rules.parties} />
            <Row label="Loud music" value={rules.musicPolicy} />
            {(rules.quietHoursFrom || rules.quietHoursTo) && (
              <Row
                label="Quiet hours"
                value={`${val(rules.quietHoursFrom)} – ${val(rules.quietHoursTo)}`}
              />
            )}
            <Row label="Gatherings" value={rules.gatherings} />
            <Row label="Smoking" value={rules.smoking} />
            <Row label="Alcohol" value={rules.alcohol} />
            <Row label="Pets" value={rules.pets} />
            <Row label="Laundry hours" value={rules.laundryHours} />
            <Row label="Kitchen hours" value={rules.kitchenHours} />
            <Row label="Visitors" value={rules.visitorPolicy} />
            <Row label="Overnight visitors" value={rules.overnightVisitors} />
            <Row label="Curfew" value={rules.curfew} />
            {rules.curfewTime && <Row label="Curfew time" value={rules.curfewTime} />}
          </Section>

          {/* Gate */}
          <Section title="Gate & Access" icon={Lock} defaultOpen={false}>
            <Row label="Has gate" value={yesNo(gate.hasGate === 'Yes' ? true : gate.hasGate === 'No' ? false : null)} />
            <Row label="Gate normally locked" value={gate.gateLocked} />
            <Row label="Closing time" value={gate.gateClosingTime} />
            <Row label="Opening time" value={gate.gateOpeningTime} />
            <Row label="After-hours access" value={gate.afterHoursAccess} />
          </Section>

          {/* Amenities */}
          {(p.roomAmenities?.length > 0 || p.propertyAmenities?.length > 0) && (
            <Section title="Amenities" icon={Sparkles}>
              {p.roomAmenities?.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mb-1">In the room</p>
                  <div className="mb-3">
                    {p.roomAmenities.map((a) => (
                      <Chip key={a}>{a}</Chip>
                    ))}
                  </div>
                </>
              )}
              {p.propertyAmenities?.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mb-1">In the property</p>
                  <div>
                    {p.propertyAmenities.map((a) => (
                      <Chip key={a}>{a}</Chip>
                    ))}
                  </div>
                </>
              )}
            </Section>
          )}

          {/* Location & Transport */}
          <Section title="Location & Transport" icon={Navigation}>
            <PrivateRow label="Address" value={p.location} />
            <PrivateRow label="County" value={approx.county} />
            <PrivateRow label="Town" value={approx.town} />
            <PrivateRow label="Estate / Area" value={approx.estate} />
            <PrivateRow label="Nearest road" value={approx.nearestRoad} />
            <ContactSellerButton onClick={handleContactSeller} className="my-3 w-full" />
            <Row label="Road type" value={p.roadType} />
            <Row label="Road condition" value={p.roadCondition} />
            <Row label="Distance to main road" value={p.distanceToMainRoad} />
            <Row label="Nearest matatu stage" value={p.nearestStage} />
            <Row label="Distance to stage" value={p.distanceToStage} />
            <Row label="Fare to campus" value={p.fareToCampus} />
            <Row label="Fare to CBD" value={p.fareToCBD} />
            <Row label="Street lighting" value={p.streetLighting} />
            <Row label="Flooding history" value={p.floodingHistory} />
            {p.transportOptions?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Transport options</p>
                {p.transportOptions.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            )}
          </Section>

          {/* Nearby places */}
          {p.nearbyPlaces?.length > 0 && (
            <Section title="Nearby places" icon={MapPin}>
              <div className="space-y-2">
                {p.nearbyPlaces.map((place, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-50 pb-1.5 last:border-0">
                    <span className="text-gray-600">
                      <strong className="text-gray-800">{place.type}</strong>
                      {place.name && ` · ${place.name}`}
                    </span>
                    <span className="text-gray-500 text-right">
                      {place.distance}
                      {place.walkingTime && ` · ${place.walkingTime}`}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* YouTube tour */}
          {youtubeId && (
            <Section title="Video tour" icon={Play}>
              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  title="Property tour"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </Section>
          )}

          {/* Photo gallery grouped by category */}
          {Object.keys(photosByCategory).length > 0 && (
            <Section title="Photos" icon={Eye}>
              {Object.entries(photosByCategory).map(([cat, items]) => (
                <div key={cat} className="mb-4 last:mb-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    {cat.replace(/_/g, ' ')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {items.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setLightbox(media.indexOf(m))}
                        className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={m.url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* RIGHT — sticky contact card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-4">
            <p className="text-2xl font-bold text-emerald-600">{KSh(costs.rent)}</p>
            <p className="text-xs text-gray-500">{val(p.paymentFrequency, 'Monthly')}</p>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
              <Row label="Deposit" value={KSh(costs.deposit)} />
              <Row label="Move-in cost" value={KSh(moveInCost)} />
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleSaveToggle}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                {saved ? 'Saved property' : 'Save property'}
              </button>
              <button
                type="button"
                onClick={() => setSiteVisitOpen((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
              >
                <Calendar className="w-4 h-4" /> Request site visit
              </button>
              <ContactSellerButton onClick={() => setInquiryOpen((prev) => !prev)} className="w-full bg-slate-900 hover:bg-slate-800" />
            </div>

            {siteVisitOpen && (
              <form onSubmit={handleSiteVisitSubmit} className="mt-4 space-y-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Preferred date</label>
                  <input
                    type="date"
                    value={siteVisitForm.date}
                    onChange={(e) => setSiteVisitForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Preferred time</label>
                  <input
                    type="time"
                    value={siteVisitForm.time}
                    onChange={(e) => setSiteVisitForm((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-md border border-gray-200 p-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Visit fee</label>
                    <input
                      type="number"
                      min="0"
                      value={siteVisitForm.visitFee}
                      onChange={(e) => setSiteVisitForm((prev) => ({ ...prev, visitFee: e.target.value }))}
                      className="w-full rounded-md border border-gray-200 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Transport fee</label>
                    <input
                      type="number"
                      min="0"
                      value={siteVisitForm.transportFee}
                      onChange={(e) => setSiteVisitForm((prev) => ({ ...prev, transportFee: e.target.value }))}
                      className="w-full rounded-md border border-gray-200 p-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Meeting point</label>
                  <input
                    type="text"
                    value={siteVisitForm.meetingPoint}
                    onChange={(e) => setSiteVisitForm((prev) => ({ ...prev, meetingPoint: e.target.value }))}
                    placeholder="Approximate meeting point"
                    className="w-full rounded-md border border-gray-200 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Notes</label>
                  <textarea
                    rows="3"
                    value={siteVisitForm.notes}
                    onChange={(e) => setSiteVisitForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Anything the agent should know"
                    className="w-full rounded-md border border-gray-200 p-2 text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                  Send viewing request
                </button>
              </form>
            )}

            {inquiryOpen && (
              <form ref={inquiryFormRef} onSubmit={handleInquirySubmit} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Your message</label>
                  <textarea
                    rows="4"
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder="Ask about rent, availability, move-in date, or property details"
                    className="w-full rounded-md border border-gray-200 p-2 text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800">
                  Send inquiry
                </button>
              </form>
            )}

            <div className="mt-5 border-t border-gray-100 pt-4 text-center">
              <p className="mb-3 text-sm text-gray-600">
                Contact the seller for the exact location and landlord or caretaker details.
              </p>
              <ContactSellerButton onClick={handleContactSeller} className="w-full" />
            </div>

            <p className="text-[11px] text-gray-400 mt-4 leading-snug">
              Listing added {p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'recently'} ·
              {' '}Views: {p.views || 0}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Lightbox ──────────────────────────────── */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>

          {lightbox > 0 && (
            <button
              onClick={() => setLightbox(lightbox - 1)}
              className="absolute left-4 text-white p-2"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <img
            src={media[lightbox]?.url}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain"
          />

          {lightbox < media.length - 1 && (
            <button
              onClick={() => setLightbox(lightbox + 1)}
              className="absolute right-4 text-white p-2"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <p className="absolute bottom-4 text-white text-sm">
            {lightbox + 1} / {media.length}
          </p>
        </div>
      )}
    </div>
  );
};

const Fact = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2">
    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
      <Icon className="w-4 h-4 text-emerald-600" />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default PropertyDetailspage;