// src/pages/SiteSeeingPage.jsx - Site Seeing Feature for MarketMix Real Estates
// Reuses Transport Page UI language (Liquid Glass, glass-surface-dark hero header, cards, location logic)

import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, addDoc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, MapPin, Search, Crosshair, Check, ChevronRight, Building, Bed, Bath, Square, Loader2, ArrowRight, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import KenyaLocationSearch from '../components/moving/KenyaLocationSearch';
import KenyaAreaPicker from '../components/moving/KenyaAreaPicker';
import CoordinateMapPicker from '../components/moving/CoordinateMapPicker';
import '../components/moving/LiquidGlass.css';
import { resolvePropertyImage, getPublicPropertyLocation } from '../utils/propertyMapping';
import { reverseGeocodeKenyaPoint } from '../utils/transportLocationLookup';
import TestPaymentModal from '../components/TestPaymentModal';

const DEFAULT_PACKAGES = [
  {
    id: 'quick_view',
    title: 'Quick View',
    price: 100,
    priceLabel: 'KSh 100',
    subtitle: 'For users who are already nearby.',
    includes: ['1 property viewing', 'Scheduled confirmation', 'Basic agent assistance']
  },
  {
    id: 'assisted_view',
    title: 'Assisted View',
    price: 250,
    priceLabel: 'KSh 250',
    subtitle: 'For users who need assistance getting to the property.',
    includes: ['1 property viewing', 'Agent assistance', 'Meeting coordination', 'Scheduled viewing']
  },
  {
    id: 'student_hunt',
    title: 'Student Hunt',
    price: 300,
    priceLabel: 'KSh 300',
    subtitle: 'For students looking for accommodation.',
    includes: ['Multiple student-friendly properties', 'Single rooms & bedsitters', 'Hostel options', 'Area guidance']
  },
  {
    id: 'property_hunt',
    title: 'Property Hunt',
    price: 500,
    priceLabel: 'KSh 500',
    subtitle: 'For users who want to compare several properties.',
    includes: ['Up to 4 properties', 'Same-area property search', 'Property comparison', 'Agent guidance']
  },
  {
    id: 'premium_hunt',
    title: 'Premium Hunt',
    price: 1000,
    priceLabel: 'KSh 1,000',
    subtitle: 'For users who want a personalized property search.',
    includes: ['Up to 6 properties', 'Personalized shortlist', 'Agent assistance', 'Priority viewing']
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

export default function SiteSeeingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPropertyId = searchParams.get('propertyId') || '';

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
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    // Load properties from Firestore
    const unsubProps = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(list);
      setLoading(false);
      if (initialPropertyId) {
        const found = list.find(p => p.id === initialPropertyId);
        if (found) setActiveProperty(found);
      }
    }, (err) => {
      console.error('Error fetching properties:', err);
      setLoading(false);
    });

    // Load admin sightseeing packages if available
    const unsubPkgs = onSnapshot(collection(db, 'sightseeingPackages'), (snapshot) => {
      if (!snapshot.empty) {
        const customPkgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        customPkgs.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
        setPackages(customPkgs);
      }
    }, () => {});

    return () => {
      unsubProps();
      unsubPkgs();
    };
  }, [initialPropertyId]);

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

  const handleBookViewing = () => {
    if (!activeProperty || !selectedPackage) {
      toast.error('Please select a property and a site seeing package');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setBookingLoading(true);
    try {
      await addDoc(collection(db, 'sightseeingBookings'), {
        propertyId: activeProperty.id,
        propertyTitle: activeProperty.title,
        propertyLocation: activeProperty.location,
        packageId: selectedPackage.id,
        packageName: selectedPackage.title,
        packagePrice: selectedPackage.price || selectedPackage.priceLabel,
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'guest@marketmix.site',
        paymentStatus: 'paid',
        status: 'confirmed',
        createdAt: serverTimestamp()
      });

      toast.success(`✅ Payment verified! Site seeing tour for "${activeProperty.title}" booked & confirmed.`);
      setActiveProperty(null);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Payment verified, but failed to record booking. Contact support.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <main className="mmx-liquid-canvas min-h-screen overflow-hidden pb-24 text-slate-900">
      {/* Transport-matching Dark Hero Header */}
      <section className="mmx-glass-surface-dark relative isolate overflow-hidden rounded-b-[2.8rem] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_25%,rgba(52,211,153,0.22)_0%,rgba(15,23,42,0)_100%)]" />
        <div className="container mx-auto px-4 pt-12 pb-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md mb-4 border border-emerald-400/30">
              <Compass className="w-4 h-4" /> MarketMix Site Seeing
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Discover & Visit Properties in Person</h1>
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
      </section>

      {/* Content Container */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Property Results Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
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
                          <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{prop.title}</h3>
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
                        onClick={() => setActiveProperty(prop)}
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
        </section>

        {/* Property & Package Selection Modal */}
        <AnimatePresence>
          {activeProperty && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <button
                  onClick={() => { setActiveProperty(null); setSelectedPackage(null); }}
                  className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  ✕
                </button>

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
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{activeProperty.title}</h2>
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
                  <p className="text-xs text-slate-500">Choose your viewing experience from our site seeing packages below.</p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {packages.map(pkg => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      return (
                        <div
                          key={pkg.id || pkg.title}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`cursor-pointer rounded-2xl border p-5 transition ${
                            isSelected ? 'border-emerald-700 bg-emerald-50/50 ring-2 ring-emerald-200' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900">{pkg.title}</h4>
                            <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
                              {pkg.priceLabel || `KSh ${pkg.price}`}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{pkg.subtitle}</p>
                          <ul className="mt-3 space-y-1 text-xs text-slate-500">
                            {(pkg.includes || []).map((inc, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <Check className="h-3 w-3 text-emerald-700 shrink-0" />
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => { setActiveProperty(null); setSelectedPackage(null); }}
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
                    <span>{bookingLoading ? 'Booking...' : selectedPackage ? `Continue with ${selectedPackage.title}` : 'Select a Package'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Test Payment Modal */}
        <TestPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          title={`Pay for ${selectedPackage?.title || 'Site Seeing Package'}`}
          subtitle={`Complete KSh ${selectedPackage?.price || 100} test payment via M-Pesa to confirm your site seeing booking.`}
        />

      </div>
    </main>
  );
}
