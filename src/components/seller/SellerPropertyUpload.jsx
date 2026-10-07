// src/components/seller/SellerPropertyUpload.jsx
// MarketMix visual property builder — UI/UX redesign layer on top of the existing wizard.
// Reorganized into 10 cohesive experiences with progressive-build cumulative animated preview layers.
// Preserves 100% of existing Firestore schema, submission behavior, media handling, and step logic.

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Loader,
  Sparkles,
  MapPin,
  Eye,
  Bed,
  Bath,
  Square,
  Video,
  Users,
  BedSingle,
  BedDouble,
  Sofa,
  Hotel,
  House,
  LandPlot,
  Building2,
  GraduationCap,
  WalletCards,
  Droplets,
  Wifi,
  UserRoundCog,
  ShieldCheck,
  DoorOpen,
  MapPinned,
  Images,
  PlaySquare,
  ClipboardCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

import WizardProgress from './shared/WizardProgress';
import { WIZARD_STEPS } from './constants/wizardSteps';
import {
  PROPERTY_TYPES,
  LAND_LIKE,
  HOSTEL_LIKE,
  APARTMENT_LIKE,
  HOUSE_LIKE,
} from './constants/propertyTaxonomy';
import { resolvePropertyImage, getPublicPropertyLocation } from '../../utils/propertyMapping';
import '../moving/LiquidGlass.css';

const stageIcons = {
  propertyAndSpace: House,
  studentInfo: GraduationCap,
  spaceOccupancy: Users,
  priceCosts: WalletCards,
  locationSurroundings: MapPin,
  utilitiesServices: Droplets,
  managementSecurity: ShieldCheck,
  amenities: Sparkles,
  mediaTour: Images,
  review: ClipboardCheck,
};

const propertyTypeIcons = {
  single_room: BedSingle,
  bedsitter: Sofa,
  studio_apartment: Building2,
  apartment: BedDouble,
  maisonette: House,
  bungalow: House,
  townhouse: Building2,
  duplex: Building2,
  standalone_house: House,
  semi_detached: House,
  student_hostel: Hotel,
  shared_house: Hotel,
  compound: Building2,
  urbannest: Hotel,
  guest_house: Hotel,
  serviced_apartment: Building2,
  land: LandPlot,
  commercial: Building2,
  other: Building2,
};

// ─── Existing steps (unchanged) ────────────────────────────────────────────────
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

// ─── Initial data (unchanged shape) ────────────────────────────────────────────
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

const PROPERTY_LABELS = Object.fromEntries(
  PROPERTY_TYPES.map((entry) => [entry.id, entry.label])
);

const COMPACT_RESIDENTIAL = new Set(['single_room', 'bedsitter', 'studio_apartment']);
const SHARED_RESIDENTIAL = new Set(['student_hostel', 'shared_house', 'compound']);
const HOSPITALITY_RESIDENTIAL = new Set(['urbannest', 'guest_house', 'serviced_apartment']);
const BEDROOM_RESIDENTIAL = new Set([
  'apartment',
  'maisonette',
  'bungalow',
  'townhouse',
  'duplex',
  'standalone_house',
  'semi_detached',
]);

const PROPERTY_PREVIEW_VISUALS = {
  single_room:        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23064e3b'/><stop offset='100%' stop-color='%23022c22'/></linearGradient></defs><rect width='800' height='600' fill='url(%23bg)'/><rect x='200' y='150' width='400' height='300' rx='12' fill='%23ffffff' opacity='0.1'/><rect x='250' y='220' width='180' height='180' rx='8' fill='%2334d399' opacity='0.4'/><rect x='460' y='220' width='90' height='120' rx='8' fill='%2338bdf8' opacity='0.4'/></svg>",
  bedsitter:          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23047857'/><stop offset='100%' stop-color='%23064e3b'/></linearGradient></defs><rect width='800' height='600' fill='url(%23bg)'/><rect x='180' y='140' width='440' height='320' rx='16' fill='%23ffffff' opacity='0.12'/><rect x='230' y='200' width='200' height='200' rx='8' fill='%2334d399' opacity='0.5'/><rect x='460' y='200' width='110' height='90' rx='8' fill='%2338bdf8' opacity='0.5'/></svg>",
  studio_apartment:   "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23bae6fd'/><stop offset='100%' stop-color='%237dd3fc'/></linearGradient><linearGradient id='bldg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230284c7'/><stop offset='100%' stop-color='%230369a1'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23059669'/><rect x='250' y='160' width='300' height='340' rx='8' fill='url(%23bldg)'/><g fill='%23ffffff' opacity='0.8'><rect x='280' y='200' width='50' height='60' rx='4'/><rect x='375' y='200' width='50' height='60' rx='4'/><rect x='470' y='200' width='50' height='60' rx='4'/><rect x='280' y='300' width='50' height='60' rx='4'/><rect x='375' y='300' width='50' height='60' rx='4'/><rect x='470' y='300' width='50' height='60' rx='4'/></g></svg>",
  apartment:          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23e0f2fe'/><stop offset='100%' stop-color='%23bae6fd'/></linearGradient><linearGradient id='bldg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%2338bdf8'/><stop offset='100%' stop-color='%230284c7'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23059669'/><rect x='220' y='140' width='360' height='360' rx='8' fill='url(%23bldg)'/><g fill='%23ffffff' opacity='0.85'><rect x='260' y='180' width='60' height='70' rx='4'/><rect x='370' y='180' width='60' height='70' rx='4'/><rect x='480' y='180' width='60' height='70' rx='4'/><rect x='260' y='290' width='60' height='70' rx='4'/><rect x='370' y='290' width='60' height='70' rx='4'/><rect x='480' y='290' width='60' height='70' rx='4'/></g></svg>",
  serviced_apartment: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23e0f2fe'/><stop offset='100%' stop-color='%23bae6fd'/></linearGradient><linearGradient id='bldg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230369a1'/><stop offset='100%' stop-color='%23075985'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23059669'/><rect x='220' y='140' width='360' height='360' rx='8' fill='url(%23bldg)'/><g fill='%23ffffff' opacity='0.85'><rect x='260' y='180' width='60' height='70' rx='4'/><rect x='370' y='180' width='60' height='70' rx='4'/><rect x='480' y='180' width='60' height='70' rx='4'/><rect x='260' y='290' width='60' height='70' rx='4'/><rect x='370' y='290' width='60' height='70' rx='4'/><rect x='480' y='290' width='60' height='70' rx='4'/></g></svg>",
  maisonette:         "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ede9fe'/><stop offset='100%' stop-color='%23ddd6fe'/></linearGradient><linearGradient id='roof' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%237c3aed'/><stop offset='100%' stop-color='%235b21b6'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23065f46'/><path d='M220 280 400 120l180 160z' fill='url(%23roof)'/><rect x='250' y='280' width='300' height='220' fill='%23fef3c7'/><rect x='360' y='390' width='80' height='110' fill='%23581c87'/><rect x='280' y='320' width='60' height='60' rx='4' fill='%2338bdf8'/><rect x='460' y='320' width='60' height='60' rx='4' fill='%2338bdf8'/></svg>",
  bungalow:           "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ffedd5'/><stop offset='100%' stop-color='%23fed7aa'/></linearGradient><linearGradient id='roof' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ea580c'/><stop offset='100%' stop-color='%23c2410c'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 460h800v140H0z' fill='%2315803d'/><path d='M220 320 400 160l180 160z' fill='url(%23roof)'/><rect x='250' y='320' width='300' height='180' fill='%23fffbeb'/><rect x='360' y='400' width='80' height='100' fill='%237c2d12'/><rect x='280' y='350' width='60' height='60' rx='4' fill='%2338bdf8'/><rect x='460' y='350' width='60' height='60' rx='4' fill='%2338bdf8'/></svg>",
  townhouse:          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23dbeafe'/><stop offset='100%' stop-color='%23bfdbfe'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23059669'/><rect x='200' y='180' width='400' height='320' rx='6' fill='%231e40af'/><g fill='%23ffffff' opacity='0.85'><rect x='230' y='220' width='70' height='80' rx='4'/><rect x='365' y='220' width='70' height='80' rx='4'/><rect x='500' y='220' width='70' height='80' rx='4'/><rect x='230' y='340' width='70' height='80' rx='4'/><rect x='365' y='340' width='70' height='80' rx='4'/><rect x='500' y='340' width='70' height='80' rx='4'/></g></svg>",
  duplex:             "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23e0e7ff'/><stop offset='100%' stop-color='%23c7d2fe'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23059669'/><rect x='220' y='160' width='360' height='340' rx='8' fill='%234338ca'/><g fill='%23ffffff' opacity='0.85'><rect x='260' y='200' width='100' height='90' rx='4'/><rect x='440' y='200' width='100' height='90' rx='4'/><rect x='260' y='320' width='100' height='90' rx='4'/><rect x='440' y='320' width='100' height='90' rx='4'/></g></svg>",
  standalone_house:   "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23d1fae5'/><stop offset='100%' stop-color='%23a7f3d0'/></linearGradient><linearGradient id='roof' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23059669'/><stop offset='100%' stop-color='%23047857'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 460h800v140H0z' fill='%23065f46'/><path d='M220 320 400 160l180 160z' fill='url(%23roof)'/><rect x='250' y='320' width='300' height='180' fill='%23fffbeb'/><rect x='360' y='400' width='80' height='100' fill='%2378350f'/><rect x='280' y='350' width='60' height='60' rx='4' fill='%2338bdf8'/><rect x='460' y='350' width='60' height='60' rx='4' fill='%2338bdf8'/></svg>",
  semi_detached:      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ccfbf1'/><stop offset='100%' stop-color='%2399f6e4'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 460h800v140H0z' fill='%230f766e'/><rect x='220' y='200' width='360' height='300' fill='%23f0fdf4'/><path d='M220 200 400 80l180 120z' fill='%230d9488'/><rect x='360' y='380' width='80' height='120' fill='%23134e4a'/><rect x='260' y='240' width='70' height='80' rx='4' fill='%2338bdf8'/><rect x='470' y='240' width='70' height='80' rx='4' fill='%2338bdf8'/></svg>",
  student_hostel:     "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23fef3c7'/><stop offset='100%' stop-color='%23fde68a'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23b45309'/><rect x='200' y='160' width='400' height='340' rx='8' fill='%23d97706'/><g fill='%23ffffff' opacity='0.85'><rect x='240' y='200' width='70' height='70' rx='4'/><rect x='365' y='200' width='70' height='70' rx='4'/><rect x='490' y='200' width='70' height='70' rx='4'/><rect x='240' y='310' width='70' height='70' rx='4'/><rect x='365' y='310' width='70' height='70' rx='4'/><rect x='490' y='310' width='70' height='70' rx='4'/></g></svg>",
  shared_house:       "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ffedd5'/><stop offset='100%' stop-color='%23fed7aa'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%2392400e'/><path d='M220 280 400 140l180 140z' fill='%23b45309'/><rect x='250' y='280' width='300' height='220' fill='%23fffbeb'/><rect x='360' y='390' width='80' height='110' fill='%2378350f'/><rect x='280' y='320' width='60' height='60' rx='4' fill='%2338bdf8'/><rect x='460' y='320' width='60' height='60' rx='4' fill='%2338bdf8'/></svg>",
  compound:           "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23dcfce7'/><stop offset='100%' stop-color='%23bbf7d0'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 420h800v180H0z' fill='%23166534'/><rect x='180' y='220' width='200' height='240' rx='6' fill='%2315803d'/><rect x='420' y='220' width='200' height='240' rx='6' fill='%2315803d'/></svg>",
  urbannest:          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ffe4e6'/><stop offset='100%' stop-color='%23fecdd3'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%239f1239'/><rect x='200' y='160' width='400' height='340' rx='10' fill='%23e11d48'/><g fill='%23ffffff' opacity='0.85'><rect x='250' y='210' width='90' height='100' rx='4'/><rect x='460' y='210' width='90' height='100' rx='4'/></g></svg>",
  guest_house:        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23fce7f3'/><stop offset='100%' stop-color='%23fbcfe8'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%239d174d'/><rect x='200' y='160' width='400' height='340' rx='10' fill='%23be185d'/><g fill='%23ffffff' opacity='0.85'><rect x='250' y='210' width='90' height='100' rx='4'/><rect x='460' y='210' width='90' height='100' rx='4'/></g></svg>",
  land:               "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23ecfdf5'/><stop offset='100%' stop-color='%23d1fae5'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 350q400-80 800 0v250H0z' fill='%2315803d'/><path d='M0 420q400-60 800 20v160H0z' fill='%23166534'/><circle cx='650' cy='150' r='50' fill='%23fde047'/></svg>",
  commercial:         "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23f1f5f9'/><stop offset='100%' stop-color='%23e2e8f0'/></linearGradient></defs><rect width='800' height='600' fill='url(%23sky)'/><path d='M0 450h800v150H0z' fill='%23334155'/><rect x='180' y='140' width='440' height='360' rx='4' fill='%23475569'/><g fill='%2338bdf8' opacity='0.7'><rect x='220' y='180' width='70' height='60'/><rect x='335' y='180' width='70' height='60'/><rect x='450' y='180' width='70' height='60'/><rect x='220' y='280' width='70' height='60'/><rect x='335' y='280' width='70' height='60'/><rect x='450' y='280' width='70' height='60'/></g></svg>",
  other:              '/images/property-hero.svg',
};

