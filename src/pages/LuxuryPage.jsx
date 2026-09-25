// src/pages/LuxuryPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { FaSearch, FaFilter, FaStar, FaSwimmingPool, FaCar, FaBed, FaBath, FaRulerCombined, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import PropertyCard from '../components/PropertyCard';
import toast from 'react-hot-toast';

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 5rem;
  padding-bottom: 4rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (min-width: 640px) { padding: 0 1.5rem; }
  @media (min-width: 1024px) { padding: 0 2rem; max-width: 1280px; }
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 4rem;
  padding: 3rem 0;
  
  h1 {
    font-size: 3.5rem;
    font-weight: 800;
    background: linear-gradient(90deg, #0c4a6e 0%, #0284c7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.25rem;
    color: #4b5563;
    max-width: 700px;
    margin: 0 auto 2rem;
  }
`;

const FiltersContainer = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
    }
  }
  
  button {
    padding: 0.75rem 2rem;
    background: #0284c7;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s;
    
    &:hover {
      background: #0c4a6e;
    }
  }
`;

const FilterOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  
  select {
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #0284c7;
    }
  }
`;

const PropertiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  
  svg {
    font-size: 4rem;
    color: #cbd5e1;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.5rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #94a3b8;
  }
`;

const LuxuryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const LuxuryPage = () => {
  const { properties } = useProperties();
  const { currentUser, saveProperty } = useAuth();
  
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    propertyType: ''
  });

  // Filter for luxury properties
  useEffect(() => {
    const luxuryProps = properties.filter(prop => 
      prop.price >= 30000000 || // KES 30M+ for sale
      prop.category === 'luxury' ||
      prop.area >= 5000 || // Large properties
      prop.bedrooms >= 4 // Luxury often means more bedrooms
    );
    setFilteredProperties(luxuryProps);
  }, [properties]);

  const handleSearch = () => {
    let results = filteredProperties;
    
    if (searchTerm) {
      results = results.filter(prop =>
        prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filters.minPrice) {
      results = results.filter(prop => prop.price >= parseInt(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      results = results.filter(prop => prop.price <= parseInt(filters.maxPrice));
    }
    
    if (filters.bedrooms) {
      results = results.filter(prop => prop.bedrooms >= parseInt(filters.bedrooms));
    }
    
    if (filters.propertyType) {
      results = results.filter(prop => prop.type === filters.propertyType);
    }
    
    setFilteredProperties(results);
  };

  const handleSaveProperty = (propertyId) => {
    if (!currentUser) {
      toast.error('Please log in to save properties.');
      return;
    }
    saveProperty(propertyId, true);
    toast.success('Property saved to favorites!');
  };

  const luxuryFeatures = [
    { icon: <FaSwimmingPool />, label: 'Infinity Pool' },
    { icon: <FaStar />, label: '5-Star Amenities' },
    { icon: <FaCar />, label: 'Private Garage' },
    { icon: <FaMapMarkerAlt />, label: 'Prime Location' }
  ];

  return (
    <PageContainer>
      <Container>
        <HeroSection>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Luxury Properties</h1>
            <p>Discover exclusive high-end properties with premium amenities and breathtaking views</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
              {luxuryFeatures.map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>{feature.icon}</span>
                  <span style={{ fontWeight: 500 }}>{feature.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </HeroSection>

        <FiltersContainer>
          <SearchBar>
            <input
              type="text"
              placeholder="Search luxury properties by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={handleSearch}>
              <FaSearch style={{ marginRight: '0.5rem' }} />
              Search
            </button>
          </SearchBar>
          
          <FilterOptions>
            <select
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
            >
              <option value="">Min Price</option>
              <option value="30000000">KES 30M+</option>
              <option value="50000000">KES 50M+</option>
              <option value="100000000">KES 100M+</option>
            </select>
            
            <select
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
            >
              <option value="">Max Price</option>
              <option value="50000000">KES 50M</option>
              <option value="100000000">KES 100M</option>
              <option value="200000000">KES 200M</option>
              <option value="500000000">KES 500M+</option>
            </select>
            
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
            >
              <option value="">Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
              <option value="5">5+ Bedrooms</option>
              <option value="6">6+ Bedrooms</option>
            </select>
            
            <select
              value={filters.propertyType}
              onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
            >
              <option value="">Property Type</option>
              <option value="villa">Villa</option>
              <option value="mansion">Mansion</option>
              <option value="penthouse">Penthouse</option>
              <option value="apartment">Luxury Apartment</option>
            </select>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilters({ minPrice: '', maxPrice: '', bedrooms: '', propertyType: '' });
              }}
              style={{ 
                padding: '0.5rem 1rem', 
                border: '1px solid #e5e7eb', 
                background: '#f8fafc',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </FilterOptions>
        </FiltersContainer>

        {filteredProperties.length === 0 ? (
          <EmptyState>
            <FaSearch />
            <h3>No luxury properties found</h3>
            <p>Try adjusting your search filters or check back later</p>
          </EmptyState>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Exclusive Listings</h2>
              <LuxuryBadge>{filteredProperties.length} Properties</LuxuryBadge>
            </div>
            
            <PropertiesGrid>
              {filteredProperties.map((property) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <PropertyCard
                    property={property}
                    onSave={() => handleSaveProperty(property.id)}
                    showLuxuryBadge={true}
                  />
                </motion.div>
              ))}
            </PropertiesGrid>
          </motion.div>
        )}
      </Container>
    </PageContainer>
  );
};

export default LuxuryPage;