// src/components/seller/SellerPropertyUpload.jsx
// MarketMix premium seller property builder.
// The existing Step* components remain the real data-entry screens.
// This file controls screen flow, relevance, autosave, auto-advance, mobile hero,
// and a persistent SVG construction preview that starts from a foundation and
// progressively becomes the final property.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { sendWhatsAppNotification } from '../../lib/api';
import { db } from '../../firebase/config';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  ArrowRight,
  Bath,
  Bed,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  Droplets,
  Home,
  Image as ImageIcon,
  Images,
  LandPlot,
  Loader,
  MapPin,
  MapPinned,
  ShieldCheck,
  Sofa,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import WizardProgress from './shared/WizardProgress';
import { WIZARD_STEPS } from './constants/wizardSteps';
import { PROPERTY_TYPES, LAND_LIKE, HOSTEL_LIKE } from './constants/propertyTaxonomy';
import { getPublicPropertyLocation } from '../../utils/propertyMapping';
import '../moving/LiquidGlass.css';

import StepPropertyType from './steps/StepPropertyType';
import StepUnitRoom from './steps/StepUnitRoom';
import StepBasicDetails from './steps/StepBasicDetails';
import StepStudentInfo from './steps/StepStudentInfo';
import StepRoomOccupancy from './steps/StepRoomOccupancy';
import StepRentCosts from './steps/StepRentCosts';
import StepWaterUtilities from './steps/StepWaterUtilities';
import StepInternetGarbage from './steps/StepInternetGarbage';
import StepManagement from './steps/StepManagement';
import StepSecurity from './steps/StepSecurity';
import StepGateHouseRules from './steps/StepGateHouseRules';
import StepLocationTransport from './steps/StepLocationTransport';
import StepAmenities from './steps/StepAmenities';
import StepNearbyPlaces from './steps/StepNearbyPlaces';
import StepPhotosMedia from './steps/StepPhotosMedia';
import StepYouTubeTour from './steps/StepYouTubeTour';
import StepReview from './steps/StepReview';

const initialData = {
  listingType: 'rent',
  propertyType: 'apartment',
  unitType: '',
  roomType: '',
  rentalModel: '',
  occupancy: '1',
  title: '',
  propertyName: '',
  location: '',
  county: '',
  subCounty: '',
  ward: '',
  town: '',
  area: '',
  landmark: '',
  coordinates: null,
  price: '',
  deposit: '',
  depositRefundable: 'Yes',
  billingCycle: 'monthly',
  bedrooms: '1',
  bathrooms: '1',
  areaSize: '',
  description: '',
  features: [],
  amenities: [],
  images: [],
  media: [],
  youtubeUrl: '',
  securityFeatures: [],
  waterType: '',
  electricityType: '',
  sharingAllowed: false,
};

const PROPERTY_LABELS = Object.fromEntries(PROPERTY_TYPES.map((entry) => [entry.id, entry.label]));

const COMPACT_TYPES = new Set(['single_room', 'bedsitter', 'studio_apartment']);
const HOSTEL_TYPES = new Set(['student_hostel']);
const SHARED_TYPES = new Set(['shared_house', 'compound']);
const HOSPITALITY_TYPES = new Set(['urbannest', 'guest_house', 'serviced_apartment']);
const BEDROOM_TYPES = new Set([
  'apartment',
  'maisonette',
  'bungalow',
  'townhouse',
  'duplex',
  'standalone_house',
  'semi_detached',
]);
const RESIDENTIAL_TYPES = new Set([
  ...COMPACT_TYPES,
  ...HOSTEL_TYPES,
  ...SHARED_TYPES,
  ...HOSPITALITY_TYPES,
  ...BEDROOM_TYPES,
]);

const GROUP_LABELS = {
  propertyAndSpace: 'Property & Space',
  studentInfo: 'Student Information',
  spaceOccupancy: 'Space & Occupancy',
  priceCosts: 'Price & Costs',
  locationSurroundings: 'Location & Surroundings',
  utilitiesServices: 'Utilities & Services',
  managementSecurity: 'Management & Security',
  amenities: 'Amenities',
  mediaTour: 'Media & Tour',
  review: 'Review & Submit',
};

const SCREEN_META = {
  propertyType: { group: 'propertyAndSpace', label: 'Property type', layer: 1 },
  unitRoom: { group: 'propertyAndSpace', label: 'Unit & room', layer: 2 },
  basicDetails: { group: 'propertyAndSpace', label: 'Basic details', layer: 3 },
  studentInfo: { group: 'studentInfo', label: 'Student information', layer: 4 },
  spaceOccupancy: { group: 'spaceOccupancy', label: 'Space & occupancy', layer: 5 },
  priceCosts: { group: 'priceCosts', label: 'Price & costs', layer: 6 },
  locationTransport: { group: 'locationSurroundings', label: 'Location & transport', layer: 7 },
  nearbyPlaces: { group: 'locationSurroundings', label: 'Nearby places', layer: 8 },
  waterUtilities: { group: 'utilitiesServices', label: 'Water & utilities', layer: 9 },
  internetGarbage: { group: 'utilitiesServices', label: 'Internet & services', layer: 10 },
  management: { group: 'managementSecurity', label: 'Management & access', layer: 11 },
  security: { group: 'managementSecurity', label: 'Security', layer: 12 },
  gateHouseRules: { group: 'managementSecurity', label: 'Gate & rules', layer: 12 },
  amenities: { group: 'amenities', label: 'Amenities', layer: 13 },
  photosMedia: { group: 'mediaTour', label: 'Photos & media', layer: 14 },
  youtubeTour: { group: 'mediaTour', label: 'YouTube tour', layer: 15 },
  review: { group: 'review', label: 'Review & submit', layer: 16 },
};

const SCREEN_FLOW = [
  { id: 'propertyType', Component: StepPropertyType },
  { id: 'unitRoom', Component: StepUnitRoom },
  { id: 'basicDetails', Component: StepBasicDetails },
  { id: 'studentInfo', Component: StepStudentInfo },
  { id: 'spaceOccupancy', Component: StepRoomOccupancy },
  { id: 'priceCosts', Component: StepRentCosts },
  { id: 'locationTransport', Component: StepLocationTransport },
  { id: 'nearbyPlaces', Component: StepNearbyPlaces },
  { id: 'waterUtilities', Component: StepWaterUtilities },
  { id: 'internetGarbage', Component: StepInternetGarbage },
  { id: 'management', Component: StepManagement },
  { id: 'security', Component: StepSecurity },
  { id: 'gateHouseRules', Component: StepGateHouseRules },
  { id: 'amenities', Component: StepAmenities },
  { id: 'photosMedia', Component: StepPhotosMedia },
  { id: 'youtubeTour', Component: StepYouTubeTour },
  { id: 'review', Component: StepReview },
];

const AUTO_ADVANCE_KEYS = new Set([
  'unitType',
  'roomType',
  'rentalModel',
  'occupancy',
  'sharingAllowed',
  'waterType',
  'electricityType',
  'internetType',
  'internet',
  'ownerType',
  'managementType',
  'gateType',
]);

const GOLD = '#C8A96B';
const GOLD_SOFT = '#EFE4C8';
const INK = '#0B0B0D';
const CREAM = '#F4F1E9';
const MUTED = '#8D8A83';