const FALLBACK_PREVIEW = '/images/property-hero.svg';
const HERO_TRANSITION_MS = 400;

function resolvePreviewHeroImage(data) {
  if (Array.isArray(data.images) && data.images.length > 0) {
    const first = data.images[0];
    const url = typeof first === 'string'
      ? first
      : first?.url || first?.downloadURL || first?.src;
    if (url) return url;
  }
  const category = PROPERTY_PREVIEW_VISUALS[data.propertyType];
  if (category) return category;
  try {
    const resolved = resolvePropertyImage?.(data);
    if (resolved) return resolved;
  } catch {
    /* ignore */
  }
  return FALLBACK_PREVIEW;
}

const WIZARD_ANIMATION_CSS = `
  .mmx-hero-layer { will-change: opacity, transform, filter; }

  .mmx-hero-in {
    animation: mmxHeroIn ${HERO_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .mmx-hero-out {
    animation: mmxHeroOut 380ms cubic-bezier(0.4, 0, 0.2, 1) both;
  }
  @keyframes mmxHeroIn {
    from { opacity: 0; transform: scale(1.04); filter: blur(6px); }
    to   { opacity: 1; transform: scale(1);    filter: blur(0); }
  }
  @keyframes mmxHeroOut {
    from { opacity: 1; transform: scale(1);    filter: blur(0); }
    to   { opacity: 0; transform: scale(0.97); filter: blur(6px); }
  }

  .mmx-chip-in {
    animation: mmxChipIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes mmxChipIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  .mmx-price-pop {
    display: inline-block;
    animation: mmxPricePop 320ms ease-out both;
  }
  @keyframes mmxPricePop {
    0%   { opacity: 0.4; transform: translateY(-2px); }
    100% { opacity: 1;   transform: translateY(0); }
  }

  .mmx-step-enter {
    animation: mmxStepIn 350ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes mmxStepIn {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes mmxBuildFoundation {
    from { transform: scaleY(0); opacity: 0; }
    to   { transform: scaleY(1); opacity: 1; }
  }
  @keyframes mmxBuildWalls {
    from { transform: scaleX(0); opacity: 0; }
    to   { transform: scaleX(1); opacity: 1; }
  }
  @keyframes mmxDropRoof {
    from { transform: translateY(-40px); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes mmxWifiWave {
    0%   { opacity: 0.2; transform: scale(0.8); }
    50%  { opacity: 1;   transform: scale(1.1); }
    100% { opacity: 0.2; transform: scale(0.8); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mmx-hero-in,
    .mmx-hero-out,
    .mmx-chip-in,
    .mmx-price-pop,
    .mmx-step-enter {
      animation: none !important;
    }
  }
`;

