// src/components/PropertyFilter.jsx
import React, { useState } from 'react';
import { useProperties } from '../context/PropertyContext';
import { FaSlidersH, FaTimes } from 'react-icons/fa';

const PropertyFilter = () => {
  const { filters, applyFilters } = useProperties();
  
  const [localFilters, setLocalFilters] = useState({
    ...filters,
    priceRange: [0, 10000000],
    bedrooms: 'any',
    bathrooms: 'any',
    amenities: []
  });

  const propertyTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'apartment', label: 'Apartments' },
    { value: 'house', label: 'Houses' },
    { value: 'villa', label: 'Villas' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'for-rent', label: 'For Rent' },
    { value: 'for-sale', label: 'For Sale' }
  ];

  const amenitiesList = [
    'Swimming Pool', 'Gym', '24/7 Security', 'Parking', 'Garden',
    'Wifi', 'Backup Generator', 'Balcony', 'Fully Furnished', 'Pet Friendly'
  ];

  const handleApplyFilters = () => {
    applyFilters(localFilters);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      type: 'all',
      status: 'all',
      priceRange: [0, 10000000],
      bedrooms: 'any',
      bathrooms: 'any',
      amenities: []
    };
    setLocalFilters(resetFilters);
    applyFilters(resetFilters);
  };

  const handleAmenityToggle = (amenity) => {
    const updatedAmenities = localFilters.amenities.includes(amenity)
      ? localFilters.amenities.filter(a => a !== amenity)
      : [...localFilters.amenities, amenity];
    
    setLocalFilters({
      ...localFilters,
      amenities: updatedAmenities
    });
  };

  return (
    <div className="space-y-6">
      {/* Property Type */}
      <div>
        <h3 className="font-semibold mb-3">Property Type</h3>
        <div className="space-y-2">
          {propertyTypes.map(type => (
            <label key={type.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="propertyType"
                value={type.value}
                checked={localFilters.type === type.value}
                onChange={(e) => setLocalFilters({...localFilters, type: e.target.value})}
                className="text-primary-600"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <h3 className="font-semibold mb-3">Status</h3>
        <div className="space-y-2">
          {statusOptions.map(status => (
            <label key={status.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={status.value}
                checked={localFilters.status === status.value}
                onChange={(e) => setLocalFilters({...localFilters, status: e.target.value})}
                className="text-primary-600"
              />
              <span>{status.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">
          Price Range: KES {localFilters.priceRange[0].toLocaleString()} - KES {localFilters.priceRange[1].toLocaleString()}
        </h3>
        <div className="space-y-4">
          <input
            type="range"
            min="0"
            max="10000000"
            step="100000"
            value={localFilters.priceRange[1]}
            onChange={(e) => setLocalFilters({
              ...localFilters,
              priceRange: [localFilters.priceRange[0], parseInt(e.target.value)]
            })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>KES 0</span>
            <span>KES 10M</span>
          </div>
        </div>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-3">Bedrooms</h3>
          <select
            value={localFilters.bedrooms}
            onChange={(e) => setLocalFilters({...localFilters, bedrooms: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="any">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div>
          <h3 className="font-semibold mb-3">Bathrooms</h3>
          <select
            value={localFilters.bathrooms}
            onChange={(e) => setLocalFilters({...localFilters, bathrooms: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="any">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="font-semibold mb-3">Amenities</h3>
        <div className="space-y-2">
          {amenitiesList.map(amenity => (
            <label key={amenity} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                className="rounded text-primary-600"
              />
              <span className="text-sm">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4 border-t">
        <button
          onClick={handleApplyFilters}
          className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={handleResetFilters}
          className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Reset All
        </button>
      </div>
    </div>
  );
};

export default PropertyFilter;