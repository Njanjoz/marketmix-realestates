// src/pages/ExplorePage.jsx - WITH CORRECT GRID LAYOUT & PRICING
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, Loader, Crosshair, Navigation, MapPin, Bed, Bath, Square, 
  DollarSign, Eye, Heart, Target, Compass, TrendingUp, Star, 
  Clock, ChevronRight, Filter, X, Grid3x3, LayoutGrid
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ExplorePage = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [displayProperties, setDisplayProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findingNearby, setFindingNearby] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filters, setFilters] = useState({
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    status: ''
  });

  // Format distance
  const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const getDistanceLabel = (km) => {
    if (km < 0.5) return "Very Close";
    if (km < 1) return "Close by";
    if (km < 3) return "Nearby";
    if (km < 5) return "Short drive";
    return "Within area";
  };

  // Calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Load properties
  const loadProperties = async () => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, where('approvalStatus', '==', 'approved'));
      const snapshot = await getDocs(q);
      const propertiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProperties(propertiesList);
      setDisplayProperties(propertiesList);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...allProperties];
    
    if (searchTerm) {
      filtered = filtered.filter(prop =>
        prop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.propertyType) {
      filtered = filtered.filter(prop => prop.propertyType === filters.propertyType);
    }
    if (filters.minPrice) {
      filtered = filtered.filter(prop => prop.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(prop => prop.price <= parseInt(filters.maxPrice));
    }
    if (filters.bedrooms) {
      filtered = filtered.filter(prop => prop.bedrooms >= parseInt(filters.bedrooms));
    }
    if (filters.status) {
      filtered = filtered.filter(prop => prop.status === filters.status);
    }
    
    setDisplayProperties(filtered);
  };

  useEffect(() => {
    if (!nearMeActive) applyFilters();
  }, [allProperties, filters, searchTerm, nearMeActive]);

  // Find near me
  const findNearMe = () => {
    setFindingNearby(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setFindingNearby(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        const nearby = allProperties
          .map(property => {
            let distance = null;
            if (property.coordinates?.lat) {
              distance = calculateDistance(latitude, longitude, property.coordinates.lat, property.coordinates.lng);
            }
            return { ...property, distance };
          })
          .filter(p => p.distance !== null && p.distance <= 10)
          .sort((a, b) => a.distance - b.distance);
        
        setDisplayProperties(nearby);
        setNearMeActive(true);
        toast.success(`Found ${nearby.length} properties near you!`);
        setFindingNearby(false);
      },
      () => {
        toast.error("Please allow location access");
        setFindingNearby(false);
      }
    );
  };

  const showAllProperties = () => {
    setDisplayProperties([...allProperties]);
    setNearMeActive(false);
    setUserLocation(null);
    applyFilters();
  };

  const formatPrice = (price) => {
    // For small/student-friendly prices (under 1000)
    if (price < 1000) {
      return `KSh ${price.toFixed(2)}`;
    }
    // For larger prices (over 1M)
    if (price >= 1000000) {
      return `KES ${(price / 1000000).toFixed(1)}M`;
    }
    // For mid-range prices
    return `KES ${price?.toLocaleString()}`;
  };

  const getPriceStyle = (price) => {
    if (price < 1000) {
      return { color: '#83c325', fontSize: '1.25rem' }; // Small/bulk pricing
    }
    return { color: '#2d3e2b', fontSize: '1.1rem' }; // Standard pricing
  };

  const openGoogleMaps = (property, e) => {
    if (e) e.preventDefault();
    let query = property.location;
    if (property.coordinates?.lat) {
      query = `${property.coordinates.lat},${property.coordinates.lng}`;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
  };

  // Categories data - 5 items per row like the screenshot
  const categories = [
    { name: 'Luxury Villas', icon: '🏰', color: '#e8f5e9', count: 12, type: 'villa' },
    { name: 'Apartments', icon: '🏢', color: '#e3f2fd', count: 24, type: 'apartment' },
    { name: 'Commercial', icon: '🏭', color: '#fff3e0', count: 8, type: 'commercial' },
    { name: 'Land & Plots', icon: '🌳', color: '#e8f5e9', count: 15, type: 'land' },
    { name: 'Affordable Homes', icon: '🏠', color: '#fce4ec', count: 32, type: 'house' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f7f0',
      paddingTop: '2rem',
      paddingBottom: '4rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '600', 
            color: '#2d3e2b',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Find Your Dream Property
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            Discover homes, apartments, and commercial spaces across Kenya
          </p>
        </div>

        {/* Search Bar - Pill shaped */}
        <div style={{ 
          background: 'white', 
          borderRadius: '60px', 
          padding: '0.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Search size={20} style={{ marginLeft: '1rem', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by location, property type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            style={{
              flex: 1,
              padding: '1rem 0.5rem',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              background: 'transparent'
            }}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.75rem 1.5rem',
              background: showFilters ? '#83c325' : '#f3f4f6',
              border: 'none',
              borderRadius: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: showFilters ? 'white' : '#374151',
              fontWeight: '500'
            }}
          >
            <Filter size={16} />
            Filters
          </button>
          <button
            onClick={nearMeActive ? showAllProperties : findNearMe}
            disabled={findingNearby}
            style={{
              padding: '0.75rem 1.5rem',
              background: nearMeActive ? '#f59e0b' : '#83c325',
              border: 'none',
              borderRadius: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'white',
              fontWeight: '500'
            }}
          >
            {findingNearby ? <Loader size={16} className="animate-spin" /> : <Target size={16} />}
            {nearMeActive ? "Show All" : "Near Me"}
          </button>
          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f3f4f6', borderRadius: '40px', padding: '0.25rem' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'grid' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: viewMode === 'grid' ? '#83c325' : '#6b7280',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'list' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: viewMode === 'list' ? '#83c325' : '#6b7280',
                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: '600', color: '#2d3e2b' }}>Filter Properties</h3>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <select value={filters.propertyType} onChange={(e) => setFilters({...filters, propertyType: e.target.value})} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
              </select>
              <select value={filters.minPrice} onChange={(e) => setFilters({...filters, minPrice: e.target.value})} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <option value="">Min Price</option>
                <option value="1000000">KES 1M+</option>
                <option value="5000000">KES 5M+</option>
                <option value="10000000">KES 10M+</option>
              </select>
              <select value={filters.maxPrice} onChange={(e) => setFilters({...filters, maxPrice: e.target.value})} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <option value="">Max Price</option>
                <option value="5000000">KES 5M</option>
                <option value="10000000">KES 10M</option>
                <option value="20000000">KES 20M</option>
              </select>
              <select value={filters.bedrooms} onChange={(e) => setFilters({...filters, bedrooms: e.target.value})} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <option value="">Bedrooms</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <option value="">Status</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
              <button onClick={applyFilters} style={{ padding: '0.75rem', background: '#83c325', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' }}>
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2d3e2b' }}>{allProperties.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Properties</div>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2d3e2b' }}>KES 8.5M</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Avg Price</div>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2d3e2b' }}>24</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>New This Month</div>
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2d3e2b' }}>{nearMeActive ? displayProperties.length : 'Click'}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Near You</div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Found <strong style={{ color: '#2d3e2b' }}>{displayProperties.length}</strong> properties
            {nearMeActive && <span style={{ marginLeft: '0.5rem', background: '#fef3c7', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem' }}>📍 Near You</span>}
          </p>
        </div>

        {/* Property Grid - 4 items per row like screenshot */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader size={48} className="animate-spin" style={{ color: '#83c325', margin: '0 auto' }} />
          </div>
        ) : displayProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '24px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏠</div>
            <h3>No Properties Found</h3>
            <p style={{ color: '#6b7280' }}>Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          // GRID VIEW - 4 items per row (lg:grid-cols-4)
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1.5rem'
          }}>
            {displayProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
              >
                <Link to={`/property/${property.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={property.images?.[0] || 'https://placehold.co/400x300'} 
                      alt={property.title}
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                      }}
                    />
                    {property.status === 'sale' ? (
                      <span style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        left: '12px',
                        background: '#3b82f6',
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: '600'
                      }}>
                        FOR SALE
                      </span>
                    ) : (
                      <span style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        left: '12px',
                        background: '#83c325',
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: '600'
                      }}>
                        FOR RENT
                      </span>
                    )}
                    
                    {property.distance && property.distance < 1 && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: '#f59e0b',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Target size={10} />
                        Near
                      </span>
                    )}
                    
                    {property.distance && (
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <Navigation size={10} />
                        {formatDistance(property.distance)}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#2d3e2b',
                      marginBottom: '0.25rem',
                      lineHeight: '1.3'
                    }}>
                      {property.title}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.7rem' }}>
                      <MapPin size={12} />
                      {property.location}
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      padding: '0.5rem 0',
                      borderTop: '1px solid #f0f0f0',
                      borderBottom: '1px solid #f0f0f0',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#6b7280' }}>
                        <Bed size={12} /> {property.bedrooms || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#6b7280' }}>
                        <Bath size={12} /> {property.bathrooms || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#6b7280' }}>
                        <Square size={12} /> {property.area || 0}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontWeight: '700', 
                        color: '#83c325',
                        fontSize: property.price < 1000 ? '1.1rem' : '0.9rem'
                      }}>
                        {formatPrice(property.price)}
                      </span>
                      <button 
                        onClick={(e) => openGoogleMaps(property, e)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '20px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#83c325'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = 'inherit'; }}
                      >
                        <Navigation size={10} />
                        Map
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          // LIST VIEW
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {displayProperties.map((property) => (
              <Link key={property.id} to={`/property/${property.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; }}>
                  <img src={property.images?.[0] || 'https://placehold.co/120x80'} alt={property.title} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '600', color: '#2d3e2b', marginBottom: '0.25rem' }}>{property.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      <MapPin size={12} /> {property.location}
                      {property.distance && <span>• {formatDistance(property.distance)} away</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: '#6b7280' }}>
                      <span><Bed size={12} /> {property.bedrooms || 0}</span>
                      <span><Bath size={12} /> {property.bathrooms || 0}</span>
                      <span><Square size={12} /> {property.area || 0} sqft</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: '#83c325' }}>{formatPrice(property.price)}</div>
                    <button onClick={(e) => openGoogleMaps(property, e)} style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '20px', fontSize: '0.65rem', cursor: 'pointer' }}>Map</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Categories Section - 5 items per row like screenshot */}
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2d3e2b', textAlign: 'center', marginBottom: '2rem' }}>
            Browse by Category
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '1.5rem'
          }}>
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer'
                }}
                onClick={() => setFilters({...filters, propertyType: cat.type})}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                <h3 style={{ fontWeight: '600', color: '#2d3e2b', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{cat.name}</h3>
                <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>{cat.count} properties</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
