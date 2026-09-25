import React, { useState } from 'react';
import { Search, MapPin, DollarSign, Home, Filter, X } from 'lucide-react';

const PropertyFilter = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState({
    location: filters?.location || '',
    minPrice: filters?.minPrice || '',
    maxPrice: filters?.maxPrice || '',
    bedrooms: filters?.bedrooms || 'any',
    propertyType: filters?.type || 'all',
    status: filters?.status || 'all'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({
      location: localFilters.location,
      minPrice: localFilters.minPrice ? parseInt(localFilters.minPrice) : null,
      maxPrice: localFilters.maxPrice ? parseInt(localFilters.maxPrice) : null,
      bedrooms: localFilters.bedrooms !== 'any' ? parseInt(localFilters.bedrooms) : null,
      type: localFilters.propertyType,
      status: localFilters.status
    });
  };

  const handleReset = () => {
    setLocalFilters({
      location: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: 'any',
      propertyType: 'all',
      status: 'all'
    });
    onFilterChange({
      location: '',
      minPrice: null,
      maxPrice: null,
      bedrooms: null,
      type: 'all',
      status: 'all'
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Filter Properties
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-3 h-3 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            name="location"
            value={localFilters.location}
            onChange={handleChange}
            placeholder="Enter city or area..."
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="w-3 h-3 inline mr-1" />
            Price Range (KES)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              name="minPrice"
              value={localFilters.minPrice}
              onChange={handleChange}
              placeholder="Min"
              className="w-full p-2 border rounded-lg"
            />
            <input
              type="number"
              name="maxPrice"
              value={localFilters.maxPrice}
              onChange={handleChange}
              placeholder="Max"
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>
        
        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Home className="w-3 h-3 inline mr-1" />
            Bedrooms
          </label>
          <select
            name="bedrooms"
            value={localFilters.bedrooms}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
          >
            <option value="any">Any</option>
            <option value="1">1+ Bedroom</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
            <option value="5">5+ Bedrooms</option>
          </select>
        </div>
        
        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
          <select
            name="propertyType"
            value={localFilters.propertyType}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </select>
        </div>
        
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={localFilters.status}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg"
          >
            <option value="all">All</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
        
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyFilter;
