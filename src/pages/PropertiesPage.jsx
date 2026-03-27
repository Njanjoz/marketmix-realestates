// src/pages/PropertiesPage.jsx - FIXED INFINITE LOOP
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { useProperties } from '../context/PropertyContext';
import { useSearch } from '../context/SearchContext';
import PropertyCard from '../components/PropertyCard.jsx';
import PropertyFilter from '../components/PropertyFilter.jsx';
import { FaFilter, FaTh, FaThList, FaSort, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// --- COLOR AND STYLE CONSTANTS ---
const PRIMARY_BLUE = '#0284c7'; 
const PRIMARY_DARK = '#0c4a6e';
const WHITE = '#ffffff';
const BG_LIGHT = '#f9fafb';
const GRAY_300 = '#d1d5db';
const GRAY_700 = '#374151';

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
    padding-top: 5rem;
    padding-bottom: 4rem;
    background-color: ${BG_LIGHT};
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
`;

const ViewButton = styled.button`
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: ${props => props.$active ? WHITE : GRAY_700};
    background-color: ${props => props.$active ? PRIMARY_BLUE : 'transparent'};
    transition: all 150ms;
    cursor: pointer;
    
    &:hover {
        background-color: ${props => props.$active ? PRIMARY_DARK : '#e5e7eb'};
    }
`;

const SortSelect = styled.select`
    padding: 0.5rem 2rem 0.5rem 1rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1.5em 1.5em;
    cursor: pointer;
    background-color: white;
    
    &:focus {
        outline: none;
        border-color: ${PRIMARY_BLUE};
    }
`;

const FilterToggle = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: ${PRIMARY_BLUE};
    color: ${WHITE};
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    font-weight: 600;
    transition: background-color 200ms;
    cursor: pointer;
    border: none;
    
    &:hover {
        background-color: ${PRIMARY_DARK};
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
    background-color: ${WHITE};
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
        background-color: ${PRIMARY_BLUE};
        color: ${WHITE};
        border: none;
    ` : `
        border: 1px solid ${GRAY_300};
        background-color: ${WHITE};
        color: ${GRAY_700};
        &:hover {
            background-color: #f3f4f6;
        }
    `}
    
    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const ResultsCount = styled.div`
    color: #4b5563;
    font-weight: 500;
    display: none;
    @media (min-width: 640px) {
        display: block;
    }
`;

// --- REACT COMPONENT ---

const PropertiesPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRender = useRef(true);
  
  // Safe context access
  const propertiesContext = useProperties();
  const searchContext = useSearch();
  
  const { filteredProperties = [], loading = false, applyFilters = () => {} } = propertiesContext;
  const { updateSearchFilters = () => {}, searchFilters = {} } = searchContext;
  
  const [viewMode, setViewMode] = useState(() => searchParams.get('view') || 'grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'recent');
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get('page'));
    return isNaN(page) ? 1 : page;
  });
  const itemsPerPage = 12;

  // ✅ FIX: Use useCallback to memoize functions and prevent infinite loops
  const handleApplyFilters = useCallback((filters) => {
    if (typeof applyFilters === 'function') {
      applyFilters(filters);
    }
  }, [applyFilters]);

  const handleUpdateSearchFilters = useCallback((filters) => {
    if (typeof updateSearchFilters === 'function') {
      updateSearchFilters(filters);
    }
  }, [updateSearchFilters]);

  // ✅ FIX: Use useRef to track if URL update is from internal state change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    const newParams = new URLSearchParams(searchParams);
    newParams.set('view', viewMode);
    newParams.set('sort', sortBy);
    newParams.set('page', currentPage.toString());
    setSearchParams(newParams, { replace: true });
  }, [viewMode, sortBy, currentPage, setSearchParams, searchParams]);

  // ✅ FIX: Separate effect for URL params with proper dependencies
  useEffect(() => {
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const locationQuery = searchParams.get('location') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    
    const filters = {
      status,
      type,
      location: locationQuery,
      ...(minPrice && { minPrice: parseInt(minPrice) }),
      ...(maxPrice && { maxPrice: parseInt(maxPrice) }),
      ...(bedrooms && bedrooms !== 'any' && { bedrooms: parseInt(bedrooms) })
    };
    
    // Only run on initial mount or when URL changes
    if (isFirstRender.current) {
      handleApplyFilters(filters);
      handleUpdateSearchFilters(filters);
    }
  }, [location.search]); // ✅ Only depend on location.search, not the functions

  // ✅ FIX: Reset first render flag after initial load
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, []);

  // Handle sorting with useMemo to prevent recalculations
  const sortedProperties = useMemo(() => {
    if (!filteredProperties || filteredProperties.length === 0) return [];
    
    const sorted = [...filteredProperties];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'area':
        return sorted.sort((a, b) => (b.area || 0) - (a.area || 0));
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  }, [filteredProperties, sortBy]);

  const totalPages = useMemo(() => Math.ceil(sortedProperties.length / itemsPerPage), [sortedProperties]);
  
  const paginatedProperties = useMemo(() => {
    return sortedProperties.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedProperties, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const pageNumbersToShow = useCallback((current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    
    const pages = [];
    pages.push(1);
    
    if (current > 3) pages.push('...');
    
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    
    if (current < total - 2) pages.push('...');
    
    if (total > 1) pages.push(total);
    
    return pages.filter((item, index, self) => 
      !(item === '...' && self[index - 1] === '...') && 
      !(item === '...' && self[index + 1] === '...') &&
      self.indexOf(item) === index
    );
  }, []);

  const handleResetFilters = useCallback(() => {
    const resetFilters = { status: 'all', type: 'all', location: '' };
    handleApplyFilters(resetFilters);
    handleUpdateSearchFilters(resetFilters);
    
    const newParams = new URLSearchParams();
    newParams.set('view', viewMode);
    newParams.set('sort', sortBy);
    setSearchParams(newParams);
    setCurrentPage(1);
  }, [handleApplyFilters, handleUpdateSearchFilters, viewMode, sortBy, setSearchParams]);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // Memoize the filter change handler
  const handleFilterChange = useCallback((filters) => {
    handleApplyFilters(filters);
    setCurrentPage(1);
  }, [handleApplyFilters]);

  // Prevent render if no context
  if (!propertiesContext || !searchContext) {
    return (
      <PageWrapper>
        <Container>
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-red-600">Configuration Error</h2>
            <p className="text-gray-600 mt-2">Please check your app configuration.</p>
          </div>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Property Listings</h1>
        
        <MainContentGrid>
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block">
            <PropertyFilter 
              filters={searchFilters} 
              onFilterChange={handleFilterChange}
            />
          </div>
          
          {/* Right Column - Results */}
          <div>
            {/* Header / Controls */}
            <HeaderWrapper>
              <ResultsCount>
                Showing {paginatedProperties.length} of {filteredProperties.length} properties
              </ResultsCount>
              
              <div className="flex items-center gap-4 flex-wrap">
                <FilterToggle 
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden"
                >
                  <FaFilter />
                  Filters
                </FilterToggle>

                <div className="flex items-center gap-2">
                  <FaSort className="text-gray-500 hidden sm:block" />
                  <SortSelect value={sortBy} onChange={handleSortChange}>
                    <option value="recent">Most Recent</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="area">Area: Largest</option>
                  </SortSelect>
                </div>

                <div className="hidden sm:flex rounded-lg border border-gray-300 overflow-hidden">
                  <ViewButton 
                    $active={viewMode === 'grid'} 
                    onClick={() => handleViewModeChange('grid')}
                    aria-label="Grid view"
                  >
                    <FaTh size={18} />
                  </ViewButton>
                  <ViewButton 
                    $active={viewMode === 'list'} 
                    onClick={() => handleViewModeChange('list')} 
                    style={{borderLeft: '1px solid #d1d5db'}}
                    aria-label="List view"
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
                        aria-label="Close filters"
                      >
                        &times;
                      </button>
                    </div>
                    <PropertyFilter 
                      filters={searchFilters} 
                      onFilterChange={handleFilterChange}
                    />
                    <button 
                      onClick={() => {
                        setShowFilters(false);
                        handleResetFilters();
                      }} 
                      className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
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
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                          <PropertyCard property={property} viewMode={viewMode} />
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-20">
                        <div className="text-6xl mb-4">🏠</div>
                        <h3 className="text-2xl font-bold mb-2">No Properties Found</h3>
                        <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Empty State - No filters match */}
                {filteredProperties.length === 0 && !loading && (
                  <div className="text-center py-20 bg-white rounded-xl shadow-lg mt-8">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold mb-2">No Properties Match Your Filters</h3>
                    <p className="text-gray-600 mb-6">Try broadening your search criteria.</p>
                    <button 
                      onClick={handleResetFilters}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && paginatedProperties.length > 0 && (
                  <div className="mt-10 flex justify-center">
                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                      <PaginationButton
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
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
                            aria-label={`Page ${pageNum}`}
                            aria-current={currentPage === pageNum ? 'page' : undefined}
                          >
                            {pageNum}
                          </PaginationButton>
                        )
                      ))}
                      
                      <PaginationButton
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
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