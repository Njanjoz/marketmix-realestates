// src/pages/dashboards/SellerDashboard.jsx
import React from 'react';
import DashboardLayout from './DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Building, DollarSign, Eye, Heart, MessageSquare,
  TrendingUp, Clock, CheckCircle, Plus, Edit,
  Share2, BarChart, Users, Calendar
} from 'lucide-react';

const SellerDashboard = () => {
  const stats = [
    { label: 'Active Listings', value: '5', change: '+1', icon: <Building />, color: 'amber' },
    { label: 'Total Views', value: '1,248', change: '+42%', icon: <Eye />, color: 'blue' },
    { label: 'Inquiries', value: '28', change: '+8', icon: <MessageSquare />, color: 'emerald' },
    { label: 'Offers Received', value: '6', change: '+2', icon: <DollarSign />, color: 'purple' },
  ];

  const listings = [
    { 
      title: 'Modern Villa in Karen', 
      price: 'KES 85M', 
      status: 'Active', 
      views: 342,
      inquiries: 12,
      lastUpdated: '2 days ago'
    },
    { 
      title: '3-Bed Apartment Westlands', 
      price: 'KES 24M', 
      status: 'Pending', 
      views: 189,
      inquiries: 8,
      lastUpdated: '1 week ago'
    },
    { 
      title: 'Commercial Space CBD', 
      price: 'KES 120M', 
      status: 'Active', 
      views: 421,
      inquiries: 18,
      lastUpdated: '3 days ago'
    },
  ];

  const recentOffers = [
    { buyer: 'John Smith', property: 'Modern Villa', amount: 'KES 80M', status: 'Negotiating', date: 'Today' },
    { buyer: 'Sarah Johnson', property: '3-Bed Apartment', amount: 'KES 23M', status: 'Accepted', date: '2 days ago' },
    { buyer: 'Mike Wilson', property: 'Commercial Space', amount: 'KES 115M', status: 'Rejected', date: '1 week ago' },
  ];

  return (
    <DashboardLayout 
      title="Seller Dashboard" 
      subtitle="Manage your property listings and offers"
    >
      {/* Welcome Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sell Smarter with MarketMix</h1>
            <p className="text-gray-600 mt-1">Your properties have received 1,248 views this month.</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center">
            <Plus className="w-4 h-4 mr-2" /> List Property
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <div className={`text-${stat.color}-600`}>{stat.icon}</div>
              </div>
              <span className={`text-sm font-medium text-${stat.color}-600`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Property Listings */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Listings</h2>
          <button className="text-sm text-amber-600 hover:text-amber-700 flex items-center">
            <BarChart className="w-4 h-4 mr-1" /> View Analytics
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{listing.price}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    listing.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {listing.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <Eye className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold">{listing.views}</p>
                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded">
                    <MessageSquare className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold">{listing.inquiries}</p>
                    <p className="text-xs text-gray-500">Inquiries</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <Clock className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold">{listing.lastUpdated}</p>
                    <p className="text-xs text-gray-500">Updated</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </button>
                  <button className="flex-1 px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center">
                    <Share2 className="w-3 h-3 mr-1" /> Promote
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Offers */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Offers</h2>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
            <Users className="w-4 h-4 mr-1" /> View All Buyers
          </button>
        </div>
        
        <div className="space-y-3">
          {recentOffers.map((offer, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg border border-gray-300">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{offer.buyer}</span>
                    <span className="text-sm px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                      {offer.property}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{offer.amount}</p>
                  <p className="text-xs text-gray-500">{offer.date}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  offer.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' :
                  offer.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {offer.status}
                </span>
                <div className="flex space-x-2">
                  {offer.status === 'Negotiating' && (
                    <>
                      <button className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                        Accept
                      </button>
                      <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboard;