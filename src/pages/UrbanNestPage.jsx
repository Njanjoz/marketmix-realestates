// src/pages/UrbanNestPage.jsx - MarketMix Short Stays / UrbanNest

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { Building2, MapPin, Search, ChevronRight } from 'lucide-react';
import { db } from '../firebase/config';
import {
  resolvePropertyImage,
  getPublicPropertyLocation,
} from '../utils/propertyMapping';
import '../components/moving/LiquidGlass.css';

export default function UrbanNestPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'properties'),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProperties(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching short stay properties:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const filtered = properties.filter((prop) => {
    const type = String(prop.propertyType || '').toLowerCase();
    const category = String(prop.category || '').toLowerCase();
    const listingType = String(prop.listingType || '').toLowerCase();
    const stayType = String(prop.stayType || '').toLowerCase();

    const isShortStay =
      type.includes('short') ||
      type.includes('furnished') ||
      type.includes('serviced') ||
      type.includes('urbannest') ||
      category.includes('short') ||
      category.includes('furnished') ||
      category.includes('urbannest') ||
      listingType.includes('short') ||
      stayType.includes('short') ||
      stayType.includes('nightly');

    if (!isShortStay) return false;

    const text = `
      ${prop.title || ''}
      ${prop.location || ''}
      ${prop.description || ''}
      ${prop.propertyType || ''}
      ${prop.category || ''}
      ${prop.listingType || ''}
      ${prop.stayType || ''}
    `.toLowerCase();

    return (
      !searchQuery.trim() ||
      text.includes(searchQuery.trim().toLowerCase())
    );
  });

  return (
    <main className="mmx-liquid-canvas min-h-screen overflow-hidden pb-24 text-slate-900">
      {/* Hero */}
      <section className="mmx-glass-surface-dark relative isolate overflow-hidden rounded-b-[2.8rem] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_25%,rgba(52,211,153,0.22)_0%,rgba(15,23,42,0)_100%)]" />

        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Furnished Homes & Short-Term Stays
            </h1>

            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Find furnished apartments, vacation homes and flexible stays
              across Kenya.
            </p>

            <div className="relative mt-8 max-w-xl">
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search short stays, furnished apartments, location..."
                className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-300 outline-none backdrop-blur-md shadow-lg focus:border-emerald-400"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Listings */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Available Short Stays
          </h2>
          <p className="text-xs text-slate-500">
            {filtered.length} furnished & short stay listings ready
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Loading short stays...
          </div>
        ) : filtered.length === 0 ? (
          <div className="mmx-glass-surface rounded-3xl border border-slate-200 p-12 text-center bg-white/70 backdrop-blur-md">
            <Building2 className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No short stays found</h3>
            <p className="mt-1 text-xs text-slate-500">
              Check back soon for new furnished apartments and short stays.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {filtered.map((prop) => {
              const img = resolvePropertyImage(prop);
              return (
                <article
                  key={prop.id}
                  className="mmx-glass-surface group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-sm transition hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={img || '/images/property-hero.svg'}
                        alt={prop.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-amber-600 px-3 py-1 text-[10px] font-bold text-white shadow">
                        Short Stay
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                        {prop.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{getPublicPropertyLocation(prop)}</span>
                      </p>
                      <p className="mt-2 text-base font-extrabold text-emerald-800">
                        KSh {Number(prop.price || 0).toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          / night or month
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <Link
                      to={`/property/${prop.id}`}
                      className="w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow transition hover:bg-slate-800 flex items-center justify-center gap-2"
                    >
                      <span>View Short Stay</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
