// src/pages/PropertiesPage.jsx - WITH SIMPLE NEAR ME BUTTON
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { FaFilter, FaTh, FaThList, FaSort, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Search, Loader, Star, MapPin, Bed, Bath, Square, DollarSign, Crosshair, AlertCircle } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import PropertyCard from '../components/PropertyCard.jsx';
import PropertyFilter from '../components/PropertyFilter.jsx';
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
const ink = '#1c1c1e';
const ink2 = '#4a4a52';
const ink3 = '#8e8e99';
const rule = 'rgba(255,255,255,0.2)';
const emerald = '#059669';

// --- UTILITY STYLED COMPONENTS ---
const Container = styled.div`
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
    @media (min-width: 640px) { padding-left: 1.5rem; padding-right: 1.5rem; }
    @media (min-width: 1024px) { padding-left: 4rem; padding-right: 4rem; }
    @media (min-width: 1280px) { max-width: 1280px; }
`;

const PageWrapper = styled.div`
    min-height: 90vh;
    padding-top: 2rem;
    padding-bottom: 4rem;
    background: linear-gradient(145deg, #ecfdf5 0%, #d1fae5 30%, #ecfdf5 60%, #a7f3d0 100%);
    position: relative;
    overflow: hidden;
`;

const MainContentGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    @media (min-width: 1024px) {
        grid-template-columns: 280px 1fr;
    }
`;

const HeaderWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
    background: rgba(255,255,255,0.62);
    backdropFilter: blur(20px) saturate(1.3);
    border: 1px solid rgba(255,255,255,0.45);
    border-radius: 20px;
    padding: 1rem 1.5rem;
`;

const ViewButton = styled.button`
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: ${props => props.$active ? '#fff' : '#4a4a52'};
    background-color: ${props => props.$active ? emerald : 'transparent'};
    transition: all 150ms;
    cursor: pointer;
    
    &:hover {
        background-color: ${props => props.$active ? emerald : 'rgba(0,0,0,0.05)'};
    }
`;

const SortSelect = styled.select`
    padding: 0.5rem 2rem 0.5rem 1rem;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 0.5rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1.5em 1.5em;
    cursor: pointer;
    background-color: rgba(255,255,255,0.5);
    font-family: 'Inter', system-ui, sans-serif;
    
    &:focus {
        outline: none;
        border-color: ${emerald};
    }
`;

const FilterToggle = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: ${emerald};
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 600;
    transition: background-color 200ms;
    cursor: pointer;
    border: none;
    
    &:hover {
        background-color: #047857;
    }
`;

const SidebarOverlay = styled(motion.div)`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    background-color: rgba(0, 0, 0, 0.5);
    @media (min-width: 1024px) {
        display: none;
    }
`;

const Sidebar = styled(motion.div)`
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 20rem;
    background-color: white;
    padding: 1.5rem;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    @media (min-width: 1024px) {
        position: static;
        width: 100%;
        height: auto;
        box-shadow: none;
        padding: 0;
    }
`;

const PaginationButton = styled.button`
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    transition: all 150ms;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    ${props => props.$active ? `
        background-color: ${emerald};
        color: white;
        border: none;
    ` : `
        border: 1px solid rgba(255,255,255,0.2);
        background-color: rgba(255,255,255,0.5);
        color: #4a4a52;
        &:hover {
            background-color: rgba(255,255,255,0.8);
        }
    `}
    
    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ResultsCount = styled.div`
    color: #4a4a52;
    font-weight: 500;
    font-size: 0.875rem;
    display: none;
    @media (min-width: 640px) {
        display: block;
    }
`;

const NearMeButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, ${emerald}, #047857);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 200ms;
    margin-bottom: 1rem;
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(5,150,105,0.3);
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
`;

// --- REACT COMPONENT ---
const PropertiesPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [allProperties, setAllProperties] = useState([]);
  const [displayProperties, setDisplayProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [findingNearby, setFindingNearby] = useState(false);
  
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') || 'grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'recent');
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page'));
    return isNaN(page) ? 1 : page;
  });
  const [nearMeActive, setNearMeActive] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'any',
    propertyType: 'all',
    status: 'all'
  });
  const itemsPerPage = 12;

  // Calculate distance between two coordinates (Haversine formula)
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
  const applyFilters = useCallback(() => {
    let filtered = [...allProperties];
    
    if (filters.location) {
      filtered = filtered.filter(prop => 
        prop.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.minPrice) {
      filtered = filtered.filter(prop => prop.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(prop => prop.price <= parseInt(filters.maxPrice));
    }
    if (filters.bedrooms !== 'any') {
      filtered = filtered.filter(prop => prop.bedrooms >= parseInt(filters.bedrooms));
    }
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(prop => prop.propertyType === filters.propertyType);
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(prop => prop.status === filters.status);
    }
    
    setDisplayProperties(filtered);
    setCurrentPage(1);
  }, [allProperties, filters]);

  useEffect(() => {
    if (!nearMeActive) {
      applyFilters();
    }
  }, [applyFilters, nearMeActive]);

  // FIND PROPERTIES NEAR ME - GPS feature
  const findNearMe = () => {
    setFindingNearby(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setFindingNearby(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Calculate distance for each property and filter within 10km
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
        setCurrentPage(1);
        
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

  // Show all properties (clear near me filter)
  const showAllProperties = () => {
    setDisplayProperties([...allProperties]);
    setNearMeActive(false);
    setCurrentPage(1);
    applyFilters();
    toast.info("Showing all properties");
  };

  // Sort properties
  const sortedProperties = useMemo(() => {
    const sorted = [...displayProperties];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'area':
        return sorted.sort((a, b) => (b.area || 0) - (a.area || 0));
      case 'recent':
      default:
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });
    }
  }, [displayProperties, sortBy]);

  const totalPages = Math.ceil(sortedProperties.length / itemsPerPage);
  const paginatedProperties = sortedProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pageNumbersToShow = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    if (total > 1) pages.push(total);
    return pages;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setNearMeActive(false);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      location: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: 'any',
      propertyType: 'all',
      status: 'all'
    });
    setDisplayProperties([...allProperties]);
    setNearMeActive(false);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Update URL params
  useEffect(() => {
    const newParams = new URLSearchParams();
    newParams.set('view', viewMode);
    newParams.set('sort', sortBy);
    newParams.set('page', currentPage.toString());
    setSearchParams(newParams, { replace: true });
  }, [viewMode, sortBy, currentPage, setSearchParams]);

  return (
    <PageWrapper>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '18%', width: 340, height: 340, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '14%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <Container>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6" style={{ fontFamily: serif }}>Property Listings</h1>
        
        <MainContentGrid>
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block">
            <div style={glass}>
              {/* Near Me Button */}
              <NearMeButton 
                onClick={nearMeActive ? showAllProperties : findNearMe}
                disabled={findingNearby}
              >
                {findingNearby ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Crosshair className="w-4 h-4" />
                )}
                {nearMeActive ? "Show All Properties" : "📍 Find Properties Near Me"}
              </NearMeButton>
              
              {nearMeActive && (
                <div className="mb-4 p-2 bg-emerald-50 rounded-lg text-center">
                  <p className="text-xs text-emerald-700">
                    Showing properties within 10km of your location
                  </p>
                </div>
              )}
              
              <PropertyFilter 
                filters={filters} 
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
          
          {/* Right Column - Results */}
          <div>
            {/* Header / Controls */}
            <HeaderWrapper>
              <ResultsCount>
                Showing {paginatedProperties.length} of {sortedProperties.length} properties
                {nearMeActive && <span className="ml-1 text-emerald-600">(Near You)</span>}
              </ResultsCount>
              
              <div className="flex items-center gap-4 flex-wrap">
                <FilterToggle 
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden"
                >
                  <FaFilter />
                  Filters
                </FilterToggle>

                {/* Mobile Near Me button */}
                <div className="lg:hidden">
                  <button
                    onClick={nearMeActive ? showAllProperties : findNearMe}
                    disabled={findingNearby}
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs"
                  >
                    {findingNearby ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Crosshair className="w-3 h-3" />
                    )}
                    {nearMeActive ? "All" : "Near Me"}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <FaSort className="text-gray-500 hidden sm:block" />
                  <SortSelect value={sortBy} onChange={handleSortChange}>
                    <option value="recent">Most Recent</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="area">Area: Largest</option>
                  </SortSelect>
                </div>

                <div className="hidden sm:flex rounded-lg border overflow-hidden" style={{ borderColor: rule }}>
                  <ViewButton 
                    $active={viewMode === 'grid'} 
                    onClick={() => handleViewModeChange('grid')}
                  >
                    <FaTh size={18} />
                  </ViewButton>
                  <ViewButton 
                    $active={viewMode === 'list'} 
                    onClick={() => handleViewModeChange('list')} 
                    style={{ borderLeft: `1px solid ${rule}` }}
                  >
                    <FaThList size={18} />
                  </ViewButton>
                </div>
              </div>
            </HeaderWrapper>

            {/* Mobile Filter Sidebar */}
            <AnimatePresence>
              {showFilters && (
                <SidebarOverlay 
                  onClick={() => setShowFilters(false)} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <Sidebar 
                    onClick={(e) => e.stopPropagation()} 
                    initial={{ x: -300 }} 
                    animate={{ x: 0 }} 
                    exit={{ x: -300 }}
                    transition={{ type: 'tween' }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Filters</h2>
                      <button 
                        onClick={() => setShowFilters(false)} 
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        &times;
                      </button>
                    </div>
                    <PropertyFilter 
                      filters={filters} 
                      onFilterChange={handleFilterChange}
                    />
                    <button 
                      onClick={() => {
                        setShowFilters(false);
                        handleResetFilters();
                      }} 
                      className="w-full mt-6 py-3 rounded-lg font-semibold transition-colors"
                      style={{ background: emerald, color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      Show Results
                    </button>
                  </Sidebar>
                </SidebarOverlay>
              )}
            </AnimatePresence>

            {/* Property Results */}
            {loading ? (
              <div className="text-center py-20">
                <Loader className="w-12 h-12 animate-spin mx-auto" style={{ color: emerald }} />
                <p className="text-xl text-gray-600 mt-4">Loading properties...</p>
              </div>
            ) : (
              <>
                <div 
                  className={viewMode === 'grid' ? 
                    "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : 
                    "grid grid-cols-1 gap-6"
                  }
                >
                  <AnimatePresence>
                    {paginatedProperties.length > 0 ? (
                      paginatedProperties.map((property, index) => (
                        <motion.div 
                          key={property.id || index} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -20 }} 
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <PropertyCard 
                            property={property} 
                            viewMode={viewMode}
                            distance={property.distance}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-20">
                        <div className="text-6xl mb-4">🏠</div>
                        <h3 className="text-2xl font-bold mb-2">
                          {nearMeActive ? "No Properties Found Near You" : "No Properties Found"}
                        </h3>
                        <p className="text-gray-600">
                          {nearMeActive 
                            ? "Try adjusting your location or check back later for new listings near you."
                            : "No properties have been approved yet. Check back soon!"}
                        </p>
                        {nearMeActive && (
                          <button
                            onClick={showAllProperties}
                            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            Show All Properties
                          </button>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && paginatedProperties.length > 0 && (
                  <div className="mt-10 flex justify-center">
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                      <PaginationButton
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <FaChevronLeft size={16} />
                      </PaginationButton>
                      
                      {pageNumbersToShow(currentPage, totalPages).map((pageNum, index) => (
                        pageNum === '...' ? (
                          <span key={`dots-${index}`} className="px-2 text-gray-500">...</span>
                        ) : (
                          <PaginationButton
                            key={pageNum}
                            $active={currentPage === pageNum}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </PaginationButton>
                        )
                      ))}
                      
                      <PaginationButton
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <FaChevronRight size={16} />
                      </PaginationButton>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </MainContentGrid>
      </Container>
    </PageWrapper>
  );
};

export default PropertiesPage;
