import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bed, Bath, Square, Heart, Eye, Share2 } from 'lucide-react';
import { getPropertyImage, recordPropertyClick } from '../services/propertyService';
import { shareProperty } from '../services/shareService';
import toast from 'react-hot-toast';
import { getListingType } from '../utils/listingType';

const PropertyCard = ({ property, viewMode = 'grid', distance }) => {
  const [saved, setSaved] = useState(false);
  const listingType = getListingType(property);

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
        <div className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-[0_8px_30px_rgba(15,39,31,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,39,31,0.16)] flex flex-col md:flex-row">
          <div className="relative md:w-80 h-56 overflow-hidden bg-emerald-950">
            <img 
              src={getPropertyImage(property) || '/images/property-hero.svg'}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(event) => { event.currentTarget.src = '/images/property-hero.svg'; }}
            />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.14em] font-bold shadow-lg backdrop-blur ${
                    listingType === 'sale' ? 'bg-white/95 text-slate-900' : 'bg-emerald-950/90 text-white'
              }`}>
                {listingType === 'sale' ? 'FOR SALE' : listingType === 'rent' ? 'FOR RENT' : 'LISTING TYPE UNAVAILABLE'}
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
          <div className="flex-1 p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-1 group-hover:text-emerald-800 transition-colors">
                  {property.title}
                </h3>
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
            <div className="flex flex-wrap gap-4 mb-5 text-slate-500 text-sm">
              <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-emerald-800" /> {property.bedrooms || 0} beds</span>
              <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-emerald-800" /> {property.bathrooms || 0} baths</span>
              <span className="flex items-center gap-1.5"><Square className="w-4 h-4 text-emerald-800" /> {property.area || 0} sqft</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold tracking-tight text-emerald-900">
                {formatPrice(property.price)}
                {listingType === 'rent' && <span className="text-sm font-normal">/month</span>}
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
        <div className="overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-[0_8px_30px_rgba(15,39,31,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,39,31,0.16)]">
        <div className="relative h-56 overflow-hidden bg-emerald-950">
          <img 
            src={getPropertyImage(property) || '/images/property-hero.svg'}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(event) => { event.currentTarget.src = '/images/property-hero.svg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/15 pointer-events-none" />
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.14em] font-bold shadow-lg backdrop-blur ${
              listingType === 'sale' ? 'bg-white/95 text-slate-900' : 'bg-emerald-950/90 text-white'
            }`}>
              {listingType === 'sale' ? 'FOR SALE' : listingType === 'rent' ? 'FOR RENT' : 'LISTING TYPE UNAVAILABLE'}
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
              className="p-2.5 bg-white/90 rounded-full shadow-md backdrop-blur hover:bg-white transition-colors text-gray-700 hover:text-emerald-800"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Save property"
              onClick={toggleSaved}
              className="p-2.5 bg-white/90 rounded-full shadow-md backdrop-blur hover:bg-white transition-colors"
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`} />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 mb-2">
            {property.availabilityStatus && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-800">
                {String(property.availabilityStatus).toUpperCase()}
              </span>
            )}
            {property.verificationStatus && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-50 text-amber-800">
                {String(property.verificationStatus).toUpperCase()}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 mb-1 group-hover:text-emerald-800 transition-colors line-clamp-1">
            {property.title}
          </h3>
          <div className="flex justify-between items-center mb-4 text-slate-500 text-sm">
            <span className="flex items-center gap-1.5"><Bed className="w-4 h-4 text-emerald-800" /> {property.bedrooms || 0}</span>
            <span className="flex items-center gap-1.5"><Bath className="w-4 h-4 text-emerald-800" /> {property.bathrooms || 0}</span>
            <span className="flex items-center gap-1.5"><Square className="w-4 h-4 text-emerald-800" /> {property.area || 0}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <div className="text-xl font-bold tracking-tight text-emerald-900">
              {formatPrice(property.price)}
              {listingType === 'rent' && <span className="text-xs font-normal">/mo</span>}
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
