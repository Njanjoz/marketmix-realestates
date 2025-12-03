// src/pages/AgentsPage.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Use FaPhone, FaEnvelope, FaSearch, FaFilter for consistency
import { FaStar, FaPhone, FaEnvelope, FaSearch, FaFilter } from 'react-icons/fa'; 
// Import a custom icon for the link
import { ExternalLink } from 'lucide-react'; 

// --- COLOR CONSTANTS (Defined locally to fix the ReferenceError) ---
// Based on the colors seen in other files (e.g., HomePage.jsx)
const PRIMARY_COLOR = '#0284c7'; 
const SECONDARY_COLOR = '#0c4a6e'; // A darker blue/cyan for gradient
const ACCENT_ORANGE = '#f59e0b'; // The missing variable
const ACCENT_YELLOW = '#fcd34d'; 

const AgentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');

  const agents = [
    {
      id: 1,
      name: "Sarah Johnson",
      title: "Senior Real Estate Agent",
      photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786",
      rating: 4.9,
      experience: 12,
      propertiesSold: 245,
      specialties: ["Luxury Homes", "Commercial", "Apartments"],
      phone: "+254 712 345 678",
      email: "sarah@marketmix.co.ke"
    },
    {
      id: 2,
      name: "Michael Chen",
      title: "Property Management Expert",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      rating: 4.8,
      experience: 8,
      propertiesSold: 189,
      specialties: ["Residential", "Rentals", "Investment"],
      phone: "+254 701 234 567",
      email: "michael@marketmix.co.ke"
    },
    {
        id: 3,
        name: "Aisha Hassan",
        title: "Commercial Property Specialist",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
        rating: 5.0,
        experience: 5,
        propertiesSold: 92,
        specialties: ["Commercial", "Land"],
        phone: "+254 722 987 654",
        email: "aisha@marketmix.co.ke"
    },
    {
        id: 4,
        name: "David Kimani",
        title: "Residential Sales Agent",
        photo: "https://images.unsplash.com/photo-1531427186208-eb287f7cdba7",
        rating: 4.7,
        experience: 15,
        propertiesSold: 350,
        specialties: ["Houses", "Villas", "Luxury Homes"],
        phone: "+254 733 456 789",
        email: "david@marketmix.co.ke"
    },
  ];

  const specialtyOptions = [
    'all', 'Luxury Homes', 'Commercial', 'Apartments', 'Residential', 'Rentals', 'Investment', 'Land', 'Houses', 'Villas'
  ];

  const filteredAgents = agents.filter(agent => {
    // 1. Search Query Filter
    const searchMatch = searchQuery === '' || 
                        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        agent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        agent.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Specialty Filter
    const specialtyMatch = filterSpecialty === 'all' || agent.specialties.includes(filterSpecialty);

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
            Meet Our Real Estate Experts
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with top-rated agents specializing in luxury homes, commercial properties, and rentals.
          </p>
        </header>

        {/* Search and Filter Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-xl mb-12 flex flex-col md:flex-row gap-4 items-center">
          
          {/* Search Input */}
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

          {/* Specialty Filter Dropdown */}
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
            {/* Custom chevron icon or use native appearance-none styling */}
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

        {/* Become an Agent CTA (Using local constants to fix error) */}
        <div 
          style={{ 
            background: `linear-gradient(to right, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`
          }}
          className="mt-16 rounded-2xl p-8 text-white text-center shadow-2xl"
        >
          <h2 className="text-3xl font-bold mb-4">Join Our Team of Experts</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Are you a real estate professional? Join MarketMix Real Estates and grow your career with us.
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