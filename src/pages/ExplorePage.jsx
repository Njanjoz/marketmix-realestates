// src/pages/ExplorePage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { 
  FaSearch, FaFilter, FaMapMarkerAlt, FaCity, FaHome, 
  FaBuilding, FaHotel, FaStore, FaWarehouse, FaTree,
  FaHeart, FaChartLine, FaUsers, FaStar
} from 'react-icons/fa';
import PropertyCard from '../components/PropertyCard';
import toast from 'react-hot-toast';

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 5rem;
  padding-bottom: 4rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
`;

const Container = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  
  @media (min-width: 640px) { padding: 0 1.5rem; }
  @media (min-width: 1024px) { padding: 0 2rem; max-width: 1400px; }
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  
  h1 {
    font-size: 3rem;
    font-weight: 800;
    color: #0c4a6e;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.125rem;
    color: #4b5563;
    max-width: 800px;
    margin: 0 auto;
  }
`;

const SearchSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  input {
    flex: 1;
    padding: 1rem;
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
    padding: 1rem 2rem;
    background: linear-gradient(90deg, #0284c7 0%, #0c4a6e 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: transform 0.3s;
    
    &:hover {
      transform: translateY(-2px);
    }
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const FilterGroup = styled.div`
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4b5563;
    margin-bottom: 0.5rem;
  }
  
  select, input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: white;
    
    &:focus {
      outline: none;
      border-color: #0284c7;
    }
  }
`;

const QuickFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const FilterChip = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: ${props => props.active ? '2px solid #0284c7' : '1px solid #d1d5db'};
  border-radius: 2rem;
  background: ${props => props.active ? '#f0f9ff' : 'white'};
  color: ${props => props.active ? '#0284c7' : '#4b5563'};
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #0284c7;
    color: #0284c7;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #0c4a6e;
    margin-bottom: 0.25rem;
  }
  
  .stat-change {
    font-size: 0.875rem;
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.5rem;
  
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    background: ${props => props.active ? 'white' : 'transparent'};
    color: ${props => props.active ? '#0284c7' : '#6b7280'};
    font-weight: 500;
    cursor: pointer;
    box-shadow: ${props => props.active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
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

const MapContainer = styled.div`
  height: 500px;
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
  
  .map-overlay {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: white;
    padding: 1rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;
`;

const CategoryCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
  
  .category-icon {
    font-size: 2rem;
    color: #0284c7;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  .category-count {
    font-size: 0.875rem;
    color: #6b7280;
  }
`;

const ExplorePage = () => {
  const { properties } = useProperties();
  const { currentUser, saveProperty } = useAuth();
  
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    location: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    status: ''
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  // Property categories
  const categories = [
    { icon: <FaHome />, label: 'Residential', value: 'residential', count: 12 },
    { icon: <FaBuilding />, label: 'Commercial', value: 'commercial', count: 8 },
    { icon: <FaHotel />, label: 'Vacation', value: 'vacation', count: 5 },
    { icon: <FaStore />, label: 'Retail', value: 'retail', count: 7 },
    { icon: <FaWarehouse />, label: 'Industrial', value: 'industrial', count: 4 },
    { icon: <FaTree />, label: 'Land', value: 'land', count: 6 },
    { icon: <FaCity />, label: 'Apartments', value: 'apartment', count: 15 },
    { icon: <FaStar />, label: 'Luxury', value: 'luxury', count: 9 }
  ];

  // Quick filters
  const quickFilters = [
    { id: 'all', label: 'All Properties', icon: <FaHome /> },
    { id: 'trending', label: 'Trending', icon: <FaChartLine /> },
    { id: 'popular', label: 'Most Popular', icon: <FaUsers /> },
    { id: 'new', label: 'New Listings', icon: <FaStar /> },
    { id: 'affordable', label: 'Affordable', icon: <FaSearch /> }
  ];

  // Initialize with all properties
  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  const handleSearch = () => {
    let results = properties;
    
    // Apply search term
    if (searchTerm) {
      results = results.filter(prop =>
        prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filters
    if (filters.location) {
      results = results.filter(prop => 
        prop.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.propertyType) {
      results = results.filter(prop => prop.type === filters.propertyType);
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
    
    if (filters.status) {
      results = results.filter(prop => prop.status === filters.status);
    }
    
    // Apply quick filters
    switch (activeQuickFilter) {
      case 'trending':
        results = results.filter(prop => prop.price > 10000000); // Expensive = trending
        break;
      case 'popular':
        results = results.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'new':
        results = results.filter(prop => prop.isNew || Math.random() > 0.5); // Mock new flag
        break;
      case 'affordable':
        results = results.filter(prop => prop.price < 5000000); // Under 5M
        break;
      default:
        break;
    }
    
    setFilteredProperties(results);
  };

  const handleQuickFilter = (filterId) => {
    setActiveQuickFilter(filterId);
  };

  const handleCategorySelect = (category) => {
    setFilters({...filters, propertyType: category});
    setActiveQuickFilter('all');
    // Trigger search after a short delay
    setTimeout(handleSearch, 100);
  };

  const handleSaveProperty = (propertyId) => {
    if (!currentUser) {
      toast.error('Please log in to save properties.');
      return;
    }
    saveProperty(propertyId, true);
    toast.success('Property saved to favorites!');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      location: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      status: ''
    });
    setActiveQuickFilter('all');
    setFilteredProperties(properties);
  };

  // Stats data
  const stats = [
    { label: 'Total Properties', value: properties.length, change: '+12%' },
    { label: 'Avg Price', value: 'KES 8.5M', change: '+5%' },
    { label: 'New This Month', value: '24', change: '+18%' },
    { label: 'Properties Sold', value: '48', change: '+22%' }
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
            <h1>Explore Properties</h1>
            <p>Discover your perfect property from our extensive collection of homes, apartments, commercial spaces, and more.</p>
          </motion.div>
        </HeroSection>

        <SearchSection>
          <SearchBar>
            <input
              type="text"
              placeholder="Search by location, property type, or features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>
              <FaSearch />
              Search
            </button>
          </SearchBar>

          <FilterGrid>
            <FilterGroup>
              <label>Location</label>
              <input
                type="text"
                placeholder="City, neighborhood..."
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              />
            </FilterGroup>

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
              <label>Min Price</label>
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
              <label>Max Price</label>
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
          </FilterGrid>

          <QuickFilters>
            {quickFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                active={activeQuickFilter === filter.id}
                onClick={() => handleQuickFilter(filter.id)}
              >
                {filter.icon}
                {filter.label}
              </FilterChip>
            ))}
            <button
              onClick={handleClearFilters}
              style={{
                marginLeft: 'auto',
                padding: '0.5rem 1rem',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '2rem',
                cursor: 'pointer'
              }}
            >
              Clear All Filters
            </button>
          </QuickFilters>
        </SearchSection>

        <StatsGrid>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <h3>{stat.label}</h3>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change">
                <FaChartLine /> {stat.change} from last month
              </div>
            </StatCard>
          ))}
        </StatsGrid>

        <MapContainer>
          <div className="map-overlay">
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>Property Map</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {filteredProperties.length} properties found in this area
            </p>
          </div>
          <div style={{ textAlign: 'center', color: 'white', zIndex: 1 }}>
            <FaMapMarkerAlt size={48} />
            <h3 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 600 }}>
              Interactive Map View
            </h3>
            <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>
              Click on map markers to view property details
            </p>
          </div>
        </MapContainer>

        <SectionHeader>
          <h2>Featured Properties ({filteredProperties.length})</h2>
          <ViewToggle>
            <button 
              active={viewMode === 'grid'} 
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
            <button 
              active={viewMode === 'list'} 
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button 
              active={viewMode === 'map'} 
              onClick={() => setViewMode('map')}
            >
              Map View
            </button>
          </ViewToggle>
        </SectionHeader>

        {filteredProperties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
            <FaSearch size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No properties found</h3>
            <p>Try adjusting your search criteria or clear filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <PropertiesGrid>
            {filteredProperties.slice(0, 12).map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <PropertyCard
                  property={property}
                  onSave={() => handleSaveProperty(property.id)}
                />
              </motion.div>
            ))}
          </PropertiesGrid>
        ) : (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem' }}>
            {filteredProperties.slice(0, 6).map((property) => (
              <div 
                key={property.id}
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  alignItems: 'center'
                }}
              >
                <img 
                  src={property.images[0]} 
                  alt={property.title}
                  style={{ width: '200px', height: '150px', borderRadius: '0.75rem', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {property.title}
                  </h3>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    <FaMapMarkerAlt style={{ marginRight: '0.5rem' }} />
                    {property.location}
                  </p>
                  <div style={{ display: 'flex', gap: '2rem', color: '#4b5563' }}>
                    <span>🏠 {property.bedrooms} Beds</span>
                    <span>🛁 {property.bathrooms} Baths</span>
                    <span>📏 {property.area} sqft</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7', marginBottom: '1rem' }}>
                    KES {property.price.toLocaleString()}
                  </div>
                  <button
                    onClick={() => handleSaveProperty(property.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'transparent',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <FaHeart color="#ef4444" />
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
            Browse by Category
          </h2>
          <CategoriesGrid>
            {categories.map((category) => (
              <CategoryCard 
                key={category.value}
                onClick={() => handleCategorySelect(category.value)}
              >
                <div className="category-icon">{category.icon}</div>
                <h3>{category.label}</h3>
                <div className="category-count">{category.count} Properties</div>
              </CategoryCard>
            ))}
          </CategoriesGrid>
        </div>
      </Container>
    </PageContainer>
  );
};

export default ExplorePage;