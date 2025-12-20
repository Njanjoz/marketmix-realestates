
// src/components/PropertyFilter.jsx
import React from 'react';

const PropertyFilter = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      <div className="space-y-4">
        {/* Property Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type
          </label>
          <select 
            value={filters.type || 'all'}
            onChange={(e) => onFilterChange({...filters, type: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select 
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange({...filters, status: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input 
            type="text"
            placeholder="Search location..."
            value={filters.location || ''}
            onChange={(e) => onFilterChange({...filters, location: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Range
          </label>
          <div className="flex space-x-2">
            <input 
              type="number"
              placeholder="Min"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <input 
              type="number"
              placeholder="Max"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Reset Button */}
        <button 
          onClick={() => onFilterChange({ type: 'all', status: 'all', location: '' })}
          className="w-full mt-4 p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default PropertyFilter;