// NOTE: --mmx-footer-h and safe-area support keep the sticky footer visible
// above the mobile browser chrome and the phone's gesture bar. The shell is
// rendered at z-[100] (see JSX below) so it sits above the z-[60] MobileBottomNav.
const CSS = `
  .mmx-builder-shell { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  .mmx-shell {
    --mmx-footer-h: 68px;
    --mmx-safe-bottom: env(safe-area-inset-bottom, 0px);
    height: 100dvh;
    max-height: 100dvh;
  }
  @supports not (height: 100dvh) {
    .mmx-shell { height: 100vh; max-height: 100vh; }
  }
  .mmx-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    padding-bottom: calc(var(--mmx-footer-h) + 12px + var(--mmx-safe-bottom));
  }
  .mmx-footer {
    position: sticky;
    bottom: 0;
    z-index: 60;
    padding-bottom: calc(8px + var(--mmx-safe-bottom));
    box-shadow: 0 -8px 24px rgba(0,0,0,.06);
  }
  .mmx-screen-enter { animation: mmxScreenEnter 380ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-open { animation: mmxOpen 420ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-roof { animation: mmxRoof 620ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: 50% 100%; }
  .mmx-soft { animation: mmxSoft 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .mmx-light { animation: mmxLight 2.4s ease-in-out infinite; }
  .mmx-wifi { animation: mmxWifi 1.8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
  .mmx-success { animation: mmxSuccess 700ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-mobile-transition { animation: mmxMobileTransition 420ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-draw { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: mmxDraw 800ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-road { stroke-dasharray: 980; stroke-dashoffset: 980; animation: mmxRoad 950ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-plot-reveal { animation: mmxPlotReveal 720ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-footprint-draw { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: mmxFootprintDraw 900ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-architecture { animation: mmxArchitecture 760ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center bottom; }
  .mmx-campus { animation: mmxCampus 820ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: bottom center; }
  .mmx-occupancy { animation: mmxOccupancy 620ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-price-panel { animation: mmxPricePanel 700ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: right center; }
  .mmx-location-camera { animation: mmxLocationCamera 950ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-transport { animation: mmxTransport 900ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-water { animation: mmxWater 850ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: bottom center; }
  .mmx-power { animation: mmxPower 850ms cubic-bezier(.22,1,.36,1) both; }
  .mmx-service { animation: mmxService 650ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-management { animation: mmxManagement 650ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: left center; }
  .mmx-security { animation: mmxSecurity 850ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center bottom; }
  .mmx-amenity { animation: mmxAmenity 540ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center bottom; }
  .mmx-gallery { animation: mmxGallery 800ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-tour { animation: mmxTour 800ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-final-pullback { animation: mmxFinalPullback 1000ms cubic-bezier(.22,1,.36,1) both; transform-box: fill-box; transform-origin: center; }
  .mmx-field-attention { animation: mmxFieldAttention 1.25s ease-in-out 2; outline: 2px solid ${GOLD}; outline-offset: 3px; border-radius: 12px; }

  @keyframes mmxScreenEnter { from{opacity:0;transform:translateY(18px);filter:blur(4px)} to{opacity:1;transform:none;filter:none} }
  @keyframes mmxOpen { from{opacity:0;transform:scale(.75)} to{opacity:1;transform:scale(1)} }
  @keyframes mmxRoof { from{opacity:0;transform:translateY(-80px)} to{opacity:1;transform:none} }
  @keyframes mmxSoft { 0%,100%{opacity:.45;transform:scale(.92)} 50%{opacity:1;transform:scale(1)} }
  @keyframes mmxLight { 0%,100%{opacity:.25} 42%{opacity:1} 68%{opacity:.65} }
  @keyframes mmxWifi { 0%{opacity:0;transform:scale(.65)} 45%{opacity:.95;transform:scale(1)} 100%{opacity:0;transform:scale(1.3)} }
  @keyframes mmxSuccess { from{opacity:0;transform:scale(.84)} to{opacity:1;transform:scale(1)} }
  @keyframes mmxMobileTransition { from{opacity:.15;transform:translateY(8px) scale(.985)} to{opacity:1;transform:none} }
  @keyframes mmxDraw { from{stroke-dashoffset:1000;opacity:0} to{stroke-dashoffset:0;opacity:1} }
  @keyframes mmxRoad { from{stroke-dashoffset:980;opacity:.15} to{stroke-dashoffset:0;opacity:1} }
  @keyframes mmxPlotReveal { from{opacity:0;transform:scale(.72) rotate(-2deg)} to{opacity:1;transform:none} }
  @keyframes mmxFootprintDraw { from{stroke-dashoffset:1200;opacity:.15} to{stroke-dashoffset:0;opacity:1} }
  @keyframes mmxArchitecture { from{opacity:0;transform:translateY(34px) scaleY(.72)} to{opacity:1;transform:none} }
  @keyframes mmxCampus { from{opacity:0;transform:translateX(-55px) scale(.78)} to{opacity:1;transform:none} }
  @keyframes mmxOccupancy { from{opacity:0;transform:scale(.55)} to{opacity:1;transform:none} }
  @keyframes mmxPricePanel { from{opacity:0;transform:translateX(90px) scale(.9)} to{opacity:1;transform:none} }
  @keyframes mmxLocationCamera { from{opacity:.9;transform:scale(1.08)} to{opacity:1;transform:scale(.88)} }
  @keyframes mmxTransport { from{stroke-dashoffset:120;opacity:0} to{stroke-dashoffset:0;opacity:1} }
  @keyframes mmxWater { from{opacity:0;transform:translateY(30px) scaleY(.45)} to{opacity:1;transform:none} }
  @keyframes mmxPower { from{opacity:0;stroke-dashoffset:500} to{opacity:1;stroke-dashoffset:0} }
  @keyframes mmxService { from{opacity:0;transform:scale(.5) rotate(-8deg)} to{opacity:1;transform:none} }
  @keyframes mmxManagement { from{opacity:0;transform:translateX(-35px)} to{opacity:1;transform:none} }
  @keyframes mmxSecurity { from{opacity:0;transform:translateY(30px) scaleY(.7)} to{opacity:1;transform:none} }
  @keyframes mmxAmenity { from{opacity:0;transform:translateY(28px) scale(.65)} to{opacity:1;transform:none} }
  @keyframes mmxGallery { from{opacity:0;transform:translateY(30px) rotate(-3deg) scale(.86)} to{opacity:1;transform:none} }
  @keyframes mmxTour { from{opacity:0;transform:scale(.72) rotateX(18deg)} to{opacity:1;transform:none} }
  @keyframes mmxFinalPullback { from{opacity:.7;transform:scale(1.05)} to{opacity:1;transform:scale(.78)} }
  @keyframes mmxFieldAttention { 0%,100%{transform:translateX(0);box-shadow:0 0 0 rgba(200,169,107,0)} 25%{transform:translateX(-3px);box-shadow:0 0 0 4px rgba(200,169,107,.11)} 75%{transform:translateX(3px);box-shadow:0 0 0 4px rgba(200,169,107,.11)} }

  @media(max-width:1023px){
    .mmx-mobile-hero{position:sticky;top:0;z-index:25}
    .mmx-footer .mmx-footer-actions { width: 100%; }
    .mmx-footer .mmx-footer-actions > button { flex: 1 1 auto; justify-content: center; min-height: 44px; }
    .mmx-footer .mmx-footer-back { min-height: 44px; }
  }
  @media(prefers-reduced-motion:reduce){
    .mmx-screen-enter,.mmx-open,.mmx-roof,.mmx-soft,.mmx-light,.mmx-wifi,.mmx-success,.mmx-mobile-transition,.mmx-draw,.mmx-road,.mmx-plot-reveal,.mmx-footprint-draw,.mmx-architecture,.mmx-campus,.mmx-occupancy,.mmx-price-panel,.mmx-location-camera,.mmx-transport,.mmx-water,.mmx-power,.mmx-service,.mmx-management,.mmx-security,.mmx-amenity,.mmx-gallery,.mmx-tour,.mmx-final-pullback,.mmx-field-attention{animation:none!important}
  }
`;

// ── helpers ───────────────────────────────────────────────────────────────────

