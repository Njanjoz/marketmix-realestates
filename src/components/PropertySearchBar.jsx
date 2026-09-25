// src/components/PropertySearchBar.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useProperties } from '../context/PropertyContext';
import { FaSearch, FaMapMarkerAlt, FaFilter } from 'react-icons/fa';

// --- COLOR CONSTANTS ---
const PRIMARY_COLOR = '#0f4882'; 
const PRIMARY_HOVER = '#1a5996';
const INPUT_BORDER = '#d1d5db'; 
const LIGHT_GRAY = '#f3f4f6'; 
const GRAY_TEXT = '#4b5563'; 

// --- STYLED COMPONENTS ---

const SearchBarContainer = styled(motion.div)`
  background-color: white;
  padding: 1rem; /* p-4 */
  border-radius: 1rem; /* rounded-2xl */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05); /* shadow-2xl */
  max-width: 56rem; /* max-w-4xl */
  margin: 0 auto;
  margin-top: -4rem; /* -mt-16 (to overlap with the hero section) */
  position: relative;
  z-index: 10;
  border: 1px solid #f3f4f6; /* border border-gray-100 */

  @media (min-width: 1024px) {
    padding: 1.5rem; /* lg:p-6 */
  }
`;

const SearchForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem; /* space-y-4 */
`;

const PrimarySearchGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem; /* space-x-3 */
`;

const LocationIcon = styled(FaMapMarkerAlt)`
  color: #9ca3af; /* text-gray-400 */
  width: 1.25rem;
  height: 1.25rem;
  display: none;

  @media (min-width: 640px) {
    display: block; /* sm:block */
  }
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 0.75rem; /* p-3 */
  border: 1px solid ${INPUT_BORDER};
  border-radius: 0.5rem; /* rounded-lg */
  outline: none;
  transition: border-color 150ms;

  &:focus {
    border-color: ${PRIMARY_COLOR}; /* focus:border-primary-500 */
    box-shadow: 0 0 0 1px ${PRIMARY_COLOR};
  }
`;

const SearchButton = styled.button`
  background-color: ${PRIMARY_COLOR};
  color: white;
  padding: 0.75rem; /* p-3 */
  border-radius: 0.5rem;
  transition: background-color 150ms;
  display: flex;
  align-items: center;

  &:hover {
    background-color: ${PRIMARY_HOVER};
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    margin-right: 0.5rem; /* mr-2 */
  }
`;

const AdvancedToggleContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const AdvancedToggleButton = styled.button`
  font-size: 0.875rem; /* text-sm */
  font-weight: 500;
  color: ${PRIMARY_COLOR};
  transition: color 150ms;
  display: flex;
  align-items: center;

  &:hover {
    color: ${PRIMARY_HOVER};
  }

  svg {
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
  }
`;

const AdvancedFiltersGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr)); /* grid-cols-1 */
  gap: 1rem; /* gap-4 */
  overflow: hidden;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr)); /* md:grid-cols-2 */
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, minmax(0, 1fr)); /* lg:grid-cols-4 */
  }
`;

const AdvancedSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid ${INPUT_BORDER};
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 1px ${PRIMARY_COLOR};
  }
`;

const AdvancedPriceInput = styled.input.attrs({ type: 'number' })`
  padding: 0.75rem;
  border: 1px solid ${INPUT_BORDER};
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;

  &:focus {
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 1px ${PRIMARY_COLOR};
  }
`;

const PopularSearchesContainer = styled.div`
  margin-top: 1rem; /* mt-4 */
  padding-top: 1rem; /* pt-4 */
  border-top: 1px solid #f3f4f6; /* border-t border-gray-100 */
`;

const PopularSearchesTitle = styled.h4`
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
  margin-bottom: 0.5rem; /* mb-2 */
`;

const PopularSearchesTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem; /* gap-2 */
`;

const PopularSearchTag = styled.button`
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  background-color: ${LIGHT_GRAY};
  color: ${GRAY_TEXT};
  border-radius: 9999px; /* rounded-full */
  font-size: 0.875rem; /* text-sm */
  transition: background-color 150ms;

  &:hover {
    background-color: #e5e7eb; /* hover:bg-gray-200 */
  }
`;


const PropertySearchBar = () => {
  const { applyFilters } = useProperties();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    propertyType: 'all',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'any',
    bathrooms: 'any' 
  });

  const propertyTypes = [
    { value: 'all', label: 'All Properties' },
    { value: 'apartment', label: 'Apartments' },
    { value: 'house', label: 'Houses' },
    { value: 'villa', label: 'Villas' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters({
      location: searchQuery,
      ...advancedFilters
    });
  };

  const handleAdvancedFilterChange = (field, value) => {
    const newFilters = { ...advancedFilters, [field]: value };
    setAdvancedFilters(newFilters);
  };

  return (
    <SearchBarContainer
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SearchForm onSubmit={handleSearch}>
        {/* Primary Search Bar */}
        <PrimarySearchGroup>
          <LocationIcon />
          <SearchInput
            type="text"
            placeholder="Enter location, area, or property ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit">
            <FaSearch />
            Search
          </SearchButton>
        </PrimarySearchGroup>

        {/* Toggle Advanced Filters */}
        <AdvancedToggleContainer>
          <AdvancedToggleButton
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <FaFilter />
            {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </AdvancedToggleButton>
        </AdvancedToggleContainer>

        {/* Advanced Filters */}
        <AdvancedFiltersGrid
          initial={{ opacity: 0, height: 0 }}
          animate={showAdvanced ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Property Type */}
          <AdvancedSelect
            value={advancedFilters.propertyType}
            onChange={(e) => handleAdvancedFilterChange('propertyType', e.target.value)}
          >
            {propertyTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </AdvancedSelect>

          {/* Bedrooms */}
          <AdvancedSelect
            value={advancedFilters.bedrooms}
            onChange={(e) => handleAdvancedFilterChange('bedrooms', e.target.value)}
          >
            <option value="any">Any Bedrooms</option>
            <option value="1">1+ Bedroom</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </AdvancedSelect>

          {/* Min Price */}
          <AdvancedPriceInput
            placeholder="Min Price"
            value={advancedFilters.minPrice}
            onChange={(e) => handleAdvancedFilterChange('minPrice', e.target.value)}
          />

          {/* Max Price */}
          <AdvancedPriceInput
            placeholder="Max Price"
            value={advancedFilters.maxPrice}
            onChange={(e) => handleAdvancedFilterChange('maxPrice', e.target.value)}
          />
        </AdvancedFiltersGrid>
      </SearchForm>

      {/* Recent Searches */}
      <PopularSearchesContainer>
        <PopularSearchesTitle>Popular Searches:</PopularSearchesTitle>
        <PopularSearchesTags>
          {['Nairobi Westlands', 'Mombasa Nyali', 'Kilimani Apartments', 'Karen Villas', 'CBD Offices'].map((search, idx) => (
            <PopularSearchTag
              key={idx}
              type="button"
              onClick={() => setSearchQuery(search)}
            >
              {search}
            </PopularSearchTag>
          ))}
        </PopularSearchesTags>
      </PopularSearchesContainer>
    </SearchBarContainer>
  );
};

export default PropertySearchBar;