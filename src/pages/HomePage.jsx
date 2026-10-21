// src/pages/HomePage.jsx - FULL FIXED & ENHANCED VERSION
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Search, Home, Building2, Building, TreePine, Hotel,
  ChevronRight, Star, Bed, Bath, Square, Loader, 
  Award, Users, TrendingUp, Phone, Mail, MapPin as MapPinIcon,
  Facebook, Twitter, Instagram, Linkedin, Youtube, CheckCircle, Compass, ArrowRight, MapPin, Clock3
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { resolvePropertyImage } from '../utils/propertyMapping';
import { getListingType } from '../utils/listingType';
import MovingIllustration from '../components/moving/MovingIllustration';
import '../components/moving/LiquidGlass.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [properties, setProperties] = useState([]);
  const [searchProperties, setSearchProperties] = useState([]);
  const [heroProperties, setHeroProperties] = useState([]);
  const [trendingProperties, setTrendingProperties] = useState([]);
  const [sightseeingCampaigns, setSightseeingCampaigns] = useState([]);
  const [sightseeingCampaignStats, setSightseeingCampaignStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [homepageSettings, setHomepageSettings] = useState({
    hero: {
      title: 'Discover Timeless Properties in Kenya',
      subtitle: 'Premium real estate with uncompromising standards.',
      backgroundImage: '/images/property-hero.svg',
      searchPlaceholder: 'Search properties by location or type...'
    },
    stats: [
      { number: '5,000+', label: 'Properties Listed', icon: 'Building' },
      { number: '98%', label: 'Client Satisfaction', icon: 'Star' },
      { number: '15+', label: 'Years Experience', icon: 'Award' },
      { number: '200+', label: 'Expert Agents', icon: 'Users' }
    ],
    propertyTypes: [
      { name: 'APARTMENTS', type: 'apartment', enabled: true },
      { name: 'HOUSES', type: 'house', enabled: true },
      { name: 'STUDENT HOUSING', type: 'student_hostel', enabled: true },
      { name: 'COMMERCIAL', type: 'commercial', enabled: true },
      { name: 'LAND', type: 'land', enabled: true },
      { name: 'SHORT STAYS', type: 'urbannest', enabled: true }
    ],
    cta: {
      title: 'Begin Your Property Journey',
      subtitle: 'Connect with our expert agents for personalized property consultations',
      button1Text: 'Browse Properties',
      button1Link: '/properties',
      button2Text: 'Schedule Consultation',
      button2Link: '/contact'
    },
    contactInfo: {
      email: 'info@realestate.com',
      phone: '0115988107',
      address: 'Nairobi, Kenya'
    },
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    }
  });


  const getPropertyImage = (property) => {
    return resolvePropertyImage(property) || null;
  };

  const homeHeroImage = String(homepageSettings.hero.backgroundImage || '').includes('photo-1613977257363-707ba9348227')
    ? '/images/property-hero.svg'
    : homepageSettings.hero.backgroundImage || '/images/property-hero.svg';

  // Load homepage settings from Firestore
  const loadHomepageSettings = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'homepage');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setHomepageSettings(prev => ({ ...prev, ...settingsSnap.data() }));
      }
    } catch (error) {
      console.error('Error loading homepage settings:', error);
    }
  };

  // Load ONLY approved properties and map to homepage sections based on admin choices
  const loadProperties = async () => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, where('approvalStatus', '==', 'approved'));
      const querySnapshot = await getDocs(q);
      const allApproved = querySnapshot.docs
        .map((docEntry) => ({
          id: docEntry.id,
          ...docEntry.data(),
        }))
        .filter((property) => {
          const status = property.approvalStatus || property.verificationStatus;
          return status === 'approved';
        });

      const sortedProperties = allApproved.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setSearchProperties(sortedProperties);

      // Filter by admin assigned homepage placements
      const featured = sortedProperties.filter(
        (p) => p.featured || p.homepagePlacements?.includes('featured') || (!p.homepagePlacements && sortedProperties.indexOf(p) < 6)
      );
      const hero = sortedProperties.filter((p) => p.homepagePlacements?.includes('hero'));
      const trending = sortedProperties.filter((p) => p.homepagePlacements?.includes('trending'));

      setProperties(featured.slice(0, 6));
      setHeroProperties(hero);
      setTrendingProperties(trending);
      
    } catch (error) {
      console.error('Error loading properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomepageSettings();
    loadProperties();
  }, []);

  useEffect(() => {
    const unsubscribePackages = onSnapshot(collection(db, 'visitCampaigns'), (snapshot) => {
      const eatToday = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const activeCampaigns = snapshot.docs
        .map((entry) => ({ id: entry.id, ...entry.data() }))
        .filter((item) => item.active !== false && item.startDate && item.endDate && item.endDate >= eatToday)
        .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)));
      setSightseeingCampaigns(activeCampaigns);
    }, (error) => console.error('Could not load visit campaigns:', error));
    const unsubscribeStats = onSnapshot(collection(db, 'visitCampaignStats'), (snapshot) => {
      const next = {};
      snapshot.docs.forEach((entry) => { next[entry.id] = Number(entry.data()?.registeredCount) || 0; });
      setSightseeingCampaignStats(next);
    }, (error) => console.error('Could not load live sightseeing campaign counts:', error));
    return () => { unsubscribePackages(); unsubscribeStats(); };
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const searchSuggestions = useMemo(() => {
    const term = searchQuery.trim().toLocaleLowerCase();
    if (term.length < 2) return [];
    return searchProperties
      .map((property) => {
        const words = Array.isArray(property.searchKeywords) ? property.searchKeywords : [];
        const matchedKeyword = words.find((word) => String(word).toLocaleLowerCase().includes(term));
        const locationText = [property.location, property.town, property.estate, property.ward, property.county]
          .filter(Boolean).join(', ');
        const searchable = [property.title, locationText, property.propertyType, property.type, ...words]
          .filter(Boolean).join(' ').toLocaleLowerCase();
        return searchable.includes(term) ? { ...property, locationText, matchedKeyword } : null;
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [searchProperties, searchQuery]);

  const getStatIcon = (iconName) => {
    if (iconName === 'Building') return <Building className="w-8 h-8 text-white" />;
    if (iconName === 'Star') return <Star className="w-8 h-8 text-white" />;
    if (iconName === 'Award') return <Award className="w-8 h-8 text-white" />;
    if (iconName === 'Users') return <Users className="w-8 h-8 text-white" />;
    return <TrendingUp className="w-8 h-8 text-white" />;
  };

  const propertyTypeIcons = {
    apartment: <Building2 className="w-8 h-8" />,
    house: <Home className="w-8 h-8" />,
    student_hostel: <Hotel className="w-8 h-8" />,
    commercial: <Building className="w-8 h-8" />,
    land: <TreePine className="w-8 h-8" />,
    urbannest: <Hotel className="w-8 h-8" />
  };

  const propertyTypeBg = {
    apartment: 'bg-gradient-to-br from-gray-900 to-black',
    house: 'bg-gradient-to-br from-gray-800 to-gray-900',
    student_hostel: 'bg-gradient-to-br from-emerald-900 to-emerald-950',
    commercial: 'bg-gradient-to-br from-gray-700 to-gray-800',
    land: 'bg-gradient-to-br from-black to-gray-900',
    urbannest: 'bg-gradient-to-br from-teal-900 to-slate-950'
  };

  const popularTags = [
    { name: 'Nairobi Westlands', link: '/properties?search=Nairobi+Westlands' },
    { name: 'Mombasa Nyali', link: '/properties?search=Mombasa+Nyali' },
    { name: 'Apartments for Rent', link: '/properties?type=apartment&status=rent' },
    { name: '2 Bedroom Houses', link: '/properties?bedrooms=2' },
    { name: 'Commercial Spaces', link: '/properties?type=commercial' },
    { name: 'Luxury Villas', link: '/properties?type=villa' }
  ];

  const categoryCatalog = [
    { type: 'urbannest', name: 'URBANNEST', aliases: ['urbannest', 'short_stay', 'guest_house', 'serviced_apartment'], icon: <Hotel className="w-8 h-8" /> },
    { type: 'apartment', name: 'APARTMENTS', aliases: ['apartment', 'studio_apartment', 'bedsitter'], icon: <Building2 className="w-8 h-8" /> },
    { type: 'house', name: 'HOUSES', aliases: ['house', 'maisonette', 'bungalow', 'townhouse', 'duplex', 'standalone_house', 'semi_detached', 'shared_house'], icon: <Home className="w-8 h-8" /> },
    { type: 'student_hostel', name: 'STUDENT HOUSING', aliases: ['student_hostel', 'hostel', 'student_housing', 'single_room'], icon: <Hotel className="w-8 h-8" /> },
    { type: 'commercial', name: 'COMMERCIAL', aliases: ['commercial', 'office', 'shop', 'warehouse'], icon: <Building className="w-8 h-8" /> },
    { type: 'land', name: 'LAND', aliases: ['land'], icon: <TreePine className="w-8 h-8" /> },
  ];
  const displayedPropertyTypes = useMemo(() => {
    const latestByCategory = new Map();
    const countByCategory = new Map();
    searchProperties.forEach((property) => {
      const value = [property.propertyType, property.type, property.category].filter(Boolean)
        .map((item) => String(item).toLowerCase().replace(/[\s-]+/g, '_'));
      const category = categoryCatalog.find((item) => item.aliases.some((alias) => value.some((type) => type === alias || type.includes(alias))));
      if (!category) return;
      const rawDate = property.updatedAt || property.editedAt || property.createdAt;
      const changedAt = rawDate?.toDate ? rawDate.toDate().getTime() : new Date(rawDate || 0).getTime();
      latestByCategory.set(category.type, Math.max(latestByCategory.get(category.type) || 0, Number.isFinite(changedAt) ? changedAt : 0));
      countByCategory.set(category.type, (countByCategory.get(category.type) || 0) + 1);
    });
    const byRecency = [...latestByCategory.keys()].sort((a, b) => latestByCategory.get(b) - latestByCategory.get(a));
    const ordered = [...byRecency, ...categoryCatalog.map((item) => item.type).filter((type) => !byRecency.includes(type))].slice(0, 6);
    return ordered.map((type) => ({ ...categoryCatalog.find((item) => item.type === type), count: countByCategory.get(type) || 0 }));
  }, [searchProperties, categoryCatalog]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getPropertyImage(heroProperties[0]) || homeHeroImage}
            alt="Luxury Property"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/images/property-hero.svg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-6 leading-tight tracking-tight">
              {heroProperties[0]?.title || homepageSettings.hero.title}
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl font-light tracking-wide">
              {heroProperties[0]?.description || homepageSettings.hero.subtitle}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 max-w-2xl"
            >
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-gray-400 ml-4 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={searchSuggestions.length > 0}
                    aria-controls="homepage-property-suggestions"
                    placeholder={homepageSettings.hero.searchPlaceholder}
                    className="flex-1 bg-transparent text-white placeholder-gray-400 py-4 focus:outline-none text-lg font-light"
                  />
                  {searchSuggestions.length > 0 && <div id="homepage-property-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/20 bg-white text-left text-gray-900 shadow-2xl">
                    {searchSuggestions.map((property) => (
                      <Link
                        key={property.id}
                        role="option"
                        aria-selected="false"
                        to={`/property/${property.id}`}
                        onClick={() => setSearchQuery('')}
                        className="block border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                      >
                        <span className="block font-medium">{property.title || property.propertyName || 'Property listing'}</span>
                        <span className="block text-sm text-gray-500">{property.matchedKeyword ? `Also searched as “${property.matchedKeyword}”` : property.locationText || 'Location available in listing'}</span>
                      </Link>
                    ))}
                  </div>}
                </div>
                <button 
                  onClick={handleSearch}
                  className="px-8 py-4 bg-white text-black font-medium hover:bg-gray-100 transition-colors rounded-lg"
                >
                  <Search className="w-5 h-5 inline mr-2" />
                  Search
                </button>
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-3 mt-6">
              {popularTags.map((tag, idx) => (
                <Link
                  key={idx}
                  to={tag.link}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-colors text-sm font-light"
                >
                  {tag.name}
                </Link>
              ))}
            </div>

            {/* Quick Intent Entry Links */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <Link
                to="/explore"
                className="flex items-center justify-between px-6 py-4 bg-emerald-600/90 backdrop-blur-sm text-white rounded-xl border border-emerald-500/30 hover:bg-emerald-700 transition-all font-medium shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔍</span>
                  <div className="text-left">
                    <div className="text-sm font-bold">Find a Property</div>
                    <div className="text-xs text-emerald-100 font-light">I'm looking for a place</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-200" />
              </Link>

              <Link
                to="/login?intent=list"
                className="flex items-center justify-between px-6 py-4 bg-amber-600/90 backdrop-blur-sm text-white rounded-xl border border-amber-500/30 hover:bg-amber-700 transition-all font-medium shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">＋</span>
                  <div className="text-left">
                    <div className="text-sm font-bold">List a Property</div>
                    <div className="text-xs text-amber-100 font-light">I know a property & earn rewards</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-200" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {homepageSettings.stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                    {getStatIcon(stat.icon)}
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-black bg-clip-text text-transparent mb-2 font-serif">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-light mb-4 text-gray-900">Explore Property Categories</h2>
            <div className="w-24 h-px bg-gray-900 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto font-light">
              Curated selection of premium properties across Kenya
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayedPropertyTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link to={`/properties?type=${type.type}`}>
                  <div className={`${propertyTypeBg[type.type] || 'bg-gradient-to-br from-gray-900 to-black'} p-6 rounded-2xl text-white text-center transition-all duration-300 group-hover:shadow-2xl`}>
                    <div className="mb-4 flex justify-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        {propertyTypeIcons[type.type] || <Building2 className="w-8 h-8" />}
                      </div>
                    </div>
                    <h3 className="font-medium mb-1 tracking-wide">{type.name}</h3>
                    <p className="text-white/60 text-sm">{type.count || 0} Listings</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="visit-campaigns" className="overflow-hidden bg-emerald-950 py-14 text-white sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Join a planned visit</p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Upcoming visit campaigns</h2>
              <p className="mt-2 max-w-2xl text-sm text-emerald-100/80">See the schedule, price and live registrations, then reserve your place online.</p>
            </div>
          </div>
          {sightseeingCampaigns.length > 0 ? <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
            {sightseeingCampaigns.map((campaign) => {
              const liveCount = Number(sightseeingCampaignStats[campaign.id]) || 0;
              const count = campaign.registrationCountOverride != null && campaign.registrationCountOverride !== ''
                ? Math.max(0, Number(campaign.registrationCountOverride) || 0)
                : liveCount + Math.max(0, Number(campaign.offlineRegistrationCount) || 0);
              const target = Number(campaign.campaignTarget) > 0 ? Number(campaign.campaignTarget) : null;
              const progress = target ? Math.min(100, Math.round((count / target) * 100)) : 0;
              const dateLabel = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
              return <Link key={campaign.id} to={`/visit-campaigns/${encodeURIComponent(campaign.id)}`} className="group w-[min(86vw,380px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/15 bg-white text-slate-900 shadow-xl transition hover:-translate-y-1">
                {campaign.coverImage && <img src={campaign.coverImage} alt="" className="h-40 w-full object-cover" loading="lazy" />}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{campaign.location || 'Kenya'}</p><h3 className="mt-1 text-xl font-bold">{campaign.title}</h3></div>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-extrabold text-emerald-900">KSh {Number(campaign.price || 0).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{campaign.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
                    {campaign.duration && <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{campaign.duration}</span>}
                    <span>{dateLabel(campaign.startDate)} – {dateLabel(campaign.endDate)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-950"><Users size={17} />{count} registered{target ? ` of ${target}` : ''}</span>
                    {target && <span className="text-xs font-bold text-emerald-700">{progress}%</span>}
                  </div>
                  {target && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div>}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 group-hover:text-emerald-950">View campaign & book online <ArrowRight size={16} /></span>
                </div>
              </Link>;
            })}
          </div> : <p className="rounded-xl border border-white/15 bg-white/5 p-5 text-sm text-emerald-100">There are no upcoming visit campaigns right now. Please check back soon.</p>}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f2f6f3] py-16 sm:py-20">
        <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-emerald-100 blur-3xl" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-800">MarketMix home services</p>
            <h2 className="mt-2 text-3xl font-serif font-light text-gray-950 sm:text-4xl">More than just finding a home</h2>
            <p className="mt-3 text-gray-600">Build your next chapter with people and services that make a place feel like home.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Link to="/roommates" className="mmx-glass-card group relative overflow-hidden rounded-[2rem] border p-5 sm:p-7">
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-sky-100/70 blur-2xl transition group-hover:scale-125" />
              <div className="relative grid items-center gap-3 sm:grid-cols-[1fr_48%]">
                <div className="order-2 sm:order-1"><span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-900">Share a place</span><h3 className="mt-3 text-2xl font-bold text-gray-950">Find a Roommate</h3><p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">Looking for someone to share a place with? Find compatible roommates based on area, budget and living preferences.</p><span className="mmx-liquid-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white">Find a roommate <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></div>
                <MovingIllustration kind="roommates" className="order-1 w-full drop-shadow-[0_15px_22px_rgba(35,70,55,.13)] sm:order-2" />
              </div>
            </Link>
            <Link to="/transport" className="mmx-glass-card group relative overflow-hidden rounded-[2rem] border p-5 sm:p-7">
              <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-emerald-100/80 blur-2xl transition group-hover:scale-125" />
              <div className="relative grid items-center gap-3 sm:grid-cols-[1fr_48%]">
                <div className="order-2 sm:order-1"><span className="inline-flex rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-sky-900">Move into your next home</span><h3 className="mt-3 text-2xl font-bold text-gray-950">Move Your Things</h3><p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">Found your new place? Get help moving your belongings there.</p><span className="mmx-liquid-primary mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white">Get Moving Help <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></div>
                <MovingIllustration className="order-1 w-full drop-shadow-[0_15px_22px_rgba(35,70,55,.13)] sm:order-2" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Properties (Assigned by Admin) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16">
            <div>
              <h2 className="text-3xl lg:text-4xl font-serif font-light mb-3 text-gray-900">Featured Properties</h2>
              <div className="w-20 h-px bg-gray-900 mb-4"></div>
              <p className="text-gray-600 font-light">Handpicked properties assigned by admin for homepage showcase</p>
            </div>
            <Link
              to={userProfile?.role === 'admin' ? '/admin/properties?status=all' : '/properties'}
              className="mt-4 lg:mt-0 inline-flex items-center text-gray-900 hover:text-gray-700 font-medium group border-b border-transparent hover:border-gray-900 transition-all"
            >
              {userProfile?.role === 'admin' ? 'Manage All Properties' : 'View All Properties'}
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="w-12 h-12 animate-spin text-gray-400" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No featured properties assigned yet. Use the Admin Control Center to publish listings to the homepage!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-200"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={getPropertyImage(property) || '/images/property-hero.svg'}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getListingType(property) === 'rent' ? 'bg-gray-900' : 'bg-black'} text-white tracking-wide`}>
                      {getListingType(property) === 'rent' ? 'FOR RENT' : getListingType(property) === 'sale' ? 'FOR SALE' : 'LISTING TYPE UNAVAILABLE'}
                    </div>
                    {property.featured && (
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-600 fill-current" />
                        <span className="font-medium text-gray-900 text-sm">FEATURED</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-serif font-light mb-2 text-gray-900">{property.title}</h3>

                    <div className="flex justify-between border-t border-b border-gray-100 py-4 mb-4">
                      <div className="text-center">
                        <Bed className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <span className="text-sm font-medium">{property.bedrooms || 0} Beds</span>
                      </div>
                      <div className="text-center">
                        <Bath className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <span className="text-sm font-medium">{property.bathrooms || 0} Baths</span>
                      </div>
                      <div className="text-center">
                        <Square className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <span className="text-sm font-medium">{property.area || 0} sqft</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-serif font-light text-gray-900">
                          KES {property.price?.toLocaleString()}
                          {getListingType(property) === 'rent' && <span className="text-sm">/mo</span>}
                        </div>
                      </div>
                      <Link
                        to={`/property/${property.id}`}
                        className="px-6 py-2 bg-black text-white hover:bg-gray-900 transition-colors font-medium rounded-lg"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending & Popular Properties Section (If assigned by Admin) */}
      {trendingProperties.length > 0 && (
        <section className="py-20 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-serif font-light mb-3 text-gray-900">Trending & Popular</h2>
              <div className="w-20 h-px bg-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600 font-light">High-demand properties highlighted by our administrators</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
              {trendingProperties.map((property, index) => (
                <div key={property.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 p-6">
                  <img
                    src={getPropertyImage(property) || '/images/property-hero.svg'}
                    alt={property.title || 'Property listing'}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(event) => { event.currentTarget.src = '/images/property-hero.svg'; }}
                  />
                  <h3 className="text-lg font-serif font-semibold">{property.title}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-serif font-bold text-gray-900">KES {property.price?.toLocaleString()}</span>
                    <Link to={`/property/${property.id}`} className="px-4 py-2 bg-black text-white text-sm rounded-lg">View</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-serif font-light mb-6">{homepageSettings.cta.title}</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto font-light">
            {homepageSettings.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={homepageSettings.cta.button1Link}
              className="px-8 py-3 bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors rounded-lg"
            >
              {homepageSettings.cta.button1Text}
            </Link>
            <Link
              to={homepageSettings.cta.button2Link}
              className="px-8 py-3 bg-transparent border border-white text-white font-medium hover:bg-white/10 transition-colors rounded-lg"
            >
              {homepageSettings.cta.button2Text}
            </Link>
          </div>
        </div>
      </section>

      {/* Site Seeing Banner */}
      <section className="py-16 bg-emerald-950 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/25 px-4 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md mb-4 border border-emerald-400/30">
              <Compass className="w-4 h-4" /> MarketMix Site Seeing
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Want to see properties in person?</h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl">
              Explore listings across Kenya, scan your area to discover nearby homes, and arrange guided property site-seeing packages.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link
              to="/site-seeing"
              className="mmx-liquid-primary inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:scale-105"
            >
              <span>Explore Site Seeing</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/site-seeing"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <MapPin className="h-4 w-4" />
              <span>Search an Area</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <Phone className="w-6 h-6 mx-auto md:mx-0 mb-3 text-gray-400" />
              <h3 className="font-semibold mb-2">Call Us</h3>
              <p className="text-gray-400">{homepageSettings.contactInfo.phone}</p>
            </div>
            <div>
              <Mail className="w-6 h-6 mx-auto md:mx-0 mb-3 text-gray-400" />
              <h3 className="font-semibold mb-2">Email Us</h3>
              <p className="text-gray-400">{homepageSettings.contactInfo.email}</p>
            </div>
            <div>
              <MapPinIcon className="w-6 h-6 mx-auto md:mx-0 mb-3 text-gray-400" />
              <h3 className="font-semibold mb-2">Visit Us</h3>
              <p className="text-gray-400">{homepageSettings.contactInfo.address}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex justify-center space-x-6">
            {homepageSettings.socialLinks.facebook && (
              <a href={homepageSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {homepageSettings.socialLinks.twitter && (
              <a href={homepageSettings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {homepageSettings.socialLinks.instagram && (
              <a href={homepageSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {homepageSettings.socialLinks.linkedin && (
              <a href={homepageSettings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {homepageSettings.socialLinks.youtube && (
              <a href={homepageSettings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            )}
          </div>
          
          <div className="text-center text-gray-500 text-sm mt-8">
            &copy; {new Date().getFullYear()} Real Estate Kenya. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
