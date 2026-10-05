import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, Heart, Eye, Share2 } from 'lucide-react';
import { getPropertyImage } from '../services/propertyService';
import { shareProperty } from '../services/shareService';
import { getPublicPropertyLocation } from '../utils/propertyMapping';
import toast from 'react-hot-toast';

const PropertyCard = ({ property, viewMode = 'grid', distance }) => {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('marketmix-saved-properties') || '[]');
      setSaved(stored.includes(String(property.id)));
    } catch (error) {
      setSaved(false);
    }
  }, [property.id]);

  const toggleSaved = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const key = 'marketmix-saved-properties';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const id = String(property.id);
    const next = existing.includes(id)
      ? existing.filter((item) => item !== id)
      : [...existing, id];

    localStorage.setItem(key, JSON.stringify(next));
    setSaved(next.includes(id));
  };

  const handleShare = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const result = await shareProperty(property);
      if (result?.source === 'whatsapp') {
        toast.success('WhatsApp share opened');
      } else if (result?.source === 'clipboard') {
        toast.success('Property details copied');
      } else if (result?.shared) {
        toast.success('Property shared');
      }
    } catch (error) {
      console.error('Share property error:', error);
      toast.error('Could not share property');
    }
  };

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
              src={getPropertyImage(property)} 
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                property.status === 'sale' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {property.status === 'sale' ? 'FOR SALE' : 'FOR RENT'}
              </span>
              {property.availabilityStatus && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-white/90 text-gray-800">
                  {String(property.availabilityStatus).toUpperCase()}
                </span>
              )}
              {property.verificationStatus && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-100 text-amber-800">
                  {String(property.verificationStatus).toUpperCase()}
                </span>
              )}
            </div>
            {distance && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                📍 {distance} km away
              </div>
            )}
          </div>
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                  {property.title}
                </h3>
                <div className="flex items-center text-gray-500 text-sm mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  {getPublicPropertyLocation(property)}
                </div>
              </div>
              <button
                type="button"
                aria-label="Share property"
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
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
            src={getPropertyImage(property)} 
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
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              aria-label="Share property"
              onClick={handleShare}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors text-gray-700 hover:text-emerald-600"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Save property"
              onClick={toggleSaved}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`} />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {property.availabilityStatus && (
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                {String(property.availabilityStatus).toUpperCase()}
              </span>
            )}
            {property.verificationStatus && (
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                {String(property.verificationStatus).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
            {property.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{getPublicPropertyLocation(property)}</span>
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
