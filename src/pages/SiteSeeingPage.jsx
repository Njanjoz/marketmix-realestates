// src/pages/SiteSeeingPage.jsx - Site Seeing Feature for MarketMix Real Estates
// Reuses Transport Page UI language (Liquid Glass, glass-surface-dark hero header, cards, location logic)

import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, MapPin, Search, Crosshair, Check, ChevronRight, Building, Bed, Bath, Square, Loader2, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { bookSiteSeeingWithDeposit, getSiteSeeingPackagePrice } from '../services/siteSeeingBooking';
import KenyaLocationSearch from '../components/moving/KenyaLocationSearch';
import KenyaAreaPicker from '../components/moving/KenyaAreaPicker';
import CoordinateMapPicker from '../components/moving/CoordinateMapPicker';
import '../components/moving/LiquidGlass.css';
import { resolvePropertyImage, getPublicPropertyLocation, isApprovedProperty } from '../utils/propertyMapping';
import { reverseGeocodeKenyaPoint } from '../utils/transportLocationLookup';

const DEFAULT_PACKAGES = [
  {
    id: 'quick_view',
    title: 'Quick View',
    price: 100,
    priceLabel: 'KSh 100',
    subtitle: 'A low-cost booking for one home you have already chosen.',
    includes: ['One selected property', 'Viewing time and access request arranged', 'You travel to the property and meet there', 'No property search or transport included']
  },
  {
    id: 'assisted_view',
    title: 'Assisted View',
    price: 250,
    priceLabel: 'KSh 250',
    subtitle: 'For one selected home when you want more help arranging the visit.',
    includes: ['One selected property', 'Agent confirms availability and access', 'Meet-up point and directions coordinated', 'Guided viewing support and questions answered', 'Transport costs are not included']
  },
  {
    id: 'student_hunt',
    title: 'Student Hunt',
    price: 300,
    priceLabel: 'KSh 300',
    subtitle: 'Find affordable rooms and student accommodation near campus.',
    includes: ['Student hostels, bedsitters and shared rooms', 'Set your monthly rent budget and preferred area', 'Choose up to 4 homes or get a matching shortlist', 'Best for students comparing places to live']
  },
  {
    id: 'property_hunt',
    title: 'Property Hunt',
    price: 500,
    priceLabel: 'KSh 500',
    subtitle: 'Compare different homes across property types and rent ranges.',
    includes: ['Apartments, houses and other approved homes', 'Filter by property type, monthly rent and area', 'Choose up to 4 homes or get a matching shortlist', 'Best for renters comparing general housing options']
  },
  {
    id: 'premium_hunt',
    title: 'Premium Hunt',
    price: 1000,
    priceLabel: 'KSh 1,000',
    subtitle: 'For users who want a personalized property search.',
    includes: ['Choose up to 6 properties', 'Set your budget, type and preferred area', 'Browse homes or request a random shortlist', 'Personalized agent guidance']
  },
  {
    id: 'group_viewing',
    title: 'Group Viewing',
    price: 150,
    priceLabel: 'KSh 150 / person',
    subtitle: 'For friends, couples or roommates.',
    includes: ['Multiple participants', 'Shared viewing', 'One booking', 'Property comparison']
  }
];

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const formatDistance = (km) => {
  if (km === null || km === undefined) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
};

const profilePhone = (profile = {}) => profile.phone || profile.phoneNumber || profile.mobile || profile.mobileNumber ||
  profile.contactNumber || profile.phone_number || profile.contact?.phone || profile.contact?.phoneNumber ||
  profile.contactInfo?.phone || profile.contactInfo?.phoneNumber || profile.personalInfo?.phone ||
  profile.buyerProfile?.phone || profile.profile?.phone || '';

const MIN_VIEWING_NOTICE_DAYS = 24;
function getMinimumViewingDateEAT() {
  const eatNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const minDate = new Date(Date.UTC(
    eatNow.getUTCFullYear(), eatNow.getUTCMonth(), eatNow.getUTCDate() + MIN_VIEWING_NOTICE_DAYS
  ));
  return minDate.toISOString().slice(0, 10);
}

