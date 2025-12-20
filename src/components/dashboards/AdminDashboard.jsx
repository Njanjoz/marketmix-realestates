// src/components/dashboards/AdminDashboard.jsx
import React, { useState } from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Users, Building, BarChart, Shield, AlertTriangle, 
  TrendingUp, DollarSign, Eye, CheckCircle, XCircle,
  Download, Filter, RefreshCw, Plus, Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Total Users', value: '1,245', change: '+12%', icon: <Users />, color: 'blue' },
    { label: 'Properties', value: '5,287', change: '+8%', icon: <Building />, color: 'emerald' },
    { label: 'Revenue', value: 'KES 124M', change: '+23%', icon: <DollarSign />, color: 'amber' },
    { label: 'Active Listings', value: '842', change: '+5%', icon: <Eye />, color: 'purple' },
  ];

  const recentActivities = [
    { user: 'John Doe', action: 'listed a new property', time: '2 min ago', type: 'property' },
    { user: 'Sarah Smith', action: 'registered as an agent', time: '15 min ago', type: 'user' },
    { user: 'Mike Johnson', action: 'made a KES 25M offer', time: '1 hour ago', type: 'offer' },
    { user: 'Emma Wilson', action: 'reported an issue', time: '2 hours ago', type: 'alert' },
  ];

  const systemMetrics = [
    { label: 'Server Uptime', value: '99.9%', status: 'good' },
    { label: 'API Response Time', value: '128ms', status: 'good' },
    { label: 'Database Load', value: '64%', status: 'warning' },
    { label: 'Cache Hit Rate', value: '92%', status: 'good' },
  ];

  return (
    <DashboardLayout 
      title="Admin Control Center" 
      subtitle="Manage your real estate platform"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200"
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

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add User', icon: <Plus />, color: 'blue', path: '/admin/users/add' },
            { label: 'View Reports', icon: <BarChart />, color: 'emerald', path: '/admin/analytics' },
            { label: 'Manage Properties', icon: <Building />, color: 'amber', path: '/admin/properties' },
            { label: 'System Settings', icon: <Settings />, color: 'purple', path: '/admin/settings' },
          ].map((action, index) => (
            <button
              key={index}
              className={`flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-${action.color}-50 to-white border border-${action.color}-200 hover:shadow-md transition-shadow`}
            >
              <div className={`p-2 rounded-lg bg-${action.color}-100 mb-2`}>
                <div className={`text-${action.color}-600`}>{action.icon}</div>
              </div>
              <span className="text-sm font-medium text-gray-900">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* System Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{metric.label}</span>
                {metric.status === 'good' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-xl font-bold text-gray-900">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </button>
        </div>
        
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'property' ? 'bg-blue-100' :
                  activity.type === 'user' ? 'bg-emerald-100' :
                  activity.type === 'offer' ? 'bg-amber-100' :
                  'bg-red-100'
                }`}>
                  {activity.type === 'property' ? <Building className="w-4 h-4 text-blue-600" /> :
                   activity.type === 'user' ? <Users className="w-4 h-4 text-emerald-600" /> :
                   activity.type === 'offer' ? <DollarSign className="w-4 h-4 text-amber-600" /> :
                   <AlertTriangle className="w-4 h-4 text-red-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
              <button className="text-sm text-gray-500 hover:text-gray-700">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;