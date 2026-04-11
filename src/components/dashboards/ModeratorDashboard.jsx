// src/components/dashboards/ModeratorDashboard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle,
  Users, Building, Flag, Eye, MessageSquare,
  Clock, Filter, RefreshCw, Search, UserCheck
} from 'lucide-react';

const ModeratorDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('reported');

  const reportedItems = [
    { id: 1, type: 'property', title: 'Suspicious Listing', reportedBy: 'John Doe', reason: 'Fake listing', date: '2 hours ago', status: 'pending' },
    { id: 2, type: 'user', title: 'Spam Account', reportedBy: 'Sarah Smith', reason: 'Spam messages', date: '5 hours ago', status: 'pending' },
    { id: 3, type: 'review', title: 'Inappropriate Review', reportedBy: 'Mike Johnson', reason: 'Harassment', date: '1 day ago', status: 'reviewing' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Moderator Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Content moderation and user management</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Moderator</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                {userProfile?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'M'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending Reports', value: '12', icon: Flag, color: 'red', change: '+3' },
            { label: 'Resolved Today', value: '8', icon: CheckCircle, color: 'green', change: '+5' },
            { label: 'Active Reviews', value: '24', icon: Eye, color: 'blue', change: '+2' },
            { label: 'Actions Taken', value: '156', icon: Shield, color: 'purple', change: '+12%' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <span className="text-xs font-medium text-green-600">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6">
            <div className="flex space-x-6">
              {[
                { id: 'reported', label: 'Reported Content', icon: Flag },
                { id: 'pending', label: 'Pending Reviews', icon: Clock },
                { id: 'resolved', label: 'Resolved', icon: CheckCircle },
                { id: 'users', label: 'User Reports', icon: Users },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-3 px-1 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reported content..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Reported Items List */}
            <div className="space-y-4">
              {reportedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'property' ? 'bg-blue-50' :
                      item.type === 'user' ? 'bg-orange-50' :
                      'bg-purple-50'
                    }`}>
                      {item.type === 'property' ? <Building className="w-5 h-5 text-blue-600" /> :
                       item.type === 'user' ? <Users className="w-5 h-5 text-orange-600" /> :
                       <MessageSquare className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">Reported by {item.reportedBy} • {item.date}</p>
                      <p className="text-xs text-red-600 mt-1">Reason: {item.reason}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                      Approve
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                      Remove
                    </button>
                    <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeratorDashboard;