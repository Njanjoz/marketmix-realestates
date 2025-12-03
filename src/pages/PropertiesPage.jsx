// src/pages/PropertiesPage.jsx - STYLED COMPONENTS VERSION
import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { useProperties } from '../context/PropertyContext';
import { useSearch } from '../context/SearchContext';
// Assuming PropertyCard and PropertyFilter are separate components
import PropertyCard from '../components/PropertyCard';
import PropertyFilter from '../components/PropertyFilter';
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
`;

const ViewButton = styled.button`
    padding: 0.5rem;
    border-radius: 0.5rem;
    color: ${props => props.active ? WHITE : GRAY_700};
    background-color: ${props => props.active ? PRIMARY_BLUE : 'transparent'};
    transition: all 150ms;
    
    &:hover {
        background-color: ${props => props.active ? PRIMARY_DARK : '#e5e7eb'}; /* gray-200 */
    }
`;

const SortSelect = styled.select`
    padding: 0.5rem 1rem;
    border: 1px solid ${GRAY_300};
    border-radius: 0.5rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1.5em 1.5em;
    cursor: pointer;
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
    width: 20rem; /* w-80 */
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
    width: 2.5rem; /* w-10 */
    height: 2.5rem; /* h-10 */
    border-radius: 0.5rem;
    transition: all 150ms;
    
    ${props => props.active ? `
        background-color: ${PRIMARY_BLUE};
        color: ${WHITE};
    ` : `
        border: 1px solid ${GRAY_300};
        background-color: ${WHITE};
        color: ${GRAY_700};
        &:hover {
            background-color: #f3f4f6; /* gray-50 */
        }
    `}
    
    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;


// --- REACT COMPONENT ---

const PropertiesPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { filteredProperties, loading, applyFilters } = useProperties();
  const { updateSearchFilters, searchFilters } = useSearch();
  
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Get filter from URL
  useEffect(() => {
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const locationQuery = searchParams.get('location') || '';
    
    const filters = {
      status: status,
      type: type,
      location: locationQuery
    };
    
    applyFilters(filters);
    updateSearchFilters(filters);
  }, [location.search, applyFilters, updateSearchFilters]);

  // Handle sorting
  const getSortedProperties = () => {
    let sorted = [...filteredProperties];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'area':
        return sorted.sort((a, b) => b.area - a.area);
      case 'recent':
      default:
        // Assuming properties have a 'dateAdded' property or similar for 'recent'
        return sorted; 
    }
  };
  
  const sortedProperties = getSortedProperties();
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
    
    let pages = [];
    pages.push(1);
    
    if (current > 3) pages.push('...');
    
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    
    if (current < total - 2) pages.push('...');
    
    if (total > 1) pages.push(total);
    
    // Remove duplicate separators if they somehow appear
    return pages.filter((item, index, self) => 
        !(item === '...' && self[index - 1] === '...') && 
        !(item === '...' && self[index + 1] === '...') &&
        self.indexOf(item) === index
    );
  };

  return (
    <PageWrapper>
      <Container>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Property Listings</h1>
        
        <MainContentGrid>
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block">
            <PropertyFilter filters={searchFilters} onFilterChange={applyFilters} />
          </div>
          
          {/* Right Column - Results */}
          <div>
            
            {/* Header / Controls */}
            <HeaderWrapper>
                <div className="text-gray-600 font-medium hidden sm:block">
                    Showing **{paginatedProperties.length}** of **{filteredProperties.length}** properties
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Mobile Filter Toggle */}
                    <FilterToggle 
                        onClick={() => setShowFilters(true)}
                        className="lg:hidden"
                    >
                        <FaFilter />
                        Filters
                    </FilterToggle>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                        <FaSort className="text-gray-500 hidden sm:block" />
                        <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="recent">Most Recent</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="area">Area: Largest</option>
                        </SortSelect>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="hidden sm:flex rounded-lg border border-gray-300 overflow-hidden">
                        <ViewButton active={viewMode === 'grid'} onClick={() => setViewMode('grid')}>
                            <FaTh size={18} />
                        </ViewButton>
                        <ViewButton active={viewMode === 'list'} onClick={() => setViewMode('list')} style={{borderLeft: '1px solid #d1d5db'}}>
                            <FaThList size={18} />
                        </ViewButton>
                    </div>
                </div>
            </HeaderWrapper>

            {/* Mobile Filter Sidebar */}
            <AnimatePresence>
                {showFilters && (
                    <SidebarOverlay onClick={() => setShowFilters(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Sidebar onClick={(e) => e.stopPropagation()} initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Filters</h2>
                                <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                                    &times;
                                </button>
                            </div>
                            <PropertyFilter filters={searchFilters} onFilterChange={applyFilters} />
                            <button 
                                onClick={() => setShowFilters(false)} 
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
              <div className="text-center py-20 text-xl text-gray-600">Loading properties...</div>
            ) : (
              <>
                <div 
                    className={viewMode === 'grid' ? 
                        "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : 
                        "grid grid-cols-1 gap-6"
                    }
                >
                  <AnimatePresence>
                    {paginatedProperties.map((property, index) => (
                        <motion.div 
                            key={property.id} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }} 
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            {/* Assuming PropertyCard handles its own internal styling */}
                            <PropertyCard property={property} viewMode={viewMode} />
                        </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredProperties.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl shadow-lg mt-8">
                        <div className="text-6xl mb-4">🏠</div>
                        <h3 className="text-2xl font-bold mb-2">No Properties Match Your Filters</h3>
                        <p className="text-gray-600 mb-6">Try broadening your search criteria.</p>
                        <button 
                            onClick={() => {
                                applyFilters({ status: 'all', type: 'all', location: '' });
                                updateSearchFilters({ status: 'all', type: 'all', location: '' });
                            }}
                            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex justify-center">
                    <div className="flex items-center space-x-2">
                      <PaginationButton
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <FaChevronLeft size={16} />
                      </PaginationButton>
                      
                      {pageNumbersToShow(currentPage, totalPages).map((pageNum, index) => (
                        pageNum === '...' ? (
                          <span key={index} className="px-2 text-gray-500">...</span>
                        ) : (
                          <PaginationButton
                            key={index}
                            active={currentPage === pageNum}
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