// src/components/dashboards/UserDashboard.jsx - FIXED VERSION
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, Heart, MessageSquare, Calendar, Search,
  MapPin, Home, Star, Building, Filter,
  Clock, Bell, Settings, DollarSign
} from 'lucide-react';

const UserDashboard = () => {
  const userStats = [
    { label: 'Properties Viewed', value: '42', icon: <Eye />, color: 'bg-blue-500' },
    { label: 'Saved Properties', value: '12', icon: <Heart />, color: 'bg-red-500' },
    { label: 'Inquiries Sent', value: '8', icon: <MessageSquare />, color: 'bg-emerald-500' },
    { label: 'Upcoming Viewings', value: '2', icon: <Calendar />, color: 'bg-amber-500' },
  ];

  const savedProperties = [
    { title: 'Modern 3-Bed Apartment', location: 'Westlands, Nairobi', price: 'KES 24M', saved: '2 days ago' },
    { title: 'Luxury Villa with Pool', location: 'Karen, Nairobi', price: 'KES 85M', saved: '1 week ago' },
    { title: 'Commercial Office Space', location: 'Nairobi CBD', price: 'KES 45M', saved: '2 weeks ago' },
  ];

  const recentActivity = [
    { action: 'Viewed property in Karen', time: '2 hours ago', icon: <Eye /> },
    { action: 'Saved luxury apartment', time: '1 day ago', icon: <Heart /> },
    { action: 'Contacted agent about villa', time: '2 days ago', icon: <MessageSquare /> },
    { action: 'Scheduled property viewing', time: '3 days ago', icon: <Calendar /> },
  ];

  const recommendedProperties = [
    { title: '4-Bed Family Home', location: 'Runda', price: 'KES 65M', type: 'For Sale', features: ['Pool', 'Garden', 'Security'] },
    { title: '2-Bed Apartment', location: 'Kileleshwa', price: 'KES 18M', type: 'For Sale', features: ['Parking', 'Gym', 'Concierge'] },
    { title: 'Commercial Warehouse', location: 'Industrial Area', price: 'KES 95M', type: 'For Sale', features: ['5000 sq ft', 'Loading Dock', '24/7 Access'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Dashboard!</h1>
              <p className="text-gray-600 mt-1">Continue your property search or check your saved properties.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/properties'}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center"
            >
              <Search className="w-4 h-4 mr-2" /> Search Properties
            </button>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {userStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-20`}>
                  <div className={stat.color.replace('bg-', 'text-')}>{stat.icon}</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Saved Properties */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Saved Properties</h2>
            <button 
              onClick={() => window.location.href = '/favorites'}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              View All <Heart className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedProperties.map((property, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{property.title}</h3>
                      <div className="flex items-center mt-1">
                        <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                        <p className="text-sm text-gray-500">{property.location}</p>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-emerald-600">{property.price}</p>
                    <p className="text-xs text-gray-500">Saved {property.saved}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.location.href = `/property/${index}`}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      View Details
                    </button>
                    <button className="flex-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      Contact Agent
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="p-2 bg-white rounded-lg border border-gray-300 mr-3">
                    <div className="text-blue-600">{activity.icon}</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Properties */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended For You</h2>
            <div className="space-y-3">
              {recommendedProperties.map((property, index) => (
                <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{property.title}</h3>
                      <p className="text-sm text-gray-500">{property.location}</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full">
                      {property.type}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xl font-bold text-emerald-600">{property.price}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {property.features.map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => window.location.href = `/property/${index + 3}`}
                    className="w-full px-3 py-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:opacity-90"
                  >
                    View Property
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;