// src/components/dashboards/UserDashboard.jsx - SIMPLE VERSION
import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Eye, Heart, MessageSquare, Calendar, Search,
  MapPin, Home, Star, Building, Filter,
  Clock, Bell, Settings, DollarSign
} from 'lucide-react';

const UserDashboard = () => {
  const userStats = [
    { label: 'Properties Viewed', value: '42', icon: <Eye />, color: 'blue' },
    { label: 'Saved Properties', value: '12', icon: <Heart />, color: 'red' },
    { label: 'Inquiries Sent', value: '8', icon: <MessageSquare />, color: 'emerald' },
    { label: 'Upcoming Viewings', value: '2', icon: <Calendar />, color: 'amber' },
  ];

  return (
    <DashboardLayout 
      title="My Dashboard" 
      subtitle="Welcome to your personal dashboard"
    >
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
              <div className={`p-2 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                stat.color === 'red' ? 'bg-red-100 text-red-600' :
                stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Search Properties', icon: <Search />, color: 'emerald', onClick: () => window.location.href = '/properties' },
            { label: 'View Favorites', icon: <Heart />, color: 'red', onClick: () => window.location.href = '/favorites' },
            { label: 'My Messages', icon: <MessageSquare />, color: 'blue', onClick: () => window.location.href = '/messages' },
            { label: 'Edit Profile', icon: <Settings />, color: 'purple', onClick: () => window.location.href = '/profile' },
          ].map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
                action.color === 'emerald' ? 'border-emerald-200 bg-emerald-50' :
                action.color === 'red' ? 'border-red-200 bg-red-50' :
                action.color === 'blue' ? 'border-blue-200 bg-blue-50' :
                'border-purple-200 bg-purple-50'
              } hover:shadow-md transition-shadow`}
            >
              <div className={`p-2 rounded-lg mb-2 ${
                action.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                action.color === 'red' ? 'bg-red-100 text-red-600' :
                action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { action: 'Viewed property in Karen', time: '2 hours ago', icon: <Eye /> },
            { action: 'Saved luxury apartment', time: '1 day ago', icon: <Heart /> },
            { action: 'Contacted agent about villa', time: '2 days ago', icon: <MessageSquare /> },
            { action: 'Scheduled property viewing', time: '3 days ago', icon: <Calendar /> },
          ].map((activity, index) => (
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
    </DashboardLayout>
  );
};

export default UserDashboard;