export default function SiteSeeingPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const checkoutMode = location.pathname.endsWith('/checkout') || searchParams.get('step') === 'checkout';
  const requestedPackageId = searchParams.get('packageId') || '';
  const initialPropertyId = searchParams.get('propertyId') || '';
  const completionBookingId = searchParams.get('bookingId') || null;
  const completionPackageId = searchParams.get('packageId') || null;
  const completionParticipantCount = Number(searchParams.get('participantCount') || 1);
  const completionPropertyIds = (searchParams.get('propertyIds') || '').split(',').filter(Boolean);

  const [properties, setProperties] = useState([]);
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  // Discovery state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [scanResultText, setScanResultText] = useState('');

  // Selected property & package for booking modal
  const [activeProperty, setActiveProperty] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bookingMode, setBookingMode] = useState('availability_check');
  const [tourPropertyIds, setTourPropertyIds] = useState([]);
  const [tourSelectionMode, setTourSelectionMode] = useState('browse');
  const [tourPropertyType, setTourPropertyType] = useState('');
  const [tourMinRent, setTourMinRent] = useState('');
  const [tourMaxRent, setTourMaxRent] = useState('');
  const [groupParticipantCount, setGroupParticipantCount] = useState(2);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [preferredViewingDate, setPreferredViewingDate] = useState('');
  const [preferredViewingTime, setPreferredViewingTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const bookingPhoneEdited = useRef(false);
  const [profileContactPhone, setProfileContactPhone] = useState('');
  const [profileContactLoading, setProfileContactLoading] = useState(false);
  const paymentDetailsRef = useRef(null);

  const savedContactPhone = profileContactPhone || userProfile?.phone || userProfile?.phoneNumber || userProfile?.mobile ||
    userProfile?.mobileNumber || userProfile?.contactNumber || userProfile?.phone_number || userProfile?.contact?.phone ||
    userProfile?.contact?.phoneNumber || userProfile?.contactInfo?.phone || userProfile?.contactInfo?.phoneNumber ||
    userProfile?.personalInfo?.phone || userProfile?.buyerProfile?.phone || userProfile?.profile?.phone ||
    currentUser?.phoneNumber || currentUser?.phone || '';
  const bookingPhoneValue = bookingPhoneEdited.current
    ? bookingPhone
    : (bookingPhone || savedContactPhone);

  const isGroupViewingPackage = selectedPackage?.id === 'group_viewing';
  const bookingTotal = selectedPackage
    ? getSiteSeeingPackagePrice(selectedPackage) * (isGroupViewingPackage ? groupParticipantCount : 1)
    : 0;
  const bookingDeposit = 1;

  useEffect(() => {
    if (!completionBookingId || !completionPackageId || !packages.length) return;
    const savedPackage = packages.find((item) => String(item.id) === String(completionPackageId));
    if (savedPackage) setSelectedPackage(savedPackage);
    if (completionPropertyIds.length) setTourPropertyIds(completionPropertyIds);
    if (Number.isInteger(completionParticipantCount) && completionParticipantCount >= 1 && completionParticipantCount <= 10) {
      setGroupParticipantCount(completionParticipantCount);
    }
  }, [completionBookingId, completionPackageId, completionParticipantCount, completionPropertyIds.join(','), packages]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setProfileContactPhone('');
      setProfileContactLoading(false);
      return;
    }

    let active = true;
    setProfileContactPhone('');
    setProfileContactLoading(true);
    getDoc(doc(db, 'users', currentUser.uid))
      .then((profileSnap) => {
        if (!active || !profileSnap.exists()) return;
        const profile = profileSnap.data() || {};
        const phone = profilePhone(profile);
        if (phone) setProfileContactPhone(String(phone));
        setBookingName(profile.name || profile.fullName || profile.displayName || currentUser.displayName || '');
      })
      .catch((error) => console.warn('Could not load saved booking contact:', error))
      .finally(() => {
        if (active) setProfileContactLoading(false);
      });

    return () => { active = false; };
  }, [currentUser?.uid]);

  useEffect(() => {
    // Auth profile data can arrive after the user opens the booking form.
    if (selectedPackage && savedContactPhone && !bookingPhoneEdited.current) {
      setBookingPhone(savedContactPhone);
    }
  }, [selectedPackage, savedContactPhone]);

  const selectViewingPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg.id === 'student_hunt') {
      setTourPropertyType('student-housing');
      setTourPropertyIds([]);
      setTourSelectionMode('browse');
    } else if (pkg.id === 'property_hunt') {
      setTourPropertyType('');
      setTourPropertyIds(activeProperty ? [activeProperty.id] : []);
      setTourSelectionMode('browse');
    } else if (['premium_hunt'].includes(pkg.id) && activeProperty && !tourPropertyIds.length) {
      setTourPropertyIds([activeProperty.id]);
    }
    if (!bookingPhoneEdited.current && savedContactPhone) {
      setBookingPhone(savedContactPhone);
    }
    if (!bookingName) setBookingName(userProfile?.name || userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || '');
    const params = new URLSearchParams(searchParams);
    params.set('step', 'checkout');
    params.set('packageId', pkg.id);
    if (activeProperty?.id) params.set('propertyId', activeProperty.id);
    navigate(`/site-seeing/checkout?${params.toString()}`);
  };

  const fetchProfilePhone = async () => {
    if (!currentUser?.uid) return toast.error('Log in to fetch your saved contact number.');
    setProfileContactLoading(true);
    try {
      const profileSnap = await getDoc(doc(db, 'users', currentUser.uid));
      const phone = profilePhone(profileSnap.exists() ? profileSnap.data() : {});
      if (!phone) return toast.error('No phone number is saved in your profile yet. Enter one here or add it to your profile.');
      setProfileContactPhone(String(phone));
      setBookingPhone(String(phone));
      bookingPhoneEdited.current = false;
      toast.success('Saved profile number added to M-Pesa number.');
    } catch (error) {
      console.warn('Could not fetch saved booking contact:', error);
      toast.error('Could not fetch your profile number. Please enter it manually.');
    } finally {
      setProfileContactLoading(false);
    }
  };

  const closeViewingModal = () => {
    setActiveProperty(null);
    setSelectedPackage(null);
    setBookingMode('availability_check');
    setBookingPhone('');
    setBookingName('');
    setPreferredViewingDate('');
    setPreferredViewingTime('');
    setBookingNote('');
    bookingPhoneEdited.current = false;
  };

  useEffect(() => {
    // Load properties from Firestore
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const allProperties = snapshot.docs.map(propertyDoc => ({ id: propertyDoc.id, ...propertyDoc.data() }));
      const list = allProperties.filter(isApprovedProperty);
      setProperties(list);
      setLoading(false);
      if (initialPropertyId) {
        // Deep links should still resolve the requested property if it is not
        // currently included in the public browse list.
        const found = allProperties.find(p => p.id === initialPropertyId);
        if (found) setActiveProperty(found);
      }
    }, (err) => {
      console.error('Error fetching properties:', err);
      setLoading(false);
    });

    // Load admin sightseeing packages if available
    const unsubPkgs = onSnapshot(collection(db, 'sightseeingPackages'), (snapshot) => {
      if (!snapshot.empty) {
        const customPkgs = snapshot.docs.map(d => {
          const data = d.data() || {};
          const defaults = DEFAULT_PACKAGES.find((pkg) => pkg.id === d.id);
          if (d.id === 'quick_view' || String(data.title || '').toLowerCase() === 'quick view') {
            return { ...data, id: 'quick_view', price: 100, priceLabel: 'KSh 100' };
          }
          return {
            ...(defaults || {}),
            ...data,
            id: d.id,
            ...(defaults && ['student_hunt', 'property_hunt'].includes(d.id)
              ? { subtitle: defaults.subtitle, includes: defaults.includes }
              : {}),
          };
        });
        customPkgs.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
        setPackages(customPkgs);
      }
    }, () => {});

    return () => {
      unsubProps();
      unsubPkgs();
    };
  }, [initialPropertyId]);

  useEffect(() => {
    if (!checkoutMode || !requestedPackageId || !packages.length) return;
    const requested = packages.find((pkg) => String(pkg.id) === requestedPackageId);
    if (!requested || selectedPackage?.id === requested.id) return;
    setSelectedPackage(requested);
    if (requested.id === 'student_hunt') setTourPropertyType('student-housing');
  }, [checkoutMode, requestedPackageId, packages]);

  // Scan My Area (Geolocation)
  const handleScanMyArea = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setScanning(true);
    setScanResultText('Scanning your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setScanning(false);
        setScanResultText(`Location detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        toast.success('Successfully scanned area around you!');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setScanning(false);
        setScanResultText('Could not get precise GPS location. Try searching an area instead.');
        toast.error('Location scan failed. Please enable location permissions.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Filter properties based on search query, selected area, or proximity
  const filteredProperties = properties.filter(prop => {
    const locText = `${prop.location || ''} ${prop.title || ''} ${prop.county || ''} ${prop.subCounty || ''} ${prop.ward || ''} ${prop.estate || ''}`.toLowerCase();
    
    if (selectedArea) {
      const matchCounty = selectedArea.county && locText.includes(selectedArea.county.toLowerCase());
      const matchWard = selectedArea.ward && locText.includes(selectedArea.ward.toLowerCase());
      const matchArea = selectedArea.area && locText.includes(selectedArea.area.toLowerCase());
      if (!matchCounty && !matchWard && !matchArea) return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!locText.includes(query)) return false;
    }

    return true;
  }).map(prop => {
    let distance = null;
    const coords = prop.coordinates || prop.approxLocation?.coordinates;
    if (userLocation && coords && coords.lat && coords.lng) {
      distance = calculateDistanceKm(userLocation.latitude, userLocation.longitude, coords.lat, coords.lng);
    }
    return { ...prop, distanceKm: distance };
  }).sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    return 0;
  });

  const isMultiPropertyPackage = ['student_hunt', 'property_hunt', 'premium_hunt'].includes(selectedPackage?.id);
  const tourLimit = selectedPackage?.id === 'premium_hunt' ? 6 : 4;
  const tourCandidates = filteredProperties.filter((property) => {
    const propertyType = String(property.type || property.propertyType || property.category || '').toLowerCase();
    const bedrooms = Number(property.bedrooms || 0);
    const typeMatches = !tourPropertyType || (
      tourPropertyType === 'student-housing' ? /student|hostel|bedsitter|studio|single.?room|shared.?house|shared.?room|bed.?space/.test(`${propertyType} ${property.unitType || ''} ${property.roomType || ''}`) :
      tourPropertyType === 'bedsitter' ? /bedsitter|studio/.test(propertyType) || bedrooms <= 0 :
      tourPropertyType === 'single-room' ? /single.?room|hostel/.test(propertyType) :
      tourPropertyType === '1-bedroom' ? bedrooms === 1 || /1.?bed/.test(propertyType) :
      tourPropertyType === '2-bedroom' ? bedrooms === 2 || /2.?bed/.test(propertyType) :
      tourPropertyType === '3-bedroom' ? bedrooms >= 3 || /3.?bed|family/.test(propertyType) :
      propertyType.includes(tourPropertyType)
    );
    const rent = Number(property.price || property.monthlyRent || property.rentAmount || 0);
    return typeMatches && (!tourMinRent || rent >= Number(tourMinRent)) && (!tourMaxRent || rent <= Number(tourMaxRent));
  });

  const toggleTourProperty = (property) => {
    if (tourPropertyIds.includes(property.id)) {
      const remainingIds = tourPropertyIds.filter((id) => id !== property.id);
      setTourPropertyIds(remainingIds);
      if (activeProperty?.id === property.id && remainingIds.length) {
        setActiveProperty(properties.find((candidate) => candidate.id === remainingIds[0]) || activeProperty);
      }
    } else {
      if (tourPropertyIds.length >= tourLimit) {
        toast.error(`This package includes up to ${tourLimit} properties.`);
        return;
      }
      setTourPropertyIds([...tourPropertyIds, property.id]);
      setActiveProperty(property);
    }
    setTourSelectionMode('browse');
  };

  const chooseRandomTour = () => {
    const shuffled = [...tourCandidates].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, tourLimit);
    if (!picks.length) {
      toast.error('No approved properties match those filters. Try a wider rent range or another type.');
      return;
    }
    setTourPropertyIds(picks.map((property) => property.id));
    setActiveProperty(picks[0]);
    setTourSelectionMode('random');
    toast.success(`${picks.length} matching properties added to your tour.`);
  };

  const handleBookViewing = async () => {
    if (!currentUser) {
      toast.error('Please log in before requesting a viewing');
      navigate('/login', { state: { from: `/site-seeing?propertyId=${encodeURIComponent(activeProperty?.id || '')}` } });
      return;
    }
    const tourProperties = isMultiPropertyPackage
      ? properties.filter((property) => tourPropertyIds.includes(property.id))
      : activeProperty ? [activeProperty] : [];
    if (!tourProperties.length || !selectedPackage) {
      toast.error('Please select a property and a site seeing package');
      return;
    }
    const packageTotal = bookingTotal;
    const deposit = completionBookingId ? bookingTotal : bookingMode === 'direct_booking' ? bookingTotal : bookingDeposit;
    if (!packageTotal || deposit < 1) {
      toast.error('Choose a valid viewing package.');
      return;
    }
    if (!bookingPhoneValue.trim()) {
      toast.error('Enter the M-Pesa phone number for the booking deposit.');
      return;
    }
    const needsViewingSlot = !completionBookingId && bookingMode === 'direct_booking';
    if (!bookingName.trim() || (needsViewingSlot && (!preferredViewingDate || !preferredViewingTime))) {
      toast.error(needsViewingSlot
        ? 'Complete your name and preferred viewing date and time before paying.'
        : 'Enter your name before paying.');
      return;
    }
    setBookingLoading(true);
    try {
      const customerName = bookingName.trim();
      const customerPhone = bookingPhoneValue.trim();
      const result = await bookSiteSeeingWithDeposit({
        property: activeProperty,
        properties: tourProperties,
        package: selectedPackage,
        phoneNumber: customerPhone,
        buyerName: customerName,
        buyerEmail: currentUser.email,
        preferredViewingDate,
        preferredViewingTime,
        bookingNote: bookingNote.trim(),
        participantCount: isGroupViewingPackage ? groupParticipantCount : 1,
        tourPreferences: isMultiPropertyPackage ? {
          selectionMode: tourSelectionMode,
          propertyType: tourPropertyType || 'any',
          minMonthlyRent: tourMinRent ? Number(tourMinRent) : null,
          maxMonthlyRent: tourMaxRent ? Number(tourMaxRent) : null,
          area: selectedArea?.area || selectedArea?.ward || selectedArea?.county || searchQuery || null,
        } : null,
        completionBookingId,
        bookingMode: completionBookingId ? 'availability_check' : bookingMode,
      });
      if (completionBookingId && !result.completionPayment) {
        toast('Viewing request saved. WhatsApp could not be queued for one or both parties; verify both phone numbers.', { icon: '⚠️' });
      } else {
        toast.success(completionBookingId || bookingMode === 'direct_booking'
          ? `Booking ${result.bookingId} paid. The agent will send meeting details by WhatsApp.`
          : `Booking request received. An admin will update you on WhatsApp within 12 hours after the vacancy check. The KSh 1 test service fee is non-refundable.`);
      }
      closeViewingModal();
      setTourPropertyIds([]);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to record booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <main className="mmx-liquid-canvas min-h-screen overflow-hidden pb-24 text-slate-900">
      {/* Transport-matching Dark Hero Header */}
      {!checkoutMode && <section className="mmx-glass-surface-dark relative isolate overflow-hidden rounded-b-[2.8rem] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_25%,rgba(52,211,153,0.22)_0%,rgba(15,23,42,0)_100%)]" />
        <div className="container mx-auto px-4 pt-12 pb-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md mb-4 border border-emerald-400/30">
              <Compass className="w-4 h-4" /> MarketMix Site Seeing
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-4xl font-medium leading-[1.08] tracking-[-0.035em] sm:text-6xl">Discover &amp; Visit Properties in Person</h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300">
              Explore homes, apartments, and land across Kenya with guided site seeing tours, quick view passes, and expert agent assistance.
            </p>

            {/* Discovery Controls */}
            <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search area (e.g. Nakuru CBD, Kaptembwo, Karen, Kilimani)..."
                  className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-300 outline-none backdrop-blur-md focus:border-emerald-400 shadow-lg"
                />
              </div>
                        <button
                onClick={handleScanMyArea}
                disabled={scanning}
                className="mmx-liquid-primary inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 shrink-0"
              >
                {scanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Crosshair className="h-5 w-5" />}
                <span>{scanning ? 'Scanning...' : 'Scan My Area'}</span>
              </button>
            </div>

            {scanResultText && (
              <p className="mt-3 text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {scanResultText}
              </p>
            )}
          </div>
        </div>
      </section>}

      {/* Content Container */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Property Results Section */}
        {!checkoutMode && <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-3xl font-medium text-slate-900 tracking-tight">
                {userLocation ? 'Properties near you' : searchQuery || selectedArea ? 'Filtered Properties' : 'Available Properties for Site Seeing'}
              </h2>
              <p className="text-xs text-slate-500">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
                {userLocation ? ' sorted by proximity' : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-700" />
              <p className="mt-3 text-xs text-slate-500">Loading properties...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="mmx-glass-surface rounded-3xl border border-slate-200 p-12 text-center bg-white/70 backdrop-blur-md">
              <Building className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No properties found here</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                We couldn't find any properties matching your current search or location scan. Try searching another area like Nakuru CBD or Nairobi.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map(prop => {
                const img = resolvePropertyImage(prop);
                const distStr = formatDistance(prop.distanceKm);
                return (
                  <motion.div
                    key={prop.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mmx-glass-surface group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative h-48 overflow-hidden bg-slate-100">
                        <img
                          src={img || '/images/property-hero.svg'}
                          alt={prop.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 flex gap-2">
                          <span className="rounded-full bg-black/65 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                            {prop.type || prop.category || 'Property'}
                          </span>
                          {distStr && (
                            <span className="rounded-full bg-emerald-700/95 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                              {distStr}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-xl font-medium text-slate-900 line-clamp-1">{prop.title}</h3>
                          <span className="text-base font-extrabold text-emerald-800 shrink-0">
                            KSh {Number(prop.price || 0).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{prop.location || 'Kenya'}</span>
                        </p>

                        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                          {prop.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5 text-slate-400" /> {prop.bedrooms} Beds</span>}
                          {prop.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-slate-400" /> {prop.bathrooms} Baths</span>}
                          {prop.area && <span className="flex items-center gap-1"><Square className="h-3.5 w-3.5 text-slate-400" /> {prop.area} sqft</span>}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <button
                        onClick={() => { setActiveProperty(prop); setTourPropertyIds([prop.id]); }}
                        className="w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow transition hover:bg-slate-800 flex items-center justify-center gap-2"
                      >
                        <span>View Property & Choose Package</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>}

        {/* Property & Package Selection Modal */}
        <AnimatePresence>
          {activeProperty && (
            <div className={checkoutMode ? 'mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10' : 'fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm overflow-y-auto'}>
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className={`relative w-full max-w-3xl bg-white p-6 sm:p-8 shadow-2xl pb-6 ${checkoutMode ? 'mx-auto rounded-3xl' : 'rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-y-auto'}`}
              >
                <button
                  onClick={() => checkoutMode ? navigate(`/site-seeing?propertyId=${encodeURIComponent(activeProperty?.id || '')}`) : closeViewingModal()}
                  className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 z-10"
                >
                  ✕
                </button>

                {/* Property Selector Dropdown */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Property to Visit</label>
                  <select
                    value={activeProperty?.id || ''}
                    onChange={(e) => {
                      const found = properties.find(p => p.id === e.target.value);
                      if (found) setActiveProperty(found);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} — KSh {Number(p.price || 0).toLocaleString()} ({p.location || 'Kenya'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start border-b border-slate-100 pb-6">
                  <img
                    src={resolvePropertyImage(activeProperty) || '/images/property-hero.svg'}
                    alt=""
                    className="h-36 w-full sm:w-48 object-cover rounded-2xl shrink-0"
                  />
                  <div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                      {activeProperty.type || 'Property'}
                    </span>
                    <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-3xl font-medium text-slate-900 mt-2 tracking-tight">{activeProperty.title}</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4 text-emerald-700" /> {activeProperty.location}
                    </p>
                    <p className="text-xl font-extrabold text-emerald-800 mt-2">
                      KSh {Number(activeProperty.price || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">/ month</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-extrabold text-slate-900">Want to see this property?</h3>
                  {checkoutMode ? (
                    <>
                      <p className="mt-1 text-sm text-slate-600">Package selected: <strong className="text-slate-900">{selectedPackage?.title}</strong> · KSh {bookingTotal.toLocaleString()}</p>
                      {selectedPackage && !completionBookingId && <fieldset className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                        <legend className="mb-2 text-sm font-extrabold text-slate-900">Choose how to continue</legend>
                        <motion.button type="button" whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} onClick={() => setBookingMode('availability_check')} style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className={`min-w-0 rounded-2xl border p-3 text-left shadow-md transition-colors sm:p-5 ${bookingMode === 'availability_check' ? 'border-[#6f4e37] bg-[#6f4e37] text-white ring-2 ring-[#d6c0a8]' : 'border-[#d6c0a8] bg-[#fbf7f2] text-[#392719] hover:border-[#8b6548]'}`}>
                          <span className="block text-xs font-bold leading-snug sm:text-base">Check vacancy first · KSh 1 test</span><span className={`mt-2 block font-sans text-[10px] leading-snug sm:text-xs sm:leading-relaxed ${bookingMode === 'availability_check' ? 'text-[#f2e8dc]' : 'text-[#705b49]'}`}>Pay the non-refundable KSh 1 test fee for the agent to check vacancy and availability with the landlord. We’ll update you within 12 hours; if available, an admin will send you a link to pay for the site visit package.</span>
                        </motion.button>
                        <motion.button type="button" whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} onClick={() => setBookingMode('direct_booking')} style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className={`min-w-0 rounded-2xl border p-3 text-left shadow-md transition-colors sm:p-5 ${bookingMode === 'direct_booking' ? 'border-[#6f4e37] bg-[#6f4e37] text-white ring-2 ring-[#d6c0a8]' : 'border-[#d6c0a8] bg-[#fbf7f2] text-[#392719] hover:border-[#8b6548]'}`}>
                          <span className="block text-xs font-bold leading-snug sm:text-base">Book the site visit · KSh {bookingTotal.toLocaleString()}</span><span className={`mt-2 block font-sans text-[10px] leading-snug sm:text-xs sm:leading-relaxed ${bookingMode === 'direct_booking' ? 'text-[#f2e8dc]' : 'text-[#705b49]'}`}>Pay for the site visit now and we’ll coordinate with the agent. This pays for the visit only; vacancy and getting the property are not guaranteed.</span>
                        </motion.button>
                      </fieldset>}
                    </>
                  ) : <p className="text-xs text-slate-500">Choose your viewing experience from our site seeing packages below.</p>}

                  {!checkoutMode && <div className="mt-4 grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Choose a site-seeing package">
                    {packages.map(pkg => {
                      const packageKey = pkg.id || pkg.title;
                      const isSelected = (selectedPackage?.id || selectedPackage?.title) === packageKey;
                      return (
                        <div
                          key={packageKey}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => selectViewingPackage(pkg)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              selectViewingPackage(pkg);
                            }
                          }}
                          className={`cursor-pointer rounded-2xl border-2 p-5 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 ${
                            isSelected ? 'border-emerald-700 bg-gradient-to-br from-white via-emerald-50 to-emerald-100/70 ring-4 ring-emerald-100 shadow-xl shadow-emerald-900/10' : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg hover:shadow-slate-900/5'
                          }`}
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                          <div className="mb-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${pkg.id === 'student_hunt' ? 'bg-sky-100 text-sky-800' : pkg.id === 'property_hunt' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{pkg.id === 'student_hunt' ? 'Student accommodation' : pkg.id === 'property_hunt' ? 'All home types' : 'Viewing package'}</span></div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-semibold tracking-tight text-slate-950">{pkg.title}</h4>
                              <p className="mt-1 text-sm leading-relaxed text-slate-600">{pkg.subtitle}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {isSelected ? 'Selected' : 'Choose'}
                            </span>
                          </div>

                          <div className="mt-4 rounded-xl border border-slate-100 bg-white/80 px-3.5 py-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Package price</p>
                              <p className="mt-0.5 text-xl font-black tracking-tight text-slate-950">
                                <span className="mr-1 text-xs font-bold text-slate-500">KSh</span>{getSiteSeeingPackagePrice(pkg).toLocaleString()}
                                {pkg.id === 'group_viewing' && <span className="ml-1 text-xs font-semibold text-slate-500">/ person</span>}
                              </p>
                            </div>
                          </div>

                          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                            {(pkg.includes || []).map((inc, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100"><Check className="h-2.5 w-2.5 text-emerald-800" /></span>
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3">
                            <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-500'}`}>{isSelected ? 'Ready to book' : 'Select this package'}</span>
                            <ArrowRight className={`h-4 w-4 transition-transform ${isSelected ? 'translate-x-1 text-emerald-800' : 'text-slate-400'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>}
                  {isMultiPropertyPackage && (
                    <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5" aria-label="Build your property tour">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">{selectedPackage?.id === 'student_hunt' ? 'Find student accommodation' : selectedPackage?.id === 'property_hunt' ? 'Compare homes' : 'Build your property tour'}</h4>
                          <p className="mt-1 text-xs text-slate-600">{selectedPackage?.id === 'student_hunt' ? 'Showing student hostels, bedsitters, studios, single rooms and shared housing. Set a rent budget and area, then choose up to 4.' : selectedPackage?.id === 'property_hunt' ? 'Search across all approved home types, set your rent range and compare up to 4 options.' : `Browse and add up to ${tourLimit} homes, or let us pick a random shortlist that matches your filters.`}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-900">{tourPropertyIds.length}/{tourLimit} selected</span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <label className="text-xs font-bold text-slate-700">Property type
                          <select value={tourPropertyType} onChange={(e) => setTourPropertyType(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium">
                            <option value="">Any type</option><option value="student-housing">Student accommodation</option><option value="bedsitter">Bedsitter / studio</option><option value="single-room">Single room / hostel</option><option value="1-bedroom">1 bedroom</option><option value="2-bedroom">2 bedrooms</option><option value="3-bedroom">3+ bedrooms</option>
                          </select>
                        </label>
                        <label className="text-xs font-bold text-slate-700">Monthly rent from (KSh)
                          <input type="number" min="0" value={tourMinRent} onChange={(e) => setTourMinRent(e.target.value)} placeholder="No minimum" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium" />
                        </label>
                        <label className="text-xs font-bold text-slate-700">Monthly rent to (KSh)
                          <input type="number" min="0" value={tourMaxRent} onChange={(e) => setTourMaxRent(e.target.value)} placeholder="No maximum" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium" />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-600">{tourCandidates.length} matching approved {tourCandidates.length === 1 ? 'home' : 'homes'} · area follows your search above{selectedArea?.area ? ` (${selectedArea.area})` : ''}</p>
                        <button type="button" onClick={chooseRandomTour} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900">Pick a random shortlist</button>
                      </div>
                      <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                        {tourCandidates.map((property) => {
                          const chosen = tourPropertyIds.includes(property.id);
                          return <button type="button" key={property.id} onClick={() => toggleTourProperty(property)} className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left ${chosen ? 'border-emerald-600 bg-white ring-2 ring-emerald-100' : 'border-slate-200 bg-white/80 hover:border-emerald-400'}`}>
                            <span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-900">{property.title || 'Property'}</span><span className="block truncate text-xs text-slate-500">{property.location || property.type || 'Kenya'} · KSh {Number(property.price || property.monthlyRent || property.rentAmount || 0).toLocaleString()}/month</span></span>
                            <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${chosen ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>{chosen ? 'Added' : 'Add'}</span>
                          </button>;
                        })}
                        {!tourCandidates.length && <p className="col-span-full rounded-xl bg-white p-4 text-xs text-slate-500">No properties match those filters. Adjust the home type, rent range or area.</p>}
                      </div>
                    </section>
                  )}
                  {!checkoutMode && (selectedPackage ? (
                    <div aria-live="polite" className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                      <p className="font-bold">{selectedPackage.title} selected · Package total KSh {bookingTotal.toLocaleString()}</p>
                      <p className="mt-2 leading-relaxed">Choose whether to pay KSh 1 for an admin-coordinated vacancy check, or pay for your package and arrange a visit without a vacancy guarantee.</p>
                    </div>
                  ) : (
                    <p aria-live="polite" className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                      Select a package above to see your price and booking details.
                    </p>
                  ))}
                </div>

                {selectedPackage && !completionBookingId && !checkoutMode && <fieldset className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                  <legend className="mb-2 text-sm font-extrabold text-slate-900">Choose how to continue</legend>
                  <motion.button type="button" whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} onClick={() => setBookingMode('availability_check')} style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className={`min-w-0 rounded-2xl border p-3 text-left shadow-md transition-colors sm:p-5 ${bookingMode === 'availability_check' ? 'border-[#6f4e37] bg-[#6f4e37] text-white ring-2 ring-[#d6c0a8]' : 'border-[#d6c0a8] bg-[#fbf7f2] text-[#392719] hover:border-[#8b6548]'}`}>
                    <span className="block text-xs font-bold leading-snug sm:text-base">Check vacancy first · KSh 1 test</span><span className={`mt-2 block font-sans text-[10px] leading-snug sm:text-xs sm:leading-relaxed ${bookingMode === 'availability_check' ? 'text-[#f2e8dc]' : 'text-[#705b49]'}`}>Pay the non-refundable KSh 1 test fee for the agent to check vacancy and availability with the landlord. We’ll update you within 12 hours; if available, an admin will send you a link to pay for the site visit package.</span>
                  </motion.button>
                  <motion.button type="button" whileHover={{ y: -4, scale: 1.015 }} whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} onClick={() => setBookingMode('direct_booking')} style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className={`min-w-0 rounded-2xl border p-3 text-left shadow-md transition-colors sm:p-5 ${bookingMode === 'direct_booking' ? 'border-[#6f4e37] bg-[#6f4e37] text-white ring-2 ring-[#d6c0a8]' : 'border-[#d6c0a8] bg-[#fbf7f2] text-[#392719] hover:border-[#8b6548]'}`}>
                    <span className="block text-xs font-bold leading-snug sm:text-base">Book the site visit · KSh {bookingTotal.toLocaleString()}</span><span className={`mt-2 block font-sans text-[10px] leading-snug sm:text-xs sm:leading-relaxed ${bookingMode === 'direct_booking' ? 'text-[#f2e8dc]' : 'text-[#705b49]'}`}>Pay for the site visit now and we’ll coordinate with the agent. This pays for the visit only; vacancy and getting the property are not guaranteed.</span>
                  </motion.button>
                </fieldset>}

                {isGroupViewingPackage && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <label htmlFor="group-participant-count" className="block text-sm font-bold text-slate-900">How many people are viewing together?</label>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <select id="group-participant-count" value={groupParticipantCount} onChange={(event) => setGroupParticipantCount(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold">
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'person' : 'people'}</option>)}
                      </select>
                      <p className="text-xs text-slate-600">KSh {getSiteSeeingPackagePrice(selectedPackage).toLocaleString()} per person · Package total KSh {bookingTotal.toLocaleString()} · KSh 1 test consultation fee now</p>
                    </div>
                  </div>
                )}

                {selectedPackage && <section ref={paymentDetailsRef} className="mt-5 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Booking details">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-800">Next · Booking details</p>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="mt-1 text-xl font-medium tracking-tight text-slate-950">{bookingMode === 'direct_booking' && !completionBookingId ? 'Tell us when and how to reach you' : 'How can we reach you?'}</h3>
                  <p className="mt-1 text-xs text-slate-600">{bookingMode === 'direct_booking' && !completionBookingId ? 'Choose a preferred viewing slot for the agent to coordinate.' : 'Add your name so the agent can follow up about availability.'}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-slate-700">Your name
                      <input required value={bookingName} onChange={(event) => setBookingName(event.target.value)} autoComplete="name" placeholder="Full name" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                    </label>
                    {bookingMode === 'direct_booking' && !completionBookingId && <label className="text-xs font-bold text-slate-700">Preferred viewing date
                      <input required type="date" min={getMinimumViewingDateEAT()} value={preferredViewingDate} onChange={(event) => setPreferredViewingDate(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                      <span className="mt-1 block text-[11px] font-normal text-slate-500">Choose a date at least 24 days away so we can arrange with the agent.</span>
                    </label>}
                    {bookingMode === 'direct_booking' && !completionBookingId && <label className="text-xs font-bold text-slate-700">Preferred time
                      <input required type="time" value={preferredViewingTime} onChange={(event) => setPreferredViewingTime(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                    </label>}
                    <label className="text-xs font-bold text-slate-700 sm:col-span-2">Anything the agent should know? <span className="font-normal text-slate-500">(optional)</span>
                      <textarea value={bookingNote} onChange={(event) => setBookingNote(event.target.value)} rows={2} maxLength={500} placeholder="Access needs, questions, or useful details" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-normal outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                    </label>
                  </div>
                </section>}

                {selectedPackage && <div className="mt-5 scroll-mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white shadow-lg shadow-emerald-900/5">
                  <div className="border-b border-emerald-100 px-5 py-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-800">Then · Secure your viewing</p>
                    <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="mt-1 text-xl font-medium tracking-tight text-slate-950">{completionBookingId || bookingMode === 'direct_booking' ? 'Pay for your package' : 'Pay consultation fee'}</h3>
                    <p className="mt-1 text-xs text-slate-600">We’ll send an M-Pesa prompt to the number below.</p>
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div>
                      <div className="flex items-center justify-between gap-2"><label htmlFor="booking-mpesa-phone" className="block text-xs font-bold text-slate-700">M-Pesa number</label><button type="button" onClick={fetchProfilePhone} disabled={profileContactLoading} className="text-[11px] font-bold text-emerald-800 underline disabled:opacity-50">{profileContactLoading ? 'Fetching…' : 'Fetch from profile'}</button></div>
                      <input id="booking-mpesa-phone" type="tel" value={bookingPhoneValue} onChange={(event) => { bookingPhoneEdited.current = true; setBookingPhone(event.target.value); }} placeholder="07XXXXXXXX" autoComplete="tel" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
                      <p className="mt-1.5 text-[11px] text-slate-500" aria-live="polite">
                        {savedContactPhone && !bookingPhoneEdited.current
                          ? 'Using your saved contact number. You can change it before booking.'
                          : profileContactLoading && !bookingPhoneEdited.current
                            ? 'Checking your saved profile contact…'
                          : 'Enter the phone number that should receive the M-Pesa payment prompt.'}
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{completionBookingId ? 'This completes payment for your selected package.' : bookingMode === 'direct_booking' ? 'This payment covers the site visit only. Vacancy and getting the property are not guaranteed.' : 'The non-refundable KSh 1 test fee pays for an agent vacancy and availability check. We’ll update you within 12 hours; if available, an admin will send a separate link to pay for the site visit package.'}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-950 px-4 py-3 text-white sm:min-w-40">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">{completionBookingId || bookingMode === 'direct_booking' ? 'Package payment' : 'Availability-check fee'}</p>
                      <p className="mt-0.5 text-2xl font-black tracking-tight">KSh {(completionBookingId || bookingMode === 'direct_booking' ? bookingTotal : bookingDeposit).toLocaleString()}</p>
                      <p className="mt-1 text-[10px] text-emerald-100">{completionBookingId || bookingMode === 'direct_booking' ? 'Paid before the visit' : 'Non-refundable service fee'}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-4">
                    <Link to="/help" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 underline">Questions? Message customer help <ArrowRight className="h-3 w-3" /></Link>
                  </div>
                </div>}

                <div className="sticky bottom-0 z-20 -mx-6 mt-5 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
                  <button
                    onClick={() => checkoutMode ? navigate(`/site-seeing?propertyId=${encodeURIComponent(activeProperty?.id || '')}`) : closeViewingModal()}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedPackage || bookingLoading}
                    onClick={handleBookViewing}
                    className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow transition hover:opacity-95 disabled:opacity-50"
                  >
                    {bookingLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{bookingLoading ? 'Waiting for M-Pesa confirmation…' : selectedPackage ? (completionBookingId || bookingMode === 'direct_booking' ? `Pay KSh ${bookingTotal.toLocaleString()}` : 'Pay KSh 1 test fee and check vacancy') : 'Select a Package'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
