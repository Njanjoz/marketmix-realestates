// src/components/dashboards/AgentDashboard.jsx
import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  Building, TrendingUp, DollarSign, Users, 
  Calendar, MessageSquare, CheckCircle, Star,
  Plus, Filter, Download, Share2
} from 'lucide-react';

const AgentDashboard = () => {
  const stats = [
    { label: 'Active Listings', value: '24', change: '+3', icon: <Building />, color: 'blue' },
    { label: 'Leads This Month', value: '48', change: '+12%', icon: <Users />, color: 'emerald' },
    { label: 'Commission', value: 'KES 2.4M', change: '+18%', icon: <DollarSign />, color: 'amber' },
    { label: 'Success Rate', value: '92%', change: '+4%', icon: <CheckCircle />, color: 'purple' },
  ];

  const upcomingAppointments = [
    { time: '10:00 AM', client: 'John Smith', type: 'Property Viewing', location: 'Karen, Nairobi' },
    { time: '2:00 PM', client: 'Sarah Johnson', type: 'Contract Signing', location: 'Westlands, Nairobi' },
    { time: '4:30 PM', client: 'Mike Wilson', type: 'Initial Consultation', location: 'Online' },
  ];

  const recentLeads = [
    { name: 'Emma Davis', property: '3-Bed Apartment', budget: 'KES 8M', status: 'Hot', time: '2 hours ago' },
    { name: 'Robert Brown', property: 'Commercial Space', budget: 'KES 45M', status: 'Warm', time: '1 day ago' },
    { name: 'Lisa Taylor', property: 'Luxury Villa', budget: 'KES 120M', status: 'New', time: '2 days ago' },
  ];

  return (
    <DashboardLayout 
      title="Agent Dashboard" 
      subtitle="Manage your listings, leads, and commissions"
    >
      {/* Welcome Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, Agent!</h1>
            <p className="text-gray-600 mt-1">You have 8 new leads and 3 upcoming appointments today.</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center">
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

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
            <Calendar className="w-4 h-4 mr-1" /> View Calendar
          </button>
        </div>
        
        <div className="space-y-3">
          {upcomingAppointments.map((appointment, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg border border-blue-200">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{appointment.time}</span>
                    <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                      {appointment.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{appointment.client}</p>
                  <p className="text-xs text-gray-500">{appointment.location}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 text-sm bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                  Reschedule
                </button>
                <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Confirm
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center">
            <Download className="w-4 h-4 mr-1" /> Export Leads
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lead</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentLeads.map((lead, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.time}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{lead.property}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{lead.budget}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lead.status === 'Hot' ? 'bg-red-100 text-red-800' :
                      lead.status === 'Warm' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                      Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgentDashboard;