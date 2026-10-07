// src/pages/ExplorePage.jsx - MARKETMIX DISCOVERY & ROOMMATES
// Adopts Transport page theme and Transport location search logic (KenyaAreaPicker)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, BedDouble, CheckCircle2, CircleUserRound,
  Compass, Crosshair, Heart, Home, LoaderCircle, MapPin,
  MessageCircle, MoreHorizontal, Search, Share2, ShieldCheck,
  SlidersHorizontal, Truck, Users, X,
} from 'lucide-react';
import {
  addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc,
  updateDoc, where, writeBatch,
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation } from '../services/locationService';
import { savePropertyForUser } from '../services/propertyService';
import { getPublicPropertyLocation, resolvePropertyImage } from '../utils/propertyMapping';
import { getListingType } from '../utils/listingType';
import { formatKenyaArea } from '../utils/kenyaLocationOptions';
import KenyaAreaPicker from '../components/moving/KenyaAreaPicker';
import '../components/moving/LiquidGlass.css';

const TABS = [
  { id: 'properties', label: 'Properties', icon: Home },
  { id: 'roommates', label: 'Roommates', icon: Users },
];

const LIFESTYLE_OPTIONS = ['Quiet home', 'Social', 'Study-friendly', 'Work from home', 'Neat shared spaces', 'Early riser'];
const PROPERTY_TYPES = ['Any type', 'Bedsitter', 'Studio', '1 bedroom', '2 bedrooms', '3+ bedrooms'];

// ---- Liquid Glass style tokens (shared, purely presentational) ----
const GLASS_INPUT =
  'rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white shadow-[0_6px_20px_-8px_rgba(2,6,23,0.55)] backdrop-blur-2xl backdrop-saturate-150 outline-none placeholder:text-slate-300 transition focus:border-emerald-300/70 focus:ring-2 focus:ring-emerald-400/50';
const GLASS_PANEL =
  'relative overflow-hidden rounded-2xl border border-white/25 bg-white/10 shadow-[0_18px_60px_-18px_rgba(2,6,23,0.65)] backdrop-blur-2xl backdrop-saturate-150';
// Shared glass surface used by the search input, the inline filter pills, and the Location Search button —
// so they all render as one consistent family of pills. The glass effect lives ONLY on this wrapper.
const GLASS_CONTROL =
  'rounded-full border border-white/25 bg-transparent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(2,6,23,0.6)] backdrop-blur-2xl backdrop-saturate-150 transition hover:bg-white/10';
// Bare text-input styling — pairs with the <style> block below, which forces every visual layer off.
const BARE_FIELD =
  'w-full min-w-0 appearance-none border-0 bg-transparent p-0 text-sm font-semibold text-white outline-none shadow-none ring-0 placeholder:text-slate-300 focus:border-0 focus:bg-transparent focus:outline-none focus:ring-0 focus:shadow-none';
// Inline overrides applied to text inputs — belt-and-braces against any global CSS or UA chrome.
const BARE_FIELD_STYLE = {
  background: 'transparent',
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  boxShadow: 'none',
  border: 'none',
  outline: 'none',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
};

const propertyPrice = (property) => Number(property?.price ?? 0);
const propertyStatus = getListingType;
const formatMoney = (amount) => `KSh ${Number(amount || 0).toLocaleString()}`;
const formatMoveDate = (value) => {
  if (!value) return 'Flexible move date';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};
const timestampValue = (value) => value?.toMillis?.() || 0;

const matchScore = (profile, candidate) => {
  let score = 0;
  let weight = 0;
  const areaA = (profile.preferredArea || '').trim().toLowerCase();
  const areaB = (candidate.preferredArea || '').trim().toLowerCase();
  const same = (a, b) => Boolean(a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase());
  weight += 50;
  if (same(profile.ward, candidate.ward)) score += 50;
  else if (same(profile.subCounty, candidate.subCounty)) score += 42;
  else if (same(profile.county, candidate.county)) score += 28;
  else if (areaA && areaB && (areaA === areaB || areaA.includes(areaB) || areaB.includes(areaA))) score += 24;
  weight += 30;
  const low = Math.max(Number(profile.budgetMin) || 0, Number(candidate.budgetMin) || 0);
  const high = Math.min(Number(profile.budgetMax) || 0, Number(candidate.budgetMax) || 0);
  if (high >= low && high > 0) score += 30;
  weight += 15;
  if (profile.moveInDate && candidate.moveInDate) {
    const delta = Math.abs(new Date(profile.moveInDate) - new Date(candidate.moveInDate)) / 86400000;
    if (delta <= 30) score += 15;
    else if (delta <= 90) score += 8;
  } else {
    score += 8;
  }
  weight += 5;
  if (!profile.propertyType || !candidate.propertyType || profile.propertyType === candidate.propertyType) score += 5;
  weight += 5;
  const seekingA = profile.seekingType || 'either';
  const seekingB = candidate.seekingType || 'either';
  if (seekingA === 'either' || seekingB === 'either' || seekingA !== seekingB) score += 5;
  return weight ? Math.round((score / weight) * 100) : 0;
};

const ExplorePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(location.pathname === '/roommates' ? 'roommates' : TABS.some((tab) => tab.id === searchParams.get('tab')) ? searchParams.get('tab') : 'properties');
  const [allProperties, setAllProperties] = useState([]);
  const [roommateProfiles, setRoommateProfiles] = useState([]);
  const [ownProfile, setOwnProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingRoommates, setLoadingRoommates] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [findingNearby, setFindingNearby] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [nearbyCenter, setNearbyCenter] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('rent');
  const [moreFilters, setMoreFilters] = useState(false);
  const [bedroomFilter, setBedroomFilter] = useState('');
  
  // Transport location search logic state
  const [exploreLocationFilter, setExploreLocationFilter] = useState({ county: '', subCounty: '', ward: '', area: '' });

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '', preferredArea: '', county: '', subCounty: '', ward: '', budgetMin: '', budgetMax: '', moveInDate: '',
    propertyType: '', lifestyle: [], smoking: 'No preference', pets: 'No preference',
    furnished: 'Either', workStudy: 'Prefer not to say', roommateCount: '1', seekingType: 'either',
  });
  const [actionProperty, setActionProperty] = useState(null);
  const [profileToView, setProfileToView] = useState(null);
  const [reportProperty, setReportProperty] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [combinedBudget, setCombinedBudget] = useState(null);

  const setTab = (tab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    next.delete('createProfile');
    if (tab === 'roommates') navigate(`/roommates?${next.toString()}`, { replace: true });
    else if (location.pathname === '/roommates') navigate(`/explore?${next.toString()}`, { replace: true });
    else setSearchParams(next, { replace: true });
  };

  const propertyContext = useMemo(() => {
    const list = allProperties.filter((p) => p.county || p.subCounty || p.ward);
    return list[0] || {};
  }, [allProperties]);

  const distanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const loadProperties = async () => {
    setLoadingProperties(true);
    try {
      const snap = await getDocs(collection(db, 'properties'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllProperties(list);
    } catch (error) {
      console.error('Could not load properties:', error);
      toast.error('Could not load listings.');
    } finally {
      setLoadingProperties(false);
    }
  };

  const loadRoommates = async () => {
    setLoadingRoommates(true);
    try {
      const snap = await getDocs(collection(db, 'roommateProfiles'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.active !== false);
      setRoommateProfiles(list);
      if (currentUser?.uid) {
        const linkSnap = await getDoc(doc(db, 'roommateProfileLinks', currentUser.uid));
        if (linkSnap.exists()) {
          const profileId = linkSnap.data().profileId;
          const found = list.find((p) => p.id === profileId);
          if (found) {
            setOwnProfile(found);
            setProfileForm({
              displayName: found.displayName || '',
              preferredArea: found.preferredArea || '',
              county: found.county || '',
              subCounty: found.subCounty || '',
              ward: found.ward || '',
              budgetMin: found.budgetMin != null ? String(found.budgetMin) : '',
              budgetMax: found.budgetMax != null ? String(found.budgetMax) : '',
              moveInDate: found.moveInDate || '',
              propertyType: found.propertyType || '',
              lifestyle: found.lifestyle || [],
              smoking: found.smoking || 'No preference',
              pets: found.pets || 'No preference',
              furnished: found.furnished || 'Either',
              workStudy: found.workStudy || 'Prefer not to say',
              roommateCount: found.roommateCount != null ? String(found.roommateCount) : '1',
              seekingType: found.seekingType || 'either',
            });
          }
        }
      }
    } catch (error) {
      console.error('Could not load roommate profiles:', error);
    } finally {
      setLoadingRoommates(false);
    }
  };

  const loadConnections = async () => {
    if (!currentUser?.uid) return;
    try {
      const q = query(collection(db, 'roommateConnections'), where('fromUserId', '==', currentUser.uid));
      const q2 = query(collection(db, 'roommateConnections'), where('targetProfileId', '==', ownProfile?.id || 'none'));
      const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
      const map = new Map();
      [...snap1.docs, ...snap2.docs].forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
      setConnections(Array.from(map.values()));
    } catch (error) {
      console.error('Could not load roommate connections:', error);
    }
  };

  useEffect(() => {
    loadProperties();
    loadRoommates();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (ownProfile?.id) loadConnections();
  }, [ownProfile?.id]);

  useEffect(() => {
    setProfileForm((current) => ({
      ...current,
      county: current.county || propertyContext.county || '',
      subCounty: current.subCounty || propertyContext.subCounty || propertyContext.constituency || '',
      ward: current.ward || propertyContext.ward || '',
    }));
  }, [propertyContext]);

  useEffect(() => {
    if (searchParams.get('createProfile') === '1') {
      setTab('roommates');
      if (currentUser) setProfileOpen(true);
    }
  }, [searchParams, currentUser?.uid]);

  const properties = useMemo(() => {
    const terms = [searchTerm, areaFilter].map((value) => value.trim().toLowerCase()).filter(Boolean);
    return allProperties.filter((property) => {
      const location = getPublicPropertyLocation(property);
      const text = `${property.title || ''} ${property.propertyType || ''} ${property.unitType || ''} ${location} ${property.county || ''} ${property.subCounty || ''} ${property.ward || ''} ${property.estate || ''} ${property.town || ''}`.toLowerCase();
      const status = propertyStatus(property);
      const propertyKind = (property.propertyType || property.unitType || '').toLowerCase();
      const budget = Number(maxBudget);
      const price = propertyPrice(property);
      const bedrooms = Number(property.bedrooms || 0);

      if (terms.some((term) => !text.includes(term))) return false;
      if (statusFilter && status && !status.includes(statusFilter)) return false;
      if (typeFilter && !propertyKind.includes(typeFilter.toLowerCase())) return false;
      if (Number.isFinite(budget) && budget > 0 && price > budget) return false;
      if (bedroomFilter && bedrooms < Number(bedroomFilter)) return false;

      // Transport location filtering logic (County, Sub-county, Ward, Area)
      if (exploreLocationFilter.county && property.county && property.county.toLowerCase() !== exploreLocationFilter.county.toLowerCase()) return false;
      if (exploreLocationFilter.subCounty && (property.subCounty || property.constituency) && !(property.subCounty || property.constituency || '').toLowerCase().includes(exploreLocationFilter.subCounty.toLowerCase())) return false;
      if (exploreLocationFilter.ward && property.ward && !property.ward.toLowerCase().includes(exploreLocationFilter.ward.toLowerCase())) return false;
      if (exploreLocationFilter.area) {
        const areaTerm = exploreLocationFilter.area.toLowerCase();
        const propAreaText = `${property.location || ''} ${property.estate || ''} ${property.town || ''} ${property.landmark || ''}`.toLowerCase();
        if (!propAreaText.includes(areaTerm)) return false;
      }

      if (nearbyOnly && nearbyCenter) {
        const point = property.coordinates;
        if (point?.lat == null || point?.lng == null) return false;
        const distance = distanceKm(nearbyCenter.lat, nearbyCenter.lng, Number(point.lat), Number(point.lng));
        if (distance > radiusKm) return false;
      }
      return true;
    }).map((property) => {
      const point = property.coordinates;
      return nearbyOnly && nearbyCenter && point?.lat != null && point?.lng != null
        ? { ...property, exploreDistance: distanceKm(nearbyCenter.lat, nearbyCenter.lng, Number(point.lat), Number(point.lng)) }
        : property;
    });
  }, [allProperties, searchTerm, areaFilter, maxBudget, typeFilter, statusFilter, bedroomFilter, exploreLocationFilter, nearbyOnly, nearbyCenter, radiusKm]);

  const visibleRoommates = useMemo(() => roommateProfiles.filter((profile) => {
    if (ownProfile?.id && profile.id === ownProfile.id) return false;
    const terms = [searchTerm, areaFilter].map((value) => value.trim().toLowerCase()).filter(Boolean);
    const searchable = `${profile.displayName || ''} ${profile.preferredArea || ''} ${profile.ward || ''} ${profile.subCounty || ''} ${profile.county || ''} ${(profile.lifestyle || []).join(' ')}`.toLowerCase();
    const budget = Number(maxBudget);
    return terms.every((term) => searchable.includes(term)) && (!Number.isFinite(budget) || budget <= 0 || Number(profile.budgetMax) <= budget);
  }), [roommateProfiles, ownProfile?.id, searchTerm, areaFilter, maxBudget]);

  const saveRoommateProfile = async (event) => {
    event.preventDefault();
    if (!currentUser?.uid) {
      navigate('/login', { state: { from: '/roommates?createProfile=1' } });
      return;
    }
    const min = Number(profileForm.budgetMin);
    const max = Number(profileForm.budgetMax);
    if (!profileForm.displayName.trim() || !profileForm.county || (!profileForm.preferredArea.trim() && !profileForm.subCounty && !profileForm.ward) || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min || max > 10000000) {
      toast.error('Enter a display name, choose a county and local area, and add a valid monthly budget range.');
      return;
    }
    const profileData = {
      displayName: profileForm.displayName.trim().slice(0, 40),
      preferredArea: (profileForm.preferredArea.trim() || profileForm.ward || profileForm.subCounty).slice(0, 120),
      county: profileForm.county,
      subCounty: profileForm.subCounty,
      ward: profileForm.ward,
      budgetMin: min,
      budgetMax: max,
      moveInDate: profileForm.moveInDate,
      propertyType: profileForm.propertyType,
      lifestyle: profileForm.lifestyle.slice(0, 6),
      smoking: profileForm.smoking,
      pets: profileForm.pets,
      furnished: profileForm.furnished,
      workStudy: profileForm.workStudy,
      roommateCount: Math.min(10, Math.max(1, Number(profileForm.roommateCount) || 1)),
      seekingType: profileForm.seekingType,
      active: true,
      updatedAt: serverTimestamp(),
    };
    setSavingProfile(true);
    try {
      if (ownProfile?.id) {
        await updateDoc(doc(db, 'roommateProfiles', ownProfile.id), profileData);
      } else {
        const profileRef = doc(collection(db, 'roommateProfiles'));
        const batch = writeBatch(db);
        batch.set(doc(db, 'roommateProfileOwners', profileRef.id), {
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
        batch.set(doc(db, 'roommateProfileLinks', currentUser.uid), {
          profileId: profileRef.id,
          createdAt: serverTimestamp(),
        });
        batch.set(profileRef, { ...profileData, createdAt: serverTimestamp() });
        await batch.commit();
      }
      toast.success('Your roommate profile is live.');
      setProfileOpen(false);
      await loadRoommates();
    } catch (error) {
      console.error('Could not save roommate profile:', error);
      toast.error('Could not save your profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const deactivateProfile = async () => {
    if (!ownProfile?.id) return;
    try {
      await updateDoc(doc(db, 'roommateProfiles', ownProfile.id), { active: false, updatedAt: serverTimestamp() });
      setOwnProfile((profile) => ({ ...profile, active: false }));
      toast.success('Your profile is hidden from roommate search.');
      await loadRoommates();
    } catch (error) {
      console.error('Could not hide roommate profile:', error);
      toast.error('Could not hide your profile.');
    }
  };

  const connectToRoommate = async (profile) => {
    if (!currentUser?.uid) {
      navigate('/login', { state: { from: '/roommates' } });
      return;
    }
    if (!ownProfile?.id) {
      toast('Create a roommate profile before sending a connection request.');
      setProfileOpen(true);
      return;
    }
    if (!ownProfile.active) {
      toast('Make your roommate profile visible before sending a connection request.');
      setProfileOpen(true);
      return;
    }
    const existing = connections.find((item) => item.fromUserId === currentUser.uid && item.targetProfileId === profile.id && item.status !== 'rejected');
    if (existing) return;
    try {
      await addDoc(collection(db, 'roommateConnections'), {
        fromUserId: currentUser.uid,
        fromProfileId: ownProfile.id,
        fromName: ownProfile.displayName,
        targetProfileId: profile.id,
        targetName: profile.displayName,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Connection request sent.');
      await loadConnections();
    } catch (error) {
      console.error('Could not send roommate request:', error);
      toast.error('Could not send the connection request.');
    }
  };

  const updateConnection = async (connection, status) => {
    try {
      await updateDoc(doc(db, 'roommateConnections', connection.id), {
        status,
        ...(status === 'accepted' ? { targetUserId: currentUser.uid } : {}),
        updatedAt: serverTimestamp(),
      });
      toast.success(status === 'accepted' ? 'Connection accepted.' : 'Request declined.');
      await loadConnections();
    } catch (error) {
      console.error('Could not update connection request:', error);
      toast.error('Could not update this request.');
    }
  };

  const startRoommateChat = async (connection) => {
    if (!ownProfile?.id || !currentUser?.uid || connection.status !== 'accepted') return;
    try {
      const targetProfileId = connection.fromUserId === currentUser.uid ? connection.targetProfileId : connection.fromProfileId;
      const otherProfile = roommateProfiles.find((profile) => profile.id === targetProfileId) || {
        id: targetProfileId,
        displayName: connection.fromUserId === currentUser.uid ? connection.targetName : connection.fromName,
      };
      const targetUserId = connection.fromUserId === currentUser.uid ? connection.targetUserId : connection.fromUserId;
      if (!targetUserId) throw new Error('This connection is missing its private account link.');
      const participantIds = [currentUser.uid, targetUserId].sort();
      const roommateProfileIds = { [currentUser.uid]: ownProfile.id, [targetUserId]: targetProfileId };
      const participantNames = { [currentUser.uid]: ownProfile.displayName, [targetUserId]: otherProfile.displayName };
      const conversationId = `roommate_${participantIds.join('_')}`;
      await setDoc(doc(db, 'roommateConversations', conversationId), {
        conversationType: 'roommate',
        connectionId: connection.id,
        title: 'Roommate connection',
        participantIds,
        participantNames,
        roommateProfileIds,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      navigate(`/messages?conversationId=${encodeURIComponent(conversationId)}`);
    } catch (error) {
      console.error('Could not open roommate conversation:', error);
      toast.error('Could not open the conversation.');
    }
  };

  const findNearby = async () => {
    setFindingNearby(true);
    try {
      const location = await getCurrentLocation({ timeout: 15000, maximumAge: 60000 });
      setNearbyCenter({ lat: location.latitude, lng: location.longitude });
      setNearbyOnly(true);
    } catch (error) {
      console.error('Could not get current location:', error);
      toast.error('Allow location access to find nearby homes.');
    } finally {
      setFindingNearby(false);
    }
  };

  const chooseBudgetForPair = (profile) => {
    const total = Number(ownProfile?.budgetMax || 0) + Number(profile?.budgetMax || 0);
    setCombinedBudget(total > 0 ? total : null);
    setStatusFilter('rent');
    setMaxBudget(total > 0 ? String(total) : '');
    setTab('properties');
  };

  const shareProperty = async (property) => {
    const url = `${window.location.origin}/property/${property.id}`;
    try {
      if (navigator.share) await navigator.share({ title: property.title || 'MarketMix property', url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Property link copied.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Could not share this listing.');
    }
  };

  const saveProperty = async (property) => {
    if (!currentUser?.uid) {
      navigate('/login', { state: { from: '/explore' } });
      return;
    }
    try {
      await savePropertyForUser({ userId: currentUser.uid, propertyId: property.id, title: property.title });
      toast.success('Property saved.');
      setActionProperty(null);
    } catch (error) {
      console.error('Could not save property:', error);
      toast.error('Could not save this property.');
    }
  };

  const reportListing = async (event) => {
    event.preventDefault();
    if (!currentUser?.uid || !reportProperty || !reportReason.trim()) return;
    try {
      await addDoc(collection(db, 'propertyReports'), {
        reporterId: currentUser.uid,
        propertyId: reportProperty.id,
        propertyTitle: (reportProperty.title || 'Property listing').slice(0, 160),
        reason: reportReason.trim().slice(0, 1000),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      toast.success('Report sent for review.');
      setReportProperty(null);
      setReportReason('');
    } catch (error) {
      console.error('Could not submit listing report:', error);
      toast.error('Could not send this report.');
    }
  };

  const openReport = (property) => {
    if (!currentUser?.uid) {
      navigate('/login', { state: { from: '/explore' } });
      return;
    }
    setReportProperty(property);
    setActionProperty(null);
  };

  const filteredTabs = useMemo(() => TABS, []);

  return (
    <main className="mmx-liquid-canvas min-h-screen overflow-hidden pb-24 text-slate-900">
      {/* Scoped override: strip every visual layer from the bare text inputs inside the search/filter pills.
          Only `input.mmx-bare-field` is targeted, so the House Type <select> keeps its native appearance
          (and its dropdown arrow). */}
      <style>{`
        .mmx-liquid-canvas input.mmx-bare-field {
          border: 0 !important;
          border-color: transparent !important;
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
          outline: none !important;
          -webkit-backdrop-filter: none !important;
          backdrop-filter: none !important;
        }

        .mmx-liquid-canvas input.mmx-bare-field:focus,
        .mmx-liquid-canvas input.mmx-bare-field:focus-visible {
          border: 0 !important;
          border-color: transparent !important;
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
          outline: none !important;
          -webkit-backdrop-filter: none !important;
          backdrop-filter: none !important;
        }

        .mmx-liquid-canvas input.mmx-bare-field::placeholder {
          background: transparent !important;
          opacity: 1 !important;
        }
      `}</style>

      {/* Transport-matching Dark Hero Header */}
      <section className="mmx-glass-surface-dark relative isolate overflow-hidden rounded-b-[2.8rem] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_25%,rgba(52,211,153,0.22)_0%,rgba(15,23,42,0)_100%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Find your place in the city.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Find a home, plan how to get there, and meet people looking to share a place.</p>
            </div>
            {currentUser && <Link to="/favorites" className="hidden items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex"><Heart className="h-4 w-4" /> Saved homes</Link>}
          </div>

          {/* Search + filters — glass lives on the outer pill; text inputs are bare; select keeps native arrow */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className={`flex min-w-0 flex-1 items-center gap-3 ${GLASS_CONTROL}`}>
              <Search className="h-5 w-5 shrink-0 text-emerald-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search homes, areas, or roommate preferences"
                className={`mmx-bare-field ${BARE_FIELD}`}
                style={BARE_FIELD_STYLE}
              />
            </label>
            <div className="flex gap-2 overflow-x-auto">
              <label className={`flex w-32 items-center ${GLASS_CONTROL}`}>
                <input
                  value={areaFilter}
                  onChange={(event) => setAreaFilter(event.target.value)}
                  placeholder="Area / Town"
                  className={`mmx-bare-field ${BARE_FIELD}`}
                  style={BARE_FIELD_STYLE}
                />
              </label>
              <label className={`flex w-32 items-center ${GLASS_CONTROL}`}>
                <input
                  value={maxBudget}
                  onChange={(event) => setMaxBudget(event.target.value)}
                  inputMode="numeric"
                  placeholder="Max budget"
                  className={`mmx-bare-field ${BARE_FIELD}`}
                  style={BARE_FIELD_STYLE}
                />
              </label>
              <label className={`flex max-w-36 items-center ${GLASS_CONTROL}`}>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Property type"
                  className="mmx-bare-field w-full cursor-pointer border-0 bg-transparent px-0 py-0 text-sm font-semibold text-white outline-none [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="" className="bg-slate-900 text-white">Any type</option>
                  <option value="bedsitter" className="bg-slate-900 text-white">Bedsitter</option>
                  <option value="apartment" className="bg-slate-900 text-white">Apartment</option>
                  <option value="house" className="bg-slate-900 text-white">House</option>
                  <option value="studio" className="bg-slate-900 text-white">Studio</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => setMoreFilters((value) => !value)}
                aria-expanded={moreFilters}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_-10px_rgba(2,6,23,0.6)] backdrop-blur-2xl backdrop-saturate-150 transition ${
                  moreFilters
                    ? 'border-emerald-300/60 bg-transparent text-emerald-100'
                    : 'border-white/25 bg-transparent text-white hover:bg-white/10'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Location Search</span>
              </button>
            </div>
          </div>

          {/* Transport Location Search Integration (County, Sub-county, Ward, Area, Landmark) */}
          {moreFilters && (
            <div className={`mt-4 space-y-4 p-4 ${GLASS_PANEL}`}>
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Precise Location Filter (Transport Logic)</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setAreaFilter('');
                    setMaxBudget('');
                    setTypeFilter('');
                    setStatusFilter('');
                    setBedroomFilter('');
                    setExploreLocationFilter({ county: '', subCounty: '', ward: '', area: '' });
                    setCombinedBudget(null);
                  }}
                  className="text-xs font-bold text-emerald-200 hover:text-white"
                >
                  Clear all
                </button>
              </div>
              <div className="relative">
                <KenyaAreaPicker value={exploreLocationFilter} onChange={setExploreLocationFilter} />
              </div>
              <div className="relative grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-200">
                  Listing type
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className={`ml-2 ${GLASS_INPUT} [&>option]:bg-slate-900 [&>option]:text-white`}
                  >
                    <option value="" className="bg-slate-900 text-white">Any</option>
                    <option value="rent" className="bg-slate-900 text-white">Rent</option>
                    <option value="sale" className="bg-slate-900 text-white">Buy</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-200">
                  Bedrooms
                  <select
                    value={bedroomFilter}
                    onChange={(event) => setBedroomFilter(event.target.value)}
                    className={`ml-2 ${GLASS_INPUT} [&>option]:bg-slate-900 [&>option]:text-white`}
                  >
                    <option value="" className="bg-slate-900 text-white">Any</option>
                    <option value="1" className="bg-slate-900 text-white">1+</option>
                    <option value="2" className="bg-slate-900 text-white">2+</option>
                    <option value="3" className="bg-slate-900 text-white">3+</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Explore marketplace">
            {filteredTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${activeTab === id ? 'bg-emerald-400 text-slate-950 shadow-lg' : 'border border-white/15 bg-white/10 text-slate-200 hover:bg-white/20'}`}><Icon className="h-4 w-4" />{label}</button>)}
          </div>
        </div>
      </section>

      {/* Content Container */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'properties' && <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-800">{combinedBudget ? 'Roommate budget match' : 'Homes for your next chapter'}</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Properties matching your search</h2>
              <p className="mt-1 text-sm text-slate-500">{combinedBudget ? `Rent listings up to ${formatMoney(combinedBudget)} total per month.` : 'Compact cards show essentials. Open a listing for full details & site seeing.'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={nearbyOnly ? () => { setNearbyOnly(false); setNearbyCenter(null); } : findNearby} disabled={findingNearby} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${nearbyOnly ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400'}`}>
                {findingNearby ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}{nearbyOnly ? 'Clear nearby' : 'Find near me'}
              </button>
              {nearbyOnly && <select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} aria-label="Nearby search radius" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="0.5">500 m</option><option value="1">1 km</option><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option></select>}
              <Link to="/properties" className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50">See all properties <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          {nearbyOnly && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">Showing properties within {radiusKm < 1 ? `${radiusKm * 1000} m` : `${radiusKm} km`} by straight-line distance from your device.</p>}
          {loadingProperties ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"><div className="col-span-full flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />Loading homes…</div></div> : properties.length === 0 ? <div className="mmx-glass-surface rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Home className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 font-bold text-slate-900">No homes match those filters</h3><p className="mt-1 text-sm text-slate-500">Try a wider area or clear your filters.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {properties.map((property) => <article key={property.id} className="mmx-glass-surface group min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <Link to={`/property/${property.id}`} className="block text-slate-900">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                  <img src={resolvePropertyImage(property) || '/images/property-hero.svg'} alt={property.title || 'Property'} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded-full bg-slate-900/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">{propertyStatus(property) === 'sale' ? 'For sale' : propertyStatus(property) === 'rent' ? 'For rent' : 'Listing type'}</span>
                  {property.exploreDistance != null && <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white">{property.exploreDistance < 1 ? `${Math.round(property.exploreDistance * 1000)} m` : `${property.exploreDistance.toFixed(1)} km`} away</span>}
                </div>
                <div className="p-3 sm:p-4">
                  <p className="truncate text-xs font-semibold text-slate-500">{property.propertyType || property.unitType || 'Property'}</p>
                  <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-900 sm:text-base">{property.title || 'Property listing'}</h3>
                  <p className="mt-1 text-sm font-extrabold text-emerald-800">{formatMoney(propertyPrice(property))}{propertyStatus(property) === 'rent' ? <span className="font-medium text-slate-500"> / mo</span> : null}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0" />{getPublicPropertyLocation(property)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(property.approvalStatus === 'approved' || property.verificationStatus === 'approved') && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800"><BadgeCheck className="h-3 w-3" /> Verified</span>}
                    {property.bedrooms != null && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"><BedDouble className="h-3 w-3" />{property.bedrooms} bed</span>}
                  </div>
                </div>
              </Link>
              <div className="flex gap-2 border-t border-slate-100 p-2.5 bg-slate-50/50">
                <Link to={`/property/${property.id}`} className="flex-1 rounded-lg bg-slate-900 px-2 py-2 text-center text-xs font-bold text-white hover:bg-slate-800">View</Link>
                <button type="button" onClick={() => shareProperty(property)} aria-label={`Share ${property.title || 'property'}`} className="rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-white"><Share2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => setActionProperty(property)} aria-label={`More actions for ${property.title || 'property'}`} className="rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-white"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
            </article>)}
          </div>}
        </section>}

        {activeTab === 'roommates' && <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-semibold text-emerald-700">Find someone to share with</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Roommate marketplace</h2><p className="mt-1 text-sm text-slate-500">Profiles are opt-in. Public cards show only the details each person chose to share.</p></div>
            {currentUser ? <button type="button" onClick={() => setProfileOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"><CircleUserRound className="h-4 w-4" />{ownProfile ? 'Edit my profile' : 'Create roommate profile'}</button> : <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Sign in to create a profile <ArrowRight className="h-4 w-4" /></Link>}
          </div>

          {loadingRoommates ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />Loading roommate profiles…</div> : roommateProfiles.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Users className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 font-bold text-slate-900">No roommate profiles yet</h3><p className="mt-1 text-sm text-slate-500">Create a profile to connect with people looking for shared housing.</p></div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRoommates.map((profile) => {
              const score = ownProfile ? matchScore(ownProfile, profile) : 0;
              const conn = connections.find((item) => (item.fromUserId === currentUser?.uid && item.targetProfileId === profile.id) || (profile.ownerId && item.fromUserId === profile.ownerId));
              return <div key={profile.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-900">{profile.displayName?.charAt(0)?.toUpperCase() || 'U'}</div>
                      <div>
                        <h3 className="font-bold text-slate-900">{profile.displayName}</h3>
                        <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{profile.preferredArea || profile.ward || profile.subCounty || profile.county}</p>
                      </div>
                    </div>
                    {score > 0 && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">{score}% match</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Budget: up to {formatMoney(profile.budgetMax)} / mo</span>
                    {profile.propertyType && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{profile.propertyType}</span>}
                    {profile.moveInDate && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Move: {formatMoveDate(profile.moveInDate)}</span>}
                  </div>
                  {profile.lifestyle?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{profile.lifestyle.slice(0, 4).map((tag, i) => <span key={i} className="rounded-md bg-emerald-50/70 px-2 py-0.5 text-[11px] font-medium text-emerald-900">{tag}</span>)}</div>}
                </div>
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => setProfileToView(profile)} className="text-xs font-bold text-slate-700 hover:text-slate-900">View details</button>
                  {conn?.status === 'accepted' ? <button type="button" onClick={() => startRoommateChat(conn)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800"><MessageCircle className="h-3.5 w-3.5" />Chat</button> : conn?.status === 'pending' ? <span className="text-xs font-semibold text-amber-600">Request pending</span> : <button type="button" onClick={() => connectToRoommate(profile)} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-800">Connect</button>}
                </div>
              </div>;
            })}
          </div>}
        </section>}
      </div>

      {/* Action Sheet Modal */}
      {actionProperty && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 line-clamp-1">{actionProperty.title || 'Property actions'}</h3>
            <button type="button" onClick={() => setActionProperty(null)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 space-y-2">
            <Link to={`/property/${actionProperty.id}`} className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3.5 text-sm font-bold text-slate-900 hover:bg-slate-100">View full property details <ArrowRight className="h-4 w-4" /></Link>
            <Link to={`/site-seeing?propertyId=${actionProperty.id}`} className="flex w-full items-center justify-between rounded-xl bg-emerald-50 p-3.5 text-sm font-bold text-emerald-900 hover:bg-emerald-100">Book Site Seeing Tour <Compass className="h-4 w-4 text-emerald-700" /></Link>
            <button type="button" onClick={() => saveProperty(actionProperty)} className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3.5 text-sm font-bold text-slate-900 hover:bg-slate-100">Save to favorites <Heart className="h-4 w-4 text-rose-500" /></button>
            <button type="button" onClick={() => shareProperty(actionProperty)} className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3.5 text-sm font-bold text-slate-900 hover:bg-slate-100">Share listing link <Share2 className="h-4 w-4 text-slate-600" /></button>
            <button type="button" onClick={() => openReport(actionProperty)} className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3.5 text-sm font-bold text-rose-600 hover:bg-rose-50">Report incorrect listing <ShieldCheck className="h-4 w-4 text-rose-500" /></button>
          </div>
        </div>
      </div>}

      {/* Profile Modal & Roommate Detail Modal */}
      {profileOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900">Your roommate profile</h3>
            <button type="button" onClick={() => setProfileOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={saveRoommateProfile} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Display name</label>
              <input required value={profileForm.displayName} onChange={(e) => setProfileForm(f => ({ ...f, displayName: e.target.value }))} placeholder="e.g. Alex" className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Preferred Location in Kenya</label>
              <KenyaAreaPicker value={{ county: profileForm.county, subCounty: profileForm.subCounty, ward: profileForm.ward }} onChange={(loc) => setProfileForm(f => ({ ...f, county: loc.county || '', subCounty: loc.subCounty || '', ward: loc.ward || '' }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Min Budget (KSh)</label>
                <input required type="number" value={profileForm.budgetMin} onChange={(e) => setProfileForm(f => ({ ...f, budgetMin: e.target.value }))} placeholder="5000" className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Max Budget (KSh)</label>
                <input required type="number" value={profileForm.budgetMax} onChange={(e) => setProfileForm(f => ({ ...f, budgetMax: e.target.value }))} placeholder="15000" className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Lifestyle Vibe</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {LIFESTYLE_OPTIONS.map((tag) => {
                  const selected = profileForm.lifestyle.includes(tag);
                  return <button key={tag} type="button" onClick={() => setProfileForm(f => ({ ...f, lifestyle: selected ? f.lifestyle.filter(t => t !== tag) : [...f.lifestyle, tag] }))} className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{tag}</button>;
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              {ownProfile?.id && <button type="button" onClick={deactivateProfile} className="rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50">Hide profile</button>}
              <button type="submit" disabled={savingProfile} className="mmx-liquid-primary ml-auto inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow">{savingProfile && <LoaderCircle className="h-4 w-4 animate-spin" />}Save profile</button>
            </div>
          </form>
        </div>
      </div>}

      {profileToView && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-900">{profileToView.displayName?.charAt(0) || 'U'}</div>
              <div><h3 className="font-bold text-slate-900">{profileToView.displayName}</h3><p className="text-xs text-slate-500">{profileToView.preferredArea || profileToView.ward || profileToView.subCounty || profileToView.county}</p></div>
            </div>
            <button type="button" onClick={() => setProfileToView(null)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p><strong>Monthly budget:</strong> up to {formatMoney(profileToView.budgetMax)}</p>
            {profileToView.propertyType && <p><strong>Preferred home:</strong> {profileToView.propertyType}</p>}
            {profileToView.lifestyle?.length > 0 && <div><strong className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Lifestyle</strong><div className="flex flex-wrap gap-1">{profileToView.lifestyle.map((l, i) => <span key={i} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-900">{l}</span>)}</div></div>}
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => chooseBudgetForPair(profileToView)} className="rounded-xl border border-emerald-700 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50">Compare combined budget with homes</button>
            <button type="button" onClick={() => { connectToRoommate(profileToView); setProfileToView(null); }} className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800">Connect</button>
          </div>
        </div>
      </div>}
    </main>
  );
};

export default ExplorePage;