function PropertyHeroImage({ src, alt }) {
  const [shown, setShown] = useState(src);
  const [outgoing, setOutgoing] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (src === shown) return undefined;
    setOutgoing(shown);
    setShown(src);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOutgoing(null), HERO_TRANSITION_MS);
    return () => clearTimeout(timerRef.current);
  }, [src, shown]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleError = (event) => {
    const el = event.currentTarget;
    if (el.dataset.fallbackApplied === '1') return;
    el.dataset.fallbackApplied = '1';
    el.src = FALLBACK_PREVIEW;
  };

  return (
    <div className="absolute inset-0">
      {outgoing && (
        <img
          src={outgoing}
          alt=""
          aria-hidden="true"
          className="mmx-hero-layer mmx-hero-out absolute inset-0 h-full w-full object-cover"
        />
      )}
      <img
        key={shown}
        src={shown}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={handleError}
        className="mmx-hero-layer mmx-hero-in absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

// ─── Pure Cumulative SVG Construction Scene (10 Cumulative Layers, Zero Text) ───
function PropertyStageVisual({ currentStepId, data }) {
  const stageIndex = useMemo(() => {
    const ids = [
      'propertyAndSpace',
      'studentInfo',
      'spaceOccupancy',
      'priceCosts',
      'locationSurroundings',
      'utilitiesServices',
      'managementSecurity',
      'amenities',
      'mediaTour',
      'review',
    ];
    const idx = ids.indexOf(currentStepId);
    return idx >= 0 ? idx : 0;
  }, [currentStepId]);

  const isHostel = HOSTEL_LIKE.has(data.propertyType);
  const isLand = LAND_LIKE.has(data.propertyType);
  const occupancyCount = Number(String(data.occupancy).replace(/[^0-9]/g, '')) || 1;
  const priceVal = Number(String(data.price || '').replace(/[^0-9]/g, '')) || 0;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Layer 1: Property & Space (Foundation, Walls, Windows, Doors, Roof) */}
        {stageIndex >= 0 && (
          <g>
            <rect x="40" y="220" width="320" height="40" rx="8" fill={isLand ? '#65a30d' : '#059669'} className="animate-[mmxBuildFoundation_400ms_ease-out_both]" />
            {!isLand && (
              <>
                <rect x="100" y="200" width="200" height="20" rx="4" fill="#047857" className="animate-[mmxBuildFoundation_400ms_ease-out_both]" />
                <rect x="120" y="110" width="160" height="90" fill="#10b981" fillOpacity="0.25" stroke="#059669" strokeWidth="3" className="animate-[mmxBuildWalls_400ms_ease-out_100ms_both]" />
                <rect x="140" y="130" width="35" height="40" rx="4" fill="#38bdf8" fillOpacity="0.7" className="mmx-chip-in" />
                <rect x="225" y="130" width="35" height="40" rx="4" fill="#38bdf8" fillOpacity="0.7" className="mmx-chip-in" />
                <rect x="182" y="150" width="36" height="50" rx="4" fill="#78350f" className="mmx-chip-in" />
                <path d="M100 110 L200 40 L300 110 Z" fill="#065f46" className="animate-[mmxDropRoof_450ms_cubic-bezier(0.22,1,0.36,1)_200ms_both]" />
              </>
            )}
          </g>
        )}

        {/* Layer 2: Student Info (Bunk beds & desks inside) */}
        {stageIndex >= 1 && isHostel && (
          <g className="mmx-chip-in">
            <rect x="145" y="140" width="25" height="10" rx="2" fill="#d97706" />
            <rect x="145" y="155" width="25" height="10" rx="2" fill="#d97706" />
            <rect x="230" y="140" width="25" height="10" rx="2" fill="#d97706" />
            <rect x="230" y="155" width="25" height="10" rx="2" fill="#d97706" />
          </g>
        )}

        {/* Layer 3: Space & Occupancy (Rooms and occupancy indicators) */}
        {stageIndex >= 2 && !isLand && (
          <g className="mmx-chip-in">
            <circle cx="200" cy="95" r="14" fill="#10b981" fillOpacity="0.9" />
            <text x="200" y="99" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">{occupancyCount}</text>
          </g>
        )}

        {/* Layer 4: Price & Costs (Price plaque materializing) */}
        {stageIndex >= 3 && priceVal > 0 && (
          <g className="mmx-price-pop">
            <rect x="220" y="210" width="160" height="42" rx="10" fill="#ffffff" stroke="#059669" strokeWidth="2.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
            <text x="235" y="236" fill="#065f46" fontSize="13" fontWeight="extrabold">KSh {priceVal.toLocaleString()}</text>
          </g>
        )}

        {/* Layer 5: Location & Surroundings (Map pin & roads) */}
        {stageIndex >= 4 && (
          <g className="mmx-chip-in">
            <path d="M40 240 Q200 200 360 240" stroke="#38bdf8" strokeWidth="5" strokeDasharray="6 6" />
            <circle cx="200" cy="130" r="16" fill="#2563eb" className="animate-ping" />
            <circle cx="200" cy="130" r="10" fill="#1d4ed8" />
          </g>
        )}

        {/* Layer 6: Utilities & Services (Water, electricity, Wi-Fi, garbage) */}
        {stageIndex >= 5 && !isLand && (
          <g className="mmx-chip-in">
            <circle cx="85" cy="180" r="10" fill="#06b6d4" />
            <circle cx="315" cy="180" r="10" fill="#eab308" />
            <circle cx="200" cy="60" r="10" fill="#8b5cf6" className="animate-[mmxWifiWave_1s_infinite]" />
          </g>
        )}

        {/* Layer 7: Management & Security (Gate, lock, watchman, CCTV) */}
        {stageIndex >= 6 && !isLand && (
          <g className="mmx-chip-in">
            <rect x="80" y="195" width="240" height="12" rx="3" fill="#4338ca" />
            <circle cx="200" cy="90" r="14" fill="#312e81" />
          </g>
        )}

        {/* Layer 8: Amenities (Parking, garden, laundry, etc.) */}
        {stageIndex >= 7 && (
          <g className="mmx-chip-in">
            <circle cx="90" cy="235" r="12" fill="#10b981" />
            <circle cx="310" cy="235" r="12" fill="#34d399" />
          </g>
        )}

        {/* Layer 9: Media & Tour (Real photos crossfaded) */}
        {stageIndex >= 8 && data.images?.length > 0 && (
          <g className="mmx-hero-in">
            <rect x="130" y="100" width="140" height="90" rx="8" fill="#e11d48" fillOpacity="0.85" />
            <polygon points="190,130 190,160 215,145" fill="#ffffff" />
          </g>
        )}

        {/* Layer 10: Review & Submit (Final assembled listing) */}
        {stageIndex >= 9 && (
          <g className="mmx-hero-in">
            <rect x="60" y="30" width="280" height="240" rx="16" fill="#065f46" fillOpacity="0.9" stroke="#34d399" strokeWidth="3" />
            <circle cx="200" cy="150" r="28" fill="#10b981" className="animate-bounce" />
            <path d="M188 150 l8 8 l16 -16" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Live preview body ─────────────────────────────────────────────────────────
function PropertyLivePreviewContent({ data, currentStepId, completionPercentage }) {
  const heroSrc = resolvePreviewHeroImage(data);
  const locationStr = getPublicPropertyLocation(data);

  const pt = data.propertyType;
  const isLand = LAND_LIKE.has(pt);
  const isCompact = COMPACT_RESIDENTIAL.has(pt);
  const isShared = SHARED_RESIDENTIAL.has(pt);
  const isHospitality =
    HOSPITALITY_RESIDENTIAL.has(pt) || data.listingType === 'short_stay';
  const showsBedrooms = BEDROOM_RESIDENTIAL.has(pt);
  const isCommercial = pt === 'commercial';

  const priceValue = useMemo(() => {
    const raw = String(data.price ?? '').replace(/[^0-9.]/g, '');
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }, [data.price]);

  const listingLabel =
    data.propertyType === 'urbannest'
      ? 'UrbanNest Stay'
      : data.listingType === 'sale'
        ? 'For Sale'
        : data.listingType === 'short_stay'
          ? 'Short Stay'
          : data.propertyType === 'land'
            ? 'Land / Plot'
            : 'For Rent';

  const typeLabel = PROPERTY_LABELS[pt] || (pt ? pt.replace(/_/g, ' ') : 'Property');
  const occupancyNumber = Number(String(data.occupancy).replace(/[^0-9]/g, '')) || 1;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white relative">
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          <PropertyHeroImage
            src={heroSrc}
            alt={data.title || data.propertyName || 'Property preview'}
          />
          <PropertyStageVisual currentStepId={currentStepId} data={data} />
          <span className="mmx-chip-in absolute left-3 top-3 rounded-full bg-slate-900/85 px-3 py-1 text-[10px] font-bold text-white uppercase shadow backdrop-blur-md z-30">
            {listingLabel}
          </span>
          {data.youtubeUrl && (
            <span className="mmx-chip-in absolute right-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white shadow flex items-center gap-1 z-30">
              <Video className="w-3 h-3" /> Tour
            </span>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
              {typeLabel}
            </span>
            <span className="text-[10px] font-bold text-slate-400">Live preview</span>
          </div>

          <h4 className="font-extrabold text-slate-900 text-base line-clamp-1">
            {data.title || data.propertyName || 'Untitled Property'}
          </h4>

          <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate">{locationStr || 'Kenya'}</span>
          </p>

          {showsBedrooms && (
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs text-slate-600">
              {data.bedrooms && (
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-slate-400" /> {data.bedrooms} Bed
                </span>
              )}
              {data.bathrooms && (
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-slate-400" /> {data.bathrooms} Bath
                </span>
              )}
              {data.areaSize && (
                <span className="flex items-center gap-1">
                  <Square className="w-3.5 h-3.5 text-slate-400" /> {data.areaSize} sqft
                </span>
              )}
            </div>
          )}

          {isCompact && (
            <div className="py-2 border-y border-slate-100 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>🛏 Compact unit</span>
              <span>•</span>
              <span>
                👤 {occupancyNumber} occupant{occupancyNumber > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {isShared && (
            <div className="py-2 border-y border-slate-100 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>👥 Shared accommodation</span>
              {data.occupancy && (
                <>
                  <span>•</span>
                  <span>{data.occupancy} capacity</span>
                </>
              )}
            </div>
          )}

          {isHospitality && (
            <div className="py-2 border-y border-slate-100 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>🏨 Short-stay / furnished</span>
              {data.billingCycle && (
                <>
                  <span>•</span>
                  <span className="capitalize">{data.billingCycle} billing</span>
                </>
              )}
            </div>
          )}

          {isLand && (
            <div className="py-2 border-y border-slate-100 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>🌍 Land / Plot</span>
              {data.areaSize && (
                <>
                  <span>•</span>
                  <span>{data.areaSize} sqft</span>
                </>
              )}
            </div>
          )}

          {isCommercial && (
            <div className="py-2 border-y border-slate-100 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>🏢 Commercial / Mixed-use</span>
            </div>
          )}

          <div className="pt-1 flex items-baseline justify-between">
            <span
              key={priceValue}
              className="mmx-price-pop text-lg font-extrabold text-emerald-800"
            >
              KSh {priceValue.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              /{data.billingCycle || 'month'}
            </span>
          </div>

          {data.description?.trim() && (
            <p className="pt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-3">
              {data.description}
            </p>
          )}

          {(data.amenities?.length > 0 || data.securityFeatures?.length > 0) && (
            <div className="pt-2 flex flex-wrap gap-1">
              {data.amenities?.map((am) => (
                <span
                  key={`am-${am}`}
                  className="mmx-chip-in rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
                >
                  {am}
                </span>
              ))}
              {data.securityFeatures?.map((sec) => (
                <span
                  key={`sec-${sec}`}
                  className="mmx-chip-in rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                >
                  {sec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Listing Completeness</span>
          <span className="text-emerald-700">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function SellerPropertyUpload({ onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [data, setData] = useState(initialData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const contentRef = useRef(null);
  const closeBtnRef = useRef(null);

  const update = useCallback((patch) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      if (patch.propertyType) {
        const pt = patch.propertyType;
        if (pt === 'single_room' || pt === 'bedsitter') {
          next.bedrooms = '1';
          next.bathrooms = '1';
        }
        if (LAND_LIKE.has(pt)) {
          next.bedrooms = '';
          next.bathrooms = '';
          next.occupancy = '1';
          next.sharingAllowed = false;
        }
        if (pt === 'urbannest') {
          next.listingType = 'short_stay';
          next.billingCycle = 'daily';
        }
      }
      if (patch.occupancy !== undefined) {
        const raw = String(patch.occupancy);
        const numeric = raw.includes('+')
          ? Number(raw.replace(/[^0-9]/g, '')) + 1
          : Number(raw.replace(/[^0-9]/g, '')) || 1;
        if (numeric <= 1) next.sharingAllowed = false;
      }
      return next;
    });
  }, []);

  const steps = useMemo(() => {
    const isLand = LAND_LIKE.has(data.propertyType);
    const isHostel = HOSTEL_LIKE.has(data.propertyType);
    const isSale = data.listingType === 'sale';
    const isShortStay = data.listingType === 'short_stay';

    return WIZARD_STEPS.filter((step) => {
      if (isLand && ['spaceOccupancy', 'utilitiesServices', 'managementSecurity'].includes(step.id)) {
        return false;
      }
      if (step.id === 'studentInfo' && !isHostel) return false;
      if (isSale && step.id === 'studentInfo') return false;
      if (isShortStay && (step.id === 'studentInfo' || step.id === 'managementSecurity')) {
        return false;
      }
      return true;
    });
  }, [data.propertyType, data.listingType]);

  useEffect(() => {
    setCurrentStepIndex((idx) => {
      const max = Math.max(0, steps.length - 1);
      return idx > max ? max : idx;
    });
  }, [steps.length]);

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus?.();

    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (mobilePreviewOpen) {
        setMobilePreviewOpen(false);
        return;
      }
      onClose?.();
    };

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobilePreviewOpen, onClose]);

  const completionPercentage = useMemo(() => {
    let score = 0;
    if (data.propertyType) score += 15;
    if (data.title?.trim() || data.propertyName?.trim()) score += 20;
    if (data.price) score += 20;
    if (data.location || data.county) score += 15;
    if (data.images?.length > 0) score += 15;
    if (data.description?.trim()) score += 10;
    if (data.amenities?.length > 0) score += 5;
    return Math.min(100, score);
  }, [data]);

  const scrollTop = () => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      scrollTop();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      scrollTop();
    }
  };

  const handleSelectStep = (idx) => {
    setCurrentStepIndex(idx);
    scrollTop();
  };

  const handleSaveAndExit = async () => {
    if (!data.title?.trim() && !data.propertyName?.trim()) {
      toast.error('Please provide at least a property title');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        sellerId: currentUser?.uid || '',
        sellerEmail: currentUser?.email || '',
        approvalStatus: 'draft',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'properties'), payload);
      toast.success('Property draft saved successfully!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!data.title?.trim() || !data.price) {
      toast.error('Please fill in the title and price.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        sellerId: currentUser?.uid || '',
        sellerEmail: currentUser?.email || '',
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'properties'), payload);
      toast.success('🎉 New property listing submitted for review successfully!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error submitting property:', error);
      toast.error('Failed to submit property');
    } finally {
      setSaving(false);
    }
  };

  // ─── 10 Experiences Step Renderer ──────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'propertyAndSpace':
        return (
          <div className="space-y-6">
            <StepPropertyType data={data} update={update} onNext={handleNext} />
            <div className="pt-4 border-t border-slate-100">
              <StepBasicDetails data={data} update={update} />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <StepUnitRoom data={data} update={update} />
            </div>
          </div>
        );
      case 'studentInfo':
        return <StepStudentInfo data={data} update={update} />;
      case 'spaceOccupancy':
        return <StepRoomOccupancy data={data} update={update} />;
      case 'priceCosts':
        return <StepRentCosts data={data} update={update} />;
      case 'locationSurroundings':
        return (
          <div className="space-y-6">
            <StepLocationTransport data={data} update={update} />
            <div className="pt-4 border-t border-slate-100">
              <StepNearbyPlaces data={data} update={update} />
            </div>
          </div>
        );
      case 'utilitiesServices':
        return (
          <div className="space-y-6">
            <StepWaterUtilities data={data} update={update} />
            <div className="pt-4 border-t border-slate-100">
              <StepInternetGarbage data={data} update={update} />
            </div>
          </div>
        );
      case 'managementSecurity':
        return (
          <div className="space-y-6">
            <StepManagement data={data} update={update} />
            <div className="pt-4 border-t border-slate-100">
              <StepSecurity data={data} update={update} />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <StepGateHouseRules data={data} update={update} />
            </div>
          </div>
        );
      case 'amenities':
        return <StepAmenities data={data} update={update} />;
      case 'mediaTour':
        return (
          <div className="space-y-6">
            <StepPhotosMedia data={data} update={update} />
            <div className="pt-4 border-t border-slate-100">
              <StepYouTubeTour data={data} update={update} />
            </div>
          </div>
        );
      case 'review':
        return (
          <StepReview
            data={data}
            update={update}
            onJump={(index) => handleSelectStep(index)}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStepIndex >= steps.length - 1;

  return createPortal(
    <>
      <style>{WIZARD_ANIMATION_CSS}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mmx-wizard-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-md overflow-y-auto"
      >
        <div className="flex h-[94vh] w-full max-w-7xl flex-col rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border border-slate-100">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 id="mmx-wizard-title" className="text-lg font-bold">
                  Add New Property Listing (10-Stage Experience)
                </h2>
                <p className="text-xs text-slate-400">
                  Stage {currentStepIndex + 1} of {steps.length}: {currentStep.label}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20"
                aria-label="Open live preview"
              >
                <Eye className="w-4 h-4" /> Live Preview
              </button>
              <button
                type="button"
                onClick={handleSaveAndExit}
                disabled={saving}
                className="hidden sm:inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                aria-label="Close property uploader"
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Wizard progress */}
          <div className="border-b border-slate-100 bg-white px-6 py-3">
            <WizardProgress
              steps={steps}
              currentStepIndex={currentStepIndex}
              onSelectStep={handleSelectStep}
            />
          </div>

          {/* Body: form + sticky preview */}
          <div className="flex-1 flex overflow-hidden">

            {/* Form column */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50"
            >
              <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/60">
                {(() => {
                  const ActiveStageIcon = (data.propertyType && propertyTypeIcons[data.propertyType]) || stageIcons[currentStep.id] || Sparkles;
                  const activeTitle = data.propertyType && PROPERTY_LABELS[data.propertyType] ? PROPERTY_LABELS[data.propertyType] : currentStep.label;
                  return (
                    <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                      <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm transition-transform duration-300 hover:scale-105 mmx-chip-in">
                        <ActiveStageIcon className="w-6 h-6 animate-pulse text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{activeTitle}</h3>
                        <p className="text-xs text-slate-500">Stage {currentStepIndex + 1} of {steps.length} • {currentStep.label}</p>
                      </div>
                    </div>
                  );
                })()}

                <div key={currentStep.id} className="mmx-step-enter">
                  {renderStepContent()}
                </div>
              </div>
            </div>

            {/* Desktop preview sidebar */}
            <aside className="hidden lg:flex w-96 border-l border-slate-200 bg-white p-6 flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700">
                    Property Live Preview
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Stage {currentStepIndex + 1}/10
                  </span>
                </div>
                <PropertyLivePreviewContent
                  data={data}
                  currentStepId={currentStep.id}
                  completionPercentage={completionPercentage}
                />
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  disabled={saving}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={saving}
                  className="mmx-liquid-primary w-full rounded-2xl py-3 text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  <span>Submit Listing for Review</span>
                </button>
              </div>
            </aside>
          </div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-white">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={saving}
                className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-extrabold text-white shadow-lg disabled:opacity-50"
              >
                {saving && <Loader className="h-4 w-4 animate-spin" />}
                Submit New Listing for Review
              </button>
            )}
          </div>

          {/* Mobile full-screen preview sheet */}
          {mobilePreviewOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Live listing preview"
              className="lg:hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) setMobilePreviewOpen(false);
              }}
            >
              <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900">Live Listing Preview</h3>
                  <button
                    type="button"
                    onClick={() => setMobilePreviewOpen(false)}
                    aria-label="Close preview"
                    className="rounded-full bg-slate-100 p-2 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <PropertyLivePreviewContent
                  data={data}
                  currentStepId={currentStep.id}
                  completionPercentage={completionPercentage}
                />
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={saving}
                  className="mmx-liquid-primary w-full rounded-2xl py-3 text-xs font-bold text-white shadow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader className="h-4 w-4 animate-spin" />}
                  <span>Submit Listing for Review</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
