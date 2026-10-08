// src/components/seller/SellerPropertyEdit.jsx
// MarketMix premium seller property editor.
// Existing Step* components remain the real data-entry screens.
// This wrapper controls relevance, progressive navigation, autosave-safe editing,
// mobile/desktop construction preview, validation routing, and final persistence.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
  DoorOpen,
  Droplets,
  Home,
  Image as ImageIcon,
  Images,
  LandPlot,
  Loader,
  LockKeyhole,
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
import {
  PROPERTY_TYPES,
  LAND_LIKE,
  HOSTEL_LIKE,
} from './constants/propertyTaxonomy';

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

import '../moving/LiquidGlass.css';

const normalizeImageEntries = (images = []) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((image, index) => {
      if (!image) return null;

      if (typeof image === 'string') {
        return {
          id: `saved-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`,
          url: image,
          remoteUrl: image,
          r2Key: null,
          category: 'other',
          localPreviewUrl: null,
          status: 'uploaded',
          error: null,
        };
      }

      const remoteUrl =
        image.remoteUrl ||
        image.url ||
        image.src ||
        image.localPreviewUrl ||
        null;

      return {
        ...image,
        id:
          image.id ??
          image.imageId ??
          `saved-image-${index}-${Math.random().toString(36).slice(2, 9)}`,
        url: image.url ?? remoteUrl,
        remoteUrl: image.remoteUrl ?? remoteUrl,
        category: image.category || 'other',
        status: image.status || (remoteUrl ? 'uploaded' : 'previewing'),
      };
    })
    .filter(Boolean);
};

const hydrateImages = (property) => {
  const fromMedia = Array.isArray(property.media) ? property.media : [];
  const fromImages = Array.isArray(property.images) ? property.images : [];
  const fromPublic = Array.isArray(property.publicMedia) ? property.publicMedia : [];

  const raw =
    fromMedia.length > 0
      ? fromMedia
      : fromImages.length > 0
        ? fromImages
        : fromPublic;

  const images = normalizeImageEntries(raw);

  const coverUrl =
    typeof property.coverImage === 'string'
      ? property.coverImage
      : property.coverImage?.remoteUrl ||
        property.coverImage?.url ||
        property.coverImage?.src ||
        '';

  if (!coverUrl) return images;

  const coverIndex = images.findIndex(
    (image) => (image.remoteUrl || image.url) === coverUrl
  );

  if (coverIndex >= 0) {
    if (coverIndex === 0) return images;
    const reordered = [...images];
    const [cover] = reordered.splice(coverIndex, 1);
    return [cover, ...reordered];
  }

  return [
    {
      id: `saved-cover-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      url: coverUrl,
      remoteUrl: coverUrl,
      r2Key: null,
      category: 'other',
      localPreviewUrl: null,
      status: 'uploaded',
      error: null,
    },
    ...images,
  ];
};

const initialData = {
  listingType: '',
  propertyType: 'house',
  unitType: 'Entire property',
  roomType: '',
  rentalModel: ['Monthly'],
  occupancy: '',
  totalUnits: '',
  availableUnits: '',
  propertyName: '',
  title: '',
  description: '',
  totalBedrooms: '',
  bathrooms: '',
  floors: '',
  floorNumber: '',
  yearBuilt: '',
  furnished: '',
  suitableFor: ['General'],
  genderAccommodation: 'Mixed',
  ageRestriction: '',
  institutionName: '',
  institutionType: '',
  campus: '',
  nearestCampusGate: '',
  distanceToCampus: '',
  walkingTimeToCampus: '',
  transportTimeToCampus: '',
  transportFareToCampus: '',
  studentHousingClassification: '',
  roomSize: '',
  roomLength: '',
  roomWidth: '',
  sleepingArrangement: '',
  roomFurniture: [],
  bathroom: '',
  kitchen: '',
  occupancyCount: '',
  occupancyCustom: '',
  sharingAllowed: '',
  currentOccupancy: '',
  availabilityDate: '',
  rentAmount: '',
  paymentFrequency: 'Monthly',
  depositType: "One month's rent",
  depositAmount: '',
  depositRefundable: 'Yes',
  recurringCharges: [],
  oneTimeFees: [],
  waterSource: '',
  waterIncluded: '',
  waterCharge: '',
  waterChargingMethod: '',
  waterReliability: '',
  waterStorage: [],
  hotWater: '',
  electricityType: '',
  electricityIncluded: '',
  electricityTypicalCost: '',
  electricityNotProvided: false,
  garbageCollection: '',
  garbageCharge: '',
  garbageFrequency: '',
  commonCleaning: '',
  laundryCleaning: '',
  internetOption: '',
  internetProvider: '',
  internetCost: '',
  internetSpeed: '',
  managerType: 'Landlord',
  managerName: '',
  managerPhone: '',
  managerWhatsApp: '',
  managerEmail: '',
  problemHandler: 'Landlord',
  onSitePerson: 'Landlord',
  managementAvailability: '24/7',
  emergencyContact: 'Yes',
  responseTime: 'Under 15 minutes',
  securityFeatures: {},
  hasGate: '',
  gateLocked: '',
  gateClosingTime: '',
  gateOpeningTime: '',
  afterHoursAccess: '',
  visitorPolicy: '',
  overnightVisitors: '',
  curfew: '',
  curfewTime: '',
  parties: '',
  musicPolicy: '',
  quietHoursFrom: '',
  quietHoursTo: '',
  gatherings: '',
  smoking: '',
  alcohol: '',
  pets: '',
  laundryHours: '',
  kitchenHours: '',
  location: '',
  locationData: null,
  coordinates: null,
  county: '',
  town: '',
  estate: '',
  nearestRoad: '',
  roadType: '',
  roadCondition: '',
  distanceToMainRoad: '',
  walkingTimeToMainRoad: '',
  nearestStage: '',
  distanceToStage: '',
  walkingTimeToStage: '',
  fareToCampus: '',
  fareToCBD: '',
  transportOptions: [],
  streetLighting: '',
  floodingHistory: '',
  roomAmenities: [],
  propertyAmenities: [],
  nearbyPlaces: [],
  images: [],
  youtubeUrl: '',
  youtubeVideoId: '',
};

const PROPERTY_LABELS = Object.fromEntries(
  PROPERTY_TYPES.map((entry) => [entry.id, entry.label])
);

const COMPACT_TYPES = new Set([
  'single_room',
  'bedsitter',
  'studio_apartment',
]);

const HOSTEL_TYPES = new Set(['student_hostel']);

const SHARED_TYPES = new Set([
  'shared_house',
  'compound',
]);

const HOSPITALITY_TYPES = new Set([
  'urbannest',
  'guest_house',
  'serviced_apartment',
]);

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
  propertyType: {
    group: 'propertyAndSpace',
    label: 'Property type',
    layer: 1,
  },
  basicDetails: {
    group: 'propertyAndSpace',
    label: 'Basic details',
    layer: 2,
  },
  unitRoom: {
    group: 'propertyAndSpace',
    label: 'Unit & room',
    layer: 3,
  },
  studentInfo: {
    group: 'studentInfo',
    label: 'Student information',
    layer: 4,
  },
  roomOccupancy: {
    group: 'spaceOccupancy',
    label: 'Space & occupancy',
    layer: 5,
  },
  rentCosts: {
    group: 'priceCosts',
    label: 'Price & costs',
    layer: 6,
  },
  locationTransport: {
    group: 'locationSurroundings',
    label: 'Location & transport',
    layer: 7,
  },
  nearbyPlaces: {
    group: 'locationSurroundings',
    label: 'Nearby places',
    layer: 8,
  },
  waterUtilities: {
    group: 'utilitiesServices',
    label: 'Water & utilities',
    layer: 9,
  },
  internetGarbage: {
    group: 'utilitiesServices',
    label: 'Internet & services',
    layer: 10,
  },
  management: {
    group: 'managementSecurity',
    label: 'Management & access',
    layer: 11,
  },
  security: {
    group: 'managementSecurity',
    label: 'Security',
    layer: 12,
  },
  gateHouseRules: {
    group: 'managementSecurity',
    label: 'Gate & rules',
    layer: 12,
  },
  amenities: {
    group: 'amenities',
    label: 'Amenities',
    layer: 13,
  },
  photosMedia: {
    group: 'mediaTour',
    label: 'Photos & media',
    layer: 14,
  },
  youtubeTour: {
    group: 'mediaTour',
    label: 'YouTube tour',
    layer: 15,
  },
  review: {
    group: 'review',
    label: 'Review & submit',
    layer: 16,
  },
};

// Individual existing screens remain the actual data-entry UI.
const SCREEN_FLOW = [
  { id: 'propertyType', Component: StepPropertyType },
  { id: 'basicDetails', Component: StepBasicDetails },
  { id: 'unitRoom', Component: StepUnitRoom },
  { id: 'studentInfo', Component: StepStudentInfo },
  { id: 'roomOccupancy', Component: StepRoomOccupancy },
  { id: 'rentCosts', Component: StepRentCosts },
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
  'listingType',
  'propertyType',
  'unitType',
  'roomType',
  'rentalModel',
  'occupancy',
  'sharingAllowed',
  'depositType',
  'depositRefundable',
  'paymentFrequency',
  'waterIncluded',
  'electricityType',
  'electricityIncluded',
  'internetOption',
  'internetType',
  'ownerType',
  'managerType',
  'managementType',
  'gateType',
  'hasGate',
  'gateLocked',
]);

const GOLD = '#C8A96B';
const GOLD_SOFT = '#EFE4C8';
const INK = '#0B0B0D';
const CREAM = '#F4F1E9';
const MUTED = '#8D8A83';

const CSS = `
  .mmx-edit-shell{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .mmx-screen-enter{animation:mmxScreenEnter 360ms cubic-bezier(.22,1,.36,1) both}
  .mmx-foundation{animation:mmxFoundation 680ms cubic-bezier(.22,1,.36,1) both;transform-box:fill-box;transform-origin:50% 100%}
  .mmx-wall{animation:mmxWall 580ms cubic-bezier(.22,1,.36,1) both;transform-box:fill-box;transform-origin:50% 100%}
  .mmx-roof{animation:mmxRoof 620ms cubic-bezier(.22,1,.36,1) both}
  .mmx-open{animation:mmxOpen 420ms cubic-bezier(.22,1,.36,1) both;transform-box:fill-box;transform-origin:center}
  .mmx-room{animation:mmxRoom 420ms cubic-bezier(.22,1,.36,1) both;transform-box:fill-box;transform-origin:left center}
  .mmx-slide{animation:mmxSlide 420ms cubic-bezier(.22,1,.36,1) both}
  .mmx-draw{stroke-dasharray:1000;stroke-dashoffset:1000;animation:mmxDraw 900ms cubic-bezier(.22,1,.36,1) both}
  .mmx-soft{animation:mmxSoft 2.1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  .mmx-light{animation:mmxLight 2.2s ease-in-out infinite}
  .mmx-wifi{animation:mmxWifi 1.75s ease-out infinite;transform-box:fill-box;transform-origin:center}
  .mmx-success{animation:mmxSuccess 700ms cubic-bezier(.22,1,.36,1) both}
  .mmx-mobile-transition{animation:mmxMobileTransition 420ms cubic-bezier(.22,1,.36,1) both}
  .mmx-road{animation:mmxRoad 900ms cubic-bezier(.22,1,.36,1) both}
  .mmx-road-mark{animation:mmxRoadMark 1.4s ease-in-out infinite}
  .mmx-alert{animation:mmxAlert 1.2s ease-in-out 2 both}
  .mmx-field-attention{animation:mmxFieldAttention 1.15s ease-in-out 2 both!important;outline:3px solid rgba(200,169,107,.78)!important;outline-offset:4px!important}
  .mmx-danger-field{border-color:#ef4444!important;box-shadow:0 0 0 3px rgba(239,68,68,.10)!important}
  @keyframes mmxScreenEnter{from{opacity:0;transform:translateY(16px);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
  @keyframes mmxFoundation{from{opacity:0;transform:scaleY(.02)}to{opacity:1;transform:scaleY(1)}}
  @keyframes mmxWall{from{opacity:0;transform:scaleY(.02)}to{opacity:1;transform:scaleY(1)}}
  @keyframes mmxRoof{from{opacity:0;transform:translateY(-72px) scale(.96)}to{opacity:1;transform:none}}
  @keyframes mmxOpen{from{opacity:0;transform:scale(.72)}to{opacity:1;transform:scale(1)}}
  @keyframes mmxRoom{from{opacity:0;transform:scaleX(.05)}to{opacity:1;transform:scaleX(1)}}
  @keyframes mmxSlide{from{opacity:0;transform:translateX(-22px)}to{opacity:1;transform:none}}
  @keyframes mmxDraw{from{stroke-dashoffset:1000;opacity:0}to{stroke-dashoffset:0;opacity:1}}
  @keyframes mmxSoft{0%,100%{opacity:.35;transform:scale(.93)}50%{opacity:1;transform:scale(1)}}
  @keyframes mmxLight{0%,100%{opacity:.25}42%{opacity:1}68%{opacity:.55}}
  @keyframes mmxWifi{0%{opacity:0;transform:scale(.65)}42%{opacity:.95;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}
  @keyframes mmxSuccess{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}
  @keyframes mmxMobileTransition{from{opacity:.2;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
  @keyframes mmxRoad{from{stroke-dashoffset:900;opacity:.15}to{stroke-dashoffset:0;opacity:1}}
  @keyframes mmxRoadMark{0%,100%{opacity:.2}50%{opacity:.72}}
  @keyframes mmxAlert{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
  @keyframes mmxFieldAttention{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
  @media(prefers-reduced-motion:reduce){
    .mmx-screen-enter,.mmx-foundation,.mmx-wall,.mmx-roof,.mmx-open,.mmx-room,.mmx-slide,.mmx-draw,.mmx-soft,.mmx-light,.mmx-wifi,.mmx-success,.mmx-mobile-transition,.mmx-road,.mmx-road-mark,.mmx-alert,.mmx-field-attention{animation:none!important}
  }
`;

function cleanUndefined(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, cleanUndefined(value)])
  );
}

function imageUrl(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return image.url || image.remoteUrl || image.src || image.localPreviewUrl || '';
}

function occupancyNumber(value) {
  const text = String(value ?? '1');
  const number = Number(text.replace(/[^0-9]/g, '')) || 1;
  return text.includes('+') ? number + 1 : number;
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

function isShortStay(data) {
  return (
    data.listingType === 'short_stay' ||
    HOSPITALITY_TYPES.has(data.propertyType) ||
    data.propertyType === 'urbannest'
  );
}

function buildRules(data) {
  const land = LAND_LIKE.has(data.propertyType);
  const shortStay = isShortStay(data);
  const commercial = data.propertyType === 'commercial';
  const student =
    data.listingType === 'rent' &&
    !shortStay &&
    (HOSTEL_TYPES.has(data.propertyType) || HOSTEL_LIKE.has(data.propertyType)) &&
    (
      (Array.isArray(data.suitableFor) && data.suitableFor.includes('Students')) ||
      HOSTEL_TYPES.has(data.propertyType)
    );

  const residential = RESIDENTIAL_TYPES.has(data.propertyType);

  return {
    land,
    shortStay,
    commercial,
    student,
    showUnitRoom: !land && !commercial,
    showStudentInfo: student,
    showOccupancy: !land && !commercial && (data.listingType === 'rent' || shortStay),
    showUtilities: !land && !commercial,
    showManagement: !land && !commercial,
    showSecurity: !land && !commercial,
    showGateRules: !land && (residential || shortStay),
    showAmenities: !land && !commercial,
    showNearbyPlaces: true,
  };
}

function filterScreenFlow(data) {
  const rules = buildRules(data);

  return SCREEN_FLOW.filter(({ id }) => {
    if (id === 'unitRoom') return rules.showUnitRoom;
    if (id === 'studentInfo') return rules.showStudentInfo;
    if (id === 'roomOccupancy') return rules.showOccupancy;
    if (id === 'waterUtilities' || id === 'internetGarbage') return rules.showUtilities;
    if (id === 'management') return rules.showManagement;
    if (id === 'security') return rules.showSecurity;
    if (id === 'gateHouseRules') return rules.showGateRules;
    if (id === 'amenities') return rules.showAmenities;
    return true;
  });
}

function groupExperiences(flow) {
  const seen = new Set();

  return flow.reduce((acc, screen) => {
    const meta = SCREEN_META[screen.id];
    if (!meta || seen.has(meta.group)) return acc;

    seen.add(meta.group);

    const constantStep = Array.isArray(WIZARD_STEPS)
      ? WIZARD_STEPS.find((step) => step.id === meta.group)
      : null;

    acc.push({
      id: meta.group,
      label: constantStep?.label || GROUP_LABELS[meta.group],
    });

    return acc;
  }, []);
}

function roomsForType(type, bedrooms) {
  if (type === 'single_room' || type === 'bedsitter' || type === 'studio_apartment') {
    return 1;
  }

  if (
    type === 'apartment' ||
    type === 'standalone_house' ||
    type === 'bungalow' ||
    type === 'maisonette' ||
    type === 'townhouse' ||
    type === 'duplex' ||
    type === 'semi_detached'
  ) {
    return Math.max(2, bedrooms + 1);
  }

  return Math.max(1, bedrooms);
}

function screenCompleted(data, screenId) {
  switch (screenId) {
    case 'propertyType':
      return Boolean(data.propertyType && data.listingType);
    case 'basicDetails':
      return Boolean(data.propertyName?.trim() || data.title?.trim());
    case 'unitRoom':
      return Boolean(
        data.unitType ||
        data.roomType ||
        data.rentalModel?.length ||
        data.totalBedrooms ||
        data.roomSize
      );
    case 'studentInfo':
      return true;
    case 'roomOccupancy':
      return Boolean(data.occupancy || data.occupancyCount || data.occupancyCustom);
    case 'rentCosts':
      return Boolean(data.rentAmount || data.price);
    case 'locationTransport':
      return Boolean(
        data.location ||
        data.county ||
        data.town ||
        data.coordinates
      );
    case 'nearbyPlaces':
      return Boolean(data.nearbyPlaces?.length || data.landmark || data.estate || data.nearestRoad);
    case 'waterUtilities':
      return Boolean(data.waterSource || data.waterIncluded || data.electricityType);
    case 'internetGarbage':
      return Boolean(
        data.internetOption ||
        data.internetProvider ||
        data.garbageCollection ||
        data.features?.length
      );
    case 'management':
      return Boolean(
        data.managerType ||
        data.managerName ||
        data.problemHandler ||
        data.onSitePerson
      );
    case 'security':
      return Boolean(
        (data.securityFeatures && Object.keys(data.securityFeatures).length > 0) ||
        (Array.isArray(data.securityFeatures) && data.securityFeatures.length > 0)
      );
    case 'gateHouseRules':
      return Boolean(
        data.hasGate ||
        data.gateLocked ||
        data.gateClosingTime ||
        data.visitorPolicy ||
        data.parties ||
        data.musicPolicy
      );
    case 'amenities':
      return Boolean(
        data.roomAmenities?.length ||
        data.propertyAmenities?.length ||
        data.amenities?.length
      );
    case 'photosMedia':
      return Boolean(
        Array.isArray(data.images) &&
        data.images.length > 0
      );
    case 'youtubeTour':
      return Boolean(data.youtubeUrl || data.youtubeVideoId);
    case 'review':
      return true;
    default:
      return false;
  }
}

function firstMissingRequired(data, rules) {
  const checks = [
    {
      field: 'listingType',
      label: 'Listing type',
      screenId: 'propertyType',
      missing: !['sale', 'rent', 'short_stay'].includes(String(data.listingType || '').toLowerCase()),
      message: 'Choose whether this is for rent, sale, or short stay.',
    },
    {
      field: 'propertyType',
      label: 'Property type',
      screenId: 'propertyType',
      missing: !data.propertyType,
      message: 'Choose the property type.',
    },
    {
      field: 'title',
      label: 'Property title',
      screenId: 'basicDetails',
      missing: !String(data.title || data.propertyName || '').trim(),
      message: 'Enter a property title or property name.',
    },
    {
      field: 'price',
      label: rules.shortStay ? 'Stay price' : data.listingType === 'sale' ? 'Sale price' : 'Rent price',
      screenId: 'rentCosts',
      missing: !String(data.rentAmount || data.price || '').trim(),
      message: rules.shortStay
        ? 'Enter the short-stay price.'
        : data.listingType === 'sale'
          ? 'Enter the sale price.'
          : 'Enter the rent price.',
    },
    {
      field: 'location',
      label: 'Property location',
      screenId: 'locationTransport',
      missing: !String(data.location || '').trim() &&
        !String(data.county || '').trim() &&
        !String(data.town || '').trim() &&
        !data.coordinates,
      message: 'Add the property location or pin it on the map.',
    },
    {
      field: 'images',
      label: 'Property photos',
      screenId: 'photosMedia',
      missing: !Array.isArray(data.images) || data.images.length === 0,
      message: 'Add at least one property photo.',
    },
  ];

  if (rules.land) {
    checks.push({
      field: 'areaSize',
      label: 'Land size',
      screenId: 'unitRoom',
      missing: !String(data.roomSize || data.areaSize || '').trim(),
      message: 'Enter the land or plot size.',
    });
  }

  if (!rules.land && rules.showOccupancy) {
    checks.push({
      field: 'occupancy',
      label: rules.shortStay ? 'Guest capacity' : 'Occupancy',
      screenId: 'roomOccupancy',
      missing: !String(data.occupancy || data.occupancyCount || data.occupancyCustom || '').trim(),
      message: rules.shortStay
        ? 'Enter how many guests the accommodation can host.'
        : 'Enter the occupancy or capacity.',
    });
  }

  return checks.find((check) => check.missing) || null;
}

function aliasesForField(field) {
  const aliases = {
    listingType: ['listingType', 'listing-type', 'status'],
    propertyType: ['propertyType', 'property-type'],
    title: ['title', 'propertyTitle', 'property-name', 'propertyName'],
    price: ['price', 'rentAmount', 'amount', 'salePrice'],
    location: ['location', 'county', 'town', 'estate'],
    areaSize: ['areaSize', 'plotSize', 'landSize', 'roomSize'],
    occupancy: ['occupancy', 'occupancyCount', 'occupancyCustom', 'guestCapacity'],
    images: ['images', 'photos', 'property-images'],
  };

  return aliases[field] || [field];
}

function findFieldElement(field) {
  const aliases = aliasesForField(field);

  const elements = Array.from(
    document.querySelectorAll(
      'input, textarea, select, button, [role="button"], [tabindex]'
    )
  );

  const exact = elements.find((element) => {
    const values = [
      element.getAttribute('name'),
      element.getAttribute('id'),
      element.getAttribute('data-field'),
      element.getAttribute('data-field-key'),
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    return aliases.some((alias) => values.includes(alias.toLowerCase()));
  });

  if (exact) return exact;

  return elements.find((element) => {
    const haystack = [
      element.getAttribute('name'),
      element.getAttribute('id'),
      element.getAttribute('aria-label'),
      element.getAttribute('placeholder'),
      element.textContent,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return aliases.some((alias) => haystack.includes(alias.toLowerCase()));
  }) || null;
}

function focusField(field) {
  const element = findFieldElement(field);
  if (!element) return false;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });

  window.setTimeout(() => {
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }

    element.classList.add('mmx-field-attention');

    window.setTimeout(() => {
      element.classList.remove('mmx-field-attention');
    }, 1800);
  }, 260);

  return true;
}

function validateStep(stepId, data, rules) {
  const errors = {};

  if (stepId === 'propertyType' && !data.propertyType) {
    errors.propertyType = 'Choose a property type.';
  }

  if (stepId === 'propertyType' && !['sale', 'rent', 'short_stay'].includes(String(data.listingType || '').toLowerCase())) {
    errors.listingType = 'Choose whether the property is for sale, rent, or short stay.';
  }

  if (stepId === 'basicDetails' && !String(data.title || data.propertyName || '').trim()) {
    errors.title = 'Enter a property title or property name.';
  }

  if (stepId === 'rentCosts' && !String(data.rentAmount || data.price || '').trim()) {
    errors.price = rules.shortStay
      ? 'Enter the short-stay price.'
      : data.listingType === 'sale'
        ? 'Enter the sale price.'
        : 'Enter the rent price.';
  }

  if (stepId === 'locationTransport' &&
      !String(data.location || '').trim() &&
      !String(data.county || '').trim() &&
      !String(data.town || '').trim() &&
      !data.coordinates) {
    errors.location = 'Add the location or pin it on the map.';
  }

  if (stepId === 'roomOccupancy' &&
      rules.showOccupancy &&
      !String(data.occupancy || data.occupancyCount || data.occupancyCustom || '').trim()) {
    errors.occupancy = rules.shortStay
      ? 'Enter the number of guests the accommodation can host.'
      : 'Enter the occupancy or capacity.';
  }

  if (stepId === 'photosMedia') {
    const images = Array.isArray(data.images) ? data.images : [];
    const usable = images.some((image) => {
      if (typeof image === 'string') return Boolean(image);
      return Boolean(
        image?.remoteUrl ||
        image?.url ||
        image?.localPreviewUrl ||
        image?.file ||
        image?.status === 'uploaded' ||
        image?.status === 'uploading' ||
        image?.status === 'previewing'
      );
    });

    if (!usable) {
      errors.images = 'Upload at least one property image.';
    }
  }

  if (rules.land && stepId === 'unitRoom') {
    if (!String(data.roomSize || data.areaSize || '').trim()) {
      errors.areaSize = 'Enter the land or plot size.';
    }
  }

  return errors;
}

function activeCategoryLabel(data) {
  return (
    PROPERTY_LABELS[data.propertyType] ||
    String(data.propertyType || 'Property').replace(/_/g, ' ')
  );
}

function BuildingWindow({ x, y, delay = 0 }) {
  return (
    <g className="mmx-open" style={{ animationDelay: `${delay}ms` }}>
      <rect
        x={x}
        y={y}
        width="46"
        height="38"
        rx="6"
        fill="#DDEBF0"
        stroke={CREAM}
        strokeWidth="4"
      />
      <path
        d={`M${x + 23} ${y}v38M${x} ${y + 19}h46`}
        stroke="#758187"
        strokeWidth="2"
      />
    </g>
  );
}

function BedShape({ x, y, delay = 0, bunk = false }) {
  return (
    <g className="mmx-open" style={{ animationDelay: `${delay}ms` }}>
      <rect x={x} y={y} width="68" height="33" rx="8" fill="#E9E3D6" stroke={GOLD} strokeWidth="2" />
      <rect x={x + 6} y={y + 7} width="19" height="12" rx="4" fill="#FFF" stroke="#C9C2B5" />
      <path d={`M${x + 33} ${y + 10}h24M${x + 33} ${y + 18}h24`} stroke="#B4AB99" strokeWidth="4" strokeLinecap="round" />
      {bunk && (
        <line x1={x - 3} y1={y - 5} x2={x + 71} y2={y - 5} stroke={GOLD} strokeWidth="3" />
      )}
    </g>
  );
}

function BathroomShape({ x, y }) {
  return (
    <g className="mmx-open">
      <rect x={x} y={y} width="72" height="54" rx="8" fill="#DCE6E9" fillOpacity=".44" stroke="#A4B4B8" strokeWidth="2" />
      <circle cx={x + 48} cy={y + 26} r="12" fill="#F3F2ED" stroke="#A4B4B8" strokeWidth="2" />
    </g>
  );
}

function ParkingShape({ x, y }) {
  return (
    <g className="mmx-open">
      <rect x={x} y={y} width="110" height="54" rx="10" fill="#2A2D30" stroke={GOLD} strokeWidth="2" />
      <text x={x + 55} y={y + 21} textAnchor="middle" fill={CREAM} fontSize="9" fontWeight="700">PARKING</text>
      <path d={`M${x + 18} ${y + 34}h74`} stroke="#9C9C96" strokeWidth="3" />
    </g>
  );
}

function GardenShape({ x, y }) {
  return (
    <g className="mmx-open">
      <path d={`M${x} ${y}q14-36 28 0q14-43 28 0q14-32 28 0`} stroke="#667957" strokeWidth="10" fill="none" strokeLinecap="round" />
      <circle cx={x + 32} cy={y - 22} r="8" fill="#778C63" />
      <circle cx={x + 72} cy={y - 26} r="9" fill="#879D72" />
    </g>
  );
}

function KitchenShape({ x, y }) {
  return (
    <g className="mmx-open">
      <rect x={x} y={y} width="96" height="16" rx="5" fill="#E6DECF" stroke={GOLD} strokeWidth="2" />
      <circle cx={x + 27} cy={y - 8} r="6" fill="#7C8589" />
      <circle cx={x + 68} cy={y - 8} r="6" fill="#7C8589" />
    </g>
  );
}

function LaundryShape({ x, y }) {
  return (
    <g className="mmx-open">
      <rect x={x} y={y} width="48" height="52" rx="8" fill="#F1EEE5" stroke="#A3A5A6" strokeWidth="3" />
      <circle cx={x + 24} cy={y + 26} r="13" fill="#DEE3E3" stroke="#777E80" strokeWidth="2" />
    </g>
  );
}

function TankShape({ x, y }) {
  return (
    <g className="mmx-open">
      <ellipse cx={x + 18} cy={y + 18} rx="28" ry="16" fill="#43484A" stroke={GOLD} strokeWidth="3" />
      <rect x={x - 10} y={y + 18} width="56" height="34" fill="#43484A" stroke={GOLD} strokeWidth="3" />
      <text x={x + 18} y={y + 39} textAnchor="middle" fill={CREAM} fontSize="8" fontWeight="700">WATER</text>
    </g>
  );
}

function PlaceNode({ x, y, label, delay = 0 }) {
  return (
    <g className="mmx-open" style={{ animationDelay: `${delay}ms` }}>
      <circle cx={x} cy={y} r="13" fill={INK} stroke={GOLD} strokeWidth="3" className="mmx-soft" />
      <text x={x} y={y + 30} textAnchor="middle" fill="#FFF" fillOpacity=".46" fontSize="10">{label}</text>
    </g>
  );
}

function ConstructionScene({ data, builtLayer, currentScreenId, revision, compact = false }) {
  const kind = propertyKind(data.propertyType);
  const land = kind === 'land';
  const hostel = kind === 'hostel';
  const hospitality = isShortStay(data);
  const bedrooms = Math.max(
    1,
    Number.parseInt(String(data.totalBedrooms || data.bedrooms || '1'), 10) || 1
  );
  const baths = Math.max(
    1,
    Number.parseInt(String(data.bathrooms || '1'), 10) || 1
  );
  const occ = occupancyNumber(
    data.occupancy || data.occupancyCount || data.occupancyCustom
  );

  const amenities = [
    ...(Array.isArray(data.roomAmenities) ? data.roomAmenities : []),
    ...(Array.isArray(data.propertyAmenities) ? data.propertyAmenities : []),
  ];

  const security = Array.isArray(data.securityFeatures)
    ? data.securityFeatures
    : data.securityFeatures && typeof data.securityFeatures === 'object'
      ? Object.entries(data.securityFeatures)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
      : [];

  const featureText = [
    ...(Array.isArray(data.features) ? data.features : []),
    data.internetOption,
    data.internetProvider,
    data.internet,
  ]
    .filter(Boolean)
    .join(' ');

  const hasWater = Boolean(data.waterSource || data.waterIncluded);
  const hasElectricity = Boolean(data.electricityType || data.electricityIncluded);
  const hasWifi = /wifi|internet/i.test(featureText);
  const hasLaundry = amenities.some((value) => /laundry|washing/i.test(String(value)));
  const hasKitchen = amenities.some((value) => /kitchen|cooking/i.test(String(value)));
  const hasParking = amenities.some((value) => /parking|garage|car/i.test(String(value)));
  const hasGarden = amenities.some((value) => /garden|yard|lawn|compound/i.test(String(value)));
  const hasBalcony = amenities.some((value) => /balcony|terrace/i.test(String(value)));
  const hasTank = amenities.some((value) => /tank|borehole/i.test(String(value)));
  const hasCctv = security.some((value) => /cctv|camera/i.test(String(value)));
  const hasLock = security.some((value) => /lock|locked/i.test(String(value))) || Boolean(data.gateLocked);
  const hasGate =
    Boolean(data.hasGate) ||
    Boolean(data.gateLocked) ||
    Boolean(data.gateClosingTime) ||
    security.some((value) => /gate/i.test(String(value)));
  const hasSecurity = security.length > 0 || hasGate;

  const photo = imageUrl(data.images?.[0]);
  const zoomedOut = builtLayer >= 7;

  const building = useMemo(() => {
    if (land) return { x: 0, y: 0, w: 0, h: 0, roof: null };
    if (hostel) return { x: 286, y: 190, w: 428, h: 270, roof: 'flat' };
    if (hospitality) return { x: 322, y: 258, w: 356, h: 202, roof: 'sloped' };
    if (kind === 'compact') return { x: 346, y: 312, w: 308, h: 148, roof: 'sloped' };
    if (data.propertyType === 'duplex' || data.propertyType === 'maisonette') {
      return { x: 298, y: 190, w: 404, h: 270, roof: 'sloped' };
    }
    if (kind === 'house') return { x: 298, y: 278, w: 404, h: 182, roof: 'sloped' };
    return { x: 326, y: 258, w: 348, h: 202, roof: 'sloped' };
  }, [data.propertyType, hospitality, kind, land, hostel]);

  const shellX = building.x;
  const shellY = building.y;
  const shellW = building.w;
  const shellH = building.h;

  const floor2 =
    (data.propertyType === 'duplex' ||
      data.propertyType === 'maisonette' ||
      hostel) &&
    builtLayer >= 2;

  const roomCount = land
    ? 0
    : hostel
      ? 6
      : Math.min(4, roomsForType(data.propertyType, bedrooms));

  const cameraClass = zoomedOut
    ? compact
      ? 'scale-[.94] translate-y-3'
      : 'scale-[.84] translate-y-8'
    : 'scale-100 translate-y-0';

  return (
    <svg
      key={`${data.propertyType}-${revision}-${compact ? 'mobile' : 'desktop'}`}
      viewBox="0 0 1000 700"
      className={`absolute inset-0 h-full w-full transition-transform duration-900 ease-[cubic-bezier(.22,1,.36,1)] ${cameraClass}`}
      role="img"
      aria-label="Live architectural construction preview"
    >
      <defs>
        <linearGradient id="editGround" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#282B2D" />
          <stop offset="100%" stopColor="#101214" />
        </linearGradient>
        <linearGradient id="editWall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2A2C2F" />
          <stop offset="100%" stopColor="#17191B" />
        </linearGradient>
        <linearGradient id="editRoof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D1B574" />
          <stop offset="100%" stopColor="#886A39" />
        </linearGradient>
        <filter id="editShadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="17" floodColor="#000" floodOpacity=".48" />
        </filter>
      </defs>

      <rect width="1000" height="700" fill="#0D0F10" />
      <circle cx="520" cy="150" r="260" fill={GOLD} opacity=".035" />

      <path
        d="M70 520Q500 444 930 520L886 638Q500 682 114 628Z"
        fill="url(#editGround)"
      />
      <path
        d="M120 553Q500 495 880 553"
        stroke={GOLD}
        strokeOpacity=".20"
        strokeWidth="2"
        strokeDasharray="8 16"
        fill="none"
      />

      {land && builtLayer >= 1 && (
        <g className="mmx-foundation">
          <path
            d="M205 485L370 425L675 440L790 510L570 575L300 550Z"
            fill="#3A3F3D"
            stroke={GOLD}
            strokeWidth="3"
          />
          <path
            d="M255 488L405 452L695 470"
            stroke={GOLD}
            strokeOpacity=".45"
            strokeWidth="3"
            strokeDasharray="10 10"
          />
        </g>
      )}

      {land && builtLayer >= 7 && (
        <g className="mmx-open">
          <path
            className="mmx-draw"
            d="M160 520L250 460L710 477L822 535"
            stroke="#A79A7B"
            strokeWidth="4"
            fill="none"
          />
          {data.coordinates && (
            <>
              <circle cx="500" cy="438" r="26" fill={INK} stroke={GOLD} strokeWidth="4" />
              <path
                d="M500 411C482 411 468 425 468 443C468 466 500 490 500 490C500 490 532 466 532 443C532 425 518 411 500 411Z"
                fill={GOLD}
              />
              <circle cx="500" cy="441" r="8" fill={INK} />
            </>
          )}
        </g>
      )}

      {!land && (
        <g filter="url(#editShadow)">
          {builtLayer >= 1 && (
            <g className="mmx-foundation">
              <rect
                x={shellX - 34}
                y={shellY + shellH + 8}
                width={shellW + 68}
                height="32"
                rx="7"
                fill="#25272A"
                stroke={GOLD}
                strokeWidth="2"
              />
              <path
                d={`M${shellX - 16} ${shellY + shellH + 9}H${shellX + shellW + 16}`}
                stroke={CREAM}
                strokeWidth="3"
                opacity=".28"
              />
            </g>
          )}

          {builtLayer >= 2 && (
            <g className="mmx-wall">
              <rect
                x={shellX}
                y={shellY}
                width={shellW}
                height={shellH}
                rx="16"
                fill="url(#editWall)"
                stroke={CREAM}
                strokeWidth="5"
              />
              {floor2 && (
                <line
                  x1={shellX + 18}
                  y1={shellY + shellH / 2}
                  x2={shellX + shellW - 18}
                  y2={shellY + shellH / 2}
                  stroke={GOLD}
                  strokeWidth="3"
                  opacity=".70"
                />
              )}
            </g>
          )}

          {builtLayer >= 3 && (
            <g>
              {roomCount > 0 &&
                Array.from({ length: roomCount }).map((_, index) => {
                  const columns = hostel ? 3 : roomCount <= 2 ? roomCount : 2;
                  const rows = Math.ceil(roomCount / columns);
                  const cellW = shellW / columns;
                  const cellH = shellH / Math.max(1, rows);
                  const x = shellX + (index % columns) * cellW;
                  const y = shellY + Math.floor(index / columns) * cellH;

                  return (
                    <g
                      key={`room-${index}`}
                      className="mmx-room"
                      style={{ animationDelay: `${index * 70}ms` }}
                    >
                      <rect
                        x={x + 10}
                        y={y + 10}
                        width={Math.max(40, cellW - 20)}
                        height={Math.max(35, cellH - 20)}
                        fill="#FFF"
                        fillOpacity=".022"
                        stroke={GOLD}
                        strokeOpacity=".22"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}

              {Array.from({
                length: Math.max(2, Math.min(6, bedrooms * 2)),
              }).map((_, index) => {
                const columns = floor2 ? 4 : 3;
                const x =
                  shellX +
                  32 +
                  (index % columns) *
                    ((shellW - 64) / Math.max(1, columns - 1));
                const y =
                  shellY +
                  28 +
                  (floor2 ? Math.floor(index / columns) * 80 : 0);

                return (
                  <BuildingWindow
                    key={`window-${index}`}
                    x={x - 23}
                    y={y}
                    delay={index * 65}
                  />
                );
              })}

              <g className="mmx-open">
                <rect
                  x={shellX + shellW / 2 - 28}
                  y={shellY + shellH - 64}
                  width="56"
                  height="64"
                  rx="7"
                  fill="#3A2B1E"
                  stroke={GOLD}
                  strokeWidth="3"
                />
                <DoorOpen
                  x={shellX + shellW / 2 - 12}
                  y={shellY + shellH - 52}
                  size={24}
                  color={CREAM}
                  strokeWidth={1.7}
                />
              </g>
            </g>
          )}

          {builtLayer >= 4 && building.roof === 'sloped' && (
            <g className="mmx-roof">
              <path
                d={`M${shellX - 34} ${shellY + 10}
                L${shellX + shellW / 2} ${shellY - 86}
                L${shellX + shellW + 34} ${shellY + 10}Z`}
                fill="url(#editRoof)"
                stroke={CREAM}
                strokeWidth="4"
              />
              <path
                d={`M${shellX + shellW / 2} ${shellY - 86}
                L${shellX + shellW + 34} ${shellY + 10}`}
                stroke="#6F542F"
                strokeWidth="7"
                opacity=".7"
              />
            </g>
          )}

          {builtLayer >= 4 && building.roof === 'flat' && (
            <g className="mmx-roof">
              <rect
                x={shellX - 12}
                y={shellY - 12}
                width={shellW + 24}
                height="20"
                rx="7"
                fill="url(#editRoof)"
              />
            </g>
          )}

          {builtLayer >= 5 && (
            <g>
              {Array.from({
                length: Math.min(occ, hostel ? 8 : 4),
              }).map((_, index) => {
                const columns = hostel ? 4 : 2;
                const bx =
                  shellX +
                  26 +
                  (index % columns) *
                    Math.max(82, (shellW - 80) / Math.max(1, columns));
                const by =
                  shellY +
                  shellH -
                  112 -
                  Math.floor(index / columns) * 55;

                return (
                  <BedShape
                    key={`bed-${index}`}
                    x={bx}
                    y={by}
                    bunk={hostel}
                    delay={index * 85}
                  />
                );
              })}

              {!hostel && baths > 0 && (
                <BathroomShape
                  x={shellX + 24}
                  y={shellY + 24}
                />
              )}
            </g>
          )}

          {builtLayer >= 6 && (data.rentAmount || data.price) && (
            <g className="mmx-slide">
              <rect
                x="692"
                y="92"
                width="228"
                height="74"
                rx="20"
                fill={INK}
                stroke={GOLD}
                strokeWidth="2"
              />
              <text
                x="718"
                y="121"
                fill={GOLD}
                fontSize="11"
                fontWeight="700"
                letterSpacing="2"
              >
                {data.listingType === 'sale'
                  ? 'FOR SALE'
                  : hospitality
                    ? 'STAY RATE'
                    : 'PRICE'}
              </text>
              <text
                x="718"
                y="151"
                fill={CREAM}
                fontSize="23"
                fontWeight="700"
              >
                KSh {Number(String(data.rentAmount || data.price).replace(/[^0-9.]/g, '') || 0).toLocaleString()}
              </text>
            </g>
          )}

          {/* Location screen: road is drawn while the camera pulls back. */}
          {builtLayer >= 7 && (
            <g>
              <path
                className="mmx-road"
                d="M40 574Q500 446 960 574"
                stroke="#4D5254"
                strokeWidth="64"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="900"
              />
              <path
                className="mmx-road-mark"
                d="M40 574Q500 446 960 574"
                stroke={CREAM}
                strokeWidth="4"
                strokeDasharray="18 26"
                fill="none"
              />

              {data.coordinates && (
                <g className="mmx-open">
                  <circle
                    cx={shellX + shellW / 2}
                    cy={shellY - 28}
                    r="28"
                    fill={INK}
                    stroke={GOLD}
                    strokeWidth="4"
                  />
                  <path
                    d={`M${shellX + shellW / 2} ${shellY - 49}
                      C${shellX + shellW / 2 - 17} ${shellY - 49}
                      ${shellX + shellW / 2 - 29} ${shellY - 36}
                      ${shellX + shellW / 2 - 29} ${shellY - 19}
                      C${shellX + shellW / 2 - 29} ${shellY + 2}
                      ${shellX + shellW / 2} ${shellY + 24}
                      ${shellX + shellW / 2} ${shellY + 24}
                      C${shellX + shellW / 2} ${shellY + 24}
                      ${shellX + shellW / 2 + 29} ${shellY + 2}
                      ${shellX + shellW / 2 + 29} ${shellY - 19}
                      C${shellX + shellW / 2 + 29} ${shellY - 36}
                      ${shellX + shellW / 2 + 17} ${shellY - 49}
                      ${shellX + shellW / 2} ${shellY - 49}Z`}
                    fill={GOLD}
                  />
                  <circle
                    cx={shellX + shellW / 2}
                    cy={shellY - 18}
                    r="8"
                    fill={INK}
                  />
                </g>
              )}
            </g>
          )}

          {builtLayer >= 8 && (
            <g>
              <PlaceNode x={118} y={438} label="Nearby" delay={40} />
              <PlaceNode x={850} y={425} label="Area" delay={120} />
              <PlaceNode x={500} y={615} label="Road" delay={200} />
            </g>
          )}

          {builtLayer >= 9 && (
            <g>
              {hasWater && (
                <g className="mmx-slide">
                  <path
                    d={`M${shellX - 90} ${shellY + shellH + 20}
                    C${shellX - 130} ${shellY + shellH - 35}
                    ${shellX - 135} ${shellY + 80}
                    ${shellX - 70} ${shellY + 50}`}
                    stroke="#63B8C5"
                    strokeWidth="8"
                    fill="none"
                  />
                  <path
                    d={`M${shellX - 78} ${shellY + 52}h44`}
                    stroke="#EAE7DF"
                    strokeWidth="8"
                  />
                  <circle
                    cx={shellX - 56}
                    cy={shellY + 64}
                    r="5"
                    fill="#63B8C5"
                    className="mmx-soft"
                  />
                </g>
              )}

              {hasElectricity && (
                <g className="mmx-slide">
                  <path
                    d={`M${shellX + shellW + 25} ${shellY + 38}H910V${shellY + shellH + 18}`}
                    stroke="#C1A962"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx={shellX + shellW / 2}
                    cy={shellY + 60}
                    r="12"
                    fill="#F9EAA7"
                    className="mmx-light"
                  />
                  <circle
                    cx={shellX + shellW / 2 + 88}
                    cy={shellY + 110}
                    r="12"
                    fill="#F9EAA7"
                    className="mmx-light"
                    style={{ animationDelay: '500ms' }}
                  />
                </g>
              )}
            </g>
          )}

          {builtLayer >= 10 && (
            <g>
              {hasWifi && (
                <g className="mmx-open">
                  <rect
                    x={shellX + shellW - 82}
                    y={shellY + 32}
                    width="45"
                    height="25"
                    rx="7"
                    fill={CREAM}
                    stroke="#B59BCF"
                    strokeWidth="3"
                  />
                  <path
                    d={`M${shellX + shellW - 69} ${shellY + 31}q15-28 30 0`}
                    stroke="#B59BCF"
                    strokeWidth="3"
                    fill="none"
                    className="mmx-wifi"
                  />
                  <path
                    d={`M${shellX + shellW - 76} ${shellY + 22}q22-38 44 0`}
                    stroke="#B59BCF"
                    strokeWidth="3"
                    fill="none"
                    opacity=".55"
                    className="mmx-wifi"
                    style={{ animationDelay: '420ms' }}
                  />
                </g>
              )}
            </g>
          )}

          {builtLayer >= 11 && hasSecurity && (
            <g className="mmx-open">
              <path
                d={`M${shellX - 80} ${shellY + shellH + 25}V${shellY + 70}
                M${shellX + shellW + 80} ${shellY + shellH + 25}V${shellY + 70}`}
                stroke={GOLD}
                strokeWidth="8"
              />
              <path
                d={`M${shellX - 80} ${shellY + 70}H${shellX + shellW + 80}`}
                stroke={GOLD}
                strokeWidth="5"
              />
            </g>
          )}

          {builtLayer >= 12 && (
            <g>
              {hasGate && (
                <g className="mmx-slide">
                  <rect
                    x={shellX + shellW / 2 - 80}
                    y={shellY + shellH + 2}
                    width="58"
                    height="86"
                    rx="5"
                    fill="#26282A"
                    stroke={CREAM}
                    strokeWidth="4"
                  />
                  <rect
                    x={shellX + shellW / 2 + 22}
                    y={shellY + shellH + 2}
                    width="58"
                    height="86"
                    rx="5"
                    fill="#26282A"
                    stroke={CREAM}
                    strokeWidth="4"
                  />
                </g>
              )}

              {hasLock && (
                <g className="mmx-open">
                  <rect
                    x={shellX + shellW / 2 - 12}
                    y={shellY + shellH + 30}
                    width="24"
                    height="30"
                    rx="6"
                    fill={GOLD}
                  />
                  <path
                    d={`M${shellX + shellW / 2 - 8} ${shellY + shellH + 30}v-13q8-14 16 0v13`}
                    stroke={GOLD}
                    strokeWidth="5"
                    fill="none"
                  />
                  <LockKeyhole
                    x={shellX + shellW / 2 - 7}
                    y={shellY + shellH + 37}
                    size={14}
                    color={INK}
                    strokeWidth={1.9}
                  />
                </g>
              )}

              {hasCctv && (
                <g className="mmx-open">
                  <path
                    d={`M${shellX + shellW - 30} ${shellY + 42}h40l-23 24`}
                    stroke={CREAM}
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx={shellX + shellW + 2}
                    cy={shellY + 68}
                    r="7"
                    fill={GOLD}
                  />
                </g>
              )}
            </g>
          )}

          {builtLayer >= 13 && (
            <g>
              {hasParking && (
                <ParkingShape
                  x={Math.min(770, shellX + shellW + 26)}
                  y={shellY + shellH + 6}
                />
              )}
              {hasGarden && <GardenShape x={shellX - 95} y={shellY + shellH + 22} />}
              {hasKitchen && <KitchenShape x={shellX + 22} y={shellY + shellH - 72} />}
              {hasLaundry && (
                <LaundryShape
                  x={Math.min(805, shellX + shellW + 12)}
                  y={shellY + shellH - 76}
                />
              )}
              {hasBalcony && floor2 && (
                <g className="mmx-open">
                  <rect
                    x={shellX + shellW - 118}
                    y={shellY + 25}
                    width="112"
                    height="70"
                    rx="8"
                    fill="#222528"
                    stroke={GOLD}
                    strokeWidth="2"
                  />
                  <path
                    d={`M${shellX + shellW - 104} ${shellY + 48}h84
                    M${shellX + shellW - 88} ${shellY + 25}v70
                    M${shellX + shellW - 63} ${shellY + 25}v70
                    M${shellX + shellW - 38} ${shellY + 25}v70`}
                    stroke={CREAM}
                    strokeWidth="2"
                    opacity=".7"
                  />
                </g>
              )}
              {hasTank && (
                <TankShape x={shellX + shellW - 40} y={shellY - 56} />
              )}
            </g>
          )}

          {builtLayer >= 14 && photo && (
            <g className="mmx-open">
              <rect
                x="68"
                y="78"
                width="220"
                height="150"
                rx="20"
                fill={INK}
                stroke={GOLD}
                strokeWidth="2"
              />
              <image
                href={photo}
                x="75"
                y="85"
                width="206"
                height="136"
                preserveAspectRatio="xMidYMid slice"
              />
              <rect
                x="75"
                y="183"
                width="206"
                height="38"
                fill={INK}
                opacity=".58"
              />
              <text
                x="91"
                y="207"
                fill={CREAM}
                fontSize="12"
                fontWeight="600"
              >
                Real property photo
              </text>
            </g>
          )}

          {builtLayer >= 15 && (data.youtubeUrl || data.youtubeVideoId) && (
            <g className="mmx-open">
              <rect
                x="728"
                y="182"
                width="182"
                height="114"
                rx="18"
                fill={INK}
                stroke="#FFF"
                strokeOpacity=".15"
              />
              <circle cx="819" cy="238" r="26" fill={GOLD} />
              <path d="M811 223L837 238L811 253Z" fill={INK} />
              <text
                x="819"
                y="280"
                fill={CREAM}
                fontSize="11"
                textAnchor="middle"
                fontWeight="600"
              >
                Property tour
              </text>
            </g>
          )}
        </g>
      )}

      {builtLayer >= 16 && (
        <g className="mmx-success">
          <circle cx="500" cy="88" r="31" fill={INK} stroke={GOLD} strokeWidth="4" />
          <path
            d="M483 88l11 11l23-27"
            stroke={CREAM}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="500"
            y="139"
            textAnchor="middle"
            fill={GOLD}
            fontSize="12"
            fontWeight="700"
            letterSpacing="2"
          >
            PROPERTY COMPLETE
          </text>
        </g>
      )}

      {builtLayer > 0 && currentScreenId !== 'review' && !compact && (
        <text
          x="500"
          y="670"
          textAnchor="middle"
          fill="#FFF"
          fillOpacity=".30"
          fontSize="11"
          letterSpacing="2"
        >
          EDITING YOUR PROPERTY
        </text>
      )}
    </svg>
  );
}

function PreviewPanel({ data, builtLayer, currentScreenId, completion, revision }) {
  const propertyLabel = activeCategoryLabel(data);
  const hospitality = isShortStay(data);
  const listingLabel =
    data.listingType === 'sale'
      ? 'For Sale'
      : hospitality
        ? 'Short Stay'
        : 'For Rent';

  const price = Number(
    String(data.rentAmount || data.price || '').replace(/[^0-9.]/g, '')
  ) || 0;

  const location = [
    data.estate,
    data.town,
    data.county,
  ]
    .filter(Boolean)
    .join(', ');

  const images = Array.isArray(data.images) ? data.images : [];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] border border-black/8 bg-[#0D0F10] aspect-[1.24/1] shadow-[0_24px_70px_rgba(0,0,0,.12)]">
        <ConstructionScene
          data={data}
          builtLayer={builtLayer}
          currentScreenId={currentScreenId}
          revision={revision}
        />
      </div>

      <div className="rounded-[26px] border border-black/8 bg-white p-5 shadow-[0_18px_55px_rgba(0,0,0,.07)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div
              className="text-[10px] font-bold uppercase tracking-[.24em]"
              style={{ color: GOLD }}
            >
              {listingLabel}
            </div>
            <div className="mt-1 truncate text-base font-semibold" style={{ color: INK }}>
              {data.propertyName || data.title || 'Untitled property'}
            </div>
            <div
              className="mt-1 flex items-center gap-1.5 truncate text-xs"
              style={{ color: MUTED }}
            >
              <MapPinned size={13} />
              <span>{location || 'Location will appear here'}</span>
            </div>
          </div>

          <div
            className="shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold"
            style={{ borderColor: `${GOLD}55`, color: INK }}
          >
            {propertyLabel}
          </div>
        </div>

        {!LAND_LIKE.has(data.propertyType) && (
          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-black/7 py-3 text-xs text-[#5E5E64]">
            <div className="flex items-center gap-1.5">
              <Bed size={14} />
              {data.totalBedrooms || data.bedrooms || '—'}
            </div>
            <div className="flex items-center gap-1.5">
              <Bath size={14} />
              {data.bathrooms || '—'}
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              {data.occupancy || data.occupancyCount || '—'}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div
              className="text-[10px] uppercase tracking-[.18em]"
              style={{ color: MUTED }}
            >
              Price
            </div>
            <div className="mt-1 text-xl font-semibold" style={{ color: INK }}>
              KSh {price.toLocaleString()}
            </div>
          </div>

          <div className="text-right text-xs" style={{ color: MUTED }}>
            {data.listingType === 'sale'
              ? 'sale price'
              : hospitality
                ? data.paymentFrequency || data.billingCycle || 'nightly'
                : data.paymentFrequency || 'monthly'}
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/7 bg-[#F8F7F3] p-3">
            <img
              src={imageUrl(images[0])}
              alt="Uploaded property"
              className="h-14 w-20 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#18191C]">
                Property media
              </div>
              <div className="mt-1 text-[10px] text-[#85858C]">
                {images.length} image{images.length === 1 ? '' : 's'}
                {data.youtubeUrl || data.youtubeVideoId ? ' • tour added' : ''}
              </div>
            </div>
            <ImageIcon size={16} className="ml-auto text-[#77736A]" />
          </div>
        )}

        <div className="mt-5">
          <div
            className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.18em]"
            style={{ color: MUTED }}
          >
            <span>Edit progress</span>
            <span style={{ color: INK }}>{completion}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/6">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completion}%`,
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellerPropertyEdit({
  property,
  onClose,
  onSuccess,
}) {
  const { currentUser, userProfile } = useAuth();

  const ownerId = property?.ownerId || property?.userId;
  const isOwner = ownerId && currentUser?.uid === ownerId;

  const [data, setData] = useState(() => {
    const p = property || {};
    const houseRules = p.houseRules || {};
    const gate = p.gate || {};
    const availability = p.availability || {};
    const approx = p.approxLocation || {};
    const mgmt = p.management || p.landlordContact || {};

    return cleanUndefined({
      ...initialData,
      ...p,

      listingType: ['sale', 'rent', 'short_stay'].includes(
        String(p.listingType || '').toLowerCase()
      )
        ? String(p.listingType).toLowerCase()
        : ['sale', 'rent', 'short_stay'].includes(
            String(p.status || '').toLowerCase()
          )
          ? String(p.status).toLowerCase()
          : '',

      ...mgmt,
      propertyType: p.propertyType || 'house',
      unitType: p.unitType || 'Entire property',
      rentalModel: p.rentalModel?.length ? p.rentalModel : ['Monthly'],
      propertyName: p.propertyName || p.title || 'Property',
      title: p.title || p.propertyName || 'Property Listing',
      description: p.description || 'Property description',
      genderAccommodation: p.genderAccommodation || 'Mixed',
      suitableFor: p.suitableFor?.length ? p.suitableFor : ['General'],
      rentAmount: p.rentAmount ?? p.price ?? '',
      paymentFrequency: p.paymentFrequency || 'Monthly',
      depositType: p.depositType || "One month's rent",
      totalBedrooms: p.totalBedrooms ?? p.bedrooms ?? '',
      roomAmenities: p.roomAmenities || p.amenities?.room || [],
      propertyAmenities: p.propertyAmenities || p.amenities?.property || [],
      ...houseRules,
      ...gate,
      ...availability,

      managerType:
        p.managerType || mgmt.managerType || 'Landlord',
      managerName:
        p.managerName || mgmt.managerName || '',
      managerPhone:
        p.managerPhone || mgmt.managerPhone || '',
      managerWhatsApp:
        p.managerWhatsApp || mgmt.managerWhatsApp || '',
      managerEmail:
        p.managerEmail || mgmt.managerEmail || '',
      problemHandler:
        p.problemHandler || mgmt.problemHandler || 'Landlord',
      onSitePerson:
        p.onSitePerson || mgmt.onSitePerson || 'Landlord',
      managementAvailability:
        p.managementAvailability ||
        mgmt.managementAvailability ||
        '24/7',
      emergencyContact:
        p.emergencyContact ||
        mgmt.emergencyContact ||
        'Yes',
      responseTime:
        p.responseTime ||
        mgmt.responseTime ||
        'Under 15 minutes',

      county: approx.county || p.county || '',
      town: approx.town || p.town || '',
      estate: approx.estate || p.estate || '',
      nearestRoad: approx.nearestRoad || p.nearestRoad || '',

      images: hydrateImages(p),

      locationData:
        p.locationData ||
        (p.coordinates?.lat != null && p.coordinates?.lng != null
          ? {
              lat: Number(p.coordinates.lat),
              lng: Number(p.coordinates.lng),
              address: p.location || '',
              county: p.county || approx.county || '',
              town: p.town || approx.town || '',
              estate: p.estate || approx.estate || '',
              nearestRoad: p.nearestRoad || approx.nearestRoad || '',
              locationSource:
                p.locationSource || 'search-selection',
              locationAccuracyStatus:
                p.locationAccuracyStatus || 'unknown',
              landmarks: p.landmarks || [],
            }
          : null),
    });
  });

  const [screenIndex, setScreenIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [builtLayer, setBuiltLayer] = useState(0);
  const [revision, setRevision] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [savedState, setSavedState] = useState('saved');
  const [completed, setCompleted] = useState(false);

  const bodyRef = useRef(null);
  const dataRef = useRef(data);
  const lockRef = useRef(false);
  const timerRef = useRef(null);
  const focusTimerRef = useRef(null);

  const flow = useMemo(
    () => filterScreenFlow(data),
    [data.listingType, data.propertyType, data.suitableFor]
  );

  const experiences = useMemo(
    () => groupExperiences(flow),
    [flow]
  );

  const currentScreen =
    flow[Math.min(screenIndex, Math.max(0, flow.length - 1))] ||
    flow[0] ||
    SCREEN_FLOW[0];

  const currentScreenId = currentScreen.id;
  const currentMeta =
    SCREEN_META[currentScreenId] || SCREEN_META.propertyType;

  const rules = useMemo(
    () => buildRules(data),
    [data.listingType, data.propertyType, data.suitableFor]
  );

  const currentExperienceIndex = Math.max(
    0,
    experiences.findIndex((item) => item.id === currentMeta.group)
  );

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const max = Math.max(0, flow.length - 1);
    setScreenIndex((index) => Math.min(index, max));
  }, [flow.length]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(focusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentScreenId === 'review') {
      setBuiltLayer(16);
    }
  }, [currentScreenId]);

  const scrollTop = useCallback(() => {
    bodyRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const goToProblem = useCallback(
    (problem) => {
      if (!problem) return;

      const target = flow.findIndex(
        (screen) => screen.id === problem.screenId
      );

      const targetIndex =
        target >= 0 ? target : Math.min(screenIndex, flow.length - 1);

      clearTimeout(timerRef.current);
      lockRef.current = false;
      setTransitioning(false);
      setValidationError(problem);
      setErrors({
        [problem.field]: problem.message,
      });
      setScreenIndex(Math.max(0, targetIndex));
      scrollTop();

      clearTimeout(focusTimerRef.current);

      focusTimerRef.current = window.setTimeout(() => {
        focusField(problem.field);
      }, 160);

      toast.error(problem.message);
    },
    [flow, screenIndex, scrollTop]
  );

  const update = useCallback(
    (patch) => {
      let nextSnapshot = null;

      setData((previous) => {
        const next =
          typeof patch === 'function'
            ? patch(previous)
            : { ...previous, ...patch };

        if (patch && typeof patch === 'object' && patch.propertyType) {
          const type = patch.propertyType;

          if (
            type === 'single_room' ||
            type === 'bedsitter' ||
            type === 'studio_apartment'
          ) {
            next.totalBedrooms = '1';
            next.bedrooms = '1';
            next.bathrooms = next.bathrooms || '1';
          }

          if (LAND_LIKE.has(type)) {
            next.totalBedrooms = '';
            next.bedrooms = '';
            next.bathrooms = '';
            next.occupancy = '';
            next.occupancyCount = '';
            next.occupancyCustom = '';
            next.sharingAllowed = '';
          }

          if (type === 'urbannest') {
            next.listingType = 'short_stay';
            next.paymentFrequency = next.paymentFrequency || 'Daily';
          }
        }

        if (
          patch &&
          typeof patch === 'object' &&
          patch.occupancy !== undefined &&
          occupancyNumber(patch.occupancy) <= 1
        ) {
          next.sharingAllowed = '';
        }

        dataRef.current = next;
        nextSnapshot = next;
        setSavedState('unsaved');

        return next;
      });

      setValidationError(null);
      setErrors({});

      if (
        currentScreenId === 'propertyType' &&
        patch &&
        typeof patch === 'object' &&
        patch.propertyType
      ) {
        setBuiltLayer(1);
        setRevision((value) => value + 1);

        if (!lockRef.current) {
          lockRef.current = true;
          setTransitioning(true);

          clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(() => {
            const nextIndex = Math.min(
              screenIndex + 1,
              flow.length - 1
            );

            setBuiltLayer((value) =>
              Math.max(value, SCREEN_META.propertyType.layer)
            );
            setRevision((value) => value + 1);
            setScreenIndex(nextIndex);
            scrollTop();
            lockRef.current = false;
            setTransitioning(false);
          }, 760);
        }

        return;
      }

      const patchKeys =
        patch && typeof patch === 'object'
          ? Object.keys(patch)
          : [];

      const shouldAutoAdvance =
        patchKeys.length > 0 &&
        patchKeys.some((key) => AUTO_ADVANCE_KEYS.has(key)) &&
        (
          currentScreenId === 'propertyType' ||
          currentScreenId === 'unitRoom' ||
          currentScreenId === 'roomOccupancy' ||
          currentScreenId === 'rentCosts' ||
          currentScreenId === 'waterUtilities' ||
          currentScreenId === 'internetGarbage' ||
          currentScreenId === 'management' ||
          currentScreenId === 'security' ||
          currentScreenId === 'gateHouseRules'
        ) &&
        screenCompleted(nextSnapshot || dataRef.current, currentScreenId);

      if (shouldAutoAdvance && !lockRef.current) {
        lockRef.current = true;
        setTransitioning(true);

        clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          const nextIndex = Math.min(
            screenIndex + 1,
            flow.length - 1
          );

          setBuiltLayer((value) =>
            Math.max(value, currentMeta.layer)
          );
          setRevision((value) => value + 1);
          setScreenIndex(nextIndex);
          scrollTop();
          lockRef.current = false;
          setTransitioning(false);
        }, 420);
      }
    },
    [
      currentMeta.layer,
      currentScreenId,
      flow.length,
      screenIndex,
      scrollTop,
    ]
  );

  const goNext = useCallback(() => {
    if (lockRef.current || currentScreenId === 'review') return;

    const stepErrors = validateStep(
      currentScreenId,
      dataRef.current,
      rules
    );

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);

      const firstField = Object.keys(stepErrors)[0];
      const problem = {
        field: firstField,
        label:
          firstField === 'price'
            ? 'Price'
            : firstField === 'location'
              ? 'Property location'
              : firstField === 'occupancy'
                ? rules.shortStay
                  ? 'Guest capacity'
                  : 'Occupancy'
                : firstField === 'images'
                  ? 'Property photos'
                  : firstField,
        screenId: currentScreenId,
        message: stepErrors[firstField],
      };

      goToProblem(problem);
      return;
    }

    lockRef.current = true;
    setTransitioning(true);

    const nextIndex = Math.min(
      screenIndex + 1,
      flow.length - 1
    );
    const nextScreen = flow[nextIndex];

    setBuiltLayer((value) =>
      Math.max(
        value,
        nextScreen?.id === 'review'
          ? 16
          : currentMeta.layer
      )
    );
    setRevision((value) => value + 1);
    setScreenIndex(nextIndex);
    scrollTop();

    window.setTimeout(() => {
      lockRef.current = false;
      setTransitioning(false);
    }, 420);
  }, [
    currentMeta.layer,
    currentScreenId,
    flow,
    goToProblem,
    rules,
    screenIndex,
    scrollTop,
  ]);

  const goBack = useCallback(() => {
    clearTimeout(timerRef.current);
    lockRef.current = false;
    setTransitioning(false);
    setValidationError(null);
    setErrors({});

    setScreenIndex((index) => Math.max(0, index - 1));
    scrollTop();
  }, [scrollTop]);

  const jumpTo = useCallback(
    (experienceIndex) => {
      clearTimeout(timerRef.current);
      lockRef.current = false;
      setTransitioning(false);
      setValidationError(null);
      setErrors({});

      const experience = experiences[experienceIndex];
      if (!experience) return;

      const targetIndex = flow.findIndex(
        (screen) => SCREEN_META[screen.id]?.group === experience.id
      );

      if (targetIndex < 0) return;

      setScreenIndex(targetIndex);
      scrollTop();
    },
    [experiences, flow, scrollTop]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!submitting) onClose?.();
        return;
      }

      if (event.key !== 'Enter') return;
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;

      if (!(target instanceof HTMLElement)) return;
      if (
        target.closest(
          'button,[role="button"],textarea,[contenteditable="true"]'
        )
      ) {
        return;
      }
      if (!target.matches('input,select')) return;

      event.preventDefault();
      goNext();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [goNext, onClose, submitting]);

  const completion = useMemo(() => {
    const completedScreens = flow.filter((screen) =>
      screenCompleted(data, screen.id)
    ).length;

    return Math.round(
      (completedScreens / Math.max(1, flow.length)) * 100
    );
  }, [data, flow]);

  const submit = async () => {
    const firstProblem = firstMissingRequired(dataRef.current, rules);

    if (firstProblem) {
      goToProblem(firstProblem);
      return;
    }

    if (!currentUser || !isOwner) {
      toast.error('You can only edit your own listings.');
      return;
    }

    setSubmitting(true);

    try {
      const pid = property?.propertyId || property?.id;
      if (!pid) {
        throw new Error('Property ID is missing');
      }

      const normalizedImages = normalizeImageEntries(
        dataRef.current.images || []
      );

      const hasPendingUploads = normalizedImages.some((image) => {
        const url =
          image?.localPreviewUrl ||
          image?.remoteUrl ||
          image?.url ||
          '';

        const blobPreview =
          typeof url === 'string' && url.startsWith('blob:');

        return (
          (image?.status === 'previewing' ||
            image?.status === 'uploading') &&
          !blobPreview
        );
      });

      if (hasPendingUploads) {
        toast.error(
          'Please wait for the image uploads to finish before saving the listing.'
        );
        setSubmitting(false);
        return;
      }

      const uploadedImages = normalizedImages
        .filter((image) => {
          const url =
            image?.remoteUrl ||
            image?.url ||
            image?.localPreviewUrl ||
            image?.file ||
            '';
          return Boolean(url);
        })
        .map((image) => {
          const url =
            image.remoteUrl ||
            image.url ||
            image.localPreviewUrl ||
            '';

          const cleanUrl =
            typeof url === 'string' && url.startsWith('blob:')
              ? ''
              : url;

          return {
            url: cleanUrl,
            key: image.r2Key || image.key || null,
            category: image.category || 'other',
          };
        })
        .filter(
          (image) =>
            image.url &&
            !String(image.url).startsWith('blob:')
        );

      const publicMedia = uploadedImages.map((image) => image.url);

      const snap = await getDoc(
        doc(db, 'properties', pid)
      );

      const existing = snap.exists()
        ? snap.data()
        : {};

      const current = dataRef.current;

      const updatePayload = cleanUndefined({
        ...existing,
        propertyId: pid,
        propertyType: current.propertyType,
        unitType: current.unitType,
        roomType: current.roomType,
        rentalModel: current.rentalModel,
        occupancy: current.occupancy,
        title: current.title,
        propertyName: current.propertyName,
        description: current.description,
        campus: current.campus,
        institutionName: current.institutionName,
        institutionType: current.institutionType,
        studentHousingClassification:
          current.studentHousingClassification,

        // Preserve the existing edit payload mapping.
        rentAmount: Number(current.rentAmount) || 0,
        price: Number(current.rentAmount) || 0,
        paymentFrequency: current.paymentFrequency,
        depositType: current.depositType,
        depositAmount:
          current.depositType === "One month's rent"
            ? Number(current.rentAmount) || 0
            : Number(current.depositAmount || 0),
        depositRefundable: current.depositRefundable,
        recurringCharges: current.recurringCharges || [],
        oneTimeFees: current.oneTimeFees || [],

        waterIncluded: current.waterIncluded,
        waterSource: current.waterSource,
        waterReliability: current.waterReliability,
        waterStorage: current.waterStorage,
        hotWater: current.hotWater,

        electricityType: current.electricityType,
        electricityIncluded: current.electricityIncluded,
        internetOption: current.internetOption,
        internetProvider: current.internetProvider,

        garbageCollection: current.garbageCollection,
        commonCleaning: current.commonCleaning,
        laundryCleaning: current.laundryCleaning,

        roadType: current.roadType,
        roadCondition: current.roadCondition,
        distanceToCampus: current.distanceToCampus,
        distanceToMainRoad: current.distanceToMainRoad,
        walkingTimeToCampus: current.walkingTimeToCampus,
        walkingTimeToMainRoad: current.walkingTimeToMainRoad,
        nearestStage: current.nearestStage,
        distanceToStage: current.distanceToStage,
        walkingTimeToStage: current.walkingTimeToStage,
        fareToCampus: current.fareToCampus,
        fareToCBD: current.fareToCBD,
        transportOptions: current.transportOptions,
        streetLighting: current.streetLighting,
        floodingHistory: current.floodingHistory,

        amenities: {
          room: current.roomAmenities || [],
          property: current.propertyAmenities || [],
        },
        roomAmenities: current.roomAmenities || [],
        propertyAmenities: current.propertyAmenities || [],

        securityFeatures: current.securityFeatures || {},

        managerType: current.managerType,
        managerName: current.managerName,
        managerPhone: current.managerPhone,
        managerWhatsApp: current.managerWhatsApp,
        managerEmail: current.managerEmail,
        problemHandler: current.problemHandler,
        onSitePerson: current.onSitePerson,
        managementAvailability: current.managementAvailability,
        emergencyContact: current.emergencyContact,
        responseTime: current.responseTime,

        management: {
          managerType: current.managerType,
          managerName: current.managerName,
          managerPhone: current.managerPhone,
          managerWhatsApp: current.managerWhatsApp,
          managerEmail: current.managerEmail,
          problemHandler: current.problemHandler,
          onSitePerson: current.onSitePerson,
          managementAvailability: current.managementAvailability,
          emergencyContact: current.emergencyContact,
          responseTime: current.responseTime,
        },

        houseRules: {
          parties: current.parties,
          musicPolicy: current.musicPolicy,
          quietHoursFrom: current.quietHoursFrom,
          quietHoursTo: current.quietHoursTo,
          gatherings: current.gatherings,
          smoking: current.smoking,
          alcohol: current.alcohol,
          pets: current.pets,
          laundryHours: current.laundryHours,
          kitchenHours: current.kitchenHours,
          visitorPolicy: current.visitorPolicy,
          overnightVisitors: current.overnightVisitors,
          curfew: current.curfew,
          curfewTime: current.curfewTime,
        },

        gate: {
          hasGate: current.hasGate,
          gateLocked: current.gateLocked,
          gateClosingTime: current.gateClosingTime,
          gateOpeningTime: current.gateOpeningTime,
          afterHoursAccess: current.afterHoursAccess,
        },

        approxLocation: {
          county: current.county,
          town: current.town,
          estate: current.estate,
          nearestRoad: current.nearestRoad,
        },

        location: current.location,
        coordinates: current.coordinates,

        publicMedia,
        coverImage: publicMedia[0] || '',
        media: uploadedImages,
        nearbyPlaces: current.nearbyPlaces,

        availability: {
          currentOccupancy: current.currentOccupancy,
          availabilityDate: current.availabilityDate,
          availableUnits: current.availableUnits,
          totalUnits: current.totalUnits,
        },

        bedrooms: Number(current.totalBedrooms) || 0,
        bathrooms: Number(current.bathrooms) || 0,
        area: 0,

        images: publicMedia,

        listingType:
          current.listingType ||
          property.listingType ||
          '',

        status: 'active',
        approvalStatus: 'pending',
        previousApprovalStatus:
          existing.approvalStatus ||
          property.approvalStatus,
        verificationStatus: 'pending',

        userId:
          property.userId ||
          currentUser.uid,

        ownerId:
          property.ownerId ||
          currentUser.uid,

        userEmail:
          property.userEmail ||
          currentUser.email,

        userName:
          property.userName ||
          userProfile?.name ||
          currentUser.displayName ||
          '',

        userType: 'seller',
        updatedAt: serverTimestamp(),

        youtubeVideoId:
          current.youtubeVideoId ||
          '',
      });

      const protectedData = cleanUndefined({
        propertyId: pid,
        ownerId:
          property.ownerId ||
          currentUser.uid,
        userId:
          property.userId ||
          currentUser.uid,

        exactLocation: current.coordinates,

        landlordContact: {
          managerType: current.managerType,
          managerName: current.managerName,
          managerPhone: current.managerPhone,
          managerWhatsApp: current.managerWhatsApp,
          managerEmail: current.managerEmail,
          problemHandler: current.problemHandler,
          onSitePerson: current.onSitePerson,
          managementAvailability:
            current.managementAvailability,
          emergencyContact:
            current.emergencyContact,
          responseTime: current.responseTime,
        },

        updatedAt: serverTimestamp(),
      });

      await updateDoc(
        doc(db, 'properties', pid),
        updatePayload
      );

      await updateDoc(
        doc(db, 'properties_protected', pid),
        protectedData
      ).catch(() => {});

      setBuiltLayer(16);
      setRevision((value) => value + 1);
      setCompleted(true);
      setSavedState('saved');

      toast.success(
        'Property updated successfully and sent for admin review.'
      );

      onSuccess?.({ propertyId: pid });
    } catch (error) {
      console.error(
        'Error updating property:',
        error
      );
      toast.error(
        error.message ||
        'Failed to update property.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const CurrentComponent = currentScreen.Component;

  const CurrentIcon =
    currentScreenId === 'propertyType'
      ? (LAND_LIKE.has(data.propertyType)
          ? LandPlot
          : Home)
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

  const renderCurrentScreen = () => (
    <CurrentComponent
      data={data}
      update={update}
      onNext={goNext}
      onContinue={goNext}
      errors={errors}
      listingType={data.listingType}
      propertyType={data.propertyType}
      hospitalityMode={rules.shortStay}
      studentMode={rules.student}
      isLand={rules.land}
      editing
    />
  );

  if (!isOwner) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
        <div className="w-full max-w-md rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,.18)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <X size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111214]">
                Not allowed
              </h2>
              <p className="mt-1 text-xs text-[#77736A]">
                You can only edit your own listings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-2xl bg-[#0C0D0F] py-3 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <>
      <style>{CSS}</style>

      <div className="mmx-edit-shell fixed inset-0 z-[100] bg-[#090A0B] p-1.5 sm:p-4">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] sm:rounded-[30px] border border-white/10 bg-[#F4F1E9] shadow-[0_40px_120px_rgba(0,0,0,.55)]">

          <header className="shrink-0 border-b border-white/8 bg-[#0D0E10] text-white">
            <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[.05] sm:flex">
                  <Home
                    size={19}
                    strokeWidth={1.5}
                    color={GOLD}
                  />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold tracking-tight sm:text-base">
                    Edit your property
                  </div>

                  <div className="mt-0.5 truncate text-[9px] uppercase tracking-[.17em] text-white/40 sm:text-[10px]">
                    {currentExperienceIndex + 1} of {experiences.length}
                    {' · '}
                    {currentMeta.label}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div
                  className={`hidden rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:block ${
                    savedState === 'unsaved'
                      ? 'border-[#C8A96B]/30 text-[#C8A96B]'
                      : 'border-white/10 text-white/45'
                  }`}
                >
                  {savedState === 'unsaved'
                    ? 'Changes pending'
                    : 'Ready'}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  aria-label="Close property editor"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[.05] text-white/70 hover:bg-white/[.09] disabled:opacity-50"
                >
                  <X
                    size={17}
                    strokeWidth={1.7}
                  />
                </button>
              </div>
            </div>
          </header>

          <div className="shrink-0 border-b border-black/7 bg-white px-3 py-2 sm:px-6">
            <WizardProgress
              steps={experiences}
              currentIndex={currentExperienceIndex}
              currentStepIndex={currentExperienceIndex}
              onJump={jumpTo}
              onSelectStep={jumpTo}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">

            {/* Mobile permanent construction hero. */}
            <section className="sticky top-0 z-25 shrink-0 border-b border-black/8 bg-[#F4F1E9]/96 px-2.5 pb-2.5 pt-2.5 backdrop-blur-xl lg:hidden">
              <div className="mx-auto max-w-3xl">
                <div
                  key={`${currentScreenId}-${revision}`}
                  className="mmx-mobile-transition relative h-[178px] overflow-hidden rounded-[22px] border border-black/10 bg-[#0D0F10] shadow-[0_15px_40px_rgba(0,0,0,.10)]"
                >
                  <ConstructionScene
                    data={data}
                    builtLayer={builtLayer}
                    currentScreenId={currentScreenId}
                    revision={revision}
                    compact
                  />

                  <div className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-white/70 backdrop-blur-md">
                    Live edit
                  </div>

                  <div className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[9px] font-semibold text-white/70 backdrop-blur-md">
                    {Math.min(
                      100,
                      Math.round((builtLayer / 16) * 100)
                    )}% built
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between px-1 text-[9px] uppercase tracking-[.14em] text-[#8D8A83]">
                  <span>{currentMeta.label}</span>
                  <span style={{ color: INK }}>
                    {GROUP_LABELS[currentMeta.group]}
                  </span>
                </div>
              </div>
            </section>

            <section
              ref={bodyRef}
              className="min-w-0 flex-1 overflow-y-auto bg-[#F4F1E9] p-3 sm:p-6 lg:p-8"
            >
              <div className="mx-auto max-w-3xl">

                {validationError && (
                  <div
                    className="mmx-alert mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                        <X size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-[.15em] text-red-700">
                          Complete this field
                        </div>

                        <div className="mt-1 text-sm font-semibold text-red-950">
                          {validationError.label}
                        </div>

                        <div className="mt-0.5 text-xs text-red-800/80">
                          {validationError.message}
                        </div>

                        <button
                          type="button"
                          onClick={() => focusField(validationError.field)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-semibold text-red-800"
                        >
                          Go to field
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {Object.keys(errors).length > 0 && !validationError && (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                    {Object.values(errors).map((error, index) => (
                      <div key={`${error}-${index}`}>
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white"
                      style={{ color: INK }}
                    >
                      <CurrentIcon
                        size={18}
                        strokeWidth={1.7}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#111214]">
                        {currentMeta.label}
                      </div>
                      <div className="mt-0.5 truncate text-[9px] uppercase tracking-[.17em] text-[#99958D]">
                        {GROUP_LABELS[currentMeta.group]}
                      </div>
                    </div>
                  </div>

                  <div className="hidden text-[10px] font-medium text-[#99958D] sm:block">
                    {screenIndex + 1} / {flow.length}
                  </div>
                </div>

                <div
                  key={`${currentScreenId}-${screenIndex}`}
                  className={`rounded-[24px] border border-black/7 bg-white p-4 shadow-[0_18px_55px_rgba(0,0,0,.06)] sm:rounded-[28px] sm:p-7 ${
                    transitioning ? 'opacity-90' : ''
                  }`}
                >
                  <div className="mmx-screen-enter">
                    {renderCurrentScreen()}
                  </div>
                </div>
              </div>
            </section>

            {/* Desktop permanent preview */}
            <aside className="hidden w-[430px] shrink-0 overflow-y-auto border-l border-black/8 bg-[#EDE9E0] p-6 lg:block xl:w-[470px]">
              <div className="sticky top-0">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[.24em] text-[#9B958A]">
                      Live property
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#121316]">
                      See the changes as you edit
                    </div>
                  </div>

                  <div className="rounded-full border border-black/8 bg-white px-3 py-1.5 text-[10px] font-semibold text-[#46464B]">
                    {Math.min(
                      100,
                      Math.round((builtLayer / 16) * 100)
                    )}% built
                  </div>
                </div>

                <PreviewPanel
                  data={data}
                  builtLayer={builtLayer}
                  currentScreenId={currentScreenId}
                  completion={completion}
                  revision={revision}
                />
              </div>
            </aside>
          </div>

          <footer className="shrink-0 border-t border-black/8 bg-white px-3 py-2.5 sm:px-6 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={screenIndex === 0 || submitting || completed}
                className="inline-flex items-center gap-2 rounded-xl border border-black/8 bg-white px-3.5 py-2.5 text-[10px] font-semibold text-[#55555B] hover:bg-[#F7F6F2] disabled:opacity-35 sm:px-4 sm:text-[11px]"
              >
                <ChevronLeft size={15} />
                Back
              </button>

              <div className="flex items-center gap-2">
                {!completed && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="hidden items-center gap-2 rounded-xl border border-black/8 bg-white px-4 py-2.5 text-[11px] font-semibold text-[#55555B] hover:bg-[#F7F6F2] disabled:opacity-50 sm:inline-flex"
                    >
                      Close
                    </button>

                    {currentScreenId !== 'review' ? (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={submitting || transitioning}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0C0D0F] px-4 py-2.5 text-[10px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,.16)] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50 sm:px-5 sm:text-[11px]"
                      >
                        Save & continue
                        <ChevronRight
                          size={15}
                          color={GOLD}
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void submit()}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0C0D0F] px-4 py-2.5 text-[10px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,.16)] disabled:opacity-50 sm:px-5 sm:text-[11px]"
                      >
                        {submitting && (
                          <Loader
                            size={14}
                            className="animate-spin"
                          />
                        )}
                        Update property
                        <ArrowRight
                          size={15}
                          color={GOLD}
                        />
                      </button>
                    )}
                  </>
                )}

                {completed && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0C0D0F] px-5 py-2.5 text-[10px] font-semibold text-white sm:text-[11px]"
                  >
                    Done
                    <ArrowRight
                      size={15}
                      color={GOLD}
                    />
                  </button>
                )}
              </div>
            </div>
          </footer>

          {completed && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
              <div className="mmx-success w-full max-w-md rounded-[30px] border border-white/10 bg-[#0D0E10] p-7 text-center text-white shadow-[0_40px_120px_rgba(0,0,0,.55)]">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border"
                  style={{
                    borderColor: `${GOLD}55`,
                    background: `${GOLD}15`,
                    color: GOLD,
                  }}
                >
                  <CheckCircle2
                    size={31}
                    strokeWidth={1.6}
                  />
                </div>

                <div
                  className="mt-5 text-[11px] font-bold uppercase tracking-[.25em]"
                  style={{ color: GOLD }}
                >
                  Update complete
                </div>

                <h3 className="mt-2 text-2xl font-semibold">
                  Your property has been updated
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">
                  The updated listing has been saved and sent for admin review.
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0B0B0D]"
                >
                  Close editor
                  <ArrowRight size={16} />
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

