// src/pages/ExplorePage.jsx - WITH IMPROVED DISTANCE DISPLAY
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { 
  FaSearch, FaFilter, FaMapMarkerAlt, FaHome, 
  FaBuilding, FaHotel, FaStore, FaWarehouse, FaTree,
  FaHeart, FaChartLine, FaUsers, FaStar, FaBed, FaBath, FaRulerCombined
} from 'react-icons/fa';
import { Search, Loader, Crosshair, Navigation, MapPin, Bed, Bath, Square, DollarSign, Eye, Compass, Target } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Glassmorphism styles
const glass = {
  background: 'rgba(255,255,255,0.62)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(255,255,255,0.45)',
  borderRadius: 20,
};

const serif = "'Cormorant Garamond', 'Georgia', serif";
const sans = "'Inter', system-ui, sans-serif";
const emerald = '#059669';
const orange = '#f59e0b';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 2rem;
  padding-bottom: 4rem;
  background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 30%, #ecfdf5 60%, #a7f3d0 100%);
  position: relative;
  overflow: hidden;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 2;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  
  h1 {
    font-family: ${serif};
    font-size: 3.5rem;
    font-weight: 400;
    color: #1c1c1e;
    margin-bottom: 1rem;
  }
  
  p {
    font-family: ${sans};
    font-size: 1.125rem;
    color: #4a4a52;
    max-width: 600px;
    margin: 0 auto;
  }
`;

const SearchSection = styled.div`
  ${glass}
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  input {
    flex: 1;
    padding: 1rem;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    font-size: 1rem;
    background: rgba(255,255,255,0.5);
    font-family: ${sans};
    
    &:focus {
      outline: none;
      border-color: ${emerald};
    }
  }
  
  button {
    padding: 1rem 2rem;
    background: ${emerald};
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    
    &:hover {
      background: #047857;
      transform: translateY(-1px);
    }
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FilterGroup = styled.div`
  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #4a4a52;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  select, input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 10px;
    background: rgba(255,255,255,0.5);
    font-family: ${sans};
    
    &:focus {
      outline: none;
      border-color: ${emerald};
    }
  }
`;

const NearMeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, ${emerald}, #047857);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5,150,105,0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const NearMeActiveBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(5,150,105,0.15);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  
  .info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: ${emerald};
    
    .dot {
      width: 8px;
      height: 8px;
      background: ${emerald};
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
  }
  
  .clear-btn {
    background: none;
    border: none;
    color: ${emerald};
    cursor: pointer;
    font-size: 0.75rem;
    text-decoration: underline;
    
    &:hover {
      color: #047857;
    }
  }
  
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  ${glass}
  padding: 1.5rem;
  text-align: center;
  
  h3 {
    font-size: 0.75rem;
    font-weight: 600;
    color: #8e8e99;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-family: ${serif};
    font-size: 2rem;
    font-weight: 400;
    color: #1c1c1e;
    margin-bottom: 0.25rem;
  }
  
  .stat-change {
    font-size: 0.75rem;
    color: ${emerald};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }
`;

const PropertiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const PropertyCard = styled.div`
  ${glass}
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
`;

const PropertyImage = styled.div`
  position: relative;
  height: 220px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
`;

const DistanceBadge = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(4px);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  z-index: 2;
  
  .distance-icon {
    font-size: 0.75rem;
  }
  
  .distance-value {
    font-weight: 700;
    color: #fbbf24;
  }
  
  .distance-unit {
    font-size: 0.65rem;
    opacity: 0.8;
  }
`;

const NearBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, ${orange}, #ea580c);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
`;

const PropertyContent = styled.div`
  padding: 1.25rem;
`;

const PropertyTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1c1c1e;
  margin-bottom: 0.5rem;
`;

const PropertyLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #8e8e99;
  margin-bottom: 0.75rem;
`;

const PropertyFeatures = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-top: 1px solid rgba(255,255,255,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.2);
  margin-bottom: 0.75rem;
  
  span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #4a4a52;
  }
`;

const PropertyPrice = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .price {
    font-family: ${serif};
    font-size: 1.25rem;
    font-weight: 600;
    color: ${emerald};
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  button {
    padding: 0.5rem;
    background: rgba(255,255,255,0.5);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(255,255,255,0.8);
    }
  }
`;

const ExplorePage = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [displayProperties, setDisplayProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findingNearby, setFindingNearby] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    status: ''
  });

  // Format distance nicely
  const formatDistance = (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  // Get distance description
  const getDistanceDescription = (km) => {
    if (km < 0.5) return "Very Close";
    if (km < 1) return "Close by";
    if (km < 3) return "Nearby";
    if (km < 5) return "Short drive";
    if (km < 10) return "Within area";
    return "Further away";
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

  // Load properties from Firestore
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
    if (!nearMeActive) {
      applyFilters();
    }
  }, [allProperties, filters, searchTerm, nearMeActive]);

  // Find properties near me
  const findNearMe = () => {
    setFindingNearby(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
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
            if (property.coordinates && property.coordinates.lat) {
              distance = calculateDistance(
                latitude, longitude,
                property.coordinates.lat, property.coordinates.lng
              );
            }
            return { ...property, distance };
          })
          .filter(property => property.distance !== null && property.distance <= 10)
          .sort((a, b) => a.distance - b.distance);
        
        setDisplayProperties(nearby);
        setNearMeActive(true);
        
        if (nearby.length === 0) {
          toast.info("No properties found within 10km of your location");
        } else {
          toast.success(`Found ${nearby.length} properties near you!`);
        }
        setFindingNearby(false);
      },
      (err) => {
        let errorMessage = "Unable to get your location";
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = "Please allow location access to find nearby properties";
        }
        toast.error(errorMessage);
        setFindingNearby(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Show all properties
  const showAllProperties = () => {
    setDisplayProperties([...allProperties]);
    setNearMeActive(false);
    setUserLocation(null);
    applyFilters();
    toast.info("Showing all properties");
  };

  const openGoogleMaps = (property, e) => {
    if (e) e.preventDefault();
    let query = property.location;
    if (property.coordinates && property.coordinates.lat) {
      query = `${property.coordinates.lat},${property.coordinates.lng}`;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `KES ${(price / 1000000).toFixed(1)}M`;
    }
    return `KES ${price?.toLocaleString()}`;
  };

  // Stats
  const stats = [
    { label: 'Total Properties', value: allProperties.length, change: '+12%' },
    { label: 'Avg Price', value: 'KES 8.5M', change: '+5%' },
    { label: 'Near You', value: nearMeActive ? `${displayProperties.length} found` : 'Click "Near Me"', change: '' }
  ];

  // Get nearby count summary
  const nearbyCount = displayProperties.filter(p => p.distance && p.distance <= 10).length;

  return (
    <PageContainer>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <Container>
        <HeroSection>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Explore Properties</h1>
            <p>Discover your perfect property from our curated collection</p>
          </motion.div>
        </HeroSection>

        <SearchSection>
          <SearchBar>
            <input
              type="text"
              placeholder="Search by location, property type, or features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
            <button onClick={applyFilters}>
              <FaSearch /> Search
            </button>
          </SearchBar>

          <FilterGrid>
            <FilterGroup>
              <label>Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
              >
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Min Price (KES)</label>
              <select
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              >
                <option value="">Any</option>
                <option value="1000000">KES 1M+</option>
                <option value="5000000">KES 5M+</option>
                <option value="10000000">KES 10M+</option>
                <option value="50000000">KES 50M+</option>
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Max Price (KES)</label>
              <select
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              >
                <option value="">Any</option>
                <option value="5000000">KES 5M</option>
                <option value="10000000">KES 10M</option>
                <option value="20000000">KES 20M</option>
                <option value="50000000">KES 50M</option>
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Bedrooms</label>
              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </FilterGroup>

            <FilterGroup>
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </FilterGroup>
          </FilterGrid>

          <NearMeButton 
            onClick={nearMeActive ? showAllProperties : findNearMe}
            disabled={findingNearby}
          >
            {findingNearby ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Target className="w-5 h-5" />
            )}
            {nearMeActive ? "📍 Show All Properties" : "🎯 Find Properties Near Me"}
          </NearMeButton>
          
          {nearMeActive && userLocation && (
            <NearMeActiveBadge>
              <div className="info">
                <span className="dot"></span>
                <Compass size={14} />
                <span>Showing <strong>{nearbyCount}</strong> properties within 10km of your location</span>
              </div>
              <button onClick={showAllProperties} className="clear-btn">
                Clear
              </button>
            </NearMeActiveBadge>
          )}
        </SearchSection>

        <StatsGrid>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <h3>{stat.label}</h3>
              <div className="stat-value">{stat.value}</div>
              {stat.change && <div className="stat-change"><FaChartLine /> {stat.change}</div>}
            </StatCard>
          ))}
        </StatsGrid>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader className="w-12 h-12 animate-spin mx-auto" style={{ color: emerald }} />
            <p style={{ marginTop: '1rem', color: '#4a4a52' }}>Loading properties...</p>
          </div>
        ) : displayProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏠</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1c1c1e' }}>
              {nearMeActive ? "No Properties Found Near You" : "No Properties Found"}
            </h3>
            <p style={{ color: '#4a4a52' }}>
              {nearMeActive 
                ? "Try adjusting your location or check back later"
                : "Try adjusting your filters or check back later"}
            </p>
            {nearMeActive && (
              <button
                onClick={showAllProperties}
                style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: emerald, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                Show All Properties
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', color: '#4a4a52' }}>
                Found <strong>{displayProperties.length}</strong> properties
                {nearMeActive && <span> within 10km of your location</span>}
              </p>
            </div>
            
            <PropertiesGrid>
              {displayProperties.map((property) => (
                <PropertyCard key={property.id}>
                  <Link to={`/property/${property.id}`} style={{ textDecoration: 'none' }}>
                    <PropertyImage>
                      <img 
                        src={property.images?.[0] || 'https://placehold.co/400x300'} 
                        alt={property.title}
                      />
                      {property.distance && (
                        <DistanceBadge>
                          <Navigation className="distance-icon" size={12} />
                          <span className="distance-value">{formatDistance(property.distance)}</span>
                          <span className="distance-unit">away</span>
                          <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>• {getDistanceDescription(property.distance)}</span>
                        </DistanceBadge>
                      )}
                      {property.distance && property.distance < 1 && (
                        <NearBadge>
                          <Target size={10} />
                          Very Near
                        </NearBadge>
                      )}
                      <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                        <span style={{
                          background: property.status === 'sale' ? '#3b82f6' : emerald,
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          {property.status === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                        </span>
                      </div>
                    </PropertyImage>
                    <PropertyContent>
                      <PropertyTitle>{property.title}</PropertyTitle>
                      <PropertyLocation>
                        <MapPin size={12} />
                        {property.location}
                      </PropertyLocation>
                      <PropertyFeatures>
                        <span><Bed size={12} /> {property.bedrooms || 0}</span>
                        <span><Bath size={12} /> {property.bathrooms || 0}</span>
                        <span><Square size={12} /> {property.area || 0} sqft</span>
                      </PropertyFeatures>
                      <PropertyPrice>
                        <span className="price">{formatPrice(property.price)}</span>
                        <div className="actions">
                          <button onClick={(e) => openGoogleMaps(property, e)} title="View on Google Maps">
                            <Navigation size={14} />
                          </button>
                        </div>
                      </PropertyPrice>
                    </PropertyContent>
                  </Link>
                </PropertyCard>
              ))}
            </PropertiesGrid>
          </>
        )}
      </Container>
    </PageContainer>
  );
};

export default ExplorePage;
