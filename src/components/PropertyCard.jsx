import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Eye } from 'lucide-react';

const PropertyCard = ({ property, viewMode = 'grid', distance }) => {
  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `KES ${(price / 1000000).toFixed(1)}M`;
    }
    return `KES ${price?.toLocaleString()}`;
  };

  if (viewMode === 'list') {
    return (
      <Link to={`/property/${property.id}`} className="block group">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col md:flex-row">
          <div className="relative md:w-72 h-56 overflow-hidden">
            <img 
              src={property.images?.[0] || 'https://placehold.co/400x300'} 
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                property.status === 'sale' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {property.status === 'sale' ? 'FOR SALE' : 'FOR RENT'}
              </span>
            </div>
            {distance && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                📍 {distance} km away
              </div>
            )}
          </div>
          <div className="flex-1 p-5">
            <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </div>
            <div className="flex flex-wrap gap-4 mb-4 text-gray-600">
              <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.bedrooms || 0} beds</span>
              <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms || 0} baths</span>
              <span className="flex items-center gap-1"><Square className="w-4 h-4" /> {property.area || 0} sqft</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-emerald-600">
                {formatPrice(property.price)}
                {property.status === 'rent' && <span className="text-sm font-normal">/month</span>}
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span className="flex items-center gap-1 text-xs"><Eye className="w-3 h-3" /> {property.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/property/${property.id}`} className="block group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="relative h-56 overflow-hidden">
          <img 
            src={property.images?.[0] || 'https://placehold.co/400x300'} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
              property.status === 'sale' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {property.status === 'sale' ? 'FOR SALE' : 'FOR RENT'}
            </span>
          </div>
          {distance && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              📍 {distance} km away
            </div>
          )}
          <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
            <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
          </button>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {property.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
          <div className="flex justify-between items-center mb-3 text-gray-600 text-sm">
            <span className="flex items-center gap-1"><Bed className="w-4 h-4" /> {property.bedrooms || 0}</span>
            <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms || 0}</span>
            <span className="flex items-center gap-1"><Square className="w-4 h-4" /> {property.area || 0}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <div className="text-xl font-bold text-emerald-600">
              {formatPrice(property.price)}
              {property.status === 'rent' && <span className="text-xs font-normal">/mo</span>}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {property.views || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
