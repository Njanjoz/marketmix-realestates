// src/pages/AgentsPage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaPhone, FaEnvelope, FaSearch, FaFilter } from 'react-icons/fa'; 
import { ExternalLink } from 'lucide-react'; 
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const PRIMARY_COLOR = '#0284c7'; 
const SECONDARY_COLOR = '#0c4a6e';

const AgentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [agents, setAgents] = useState([]);
  const [agentsSettings, setAgentsSettings] = useState({
    title: 'Meet Our Real Estate Experts',
    subtitle: 'Connect with top-rated agents specializing in luxury homes, commercial properties, and rentals.',
    ctaTitle: 'Join Our Team of Experts',
    ctaSubtitle: 'Are you a real estate professional? Join MarketMix Real Estates and grow your career with us.'
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
            name: profile.name || data.name || 'Agent',
            title: profile.title || data.title || 'Real Estate Agent',
            photo: profile.photo || data.photo || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
            rating: Number(profile.rating ?? data.rating ?? 4.8),
            experience: Number(profile.experience ?? data.experience ?? 1),
            propertiesSold: Number(profile.propertiesSold ?? data.propertiesSold ?? 0),
            specialties,
            phone: profile.phone || data.phone || '',
            email: profile.email || data.email || '',
            bio: profile.bio || data.bio || 'Experienced real estate professional helping clients buy, sell, and invest.',
            languages: Array.isArray(profile.languages) && profile.languages.length ? profile.languages : ['English'],
            office: profile.office || data.office || '',
          };
        });

        setAgents(agentList);
      } catch (err) {
        console.error('Failed to load agent data:', err);
        setAgents([]);
      }
    };

    loadAgentsSettings();
    loadAgents();
  }, []);

  const specialtyOptions = [
    'all', 'Luxury Homes', 'Commercial', 'Apartments', 'Residential', 'Rentals', 'Investment', 'Land', 'Houses', 'Villas'
  ];

  const filteredAgents = agents.filter(agent => {
    const name = (agent.name || '').toLowerCase();
    const title = (agent.title || '').toLowerCase();
    const specialties = Array.isArray(agent.specialties) ? agent.specialties : [];

    const searchMatch = searchQuery === '' ||
      name.includes(searchQuery.toLowerCase()) ||
      title.includes(searchQuery.toLowerCase()) ||
      specialties.some(s => (s || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const specialtyMatch = filterSpecialty === 'all' || specialties.includes(filterSpecialty);

    return searchMatch && specialtyMatch;
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            {agentsSettings.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {agentsSettings.subtitle}
          </p>
        </header>

        {/* Search and Filter Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-12 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="w-full md:w-64 relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">All Specialties</option>
              {specialtyOptions.filter(s => s !== 'all').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Agents Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {filteredAgents.map(agent => (
            <motion.div 
              key={agent.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 transform hover:shadow-xl transition-shadow duration-300"
              variants={cardVariants}
            >
              <div className="relative h-48 bg-gray-100">
                <img 
                  src={agent.photo} 
                  alt={agent.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold flex items-center shadow-md">
                  <FaStar className="text-yellow-500 mr-1 w-3 h-3" />
                  {agent.rating}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{agent.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{agent.title}</p>
                
                <div className="flex justify-between text-sm text-gray-600 border-t border-b py-3 mb-4">
                  <div className="text-center">
                    <span className="font-bold text-lg text-gray-800">{agent.experience}+</span>
                    <p>Years Exp</p>
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-lg text-gray-800">{agent.propertiesSold}</span>
                    <p>Properties Sold</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Specializes In:</h4>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map(s => (
                      <span key={s} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <a 
                    href={`tel:${agent.phone}`} 
                    className="flex-1 flex items-center justify-center p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium text-sm"
                  >
                    <FaPhone className="mr-2" /> Call
                  </a>
                  <a 
                    href={`mailto:${agent.email}`} 
                    className="flex-1 flex items-center justify-center p-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    <FaEnvelope className="mr-2" /> Email
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold mb-2">No Agents Found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterSpecialty('all');
              }}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Become an Agent CTA */}
        <div 
          style={{ 
            background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
          }}
          className="mt-16 rounded-2xl p-8 text-white text-center shadow-2xl"
        >
          <h2 className="text-3xl font-bold mb-4">{agentsSettings.ctaTitle}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {agentsSettings.ctaSubtitle}
          </p>
          <button 
            style={{ 
              backgroundColor: 'white', 
              color: PRIMARY_COLOR,
              fontWeight: 600
            }}
            className="px-8 py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center mx-auto"
          >
            Apply Now <ExternalLink className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