function cleanNumber(value) {
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function occupancyNumber(value) {
  const text = String(value ?? '1');
  const n = Number(text.replace(/[^0-9]/g, '')) || 1;
  return text.includes('+') ? n + 1 : n;
}

function propertyKind(propertyType) {
  if (LAND_LIKE.has(propertyType)) return 'land';
  if (propertyType === 'commercial') return 'commercial';
  if (HOSTEL_TYPES.has(propertyType) || HOSTEL_LIKE.has(propertyType)) return 'hostel';
  if (HOSPITALITY_TYPES.has(propertyType) || propertyType === 'urbannest') return 'hospitality';
  if (COMPACT_TYPES.has(propertyType)) return 'compact';
  if (BEDROOM_TYPES.has(propertyType) || SHARED_TYPES.has(propertyType)) return 'house';
  return 'building';
}

function buildRules(data) {
  const { listingType, propertyType } = data;
  const land = LAND_LIKE.has(propertyType);
  const shortStay = listingType === 'short_stay' || HOSPITALITY_TYPES.has(propertyType) || propertyType === 'urbannest';
  const student = listingType === 'rent' && (HOSTEL_TYPES.has(propertyType) || (HOSTEL_LIKE.has(propertyType) && propertyType !== 'urbannest'));
  const commercial = propertyType === 'commercial';
  const residential = RESIDENTIAL_TYPES.has(propertyType);

  return {
    land,
    shortStay,
    student,
    commercial,
    showUnitRoom: !land && !commercial,
    showStudentInfo: student && !shortStay,
    showOccupancy: !land && !commercial && (listingType === 'rent' || shortStay),
    showUtilities: !land && !commercial,
    showManagement: !land && !commercial,
    showSecurity: !land && !commercial,
    showGateRules: !land && (residential || shortStay),
    showAmenities: !land && !commercial,
    showNearbyPlaces: !commercial || shortStay,
  };
}

function filterScreenFlow(data) {
  const rules = buildRules(data);
  return SCREEN_FLOW.filter(({ id }) => {
    if (id === 'unitRoom') return rules.showUnitRoom;
    if (id === 'studentInfo') return rules.showStudentInfo;
    if (id === 'spaceOccupancy') return rules.showOccupancy;
    if (id === 'waterUtilities' || id === 'internetGarbage') return rules.showUtilities;
    if (id === 'management') return rules.showManagement;
    if (id === 'security') return rules.showSecurity;
    if (id === 'gateHouseRules') return rules.showGateRules;
    if (id === 'amenities') return rules.showAmenities;
    if (id === 'nearbyPlaces') return rules.showNearbyPlaces;
    return true;
  });
}

function groupExperiences(flow) {
  const seen = new Set();
  return flow.reduce((acc, screen) => {
    const meta = SCREEN_META[screen.id];
    if (!meta || seen.has(meta.group)) return acc;
    seen.add(meta.group);
    const fromConstants = Array.isArray(WIZARD_STEPS) ? WIZARD_STEPS.find((step) => step.id === meta.group) : null;
    acc.push({ id: meta.group, label: fromConstants?.label || GROUP_LABELS[meta.group] });
    return acc;
  }, []);
}

function isShortStay(data) {
  return data.listingType === 'short_stay' || HOSPITALITY_TYPES.has(data.propertyType) || data.propertyType === 'urbannest';
}

function imageUrl(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.remoteUrl || image.url || image.downloadURL || image.src || '';
}

const PRIMARY_PRICE_KEYS = ['price', 'rent', 'rentAmount', 'monthlyRent', 'salePrice', 'listingPrice'];

function readPrice(data) {
  if (!data) return '';
  for (const key of PRIMARY_PRICE_KEYS) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

function readTitle(data) {
  if (!data) return '';
  return data.title ?? data.propertyName ?? data.name ?? '';
}

function readLocation(data) {
  if (!data) return '';
  return data.location ?? data.area ?? data.town ?? data.county ?? '';
}

function readOccupancy(data) {
  if (!data) return '';
  return data.occupancy ?? data.capacity ?? data.guestCapacity ?? '';
}

function readAreaSize(data) {
  if (!data) return '';
  return data.areaSize ?? data.size ?? data.plotSize ?? data.landSize ?? '';
}

function serializeImages(input) {
  if (!Array.isArray(input)) return [];

  return input
    .map((img) => {
      if (!img) return null;

      if (typeof img === 'string') {
        const url = img.trim();
        if (!url || url.startsWith('blob:')) return null;
        return { id: null, url, remoteUrl: url, r2Key: null, category: null, name: '', status: 'uploaded' };
      }

      if (typeof img !== 'object') return null;

      const url = (img.remoteUrl || img.url || img.src || '').trim();
      if (!url || url.startsWith('blob:')) return null;

      return {
        id: img.id || null,
        url,
        remoteUrl: url,
        r2Key: img.r2Key || null,
        category: img.category || null,
        name: img.file?.name || img.name || '',
        status: img.status || 'uploaded',
      };
    })
    .filter(Boolean);
}

function hasPendingUploads(images) {
  if (!Array.isArray(images)) return false;
  return images.some((img) => img && typeof img === 'object' && img.status === 'uploading');
}

// ── SVG construction preview ──────────────────────────────────────────────────

function ConstructionScene({ data, builtLayer, currentScreenId, revision, compact = false }) {
  const kind = propertyKind(data.propertyType);
  const land = kind === 'land';
  const hostel = kind === 'hostel';
  const hospitality = isShortStay(data);
  const bedrooms = Math.max(1, Number.parseInt(String(data.bedrooms || '1'), 10) || 1);
  const occ = occupancyNumber(readOccupancy(data) || '1');
  const price = cleanNumber(readPrice(data));
  const amenities = Array.isArray(data.amenities) ? data.amenities : [];
  const security = Array.isArray(data.securityFeatures) ? data.securityFeatures : [];
  const features = Array.isArray(data.features) ? data.features : [];
  const serviceText = `${features.join(' ')} ${data.internet || ''} ${data.internetType || ''}`;
  const hasWater = Boolean(data.waterType);
  const hasElectricity = Boolean(data.electricityType);
  const hasWifi = /wifi|internet/i.test(serviceText);
  const hasGarbage = /garbage|waste|collection/i.test(`${serviceText} ${data.garbageCollection || ''}`);
  const hasCctv = security.some((x) => /cctv|camera/i.test(String(x)));
  const hasLock = security.some((x) => /lock|locked/i.test(String(x))) || Boolean(data.lockType);
  const hasGate = Boolean(data.gateType) || security.some((x) => /gate/i.test(String(x)));
  const hasSecurity = security.length > 0 || hasGate;
  const photo = imageUrl(data.images?.[0]);
  const secondPhoto = imageUrl(data.images?.[1]);
  const location = getPublicPropertyLocation(data);
  const title = PROPERTY_LABELS[data.propertyType] || String(data.propertyType || 'Property').replace(/_/g, ' ');
  const student = data.listingType === 'rent' && (HOSTEL_TYPES.has(data.propertyType) || HOSTEL_LIKE.has(data.propertyType));
  const showStudent = student && !hospitality;

  const building = useMemo(() => {
    if (land) return { x: 0, y: 0, w: 0, h: 0, roof: null };
    if (hostel) return { x: 305, y: 205, w: 390, h: 255, roof: 'flat' };
    if (hospitality) return { x: 320, y: 245, w: 360, h: 210, roof: 'sloped' };
    if (kind === 'compact') return { x: 345, y: 315, w: 310, h: 140, roof: 'sloped' };
    if (data.propertyType === 'duplex' || data.propertyType === 'maisonette') return { x: 300, y: 195, w: 400, h: 265, roof: 'sloped' };
    if (kind === 'house') return { x: 300, y: 275, w: 400, h: 185, roof: 'sloped' };
    return { x: 325, y: 255, w: 350, h: 205, roof: 'sloped' };
  }, [data.propertyType, hospitality, kind, land, hostel]);

  const x = building.x;
  const y = building.y;
  const w = building.w;
  const h = building.h;
  const floor2 = !land && (data.propertyType === 'duplex' || data.propertyType === 'maisonette' || hostel);
  const built = (layer) => builtLayer >= layer;
  const active = (id) => currentScreenId === id;
  const cameraClass = active('locationTransport') || active('nearbyPlaces') ? 'mmx-location-camera' : active('review') ? 'mmx-final-pullback' : '';
  const cameraTransform = active('locationTransport') || active('nearbyPlaces') ? 'translate(60 -20) scale(.88)' : active('review') ? 'translate(110 70) scale(.78)' : 'none';

  return (
    <svg
      key={`${data.propertyType || 'property'}-${compact ? 'mobile' : 'desktop'}`}
      viewBox={compact ? '0 170 1000 470' : '0 0 1000 700'}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-label={`${title} live property preview`}
      role="img"
    >
      <defs>
        <linearGradient id="mmxGround2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#292C2E" /><stop offset="100%" stopColor="#101214" />
        </linearGradient>
        <linearGradient id="mmxWall2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#303235" /><stop offset="100%" stopColor="#151719" />
        </linearGradient>
        <linearGradient id="mmxGold2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0C78C" /><stop offset="100%" stopColor="#987640" />
        </linearGradient>
        <filter id="mmxSceneShadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity=".48" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1000" height="700" fill="#0C0E0F" />
      <circle cx="520" cy="160" r="300" fill={GOLD} opacity=".035" />

      <g className={cameraClass} style={{ transform: cameraTransform === 'none' ? undefined : cameraTransform, transformOrigin: '500px 350px' }}>
        <path d="M70 520 Q500 435 930 520 L880 640 Q500 690 120 630Z" fill="url(#mmxGround2)" />
        <path d="M100 548 Q500 480 900 548" stroke={GOLD} strokeOpacity=".18" strokeWidth="2" strokeDasharray="8 15" fill="none" />

        {built(1) && (
          <g className={active('propertyType') ? 'mmx-plot-reveal' : ''}>
            <path d="M185 485 L370 425 L690 440 L815 515 L565 580 L290 550 Z" fill="none" stroke={GOLD} strokeWidth="4" strokeDasharray="9 7" />
            <path d="M235 487 L392 450 L675 465" stroke={CREAM} strokeOpacity=".25" strokeWidth="2" fill="none" />
            {land && <path d="M300 525 Q500 475 700 520" stroke="#68765C" strokeWidth="13" fill="none" strokeLinecap="round" opacity=".8" />}
          </g>
        )}

        {!land && (
          <g filter="url(#mmxSceneShadow)">
            {built(2) && (
              <g className={active('unitRoom') ? 'mmx-footprint-draw' : ''}>
                <path d={`M${x - 22} ${y + h + 9}H${x + w + 22}V${y + h + 30}H${x - 22}Z`} fill="#24272A" stroke={GOLD} strokeWidth="3" />
                <path d={`M${x - 10} ${y + h + 4}V${y - 10}H${x + w + 10}V${y + h + 4}`} fill="none" stroke={GOLD_SOFT} strokeWidth="4" strokeDasharray="15 9" />
                <path d={`M${x + w / 2} ${y - 10}V${y + h + 4}`} stroke={GOLD} strokeOpacity=".32" strokeWidth="2" strokeDasharray="7 9" />
              </g>
            )}

            {built(3) && (
              <g className={active('basicDetails') ? 'mmx-architecture' : ''}>
                <rect x={x} y={y} width={w} height={h} rx="15" fill="url(#mmxWall2)" stroke={CREAM} strokeWidth="5" />
                {floor2 && <line x1={x + 18} y1={y + h / 2} x2={x + w - 18} y2={y + h / 2} stroke={GOLD} strokeWidth="3" opacity=".65" />}
                {Array.from({ length: Math.max(2, Math.min(6, bedrooms * 2)) }).map((_, i) => {
                  const cols = floor2 ? 4 : 3;
                  const wx = x + 32 + (i % cols) * ((w - 64) / Math.max(1, cols - 1));
                  const wy = y + 28 + (floor2 ? Math.floor(i / cols) * 78 : 0);
                  return <Window key={`window-${i}`} x={wx - 22} y={wy} delay={i * 70} />;
                })}
                <g className="mmx-open">
                  <rect x={x + w / 2 - 27} y={y + h - 64} width="54" height="64" rx="7" fill="#3A2A1E" stroke={GOLD} strokeWidth="3" />
                  <circle cx={x + w / 2 + 15} cy={y + h - 35} r="3" fill={GOLD} />
                </g>
                {building.roof === 'sloped' ? (
                  <path d={`M${x - 30} ${y + 8}L${x + w / 2} ${y - 82}L${x + w + 30} ${y + 8}Z`} fill="url(#mmxGold2)" stroke={CREAM} strokeWidth="4" className="mmx-roof" />
                ) : (
                  <rect x={x - 12} y={y - 13} width={w + 24} height="20" rx="7" fill="url(#mmxGold2)" className="mmx-roof" />
                )}
              </g>
            )}

            {built(4) && showStudent && (
              <g className={active('studentInfo') ? 'mmx-campus' : ''}>
                <path d={`M${x - 145} ${y + h + 8} Q${x - 80} ${y + h - 25} ${x - 15} ${y + h + 8}`} fill="none" stroke="#D8C99D" strokeWidth="5" strokeDasharray="9 8" />
                <path d="M125 350l70-38 70 38-70 38z" fill="#262A2C" stroke={GOLD} strokeWidth="3" />
                <path d="M155 350v55h80v-55M190 330v-58" stroke={CREAM} strokeWidth="5" fill="none" />
                <path d="M176 390h38" stroke={GOLD} strokeWidth="5" />
              </g>
            )}

            {built(5) && (
              <g className={active('spaceOccupancy') ? 'mmx-occupancy' : ''}>
                {Array.from({ length: Math.min(Math.max(1, occ), hostel ? 8 : 4) }).map((_, i) => {
                  const cols = hostel ? 4 : 2;
                  const bx = x + 25 + (i % cols) * Math.max(78, (w - 75) / Math.max(1, cols));
                  const by = y + h - 86 - Math.floor(i / cols) * 48;
                  return <BedShape key={`bed-${i}`} x={bx} y={by} bunk={hostel} delay={i * 90} />;
                })}
                {!hostel && <BathroomShape x={x + 20} y={y + 22} />}
                {hostel && <DeskShape x={x + w - 98} y={y + 28} />}
                {data.sharingAllowed && occ > 1 && <path d={`M${x + 18} ${y + h - 25}H${x + w - 18}`} stroke={GOLD} strokeWidth="3" strokeDasharray="5 7" opacity=".65" />}
              </g>
            )}

            {built(6) && price > 0 && (
              <g className={active('priceCosts') ? 'mmx-price-panel' : ''}>
                <rect x="680" y="82" width="250" height="126" rx="24" fill="#090B0C" stroke={GOLD} strokeWidth="2" />
                <text x="706" y="113" fill={GOLD} fontSize="10" fontWeight="700" letterSpacing="2">{data.listingType === 'sale' ? 'SALE PRICE' : hospitality ? 'STAY RATE' : 'RENT'}</text>
                <text x="706" y="151" fill={CREAM} fontSize="25" fontWeight="700">KSh {price.toLocaleString()}</text>
                {data.deposit && <text x="706" y="177" fill="#B9B5AC" fontSize="10">Deposit · KSh {cleanNumber(data.deposit).toLocaleString()}</text>}
                {data.billingCycle && data.listingType !== 'sale' && <text x="706" y="195" fill="#8E8A82" fontSize="9">{String(data.billingCycle).replace(/_/g, ' ')}</text>}
              </g>
            )}

            {built(7) && (
              <g className={active('locationTransport') ? 'mmx-location-camera' : ''}>
                <path d="M35 570 Q500 455 965 570" stroke="#4B5052" strokeWidth="58" fill="none" strokeLinecap="round" />
                <path d="M35 570 Q500 455 965 570" stroke={CREAM} strokeWidth="3" strokeDasharray="18 20" fill="none" opacity=".38" className="mmx-road" />
                <path d={`M${x + w / 2} ${y + h + 30} Q500 500 500 475`} stroke={GOLD} strokeWidth="5" fill="none" strokeDasharray="9 9" />
                {data.coordinates && (
                  <g className="mmx-open">
                    <path d="M500 390c-23 0-40 17-40 39 0 31 40 65 40 65s40-34 40-65c0-22-17-39-40-39z" fill={GOLD} stroke={CREAM} strokeWidth="3" />
                    <circle cx="500" cy="430" r="10" fill={INK} />
                  </g>
                )}
                {location && <text x="500" y="330" textAnchor="middle" fill={CREAM} fontSize="13" fontWeight="600">{location.slice(0, 48)}</text>}
              </g>
            )}

            {built(8) && (
              <g className={active('nearbyPlaces') ? 'mmx-service' : ''}>
                <PlaceNode x={150} y={400} label="Nearby" />
                <PlaceNode x={850} y={395} label="Area" />
                <PlaceNode x={520} y={605} label="Road" />
                <path d="M150 400L420 475M850 395L590 470M520 605L500 520" stroke={GOLD} strokeOpacity=".28" strokeWidth="2" strokeDasharray="5 8" />
              </g>
            )}

            {built(9) && hasWater && (
              <g className={active('waterUtilities') ? 'mmx-water' : ''}>
                <ellipse cx={x - 82} cy={y + 12} rx="34" ry="14" fill="#3B4548" stroke="#75C7D2" strokeWidth="3" />
                <rect x={x - 116} y={y + 12} width="68" height="82" fill="#30383B" stroke="#75C7D2" strokeWidth="3" />
                <path d={`M${x - 103} ${y + 66}h42`} stroke="#75C7D2" strokeWidth="18" opacity=".8" />
                <path d={`M${x - 48} ${y + 75}H${x - 12}V${y + h - 18}`} stroke="#75C7D2" strokeWidth="6" fill="none" className="mmx-draw" />
              </g>
            )}

            {built(10) && hasElectricity && (
              <g className={active('internetGarbage') ? 'mmx-power' : ''}>
                <path d="M820 260v210M790 290h60M800 310h40" stroke="#B4B1AA" strokeWidth="6" fill="none" />
                <path d={`M820 310H${x + w}V${y + 58}`} stroke={GOLD} strokeWidth="4" fill="none" strokeDasharray="500" strokeDashoffset="500" className="mmx-draw" />
                <circle cx={x + w - 30} cy={y + 58} r="10" fill="#F7E5A0" className="mmx-light" />
              </g>
            )}
            {built(10) && hasWifi && (
              <g className={active('internetGarbage') ? 'mmx-service' : ''}>
                <rect x={x + w - 82} y={y + 30} width="48" height="26" rx="7" fill={CREAM} stroke="#B79AD2" strokeWidth="3" />
                <path d={`M${x + w - 72} ${y + 27}q14-27 28 0M${x + w - 79} ${y + 18}q21-40 42 0`} stroke="#B79AD2" strokeWidth="3" fill="none" className="mmx-wifi" />
              </g>
            )}
            {built(10) && hasGarbage && (
              <g className={active('internetGarbage') ? 'mmx-service' : ''}>
                <rect x={x + w + 34} y={y + h - 55} width="44" height="52" rx="7" fill="#303438" stroke="#A9A69F" strokeWidth="3" />
                <path d={`M${x + w + 30} ${y + h - 55}h52`} stroke={GOLD} strokeWidth="4" />
              </g>
            )}

            {built(11) && (
              <g className={active('management') ? 'mmx-management' : ''}>
                <rect x={x - 118} y={y + h - 95} width="104" height="62" rx="16" fill="#0B0D0E" stroke={GOLD} strokeWidth="2" />
                <circle cx={x - 92} cy={y + h - 64} r="12" fill="#25282A" stroke={CREAM} strokeWidth="2" />
                <path d={`M${x - 108} ${y + h - 38}q16-24 32 0`} stroke={CREAM} strokeWidth="3" fill="none" />
                <text x={x - 73} y={y + h - 67} fill={GOLD} fontSize="9" fontWeight="700">{data.managementType || data.ownerType || 'MANAGEMENT'}</text>
                <text x={x - 73} y={y + h - 49} fill="#A8A49C" fontSize="8">{data.managerName ? String(data.managerName).slice(0, 18) : 'Contact available'}</text>
              </g>
            )}

            {built(12) && hasSecurity && (
              <g className={active('security') || active('gateHouseRules') ? 'mmx-security' : ''}>
                <path d={`M${x - 70} ${y + h + 20}V${y + 75}M${x + w + 70} ${y + h + 20}V${y + 75}`} stroke={GOLD} strokeWidth="7" />
                <path d={`M${x - 70} ${y + 75}H${x + w + 70}`} stroke={GOLD} strokeWidth="4" />
                {hasGate && (
                  <g>
                    <rect x={x + w / 2 - 74} y={y + h + 2} width="54" height="84" rx="5" fill="#26292B" stroke={CREAM} strokeWidth="3" />
                    <rect x={x + w / 2 + 20} y={y + h + 2} width="54" height="84" rx="5" fill="#26292B" stroke={CREAM} strokeWidth="3" />
                    <path d={`M${x + w / 2 - 16} ${y + h + 34}h32`} stroke={GOLD} strokeWidth="4" />
                  </g>
                )}
                {hasLock && <g><rect x={x + w / 2 - 11} y={y + h + 36} width="22" height="28" rx="5" fill={GOLD} /><path d={`M${x + w / 2 - 7} ${y + h + 36}v-11q7-12 14 0v11`} stroke={GOLD} strokeWidth="4" fill="none" /></g>}
                {hasCctv && <g><path d={`M${x + w - 20} ${y + 42}h36l-20 20`} stroke={CREAM} strokeWidth="4" fill="none" /><circle cx={x + w + 2} cy={y + 63} r="6" fill={GOLD} className="mmx-light" /></g>}
              </g>
            )}

            {built(12) && active('gateHouseRules') && (
              <g className="mmx-management">
                <rect x="665" y="400" width="255" height="110" rx="20" fill="#090B0C" stroke={GOLD} strokeWidth="2" />
                <path d="M690 435h28M690 452h38M690 469h22" stroke={CREAM} strokeWidth="4" strokeLinecap="round" opacity=".72" />
                <circle cx="748" cy="434" r="5" fill={GOLD} /><circle cx="758" cy="451" r="5" fill={GOLD} /><circle cx="742" cy="468" r="5" fill={GOLD} />
                <text x="785" y="439" fill={GOLD} fontSize="9" fontWeight="700">ACCESS</text>
                <text x="785" y="457" fill="#B9B5AC" fontSize="8">Gate & house rules</text>
                <text x="785" y="475" fill="#7F7B73" fontSize="8">Controlled entry</text>
              </g>
            )}

            {built(13) && (
              <g>
                {amenities.map((amenity, i) => {
                  const a = String(amenity).toLowerCase();
                  const ax = x + w + 20 + (i % 2) * 105;
                  const ay = y + 18 + Math.floor(i / 2) * 62;
                  if (/parking|garage|car/.test(a)) return <g key={`amenity-${i}`} className="mmx-amenity" style={{ animationDelay: `${i * 90}ms` }}><rect x={ax} y={ay} width="90" height="42" rx="9" fill="#2B2F31" stroke={GOLD} strokeWidth="2" /><text x={ax + 45} y={ay + 26} textAnchor="middle" fill={CREAM} fontSize="8">PARKING</text></g>;
                  if (/garden|yard|lawn/.test(a)) return <g key={`amenity-${i}`} className="mmx-amenity" style={{ animationDelay: `${i * 90}ms` }}><path d={`M${ax} ${ay + 35}q15-38 30 0t30 0t30 0`} stroke="#718460" strokeWidth="10" fill="none" strokeLinecap="round" /></g>;
                  if (/laundry|washing/.test(a)) return <g key={`amenity-${i}`} className="mmx-amenity" style={{ animationDelay: `${i * 90}ms` }}><rect x={ax + 15} y={ay} width="48" height="42" rx="8" fill="#E8E5DC" stroke="#9BA0A0" strokeWidth="2" /><circle cx={ax + 39} cy={ay + 21} r="11" fill="#D7DCE0" stroke="#777D80" strokeWidth="2" /></g>;
                  if (/kitchen|cooking/.test(a)) return <g key={`amenity-${i}`} className="mmx-amenity" style={{ animationDelay: `${i * 90}ms` }}><rect x={ax} y={ay + 17} width="92" height="15" rx="5" fill="#E6DECF" stroke={GOLD} strokeWidth="2" /><circle cx={ax + 27} cy={ay + 8} r="6" fill="#7C8589" /><circle cx={ax + 66} cy={ay + 8} r="6" fill="#7C8589" /></g>;
                  if (/balcony|terrace/.test(a)) return <g key={`amenity-${i}`} className="mmx-amenity" style={{ animationDelay: `${i * 90}ms` }}><rect x={ax} y={ay} width="90" height="42" rx="8" fill="#222528" stroke={GOLD} strokeWidth="2" /><path d={`M${ax + 12} ${ay + 20}h66M${ax + 25} ${ay}v42M${ax + 45} ${ay}v42M${ax + 65} ${ay}v42`} stroke={CREAM} strokeWidth="2" /></g>;
                  if (/tank|borehole/.test(a)) return <g key={`amenity-${i}`} className="mmx-amenity" style={{ animationDelay: `${i * 90}ms` }}><ellipse cx={ax + 43} cy={ay + 9} rx="25" ry="9" fill="#3E484A" stroke="#75C7D2" strokeWidth="2" /><rect x={ax + 18} y={ay + 9} width="50" height="30" fill="#30383B" stroke="#75C7D2" strokeWidth="2" /></g>;
                  return <g key={`amenity-${i}`} className="mmx-amenity" style={{ animationDelay: `${i * 90}ms` }}><circle cx={ax + 45} cy={ay + 21} r="18" fill="#222528" stroke={GOLD} strokeWidth="2" /><text x={ax + 45} y={ay + 24} textAnchor="middle" fill={CREAM} fontSize="7">{String(amenity).slice(0, 9)}</text></g>;
                })}
              </g>
            )}

            {built(14) && photo && (
              <g className={active('photosMedia') ? 'mmx-gallery' : ''}>
                <rect x="72" y="74" width="238" height="164" rx="18" fill="#080A0B" stroke={GOLD} strokeWidth="2" transform="rotate(-5 191 156)" />
                <image href={photo} x="80" y="82" width="222" height="146" preserveAspectRatio="xMidYMid slice" transform="rotate(-5 191 156)" />
                {secondPhoto && <><rect x="770" y="90" width="170" height="122" rx="16" fill="#080A0B" stroke="#FFFFFF" strokeOpacity=".22" transform="rotate(5 855 151)" /><image href={secondPhoto} x="777" y="97" width="156" height="108" preserveAspectRatio="xMidYMid slice" transform="rotate(5 855 151)" /></>}
              </g>
            )}

            {built(15) && data.youtubeUrl && (
              <g className={active('youtubeTour') ? 'mmx-tour' : ''}>
                <rect x="720" y="245" width="205" height="126" rx="20" fill="#090B0C" stroke={GOLD} strokeWidth="2" />
                <rect x="735" y="260" width="175" height="82" rx="13" fill="#191C1E" />
                <circle cx="822" cy="301" r="25" fill={GOLD} />
                <path d="M814 286L840 301L814 316Z" fill={INK} />
                <path d="M748 353h148" stroke="#FFFFFF" strokeOpacity=".15" strokeWidth="3" />
                <circle cx="750" cy="353" r="5" fill={GOLD} />
              </g>
            )}
          </g>
        )}

        {land && built(7) && (
          <g className={active('locationTransport') ? 'mmx-location-camera' : ''}>
            <path d="M30 570 Q500 470 970 570" stroke="#4B5052" strokeWidth="58" fill="none" strokeLinecap="round" />
            <path d="M30 570 Q500 470 970 570" stroke={CREAM} strokeWidth="3" strokeDasharray="18 20" fill="none" className="mmx-road" />
            {data.coordinates && <g className="mmx-open"><path d="M500 390c-23 0-40 17-40 39 0 31 40 65 40 65s40-34 40-65c0-22-17-39-40-39z" fill={GOLD} /><circle cx="500" cy="430" r="10" fill={INK} /></g>}
            {location && <text x="500" y="335" textAnchor="middle" fill={CREAM} fontSize="13">{location.slice(0, 48)}</text>}
          </g>
        )}

        {built(7) && (active('locationTransport') || builtLayer >= 8) && (
          <g className={active('locationTransport') ? 'mmx-transport' : ''}>
            <path d="M90 548 Q500 455 910 548" stroke="#D7D0C1" strokeWidth="2" fill="none" strokeDasharray="5 13" opacity=".4" />
            <g>
              <rect x="430" y="475" width="76" height="30" rx="10" fill="#D8D2C6" stroke={INK} strokeWidth="3" />
              <rect x="445" y="465" width="35" height="20" rx="6" fill="#BFCAD0" stroke={INK} strokeWidth="2" />
              <circle cx="447" cy="507" r="9" fill="#17191A" /><circle cx="490" cy="507" r="9" fill="#17191A" />
            </g>
          </g>
        )}
      </g>

      {built(16) && (
        <g className="mmx-success">
          <circle cx="500" cy="92" r="31" fill={INK} stroke={GOLD} strokeWidth="4" />
          <path d="M483 92l11 11l23-27" stroke={CREAM} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

function roomsForType(type, bedrooms) {
  if (type === 'single_room' || type === 'bedsitter' || type === 'studio_apartment') return 1;
  if (type === 'apartment' || type === 'standalone_house' || type === 'bungalow' || type === 'maisonette' || type === 'townhouse' || type === 'duplex' || type === 'semi_detached') return Math.max(2, bedrooms + 1);
  return Math.max(1, bedrooms);
}

function Window({ x, y, delay = 0 }) {
  return (
    <g className="mmx-open" style={{ animationDelay: `${delay}ms` }}>
      <rect x={x} y={y} width="44" height="38" rx="6" fill="#D8E8EF" stroke={CREAM} strokeWidth="4" />
      <path d={`M${x + 22} ${y}v38M${x} ${y + 19}h44`} stroke="#7B858A" strokeWidth="2" />
    </g>
  );
}

function BedShape({ x, y, bunk = false, delay = 0 }) {
  return (
    <g className="mmx-open" style={{ animationDelay: `${delay}ms` }}>
      <rect x={x} y={y} width="68" height="34" rx="8" fill="#E9E3D6" stroke={GOLD} strokeWidth="2" />
      <rect x={x + 6} y={y + 7} width="20" height="13" rx="4" fill="#FFFFFF" stroke="#C9C2B5" />
      <path d={`M${x + 34} ${y + 10}h24M${x + 34} ${y + 18}h24`} stroke="#B4AB99" strokeWidth="4" strokeLinecap="round" />
      {bunk && <line x1={x - 3} y1={y - 5} x2={x + 71} y2={y - 5} stroke={GOLD} strokeWidth="3" />}
    </g>
  );
}

function DeskShape({ x, y }) {
  return <g className="mmx-open"><rect x={x} y={y} width="70" height="12" rx="4" fill="#D8CCB7" /><path d={`M${x + 8} ${y + 12}v25M${x + 62} ${y + 12}v25`} stroke="#D8CCB7" strokeWidth="4" /></g>;
}

function BathroomShape({ x, y }) {
  return <g className="mmx-open"><rect x={x} y={y} width="70" height="52" rx="8" fill="#DCE6E9" fillOpacity=".45" stroke="#A4B4B8" strokeWidth="2" /><circle cx={x + 48} cy={y + 25} r="12" fill="#F3F2ED" stroke="#A4B4B8" strokeWidth="2" /></g>;
}

function PlaceNode({ x, y, label }) {
  return <g><circle cx={x} cy={y} r="13" fill="#0B0B0D" stroke={GOLD} strokeWidth="3" className="mmx-soft" /><text x={x} y={y + 30} textAnchor="middle" fill="#FFFFFF" fillOpacity=".42" fontSize="10">{label}</text></g>;
}

function PreviewCard({ data, builtLayer, currentScreenId, completion, revision }) {
  const land = LAND_LIKE.has(data.propertyType);
  const hospitality = isShortStay(data);
  const propertyLabel = PROPERTY_LABELS[data.propertyType] || String(data.propertyType || 'Property').replace(/_/g, ' ');
  const listingLabel = data.listingType === 'sale' ? 'For Sale' : hospitality ? 'Short Stay' : 'For Rent';
  const price = cleanNumber(readPrice(data));
  const location = getPublicPropertyLocation(data);
  const images = Array.isArray(data.images) ? data.images : [];
  const firstImage = imageUrl(images[0]);
  const occ = readOccupancy(data);
  const title = readTitle(data);

  return (
    <div className="space-y-4">
      <ConstructionScene data={data} builtLayer={builtLayer} currentScreenId={currentScreenId} revision={revision} />

      <div className="rounded-[26px] border border-black/8 bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,.07)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[.24em]" style={{ color: GOLD }}>{listingLabel}</div>
            <div className="mt-1 truncate text-base font-semibold" style={{ color: INK }}>{title || 'Untitled property'}</div>
            <div className="mt-1 flex items-center gap-1.5 truncate text-xs" style={{ color: MUTED }}>
              <MapPinned size={13} />
              <span>{location || 'Location will appear here'}</span>
            </div>
          </div>
          <div className="shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold" style={{ borderColor: `${GOLD}55`, color: INK }}>
            {propertyLabel}
          </div>
        </div>

        {!land && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-black/7 py-3 text-xs text-[#5E5E64]">
            <div className="flex items-center gap-1.5"><Bed size={14} /> {data.bedrooms || '—'}</div>
            <div className="flex items-center gap-1.5"><Bath size={14} /> {data.bathrooms || '—'}</div>
            <div className="flex items-center gap-1.5"><Users size={14} /> {occ ? occupancyNumber(occ) : '—'}</div>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[.18em]" style={{ color: MUTED }}>Price</div>
            <div className="mt-1 text-xl font-semibold" style={{ color: INK }}>KSh {price.toLocaleString()}</div>
          </div>
          <div className="text-right text-xs capitalize" style={{ color: MUTED }}>
            {data.listingType === 'sale' ? 'sale price' : hospitality ? (data.billingCycle || 'nightly') : (data.billingCycle || 'monthly')}
          </div>
        </div>

        {firstImage && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/7 bg-[#F8F7F3] p-3">
            <img src={firstImage} alt="Uploaded property" className="h-14 w-20 rounded-xl object-cover" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#18191C]">Real property media</div>
              <div className="mt-1 text-[10px] text-[#85858C]">
                {images.length} image{images.length === 1 ? '' : 's'} uploaded
                {data.youtubeUrl ? ' • tour added' : ''}
              </div>
            </div>
            <ImageIcon size={16} className="ml-auto text-[#77736A]" />
          </div>
        )}

        {currentScreenId === 'review' && builtLayer >= 16 && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border p-3.5" style={{ borderColor: `${GOLD}42`, background: `${GOLD}0B` }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${GOLD}22`, color: INK }}>
              <CheckCircle2 size={19} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#151619]">Property built successfully</div>
              <div className="mt-0.5 text-[10px] text-[#77736A]">Review the details, then submit.</div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: MUTED }}>
            <span>Build progress</span><span style={{ color: INK }}>{completion}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/6">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completion}%`, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── validation & focus helpers ────────────────────────────────────────────────

function isEmpty(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function getFieldAliases(field) {
  const aliases = {
    title: ['title', 'property-title', 'listing-title', 'propertyname', 'name'],
    price: ['price', 'amount', 'saleprice', 'rentamount', 'monthlyrent', 'rent', 'listingprice'],
    location: ['location', 'property-location', 'area', 'town', 'county', 'landmark'],
    areaSize: ['areasize', 'size', 'plotsize', 'landsize'],
    occupancy: ['occupancy', 'capacity', 'guestcapacity'],
    bedrooms: ['bedrooms', 'bedroomcount'],
    bathrooms: ['bathrooms', 'bathroomcount'],
    images: ['images', 'photos', 'property-images', 'media'],
    propertyType: ['propertytype', 'property-type'],
    listingType: ['listingtype', 'listing-type'],
  };
  return aliases[field] || [field];
}

function fieldMatches(element, aliases) {
  const haystack = [
    element.getAttribute?.('name'),
    element.getAttribute?.('id'),
    element.getAttribute?.('data-field'),
    element.getAttribute?.('data-field-key'),
    element.getAttribute?.('aria-label'),
    element.getAttribute?.('placeholder'),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return aliases.some((alias) => haystack.includes(String(alias).toLowerCase()));
}

function focusField(field) {
  const elements = Array.from(
    document.querySelectorAll('input, textarea, select, button, [role="button"], [tabindex]')
  );
  const aliases = getFieldAliases(field);
  const editable = elements.filter((el) => el.matches('input, textarea, select'));
  const target = editable.find((element) => fieldMatches(element, aliases)) || elements.find((element) => fieldMatches(element, aliases));

  if (!target) return false;

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }

    target.classList.add('mmx-field-attention');
    window.setTimeout(() => target.classList.remove('mmx-field-attention'), 1800);
  }, 220);

  return true;
}

function validateForSubmit(data) {
  const priceValue = readPrice(data);
  const titleValue = readTitle(data);
  const locationValue = readLocation(data);
  const areaSizeValue = readAreaSize(data);
  const occupancyValue = readOccupancy(data);

  const required = [
    {
      field: 'propertyType',
      label: 'Property type',
      screenId: 'propertyType',
      missing: isEmpty(data.propertyType),
      message: 'Choose the property type before submitting.',
    },
    {
      field: 'title',
      label: 'Property title',
      screenId: 'basicDetails',
      missing: isEmpty(titleValue),
      message: 'Enter a property title or property name.',
    },
    {
      field: 'price',
      label: data.listingType === 'sale' ? 'Sale price' : 'Price',
      screenId: 'priceCosts',
      missing: isEmpty(priceValue),
      message: data.listingType === 'sale'
        ? 'Enter the sale price before submitting.'
        : 'Enter the rent amount before submitting.',
    },
    {
      field: 'location',
      label: 'Property location',
      screenId: 'locationTransport',
      missing: isEmpty(locationValue) && !data.coordinates,
      message: 'Add the property location or pin the property on the map.',
    },
  ];

  if (LAND_LIKE.has(data.propertyType)) {
    required.push({
      field: 'areaSize',
      label: 'Land / plot size',
      screenId: 'basicDetails',
      missing: isEmpty(areaSizeValue),
      message: 'Enter the land or plot size.',
    });
  }

  if (!LAND_LIKE.has(data.propertyType) && isShortStay(data)) {
    required.push({
      field: 'occupancy',
      label: 'Guest capacity',
      screenId: 'spaceOccupancy',
      missing: isEmpty(occupancyValue),
      message: 'Enter how many guests the accommodation can host.',
    });
  }

  if (!LAND_LIKE.has(data.propertyType) && data.propertyType !== 'commercial') {
    const uploaded = (Array.isArray(data.images) ? data.images : []).filter((img) => imageUrl(img));
    required.push({
      field: 'images',
      label: 'Property photos',
      screenId: 'photosMedia',
      missing: uploaded.length === 0,
      message: 'Add at least one property photo.',
    });
  }

  return required.find((item) => item.missing) || null;
}

function validateScreenForContinue(data, screenId, rules) {
  switch (screenId) {
    case 'propertyType':
      return isEmpty(data.propertyType)
        ? { field: 'propertyType', label: 'Property type', screenId, message: 'Choose the property type.' }
        : null;

    case 'basicDetails':
      return isEmpty(readTitle(data))
        ? { field: 'title', label: 'Property title', screenId, message: 'Enter a property title or property name.' }
        : null;

    case 'priceCosts': {
      const primary = readPrice(data);
      const label = data.listingType === 'sale' ? 'Sale price' : 'Rent amount';
      const message = data.listingType === 'sale'
        ? 'Enter the sale price. Other monthly charges are optional.'
        : 'Enter the monthly rent amount. Other recurring charges are optional.';
      return isEmpty(primary)
        ? { field: 'price', label, screenId, message }
        : null;
    }

    case 'locationTransport':
      return isEmpty(readLocation(data)) && !data.coordinates
        ? { field: 'location', label: 'Property location', screenId, message: 'Add the location or pin the property on the map.' }
        : null;

    case 'photosMedia': {
      const uploaded = (Array.isArray(data.images) ? data.images : []).filter((img) => imageUrl(img));
      const pending = hasPendingUploads(data.images);
      if (pending) {
        return { field: 'images', label: 'Property photos', screenId, message: 'Wait for uploads to finish before continuing.' };
      }
      if (!LAND_LIKE.has(data.propertyType) && data.propertyType !== 'commercial' && uploaded.length === 0) {
        return { field: 'images', label: 'Property photos', screenId, message: 'Add at least one property photo.' };
      }
      return null;
    }

    case 'spaceOccupancy':
      return rules.shortStay && isEmpty(readOccupancy(data))
        ? { field: 'occupancy', label: 'Guest capacity', screenId, message: 'Enter the number of guests this accommodation can host.' }
        : null;

    default:
      return null;
  }
}

function screenCompleted(data, screenId) {
  switch (screenId) {
    case 'propertyType': return Boolean(data.propertyType && data.listingType);
    case 'basicDetails': return Boolean(String(readTitle(data) || '').trim());
    case 'unitRoom': return Boolean(data.unitType || data.roomType || data.bedrooms || readAreaSize(data));
    case 'studentInfo': return true;
    case 'spaceOccupancy': return Boolean(readOccupancy(data));
    case 'priceCosts': return Boolean(readPrice(data));
    case 'locationTransport': return Boolean(readLocation(data) || data.coordinates);
    case 'nearbyPlaces': return Boolean(data.landmark || data.area || data.town);
    case 'waterUtilities': return Boolean(data.waterType || data.electricityType);
    case 'internetGarbage': return Boolean(data.internet || data.internetType || data.features?.length);
    case 'management': return Boolean(data.managementType || data.managerName || data.ownerType);
    case 'security': return Boolean(data.securityFeatures?.length);
    case 'gateHouseRules': return Boolean(data.gateType || data.houseRules || data.securityFeatures?.length);
    case 'amenities': return Boolean(data.amenities?.length);
    case 'photosMedia': return (Array.isArray(data.images) ? data.images : []).some((img) => imageUrl(img));
    case 'youtubeTour': return Boolean(data.youtubeUrl);
    case 'review': return true;
    default: return false;
  }
}

// ── main component ────────────────────────────────────────────────────────────

export default function SellerPropertyUpload({ onClose, onSuccess, existingDraft = null }) {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [phonePromptOpen, setPhonePromptOpen] = useState(false);
  const [phoneNumberInput, setPhoneNumberInput] = useState('');

  useEffect(() => {
    const hasPhone = userProfile?.phone || userProfile?.phoneNumber || currentUser?.phoneNumber;
    if (currentUser && !hasPhone) {
      setPhonePromptOpen(true);
    } else {
      setPhonePromptOpen(false);
    }
  }, [userProfile, currentUser]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumberInput.trim()) {
      toast.error('Please enter a valid phone number');
      return;
    }
    try {
      await updateUserProfile({ phone: phoneNumberInput.trim() });
      setPhonePromptOpen(false);
      toast.success('Phone number saved successfully!');
    } catch (err) {
      console.error('Error saving phone:', err);
      toast.error('Failed to save phone number');
    }
  };

  const draftData = existingDraft?.data || null;
  const [data, setData] = useState(() => ({ ...initialData, ...(draftData || {}) }));
  const [screenIndex, setScreenIndex] = useState(() => Math.max(0, Number(existingDraft?.stepIndex ?? draftData?.stepIndex ?? 0) || 0));
  const [saving, setSaving] = useState(false);
  const [builtLayer, setBuiltLayer] = useState(() => Math.max(0, Math.min(16, Number(draftData?.builtLayer ?? 0) || 0)));
  const [constructionRevision, setConstructionRevision] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [transitioning, setTransitioning] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const contentRef = useRef(null);
  const closeBtnRef = useRef(null);
  const dataRef = useRef(data);
  const draftIdRef = useRef(null);
  const saveQueueRef = useRef(Promise.resolve());
  const advanceTimerRef = useRef(null);
  const autoAdvanceLockRef = useRef(false);
  const focusTimerRef = useRef(null);
  const draftSaveTimerRef = useRef(null);
  const screenIndexRef = useRef(Math.max(0, Number(existingDraft?.stepIndex ?? draftData?.stepIndex ?? 0) || 0));
  const builtLayerRef = useRef(builtLayer);

  const flow = useMemo(() => filterScreenFlow(data), [data.listingType, data.propertyType]);
  const experiences = useMemo(() => groupExperiences(flow), [flow]);
  const currentScreen = flow[screenIndex] || flow[0] || SCREEN_FLOW[0];
  const currentScreenId = currentScreen.id;
  const currentMeta = SCREEN_META[currentScreenId] || SCREEN_META.propertyType;
  const currentExperienceIndex = Math.max(0, experiences.findIndex((x) => x.id === currentMeta.group));
  const isLastScreen = screenIndex >= flow.length - 1;
  const rules = useMemo(() => buildRules(data), [data.listingType, data.propertyType]);

  useEffect(() => {
    draftIdRef.current = existingDraft?.propertyId || draftData?.id || null;
  }, [existingDraft?.propertyId, draftData?.id]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    builtLayerRef.current = builtLayer;
  }, [builtLayer]);

  useEffect(() => () => {
    clearTimeout(advanceTimerRef.current);
    clearTimeout(focusTimerRef.current);
    clearTimeout(draftSaveTimerRef.current);
  }, []);

  useEffect(() => {
    const max = Math.max(0, flow.length - 1);
    setScreenIndex((prev) => {
      const next = Math.min(prev, max);
      screenIndexRef.current = next;
      return next;
    });
  }, [flow.length]);

  const scrollTop = useCallback(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, []);

  const routeToProblem = useCallback((problem) => {
    if (!problem) return;

    const targetIndex = flow.findIndex((screen) => screen.id === problem.screenId);
    const safeIndex = targetIndex >= 0 ? targetIndex : 0;

    clearTimeout(advanceTimerRef.current);
    autoAdvanceLockRef.current = false;
    setTransitioning(false);
    setValidationError(problem);
    screenIndexRef.current = safeIndex;
    setScreenIndex(safeIndex);
    scrollTop();

    clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      focusField(problem.field);
    }, 320);

    toast.error(problem.message || `Complete ${problem.label}.`);
  }, [flow, scrollTop]);

  const saveDraftSnapshot = useCallback(async (snapshot = dataRef.current, options = {}) => {
    if (!currentUser?.uid) return null;

    const stepIndexToSave = Number.isFinite(Number(options.stepIndex))
      ? Number(options.stepIndex)
      : screenIndexRef.current;

    const layerToSave = Number.isFinite(Number(options.builtLayer))
      ? Number(options.builtLayer)
      : builtLayerRef.current;

    const serializedImages = serializeImages(snapshot.images);

    const payload = {
      ...snapshot,
      images: serializedImages,
      media: serializeImages(snapshot.media || snapshot.images),
      sellerId: currentUser.uid,
      userId: currentUser.uid,
      sellerEmail: currentUser.email || '',
      status: 'draft',
      approvalStatus: 'draft',
      verificationStatus: 'draft',
      stepIndex: stepIndexToSave,
      currentStepId: options.currentStepId || flow[stepIndexToSave]?.id || currentScreenId,
      builtLayer: layerToSave,
      updatedAt: serverTimestamp(),
    };

    setAutoSaveStatus('saving');
    saveQueueRef.current = saveQueueRef.current.catch(() => {}).then(async () => {
      if (draftIdRef.current) {
        await setDoc(doc(db, 'properties', draftIdRef.current), payload, { merge: true });
      } else {
        const created = await addDoc(collection(db, 'properties'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        draftIdRef.current = created.id;
      }
      setAutoSaveStatus('saved');
      return draftIdRef.current;
    }).catch((error) => {
      console.error('MarketMix draft autosave failed:', error);
      setAutoSaveStatus('error');
      throw error;
    });

    return saveQueueRef.current;
  }, [currentScreenId, currentUser?.email, currentUser?.uid, flow]);

  const scheduleDraftSave = useCallback((snapshot, stepIndex = screenIndexRef.current, layer = builtLayerRef.current) => {
    if (!currentUser?.uid || submitted) return;
    clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = window.setTimeout(() => {
      void saveDraftSnapshot(snapshot, { stepIndex, currentStepId: flow[stepIndex]?.id, builtLayer: layer });
    }, 650);
  }, [currentUser?.uid, flow, saveDraftSnapshot, submitted]);

  const advanceToNext = useCallback((delay = 420, snapshot = dataRef.current) => {
    if (autoAdvanceLockRef.current || isLastScreen) return;

    autoAdvanceLockRef.current = true;
    setTransitioning(true);
    clearTimeout(advanceTimerRef.current);

    advanceTimerRef.current = window.setTimeout(async () => {
      try {
        const problem = validateScreenForContinue(snapshot, currentScreenId, rules);
        if (problem) {
          routeToProblem(problem);
          return;
        }

        const nextIndex = Math.min(screenIndexRef.current + 1, flow.length - 1);
        const nextScreen = flow[nextIndex];
        const nextLayer = nextScreen?.id === 'review' ? 16 : currentMeta.layer;
        await saveDraftSnapshot(snapshot, { stepIndex: nextIndex, currentStepId: nextScreen?.id, builtLayer: nextLayer });

        setBuiltLayer((previous) => Math.max(previous, nextLayer));
        builtLayerRef.current = Math.max(builtLayerRef.current, nextLayer);
        setConstructionRevision((previous) => previous + 1);
        screenIndexRef.current = nextIndex;
        setScreenIndex(nextIndex);
        setValidationError(null);
        scrollTop();
      } catch (error) {
        console.error('MarketMix advance failed:', error);
      } finally {
        autoAdvanceLockRef.current = false;
        setTransitioning(false);
      }
    }, delay);
  }, [currentMeta.layer, currentScreenId, flow, isLastScreen, routeToProblem, rules, saveDraftSnapshot, scrollTop]);

  // update accepts BOTH a plain object patch AND a reducer function.
  const update = useCallback((patchOrUpdater) => {
    const prev = dataRef.current || {};
    const patch = typeof patchOrUpdater === 'function' ? patchOrUpdater(prev) : patchOrUpdater;
    if (!patch || typeof patch !== 'object') return;

    const next = { ...prev, ...patch };

    if (patch.propertyType) {
      const type = patch.propertyType;
      if (type === 'single_room' || type === 'bedsitter' || type === 'studio_apartment') {
        next.bedrooms = '1';
        next.bathrooms = '1';
      }
      if (LAND_LIKE.has(type)) {
        next.bedrooms = '';
        next.bathrooms = '';
        next.occupancy = '';
        next.sharingAllowed = false;
      }
      if (type === 'urbannest') {
        next.listingType = 'short_stay';
        next.billingCycle = 'daily';
      }
    }

    if (patch.occupancy !== undefined && occupancyNumber(patch.occupancy) <= 1) {
      next.sharingAllowed = false;
    }

    dataRef.current = next;
    setData(next);
    setAutoSaveStatus('unsaved');
    setValidationError(null);
    scheduleDraftSave(next, screenIndexRef.current, builtLayerRef.current);

    if (currentScreenId === 'propertyType' && patch.propertyType) {
      setBuiltLayer(1);
      builtLayerRef.current = Math.max(builtLayerRef.current, 1);
      setConstructionRevision((prevRev) => prevRev + 1);
      advanceToNext(800, next);
      return;
    }

    if (currentScreenId === 'spaceOccupancy' && patch.occupancy !== undefined && occupancyNumber(patch.occupancy) <= 1) {
      advanceToNext(420, next);
      return;
    }
    if (currentScreenId === 'spaceOccupancy' && patch.sharingAllowed !== undefined) {
      advanceToNext(420, next);
      return;
    }

    // Don't auto-advance photosMedia: the user needs to finish uploading.
    if (currentScreenId === 'photosMedia') return;

    const keys = Object.keys(patch);
    if (keys.length === 1 && AUTO_ADVANCE_KEYS.has(keys[0]) && screenCompleted(next, currentScreenId)) {
      advanceToNext(420, next);
    }
  }, [advanceToNext, currentScreenId, scheduleDraftSave]);

  const handleContinue = useCallback(async () => {
    if (autoAdvanceLockRef.current || isLastScreen || submitted) return;

    const snapshot = dataRef.current;

    if (currentScreenId === 'photosMedia' && hasPendingUploads(snapshot.images)) {
      toast.error('Please wait for your photos to finish uploading.');
      return;
    }

    const problem = validateScreenForContinue(snapshot, currentScreenId, rules);
    if (problem) {
      routeToProblem(problem);
      return;
    }

    autoAdvanceLockRef.current = true;
    setTransitioning(true);

    try {
      const nextIndex = Math.min(screenIndexRef.current + 1, flow.length - 1);
      const nextScreen = flow[nextIndex];
      const nextLayer = nextScreen?.id === 'review' ? 16 : currentMeta.layer;
      clearTimeout(draftSaveTimerRef.current);
      await saveDraftSnapshot(snapshot, { stepIndex: nextIndex, currentStepId: nextScreen?.id, builtLayer: nextLayer });

      setBuiltLayer((previous) => Math.max(previous, nextLayer));
      builtLayerRef.current = Math.max(builtLayerRef.current, nextLayer);
      setConstructionRevision((previous) => previous + 1);
      screenIndexRef.current = nextIndex;
      setScreenIndex(nextIndex);
      setValidationError(null);
      scrollTop();
    } catch (error) {
      console.error('MarketMix continue save failed:', error);
    } finally {
      window.setTimeout(() => {
        autoAdvanceLockRef.current = false;
        setTransitioning(false);
      }, 420);
    }
  }, [currentMeta.layer, currentScreenId, flow, isLastScreen, routeToProblem, rules, saveDraftSnapshot, scrollTop, submitted]);

  const handleBack = useCallback(() => {
    clearTimeout(advanceTimerRef.current);
    autoAdvanceLockRef.current = false;
    setScreenIndex((prev) => { const next = Math.max(prev - 1, 0); screenIndexRef.current = next; return next; });
    scrollTop();
  }, [scrollTop]);

  const handleSelectExperience = useCallback((experienceIndex) => {
    clearTimeout(advanceTimerRef.current);
    autoAdvanceLockRef.current = false;
    setValidationError(null);
    const experience = experiences[experienceIndex];
    if (!experience) return;
    const target = flow.findIndex((screen) => SCREEN_META[screen.id]?.group === experience.id);
    if (target < 0) return;
    screenIndexRef.current = target;
    setScreenIndex(target);
    scrollTop();
  }, [experiences, flow, scrollTop]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('mmx-builder-open');
    closeBtnRef.current?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }
      if (event.key !== 'Enter') return;
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('button,[role="button"],textarea,[contenteditable="true"]')) return;
      if (!target.matches('input,select')) return;

      event.preventDefault();
      void handleContinue();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('mmx-builder-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleContinue, onClose]);

  const completion = useMemo(() => {
    const completed = flow.filter((screen) => screenCompleted(data, screen.id)).length;
    return Math.round((completed / Math.max(1, flow.length)) * 100);
  }, [data, flow]);

  const handleSaveAndExit = useCallback(async () => {
    if (!String(readTitle(dataRef.current) || '').trim()) {
      toast.error('Please provide at least a property title');
      return;
    }
    setSaving(true);
    try {
      clearTimeout(draftSaveTimerRef.current);
      await saveDraftSnapshot(dataRef.current, { stepIndex: screenIndexRef.current, currentStepId: currentScreenId, builtLayer: builtLayerRef.current });
      toast.success('Property draft saved successfully.');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save property draft');
    } finally {
      setSaving(false);
    }
  }, [currentScreenId, onClose, onSuccess, saveDraftSnapshot]);

  const handleFinalSubmit = useCallback(async () => {
    if (submitted) return;

    const snapshot = dataRef.current;

    if (hasPendingUploads(snapshot.images)) {
      toast.error('Please wait for your photos to finish uploading before submitting.');
      return;
    }

    const problem = validateForSubmit(snapshot);
    if (problem) {
      routeToProblem(problem);
      return;
    }

    setSaving(true);
    setValidationError(null);

    try {
      clearTimeout(draftSaveTimerRef.current);
      await saveQueueRef.current.catch(() => {});

      const payload = {
        ...snapshot,
        images: serializeImages(snapshot.images),
        media: serializeImages(snapshot.media || snapshot.images),
        sellerId: currentUser?.uid || '',
        userId: currentUser?.uid || '',
        sellerEmail: currentUser?.email || '',
        status: 'active',
        approvalStatus: 'pending',
        verificationStatus: 'pending',
        stepIndex: screenIndexRef.current,
        builtLayer: 16,
        updatedAt: serverTimestamp(),
      };

      if (draftIdRef.current) {
        await setDoc(doc(db, 'properties', draftIdRef.current), payload, { merge: true });
      } else {
        const created = await addDoc(collection(db, 'properties'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        draftIdRef.current = created.id;
      }

      const createdId = draftIdRef.current;
      sendWhatsAppNotification(
        snapshot.phone || snapshot.sellerPhone || currentUser?.phoneNumber,
        "listing-published",
        `🏠 MarketMix Real Estates\n` +
        `Your listing is live:\n` +
        `${snapshot.title || 'Property'}\n` +
        `${snapshot.location || 'Kenya'}\n` +
        `KES ${Number(snapshot.price || 0).toLocaleString()} ${snapshot.listingType === "rent" ? "/ month" : ""}\n` +
        `View: https://marketmix-realestates.vercel.app/property/${createdId}`
      );

      setBuiltLayer(16);
      builtLayerRef.current = 16;
      setConstructionRevision((previous) => previous + 1);
      setSubmitted(true);
      toast.success('Property submitted for review.');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting property:', error);
      toast.error('Failed to submit property.');
    } finally {
      setSaving(false);
    }
  }, [currentUser?.email, currentUser?.uid, onSuccess, routeToProblem, submitted]);

  const ActiveComponent = currentScreen.Component;
  const ActiveIcon = currentScreenId === 'propertyType'
    ? (LAND_LIKE.has(data.propertyType) ? LandPlot : Home)
    : currentMeta.group === 'studentInfo'
      ? CircleUserRound
      : currentMeta.group === 'spaceOccupancy'
        ? Users
        : currentMeta.group === 'priceCosts'
          ? Building2
          : currentMeta.group === 'locationSurroundings'
            ? MapPin
            : currentMeta.group === 'utilitiesServices'
              ? Droplets
              : currentMeta.group === 'managementSecurity'
                ? ShieldCheck
                : currentMeta.group === 'amenities'
                  ? Sofa
                  : currentMeta.group === 'mediaTour'
                    ? Images
                    : ClipboardCheck;

  const renderScreen = () => (
    <ActiveComponent
      data={data}
      update={update}
      onNext={handleContinue}
      onContinue={handleContinue}
      listingType={data.listingType}
      propertyType={data.propertyType}
      hospitalityMode={rules.shortStay}
      studentMode={rules.student}
      isLand={rules.land}
    />
  );

  return createPortal(
    <>
      <style>{CSS}</style>
      <div className="mmx-builder-shell fixed inset-0 z-[100] bg-[#090A0B] p-1.5 sm:p-4">
        <div className="mmx-shell flex h-full w-full flex-col overflow-hidden rounded-[26px] sm:rounded-[30px] border border-white/10 bg-[#F4F1E9] shadow-[0_40px_120px_rgba(0,0,0,.55)]">

          <header className="shrink-0 border-b border-white/8 bg-[#0D0E10] text-white">
            <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[.05] sm:flex">
                  <Home size={19} strokeWidth={1.5} color={GOLD} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight sm:text-base">Build your property</div>
                  <div className="mt-0.5 truncate text-[9px] uppercase tracking-[.17em] text-white/40 sm:text-[10px]">
                    {currentExperienceIndex + 1} of {experiences.length} · {currentMeta.label}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className={`hidden rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:block ${autoSaveStatus === 'error' ? 'border-red-400/20 text-red-200' : autoSaveStatus === 'saving' || autoSaveStatus === 'unsaved' ? 'border-[#C8A96B]/30 text-[#C8A96B]' : 'border-white/10 text-white/45'}`}>
                  {autoSaveStatus === 'saving' ? 'Saving…' : autoSaveStatus === 'unsaved' ? 'Unsaved' : autoSaveStatus === 'error' ? 'Save failed' : 'Saved'}
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close property builder"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[.05] text-white/70 hover:bg-white/[.09]"
                >
                  <X size={17} strokeWidth={1.7} />
                </button>
              </div>
            </div>
          </header>

          <div className="shrink-0 border-b border-black/7 bg-white px-3 py-2 sm:px-6">
            <WizardProgress
              steps={experiences}
              currentStepIndex={currentExperienceIndex}
              onSelectStep={handleSelectExperience}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <section className="mmx-mobile-hero shrink-0 border-b border-black/8 bg-[#F4F1E9]/95 px-2.5 pb-2.5 pt-2.5 backdrop-blur-xl lg:hidden">
              <div className="mx-auto max-w-3xl">
                <div
                  key={`${currentScreenId}-${constructionRevision}`}
                  className="mmx-mobile-transition relative h-[178px] overflow-hidden rounded-[22px] border border-black/10 bg-[#0D0F10] shadow-[0_15px_40px_rgba(0,0,0,.10)]"
                >
                  <ConstructionScene
                    data={data}
                    builtLayer={builtLayer}
                    currentScreenId={currentScreenId}
                    revision={constructionRevision}
                    compact
                  />
                  <div className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-white/70 backdrop-blur-md">
                    Live build
                  </div>
                  <div className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[9px] font-semibold text-white/70 backdrop-blur-md">
                    {Math.min(100, Math.round((builtLayer / 16) * 100))}%
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between px-1 text-[9px] uppercase tracking-[.15em] text-[#8D8A83]">
                  <span>{currentMeta.label}</span>
                  <span style={{ color: INK }}>{Math.min(100, Math.round((builtLayer / 16) * 100))}% built</span>
                </div>
              </div>
            </section>

            <section ref={contentRef} className="mmx-scroll min-w-0 flex-1 overflow-y-auto bg-[#F4F1E9] p-3 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-3xl">
                {validationError && (
                  <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 sm:mb-5" role="alert">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                        <X size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-[.16em] text-red-700">Required before continuing</div>
                        <div className="mt-1 text-sm font-semibold text-red-950">{validationError.label}</div>
                        <div className="mt-0.5 text-xs text-red-800/80">{validationError.message}</div>
                        <button
                          type="button"
                          onClick={() => focusField(validationError.field)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-semibold text-red-800"
                        >
                          Go to field <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white" style={{ color: INK }}>
                      <ActiveIcon size={18} strokeWidth={1.7} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#111214]">{currentMeta.label}</div>
                      <div className="mt-0.5 truncate text-[9px] uppercase tracking-[.17em] text-[#99958D]">
                        {GROUP_LABELS[currentMeta.group] || currentMeta.group}
                      </div>
                    </div>
                  </div>
                  <div className="hidden text-[10px] font-medium text-[#99958D] sm:block">
                    {screenIndex + 1} / {flow.length}
                  </div>
                </div>

                <div key={`${currentScreenId}-${screenIndex}`} className={`rounded-[24px] border border-black/7 bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,.06)] sm:rounded-[28px] sm:p-7 ${transitioning ? 'opacity-90' : ''}`}>
                  <div className="mmx-screen-enter">{renderScreen()}</div>
                </div>
              </div>
            </section>

            <aside className="hidden w-[430px] shrink-0 overflow-y-auto border-l border-black/8 bg-[#EDE9E0] p-6 lg:block xl:w-[470px]">
              <div className="sticky top-0">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[#9B958A]">Live property</div>
                    <div className="mt-1 text-sm font-semibold text-[#121316]">Built as you answer</div>
                  </div>
                  <div className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-[10px] font-semibold text-[#46464B]">
                    {Math.min(100, Math.round((builtLayer / 16) * 100))}% built
                  </div>
                </div>
                <PreviewCard data={data} builtLayer={builtLayer} currentScreenId={currentScreenId} completion={completion} revision={constructionRevision} />
              </div>
            </aside>
          </div>

          <footer className="mmx-footer shrink-0 border-t border-black/8 bg-white px-3 py-2.5 sm:px-6 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={screenIndex === 0 || submitted}
                className="mmx-footer-back inline-flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3.5 py-2.5 text-[10px] font-semibold text-[#55555B] hover:bg-[#F7F6F2] disabled:opacity-35 sm:px-4 sm:text-[11px]"
              >
                <ChevronLeft size={15} /> Back
              </button>

              <div className="mmx-footer-actions flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={saving || submitted}
                  className="hidden items-center gap-2 rounded-xl border border-black/8 bg-white px-4 py-2.5 text-[11px] font-semibold text-[#55555B] hover:bg-[#F7F6F2] disabled:opacity-50 sm:inline-flex"
                >
                  {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                  Save draft
                </button>

                {!isLastScreen && !submitted ? (
                  <button
                    type="button"
                    onClick={() => void handleContinue()}
                    disabled={saving || transitioning}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0C0D0F] px-4 py-2.5 text-[10px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,.16)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 sm:px-5 sm:text-[11px]"
                  >
                    Save & continue <ChevronRight size={15} color={GOLD} />
                  </button>
                ) : !submitted ? (
                  <button
                    type="button"
                    onClick={() => void handleFinalSubmit()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0C0D0F] px-4 py-2.5 text-[10px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,.16)] disabled:opacity-50 sm:px-5 sm:text-[11px]"
                  >
                    {saving && <Loader size={14} className="animate-spin" />}
                    Submit for review <ArrowRight size={15} color={GOLD} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0C0D0F] px-5 py-2.5 text-[10px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,.16)] sm:text-[11px]"
                  >
                    Done <ArrowRight size={15} color={GOLD} />
                  </button>
                )}
              </div>
            </div>
          </footer>
        </div>

        {submitted && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
            <div className="mmx-success w-full max-w-md rounded-[30px] border border-white/10 bg-[#0D0E10] p-7 text-center text-white shadow-[0_40px_120px_rgba(0,0,0,.55)]">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border"
                style={{ borderColor: `${GOLD}55`, background: `${GOLD}15`, color: GOLD }}
              >
                <CheckCircle2 size={31} strokeWidth={1.6} />
              </div>
              <div className="mt-5 text-[10px] font-bold uppercase tracking-[.25em]" style={{ color: GOLD }}>Listing complete</div>
              <h3 className="mt-2 text-2xl font-semibold">Your property is ready for review</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">Your saved draft has been updated and submitted for review.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0B0B0D]"
              >
                Close builder <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {phonePromptOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#0D0E10] p-7 text-white shadow-[0_40px_120px_rgba(0,0,0,.55)]">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border"
                style={{ borderColor: `${GOLD}55`, background: `${GOLD}15`, color: GOLD }}
              >
                <CircleUserRound size={31} strokeWidth={1.6} />
              </div>
              <div className="mt-5 text-[10px] font-bold uppercase tracking-[.25em]" style={{ color: GOLD }}>Phone Number Required</div>
              <h3 className="mt-2 text-2xl font-semibold">Enter your phone number</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">
                A valid phone number is required on your profile before you can list a property and receive WhatsApp alerts.
              </p>
              <form onSubmit={handlePhoneSubmit} className="mt-5 space-y-4 text-left">
                <div>
                  <label className="text-xs text-white/70 block mb-1">Phone number (e.g. 0712345678 or +254712345678)</label>
                  <input
                    type="tel"
                    required
                    placeholder="0712345678"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
                >
                  Save & Continue <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}