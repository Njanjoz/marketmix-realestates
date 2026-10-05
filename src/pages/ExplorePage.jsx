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
    const id = searchParams.get('propertyId');
    return id ? allProperties.find((property) => property.id === id) || null : null;
  }, [allProperties, searchParams]);

  useEffect(() => {
    const nextTab = location.pathname === '/roommates' ? 'roommates' : TABS.some((tab) => tab.id === searchParams.get('tab')) ? searchParams.get('tab') : 'properties';
    setActiveTab(nextTab);
  }, [location.pathname, searchParams]);

  const loadProperties = useCallback(async () => {
    setLoadingProperties(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'properties'), where('approvalStatus', '==', 'approved')));
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      items.sort((a, b) => timestampValue(b.createdAt) - timestampValue(a.createdAt));
      setAllProperties(items);
    } catch (error) {
      console.error('Could not load Explore properties:', error);
      toast.error('Could not load properties right now.');
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  const loadRoommates = useCallback(async () => {
    setLoadingRoommates(true);
    try {
      const activeQuery = query(collection(db, 'roommateProfiles'), where('active', '==', true));
      const snapshot = await getDocs(activeQuery);
      const profiles = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      profiles.sort((a, b) => timestampValue(b.updatedAt) - timestampValue(a.updatedAt));
      setRoommateProfiles(profiles);

      if (currentUser?.uid) {
        const ownerSnapshot = await getDoc(doc(db, 'roommateProfileLinks', currentUser.uid));
        if (ownerSnapshot.exists()) {
          const ownSnapshot = await getDoc(doc(db, 'roommateProfiles', ownerSnapshot.data().profileId));
          if (ownSnapshot.exists()) {
            const own = { id: ownSnapshot.id, ...ownSnapshot.data() };
            setOwnProfile(own);
            setProfileForm({
              displayName: own.displayName || '', preferredArea: own.preferredArea || '',
              county: own.county || '', subCounty: own.subCounty || '', ward: own.ward || '',
              budgetMin: String(own.budgetMin || ''), budgetMax: String(own.budgetMax || ''),
              moveInDate: own.moveInDate || '', propertyType: own.propertyType || '',
              lifestyle: own.lifestyle || [], smoking: own.smoking || 'No preference',
              pets: own.pets || 'No preference', furnished: own.furnished || 'Either',
              workStudy: own.workStudy || 'Prefer not to say', roommateCount: String(own.roommateCount || 1),
              seekingType: own.seekingType || 'either',
            });
          }
        } else {
          setOwnProfile(null);
        }
      } else {
        setOwnProfile(null);
      }
    } catch (error) {
      console.error('Could not load roommate profiles:', error);
      toast.error('Could not load roommate profiles.');
    } finally {
      setLoadingRoommates(false);
    }
  }, [currentUser?.uid]);

  const loadConnections = useCallback(async () => {
    if (!currentUser?.uid) {
      setConnections([]);
      return;
    }
    try {
      const outgoing = await getDocs(query(collection(db, 'roommateConnections'), where('fromUserId', '==', currentUser.uid)));
      const requests = outgoing.docs.map((item) => ({ id: item.id, ...item.data() }));
      if (ownProfile?.id) {
        const incoming = await getDocs(query(collection(db, 'roommateConnections'), where('targetProfileId', '==', ownProfile.id)));
        incoming.docs.forEach((item) => {
          if (!requests.some((request) => request.id === item.id)) requests.push({ id: item.id, ...item.data() });
        });
      }
      requests.sort((a, b) => timestampValue(b.createdAt) - timestampValue(a.createdAt));
      setConnections(requests);
    } catch (error) {
      console.error('Could not load roommate connection requests:', error);
      toast.error('Could not load connection requests.');
    }
  }, [currentUser?.uid, ownProfile?.id]);

  useEffect(() => { loadProperties(); }, [loadProperties]);
  useEffect(() => { loadRoommates(); }, [loadRoommates]);
  useEffect(() => { loadConnections(); }, [loadConnections]);

  useEffect(() => {
    if (!propertyContext) return;
    const area = getPublicPropertyLocation(propertyContext).split(',')[0].trim();
    if (area) setAreaFilter((current) => current || area);
    setProfileForm((current) => ({
      ...current,
      preferredArea: current.preferredArea || propertyContext.estate || propertyContext.neighborhood || area,
      county: current.county || propertyContext.county || propertyContext.approxLocation?.county || '',
      subCounty: current.subCounty || propertyContext.subCounty || propertyContext.constituency || '',
      ward: current.ward || propertyContext.ward || '',
    }));
  }, [propertyContext]);

  useEffect(() => {
    if (searchParams.get('createProfile') === '1') {
      setTab('roommates');
      if (currentUser) setProfileOpen(true);
    }
  // setTab is intentionally not a dependency: the query flag is one-shot.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentUser?.uid]);

  const properties = useMemo(() => {
    const terms = [searchTerm, areaFilter].map((value) => value.trim().toLowerCase()).filter(Boolean);
    return allProperties.filter((property) => {
      const location = getPublicPropertyLocation(property);
      const text = `${property.title || ''} ${property.propertyType || ''} ${property.unitType || ''} ${location}`.toLowerCase();
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
  }, [allProperties, searchTerm, areaFilter, maxBudget, typeFilter, statusFilter, bedroomFilter, nearbyOnly, nearbyCenter, radiusKm]);

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
    <main className={`${activeTab === 'roommates' ? 'mmx-liquid-canvas' : ''} min-h-screen bg-slate-50 pb-8`}>
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8 lg:pb-10 lg:pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><Compass className="h-4 w-4" /> MARKETMIX DISCOVERY</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Find your place in the city.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Find a home, plan how to get there, and meet people looking to share a place.</p>
            </div>
            {currentUser && <Link to="/favorites" className="hidden items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 sm:inline-flex"><Heart className="h-4 w-4" /> Saved homes</Link>}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-slate-500">
              <Search className="h-5 w-5 shrink-0" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search homes, areas, or roommate preferences" className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </label>
            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 pt-2 sm:border-0 sm:pt-0">
              <input value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} placeholder="Area" className="w-24 rounded-xl bg-slate-100 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 sm:w-32" />
              <input value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} inputMode="numeric" placeholder="Max budget" className="w-28 rounded-xl bg-slate-100 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500" />
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Property type" className="max-w-32 rounded-xl bg-slate-100 px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Any type</option><option value="bedsitter">Bedsitter</option><option value="apartment">Apartment</option><option value="house">House</option><option value="studio">Studio</option>
              </select>
              <button type="button" onClick={() => setMoreFilters((value) => !value)} aria-expanded={moreFilters} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${moreFilters ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}><SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">More</span></button>
            </div>
          </div>

          {moreFilters && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
            <label className="text-xs font-semibold text-slate-200">Listing type<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ml-2 rounded-lg border-0 bg-white px-2 py-2 text-sm text-slate-900"><option value="">Any</option><option value="rent">Rent</option><option value="sale">Buy</option></select></label>
            <label className="text-xs font-semibold text-slate-200">Bedrooms<select value={bedroomFilter} onChange={(event) => setBedroomFilter(event.target.value)} className="ml-2 rounded-lg border-0 bg-white px-2 py-2 text-sm text-slate-900"><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></label>
            <button type="button" onClick={() => { setSearchTerm(''); setAreaFilter(''); setMaxBudget(''); setTypeFilter(''); setStatusFilter(''); setBedroomFilter(''); setCombinedBudget(null); }} className="ml-auto text-xs font-bold text-emerald-200 hover:text-white">Clear filters</button>
          </div>}

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Explore marketplace">
            {filteredTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${activeTab === id ? 'bg-emerald-400 text-slate-950' : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'}`}><Icon className="h-4 w-4" />{label}</button>)}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        {activeTab === 'properties' && <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-700">{combinedBudget ? 'Roommate budget match' : 'Homes for your next chapter'}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Properties matching your search</h2>
              <p className="mt-1 text-sm text-slate-500">{combinedBudget ? `Rent listings up to ${formatMoney(combinedBudget)} total per month.` : 'Compact cards show the essentials. Open a listing for full details.'}</p>
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
          {loadingProperties ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"><div className="col-span-full flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />Loading homesâ€¦</div></div> : properties.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Home className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 font-bold text-slate-900">No homes match those filters</h3><p className="mt-1 text-sm text-slate-500">Try a wider area or clear your filters.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {properties.map((property) => <article key={property.id} className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <Link to={`/property/${property.id}`} className="block text-slate-900">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                  <img src={resolvePropertyImage(property) || '/images/property-hero.svg'} alt={property.title || 'Property'} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-900 shadow-sm">{propertyStatus(property) === 'sale' ? 'For sale' : propertyStatus(property) === 'rent' ? 'For rent' : 'Listing type unavailable'}</span>
                  {property.exploreDistance != null && <span className="absolute bottom-2 left-2 rounded-full bg-slate-950/75 px-2 py-1 text-[10px] font-semibold text-white">{property.exploreDistance < 1 ? `${Math.round(property.exploreDistance * 1000)} m` : `${property.exploreDistance.toFixed(1)} km`} away</span>}
                </div>
                <div className="p-3 sm:p-4">
                  <p className="truncate text-xs font-semibold text-slate-500">{property.propertyType || property.unitType || 'Property'}</p>
                  <h3 className="mt-1 line-clamp-1 text-sm font-bold text-slate-900 sm:text-base">{property.title || 'Property listing'}</h3>
                  <p className="mt-1 text-sm font-extrabold text-emerald-800">{formatMoney(propertyPrice(property))}{propertyStatus(property) === 'rent' ? <span className="font-medium text-slate-500"> / mo</span> : null}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0" />{getPublicPropertyLocation(property)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(property.approvalStatus === 'approved' || property.verificationStatus === 'approved') && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800"><BadgeCheck className="h-3 w-3" /> Verified listing</span>}
                    {property.bedrooms != null && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"><BedDouble className="h-3 w-3" />{property.bedrooms} bed</span>}
                  </div>
                </div>
              </Link>
              <div className="flex gap-2 border-t border-slate-100 p-2.5">
                <Link to={`/property/${property.id}`} className="flex-1 rounded-lg bg-slate-900 px-2 py-2 text-center text-xs font-bold text-white hover:bg-slate-800">View</Link>
                <button type="button" onClick={() => shareProperty(property)} aria-label={`Share ${property.title || 'property'}`} className="rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"><Share2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => setActionProperty(property)} aria-label={`More actions for ${property.title || 'property'}`} className="rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-slate-50"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
            </article>)}
          </div>}
        </section>}

        {activeTab === 'roommates' && <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-semibold text-emerald-700">Find someone to share with</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Roommate marketplace</h2><p className="mt-1 text-sm text-slate-500">Profiles are opt-in. Public cards show only the details each person chose to share.</p></div>
            {currentUser ? <button type="button" onClick={() => setProfileOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"><CircleUserRound className="h-4 w-4" />{ownProfile ? 'Edit my profile' : 'Create roommate profile'}</button> : <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Sign in to create a profile <ArrowRight className="h-4 w-4" /></Link>}
          </div>

          {propertyContext && <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-800">Looking for someone to share this property?</p><h3 className="mt-1 font-bold text-slate-950">{propertyContext.title}</h3><p className="mt-1 text-xs text-slate-600">{getPublicPropertyLocation(propertyContext)} · We’ve filtered profiles nearby.</p></div><Link to={`/property/${propertyContext.id}`} className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-bold text-emerald-900">View property</Link></div>}

          {ownProfile && <div className="mb-5 grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-700" /><p className="font-bold text-emerald-950">Your profile is {ownProfile.active ? 'visible' : 'hidden'}</p></div><p className="mt-1 text-sm text-emerald-900">{ownProfile.displayName} Â· {ownProfile.preferredArea} Â· {formatMoney(ownProfile.budgetMin)}â€“{formatMoney(ownProfile.budgetMax)} monthly</p>{!ownProfile.active && <p className="mt-1 text-xs text-emerald-800">Turn it back on by editing and saving your profile.</p>}</div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setProfileOpen(true)} className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-900">Edit profile</button>{ownProfile.active && <button type="button" onClick={deactivateProfile} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-white">Hide profile</button>}</div>
          </div>}

          {connections.length > 0 && currentUser && <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-slate-900">Connection requests</h3><p className="mt-1 text-xs text-slate-500">Accept a request to open a private MarketMix chat.</p></div><button type="button" onClick={loadConnections} className="text-xs font-bold text-emerald-800">Refresh</button></div>
            <div className="mt-3 space-y-2">{connections.map((connection) => {
              const incoming = connection.targetProfileId === ownProfile?.id && connection.fromUserId !== currentUser.uid;
              const peer = incoming ? connection.fromName : roommateProfiles.find((profile) => profile.id === connection.targetProfileId)?.displayName || 'Roommate profile';
              return <div key={connection.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3">
                <div><p className="text-sm font-semibold text-slate-900">{incoming ? `${peer} wants to connect` : `Request to ${peer}`}</p><p className="mt-0.5 text-xs capitalize text-slate-500">{connection.status}</p></div>
                <div className="flex gap-2">{incoming && connection.status === 'pending' && <><button type="button" onClick={() => updateConnection(connection, 'rejected')} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Decline</button><button type="button" onClick={() => updateConnection(connection, 'accepted')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Accept</button></>}{connection.status === 'accepted' && <button type="button" onClick={() => startRoommateChat(connection)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"><MessageCircle className="h-3.5 w-3.5" />Message</button>}</div>
              </div>;
            })}</div>
          </div>}

          {loadingRoommates ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />Loading roommate profilesâ€¦</div> : visibleRoommates.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Users className="mx-auto h-8 w-8 text-slate-400" /><h3 className="mt-3 font-bold text-slate-900">No roommate profiles found yet</h3><p className="mt-1 text-sm text-slate-500">Try another area or be the first to create a profile.</p>{currentUser && <button type="button" onClick={() => setProfileOpen(true)} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">Create a profile</button>}</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {visibleRoommates.map((profile) => {
              const score = ownProfile ? matchScore(ownProfile, profile) : null;
              const pairBudget = Number(ownProfile?.budgetMax || 0) + Number(profile.budgetMax || 0);
              const alreadyRequested = connections.some((item) => item.fromUserId === currentUser?.uid && item.targetProfileId === profile.id && item.status !== 'rejected');
              return <article key={profile.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="flex items-start justify-between gap-2"><div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-900">{(profile.displayName || 'M').slice(0, 1).toUpperCase()}</div>{score != null && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-800">{score}% match</span>}</div>
                <h3 className="mt-3 truncate text-sm font-bold text-slate-900 sm:text-base">{profile.displayName || 'MarketMix member'}</h3>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0" />{formatKenyaArea({ area: profile.preferredArea, ward: profile.ward, subCounty: profile.subCounty, county: profile.county })}</p>
                <p className="mt-2 text-sm font-extrabold text-emerald-800">{formatMoney(profile.budgetMin)}â€“{formatMoney(profile.budgetMax)}<span className="font-medium text-slate-500"> / mo</span></p>
                <p className="mt-1 text-xs text-slate-500">Moves {formatMoveDate(profile.moveInDate)}</p>
                <p className="mt-1 line-clamp-1 text-[10px] font-semibold text-slate-600">{profile.seekingType === 'share_existing' ? 'Has a home to share' : profile.seekingType === 'find_property' ? 'Looking for a home together' : 'Open to either option'}</p>
                <div className="mt-3 flex min-h-6 flex-wrap gap-1">{(profile.lifestyle || []).slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">{tag}</span>)}</div>
                <div className="mt-auto space-y-2 pt-4">
                  <button type="button" onClick={() => setProfileToView(profile)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">View profile</button>
                  <button type="button" onClick={() => connectToRoommate(profile)} disabled={alreadyRequested} className="w-full rounded-lg bg-slate-900 px-2 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-default disabled:bg-slate-300">{alreadyRequested ? 'Request sent' : 'Connect'}</button>
                  {ownProfile && pairBudget > 0 && <button type="button" onClick={() => chooseBudgetForPair(profile)} className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-[11px] font-bold text-emerald-900 hover:bg-emerald-100">Find homes together Â· {formatMoney(pairBudget)}</button>}
                </div>
              </article>;
            })}
          </div>}
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />We never publish email addresses, phone numbers, gender, or exact addresses in roommate search. Chat opens only after the other person accepts.</p>
        </section>}
      </div>

      {profileToView && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setProfileToView(null)}><section className="mmx-glass-surface max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-900">{(profileToView.displayName || 'M').slice(0, 1).toUpperCase()}</span><span><span className="block text-lg font-extrabold text-slate-950">{profileToView.displayName || 'MarketMix member'}</span><span className="block text-xs text-slate-500">{profileToView.seekingType === 'share_existing' ? 'Has a home and wants a roommate' : profileToView.seekingType === 'find_property' ? 'Looking for a home to share' : 'Open to either option'}</span></span></div><button type="button" onClick={() => setProfileToView(null)} aria-label="Close profile" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5"/></button></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Preferred area</p><p className="mt-1 text-sm font-bold text-slate-900">{formatKenyaArea({ area: profileToView.preferredArea, ward: profileToView.ward, subCounty: profileToView.subCounty, county: profileToView.county })}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Monthly budget</p><p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(profileToView.budgetMin)}–{formatMoney(profileToView.budgetMax)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Move-in</p><p className="mt-1 text-sm font-bold text-slate-900">{formatMoveDate(profileToView.moveInDate)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-500">Property type</p><p className="mt-1 text-sm font-bold text-slate-900">{profileToView.propertyType || 'Flexible'}</p></div></div><div className="mt-4 space-y-2 rounded-xl border border-slate-100 p-4 text-xs text-slate-600"><p><strong>Lifestyle:</strong> {(profileToView.lifestyle || []).join(', ') || 'Not specified'}</p><p><strong>Smoking:</strong> {profileToView.smoking || 'No preference'} · <strong>Pets:</strong> {profileToView.pets || 'No preference'}</p><p><strong>Furnishing:</strong> {profileToView.furnished || 'Either'} · <strong>Study/work:</strong> {profileToView.workStudy || 'Not specified'}</p></div>{ownProfile && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-950">Combined maximum budget: <strong>{formatMoney(Number(ownProfile.budgetMax || 0) + Number(profileToView.budgetMax || 0))}/month</strong></p>}<button type="button" onClick={() => { const target = profileToView; setProfileToView(null); connectToRoommate(target); }} className="mmx-liquid-primary mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-white">Connect</button></section></div>}

      {profileOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setProfileOpen(false)}>
        <form onSubmit={saveRoommateProfile} className="mmx-glass-surface max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl p-5 shadow-2xl sm:rounded-3xl sm:p-7">
          <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-700">Your choice, your profile</p><h2 className="mt-1 text-xl font-bold text-slate-900">{ownProfile ? 'Edit roommate profile' : 'Create roommate profile'}</h2><p className="mt-1 text-xs leading-5 text-slate-500">Only the fields you enter below are shown. Leave anything blank that you do not want to share.</p></div><button type="button" onClick={() => setProfileOpen(false)} aria-label="Close profile form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
          {!currentUser ? <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Sign in to create and manage your profile. <Link to="/login" className="font-bold underline">Sign in</Link></div> : <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Display name<input required maxLength={40} value={profileForm.displayName} onChange={(event) => setProfileForm((form) => ({ ...form, displayName: event.target.value }))} placeholder="First name or a nickname" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-600" /></label>
              <div className="sm:col-span-2"><KenyaAreaPicker value={{ county: profileForm.county, subCounty: profileForm.subCounty, ward: profileForm.ward, area: profileForm.preferredArea }} onChange={(area) => setProfileForm((form) => ({ ...form, county: area.county, subCounty: area.subCounty, ward: area.ward, preferredArea: area.area }))} areaLabel="Estate, neighbourhood or local place" areaPlaceholder="e.g. Kilimani, Kaptembwo or near a known landmark" /></div>
              <label className="text-sm font-semibold text-slate-700">Minimum monthly budget (KES)<input required type="number" min="0" max="10000000" value={profileForm.budgetMin} onChange={(event) => setProfileForm((form) => ({ ...form, budgetMin: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-600" /></label>
              <label className="text-sm font-semibold text-slate-700">Maximum monthly budget (KES)<input required type="number" min="0" max="10000000" value={profileForm.budgetMax} onChange={(event) => setProfileForm((form) => ({ ...form, budgetMax: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-600" /></label>
              <label className="text-sm font-semibold text-slate-700">Move-in date<input type="date" value={profileForm.moveInDate} onChange={(event) => setProfileForm((form) => ({ ...form, moveInDate: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-600" /></label>
              <label className="text-sm font-semibold text-slate-700">Property type<select value={profileForm.propertyType} onChange={(event) => setProfileForm((form) => ({ ...form, propertyType: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-600">{PROPERTY_TYPES.map((type) => <option key={type} value={type === 'Any type' ? '' : type}>{type}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Roommate plan<select value={profileForm.seekingType} onChange={(event) => setProfileForm((form) => ({ ...form, seekingType: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-600"><option value="share_existing">I have a property and need a roommate</option><option value="find_property">I want to find a property to share</option><option value="either">Either option works for me</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Smoking preference<select value={profileForm.smoking} onChange={(event) => setProfileForm((form) => ({ ...form, smoking: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none"><option>No preference</option><option>Non-smoking home</option><option>Smoking outdoors only</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Pets<select value={profileForm.pets} onChange={(event) => setProfileForm((form) => ({ ...form, pets: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none"><option>No preference</option><option>Pets welcome</option><option>No pets</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Furnishing<select value={profileForm.furnished} onChange={(event) => setProfileForm((form) => ({ ...form, furnished: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none"><option>Either</option><option>Furnished</option><option>Unfurnished</option></select></label>
              <label className="text-sm font-semibold text-slate-700">Study/work status<select value={profileForm.workStudy} onChange={(event) => setProfileForm((form) => ({ ...form, workStudy: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none"><option>Prefer not to say</option><option>Student</option><option>Working</option><option>Working from home</option><option>Other</option></select></label>
              <label className="text-sm font-semibold text-slate-700">People you hope to share with<input type="number" min="1" max="10" value={profileForm.roommateCount} onChange={(event) => setProfileForm((form) => ({ ...form, roommateCount: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none" /></label>
            </div>
            <fieldset className="mt-4"><legend className="text-sm font-semibold text-slate-700">Lifestyle preferences</legend><div className="mt-2 flex flex-wrap gap-2">{LIFESTYLE_OPTIONS.map((tag) => { const selected = profileForm.lifestyle.includes(tag); return <button key={tag} type="button" aria-pressed={selected} onClick={() => setProfileForm((form) => ({ ...form, lifestyle: selected ? form.lifestyle.filter((item) => item !== tag) : [...form.lifestyle, tag] }))} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 text-slate-600'}`}>{tag}</button>; })}</div></fieldset>
            <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center"><p className="text-xs text-slate-500">Do not include phone numbers, email, or exact addresses.</p><div className="flex gap-2"><button type="button" onClick={() => setProfileOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={savingProfile} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{savingProfile && <LoaderCircle className="h-4 w-4 animate-spin" />}{savingProfile ? 'Savingâ€¦' : ownProfile ? 'Save profile' : 'Publish profile'}</button></div></div>
          </>}
        </form>
      </div>}

      {actionProperty && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && setActionProperty(null)}>
        <section className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Property actions</p><h2 className="mt-1 font-bold text-slate-900">{actionProperty.title || 'Property listing'}</h2><p className="mt-1 text-xs text-slate-500">{getPublicPropertyLocation(actionProperty)}</p></div><button type="button" onClick={() => setActionProperty(null)} aria-label="Close actions" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => saveProperty(actionProperty)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Heart className="h-4 w-4" /> Save</button>
            <button type="button" onClick={() => shareProperty(actionProperty)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Share2 className="h-4 w-4" /> Share</button>
            <button type="button" onClick={() => { toast(`Approximate area: ${getPublicPropertyLocation(actionProperty)}`); setActionProperty(null); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><MapPin className="h-4 w-4" /> View area</button>
            <button type="button" onClick={() => navigate(`/transport?propertyId=${encodeURIComponent(actionProperty.id)}`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Truck className="h-4 w-4" /> Arrange moving</button>
            <button type="button" onClick={() => navigate(`/roommates?propertyId=${encodeURIComponent(actionProperty.id)}`)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Users className="h-4 w-4" /> Find roommate</button>
            <button type="button" onClick={() => openReport(actionProperty)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"><ShieldCheck className="h-4 w-4" /> Report listing</button>
          </div>
          <Link to={`/property/${actionProperty.id}`} onClick={() => setActionProperty(null)} className="mt-3 block rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white">Open property details</Link>
        </section>
      </div>}

      {reportProperty && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
        <form onSubmit={reportListing} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">Report this listing</h2><p className="mt-1 text-xs text-slate-500">{reportProperty.title || 'Property listing'}</p></div><button type="button" onClick={() => setReportProperty(null)} aria-label="Close report" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><label className="mt-4 block text-sm font-semibold text-slate-700">What should we review?<textarea required maxLength={1000} rows="4" value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600" /></label><button type="submit" className="mt-4 w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white hover:bg-red-800">Send report</button></form>
      </div>}
    </main>
  );
};

function distanceKm(lat1, lon1, lat2, lon2) {
  const radians = (value) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default ExplorePage;
