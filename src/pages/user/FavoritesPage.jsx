import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Heart, Compass, MapPin, Building, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import PropertyCard from '../../components/PropertyCard';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import '../../components/moving/LiquidGlass.css';

const FavoritesPage = () => {
  const { currentUser } = useAuth();
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadFavorites = async () => {
      try {
        let propertyIds = [];
        if (currentUser) {
          // Load from Firestore favorites/savedProperties
          const favQuery = query(collection(db, 'favorites'), where('userId', '==', currentUser.uid));
          const favSnap = await getDocs(favQuery);
          propertyIds = favSnap.docs.map(d => d.data().propertyId).filter(Boolean);
          
          if (propertyIds.length === 0) {
            const savedQuery = query(collection(db, 'savedProperties'), where('userId', '==', currentUser.uid));
            const savedSnap = await getDocs(savedQuery);
            propertyIds = savedSnap.docs.map(d => d.data().propertyId || d.id.split('_')[1]).filter(Boolean);
          }
        }
        
        // Also check localStorage
        try {
          const localStored = JSON.parse(localStorage.getItem('marketmix-saved-properties') || '[]');
          propertyIds = Array.from(new Set([...propertyIds, ...localStored]));
        } catch (e) {
          // ignore
        }

        if (propertyIds.length === 0) {
          if (active) {
            setSavedProperties([]);
            setLoading(false);
          }
          return;
        }

        // Fetch properties
        const propList = [];
        for (const pid of propertyIds) {
          try {
            const pDoc = await getDoc(doc(db, 'properties', pid));
            if (pDoc.exists()) {
              propList.push({ id: pDoc.id, ...pDoc.data() });
            }
          } catch (e) {
            // ignore individual fetch errors
          }
        }

        if (active) {
          setSavedProperties(propList);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        if (active) setLoading(false);
      }
    };

    loadFavorites();
    return () => { active = false; };
  }, [currentUser]);

  return (
    <DashboardLayout title="Favorites" subtitle="Your saved properties">
      <div className="space-y-6">
        {/* Ready to see saved properties banner */}
        {savedProperties.length > 0 && (
          <div className="mmx-glass-surface rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-sm bg-gradient-to-br from-emerald-50 via-white to-sky-50 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-widest mb-1">
                <Compass className="w-4 h-4" />
                Site Seeing Package Ready
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ready to see your saved properties?</h2>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                You have {savedProperties.length} saved {savedProperties.length === 1 ? 'property' : 'properties'}. Plan a multi-property viewing tour with our expert agents.
              </p>
            </div>
            <Link
              to="/site-seeing"
              className="mmx-liquid-primary inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-95 shrink-0"
            >
              <span>Plan My Viewing</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Saved Properties Grid */}
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-4">Saved Properties</h3>
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading your saved properties...</div>
          ) : savedProperties.length === 0 ? (
            <div className="mmx-glass-surface rounded-3xl border border-slate-200 p-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h4 className="text-lg font-bold text-slate-900">No saved properties yet</h4>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Explore our listings and click the heart icon to save properties you want to review or see in person.
              </p>
              <Link
                to="/properties"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-xs font-bold text-white shadow hover:bg-emerald-800 transition"
              >
                Explore Properties
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {savedProperties.map(prop => (
                <PropertyCard key={prop.id} property={prop} viewMode="grid" />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FavoritesPage;
