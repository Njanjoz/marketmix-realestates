// src/pages/LuxuryPage.jsx - Luxury Properties Page
// Adopts the Transport page theme (Liquid Glass, mmx-glass-surface-dark hero header)

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Crown, Search, Filter, Star, Bed, Bath, Square, Heart, MapPin, ChevronRight } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { getPublicPropertyLocation } from '../utils/propertyMapping';
import toast from 'react-hot-toast';
import '../components/moving/LiquidGlass.css';

const LuxuryPage = () => {
  const { properties } = useProperties();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [luxuryProperties, setLuxuryProperties] = useState([]);

  useEffect(() => {
    if (properties) {
      // Filter properties that are luxury or priced above 100k or tagged luxury
      const luxury = properties.filter(p => 
        p.isLuxury || 
        p.category === 'luxury' || 
        p.propertyType === 'villa' || 
        (Number(p.price || 0) >= 100000)
      );
      setLuxuryProperties(luxury.length > 0 ? luxury : properties.slice(0, 6));
    }
  }, [properties]);

  const filtered = luxuryProperties.filter(prop => {
    const text = `${prop.title || ''} ${prop.location || ''} ${prop.description || ''}`.toLowerCase();
    if (searchQuery.trim() && !text.includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="mmx-liquid-canvas min-h-screen overflow-hidden pb-24 text-slate-900">
      {/* Dark Hero Header matching Transport/Site Seeing */}
      <section className="mmx-glass-surface-dark relative isolate overflow-hidden rounded-b-[2.8rem] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_25%,rgba(52,211,153,0.22)_0%,rgba(15,23,42,0)_100%)]" />
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-1.5 text-xs font-bold text-amber-300 backdrop-blur-md mb-4 border border-amber-400/30">
            <Crown className="w-4 h-4" /> Exclusive Estates
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Luxury Real Estate</h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
            Discover elite residences, high-end penthouses, and bespoke properties across Kenya's prime addresses.
          </p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search luxury villas, penthouses, locations..."
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-300 outline-none backdrop-blur-md focus:border-amber-400 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Content Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Curated Luxury Properties</h2>
            <p className="text-xs text-slate-500">{filtered.length} elite listings available</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mmx-glass-surface rounded-3xl border border-slate-200 p-12 text-center bg-white/70 backdrop-blur-md">
            <Crown className="mx-auto h-12 w-12 text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No luxury listings found</h3>
            <p className="mt-1 text-xs text-slate-500">Check back soon for new exclusive luxury arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {filtered.map(prop => (
              <PropertyCard key={prop.id} property={prop} viewMode="grid" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default LuxuryPage;
