// src/pages/AgentsPage.jsx - Agents Page
// Adopts the Transport page theme (Liquid Glass, mmx-glass-surface-dark hero header)

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Phone, Mail, Award, ExternalLink, ChevronRight, User } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import '../components/moving/LiquidGlass.css';

const AgentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [agents, setAgents] = useState([]);
  const [agentsSettings, setAgentsSettings] = useState({
    title: 'Meet Our Real Estate Experts',
    subtitle: 'Connect with top-rated agents specializing in luxury homes, commercial properties, and rentals across Kenya.'
  });

  useEffect(() => {
    const loadAgentsSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'agents'));
        if (snap.exists()) {
          setAgentsSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error(err);
      }
    };

    const loadAgents = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'agent'));
        const snapshot = await getDocs(q);

        const agentList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const profile = data.agentProfile || {};
          const specialties = Array.isArray(profile.specialties) && profile.specialties.length
            ? profile.specialties
            : Array.isArray(data.specialties)
              ? data.specialties
              : ['Residential'];

          return {
            id: docSnap.id,
            name: data.name || profile.name || data.email?.split('@')[0] || 'Agent',
            email: data.email || '',
            phone: profile.phone || data.phone || '+254 700 000000',
            agency: profile.agency || data.agency || 'MarketMix Verified Agency',
            specialties,
            rating: profile.rating || data.rating || 5.0,
            reviewsCount: profile.reviewsCount || data.reviewsCount || 12,
            avatar: profile.avatar || data.avatar || null,
            bio: profile.bio || data.bio || 'Professional real estate expert dedicated to finding you the perfect home in Kenya.'
          };
        });

        setAgents(agentList);
      } catch (err) {
        console.error('Error loading agents:', err);
      }
    };

    loadAgentsSettings();
    loadAgents();
  }, []);

  const filtered = agents.filter(agent => {
    const text = `${agent.name} ${agent.agency} ${agent.bio} ${agent.specialties.join(' ')}`.toLowerCase();
    if (searchQuery.trim() && !text.includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="mmx-liquid-canvas min-h-screen overflow-hidden pb-24 text-slate-900">
      {/* Dark Hero Header matching Transport/Site Seeing */}
      <section className="mmx-glass-surface-dark relative isolate overflow-hidden rounded-b-[2.8rem] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_25%,rgba(52,211,153,0.22)_0%,rgba(15,23,42,0)_100%)]" />
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md mb-4 border border-emerald-400/30">
            <Award className="w-4 h-4" /> Verified Experts
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{agentsSettings.title}</h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
            {agentsSettings.subtitle}
          </p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search agents by name, agency, specialty..."
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-300 outline-none backdrop-blur-md focus:border-emerald-400 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Content Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Our Professional Agents</h2>
            <p className="text-xs text-slate-500">{filtered.length} verified experts ready to assist you</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mmx-glass-surface rounded-3xl border border-slate-200 p-12 text-center bg-white/70 backdrop-blur-md">
            <User className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No agents found</h3>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(agent => (
              <div key={agent.id} className="mmx-glass-surface rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xl flex items-center justify-center shrink-0 shadow">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{agent.name}</h3>
                      <p className="text-xs font-semibold text-emerald-700">{agent.agency}</p>
                      <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{agent.rating} ({agent.reviewsCount} reviews)</span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-600 line-clamp-3 leading-relaxed">{agent.bio}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {agent.specialties.map((spec, i) => (
                      <span key={i} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${agent.phone}`}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold text-center hover:bg-slate-800 transition"
                  >
                    Call Agent
                  </a>
                  <a
                    href={`mailto:${agent.email}`}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold text-center hover:bg-slate-50 transition"
                  >
                    Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AgentsPage;
