// src/pages/HomePage.jsx - LUXURY BLACK & WHITE VERSION
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Home, Building2, Building, TreePine, Hotel, Store, ChevronRight, Star, MapPin, Bed, Bath, Square } from 'lucide-react';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Property types data - Black & White Theme
  const propertyTypes = [
    { icon: <Building2 className="w-8 h-8" />, name: 'APARTMENTS', count: '1,200+', bg: 'bg-gradient-to-br from-gray-900 to-black' },
    { icon: <Home className="w-8 h-8" />, name: 'HOUSES', count: '850+', bg: 'bg-gradient-to-br from-gray-800 to-gray-900' },
    { icon: <Building className="w-8 h-8" />, name: 'COMMERCIAL', count: '450+', bg: 'bg-gradient-to-br from-gray-700 to-gray-800' },
    { icon: <TreePine className="w-8 h-8" />, name: 'LAND', count: '320+', bg: 'bg-gradient-to-br from-black to-gray-900' },
    { icon: <Hotel className="w-8 h-8" />, name: 'VILLAS', count: '180+', bg: 'bg-gradient-to-br from-gray-900 to-black' },
    { icon: <Store className="w-8 h-8" />, name: 'OFFICES', count: '600+', bg: 'bg-gradient-to-br from-gray-800 to-gray-900' },
  ];

  // Stats data
  const stats = [
    { number: '5,000+', label: 'Properties Listed', color: 'from-gray-900 to-black' },
    { number: '98%', label: 'Client Satisfaction', color: 'from-gray-800 to-gray-900' },
    { number: '15+', label: 'Years Experience', color: 'from-black to-gray-900' },
    { number: '200+', label: 'Expert Agents', color: 'from-gray-900 to-black' },
  ];

  // Featured properties data
  const featuredProperties = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop',
      title: 'Modern 3-Bedroom Apartment',
      location: 'Kilimani, Nairobi',
      price: 85000,
      status: 'rent',
      bedrooms: 3,
      bathrooms: 2,
      area: 1800,
      featured: true
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
      title: 'Luxury Villa in Karen',
      location: 'Karen, Nairobi',
      price: 45000000,
      status: 'sale',
      bedrooms: 5,
      bathrooms: 4,
      area: 4500,
      featured: true
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop',
      title: '2-Bedroom Apartment',
      location: 'Westlands, Nairobi',
      price: 65000,
      status: 'rent',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      featured: false
    },
  ];

  const popularTags = ['Nairobi Westlands', 'Mombasa Nyali', 'Apartments for Rent', '2 Bedroom Houses', 'Commercial Spaces', 'Luxury Villas'];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Monochromatic Luxury */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Black Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920&auto=format&fit=crop&q=80"
            alt="Luxury Property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            {/* Main Heading with Elegant Typography */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light text-white mb-6 leading-tight tracking-tight">
              Discover <span className="font-normal">Timeless</span><br />
              <span className="font-normal">Properties</span> in Kenya
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl font-light tracking-wide">
              Premium real estate with uncompromising standards. Experience luxury living at its finest.
            </p>

            {/* Search Bar - Minimalist Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 max-w-2xl"
            >
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center">
                  <Search className="w-5 h-5 text-gray-400 ml-4 mr-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search properties by location or type..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 py-4 focus:outline-none text-lg font-light"
                  />
                </div>
                <button className="px-8 py-4 bg-white text-black font-medium hover:bg-gray-100 transition-colors rounded-lg">
                  <Search className="w-5 h-5 inline mr-2" />
                  Search
                </button>
              </div>
            </motion.div>

            {/* Quick Search Tags */}
            <div className="flex flex-wrap gap-3 mt-6">
              {popularTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full border border-white/20 hover:bg-white/20 transition-colors text-sm font-light"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section - Minimalist */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 font-serif`}>
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types - Monochromatic */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-light mb-4 text-gray-900">Explore Property Categories</h2>
            <div className="w-24 h-px bg-gray-900 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto font-light">
              Curated selection of premium properties across Kenya
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {propertyTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link to={`/properties?type=${type.name.toLowerCase()}`}>
                  <div className={`${type.bg} p-6 rounded-2xl text-white text-center transition-all duration-300 group-hover:shadow-2xl`}>
                    <div className="mb-4 flex justify-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        {type.icon}
                      </div>
                    </div>
                    <h3 className="font-medium mb-1 tracking-wide">{type.name}</h3>
                    <p className="text-white/60 text-sm">{type.count} Listings</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties - Elegant Cards */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16">
            <div>
              <h2 className="text-3xl lg:text-4xl font-serif font-light mb-3 text-gray-900">Featured Properties</h2>
              <div className="w-20 h-px bg-gray-900 mb-4"></div>
              <p className="text-gray-600 font-light">Handpicked properties of exceptional quality</p>
            </div>
            <Link
              to="/properties"
              className="mt-4 lg:mt-0 inline-flex items-center text-gray-900 hover:text-gray-700 font-medium group border-b border-transparent hover:border-gray-900 transition-all"
            >
              View All Properties
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-200"
              >
                {/* Property Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  {/* Status Badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${property.status === 'rent' ? 'bg-gray-900' : 'bg-black'} text-white tracking-wide`}>
                    {property.status === 'rent' ? 'FOR RENT' : 'FOR SALE'}
                  </div>
                  {property.featured && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-600 fill-current" />
                      <span className="font-medium text-gray-900 text-sm">FEATURED</span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <h3 className="text-xl font-serif font-light mb-2 text-gray-900">{property.title}</h3>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{property.location}</span>
                  </div>

                  {/* Property Features */}
                  <div className="flex justify-between border-t border-b border-gray-100 py-4 mb-4">
                    <div className="text-center">
                      <Bed className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm font-medium">{property.bedrooms} Beds</span>
                    </div>
                    <div className="text-center">
                      <Bath className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm font-medium">{property.bathrooms} Baths</span>
                    </div>
                    <div className="text-center">
                      <Square className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <span className="text-sm font-medium">{property.area} sqft</span>
                    </div>
                  </div>

                  {/* Price and Action */}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-serif font-light text-gray-900">
                        {property.status === 'rent' ? `KES ${property.price.toLocaleString()}/mo` : `KES ${property.price.toLocaleString()}`}
                      </div>
                    </div>
                    <Link
                      to={`/property/${property.id}`}
                      className="px-6 py-2 bg-black text-white hover:bg-gray-900 transition-colors font-medium rounded-lg"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action - Minimalist */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-serif font-light mb-6">Begin Your Property Journey</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto font-light">
            Connect with our expert agents for personalized property consultations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/properties"
              className="px-8 py-3 bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors rounded-lg"
            >
              Browse Properties
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 bg-transparent border border-white text-white font-medium hover:bg-white/10 transition-colors rounded-lg"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;