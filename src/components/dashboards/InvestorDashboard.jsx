// src/components/dashboards/InvestorDashboard.jsx
import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  TrendingUp, DollarSign, PieChart, Building, 
  BarChart, Target, TrendingDown, ArrowUpRight,
  Filter, Download, Plus, Eye
} from 'lucide-react';

const InvestorDashboard = () => {
  const portfolioStats = [
    { label: 'Total Portfolio Value', value: 'KES 245M', change: '+18.2%', icon: <DollarSign />, color: 'emerald' },
    { label: 'Active Investments', value: '12', change: '+2', icon: <Building />, color: 'blue' },
    { label: 'Annual Return', value: '24.8%', change: '+3.2%', icon: <TrendingUp />, color: 'amber' },
    { label: 'Risk Level', value: 'Medium', change: 'Stable', icon: <Target />, color: 'purple' },
  ];

  const investmentOpportunities = [
    { name: 'Luxury Apartment Complex', location: 'Westlands', roi: '28%', minInvestment: 'KES 10M', risk: 'Medium' },
    { name: 'Commercial REIT', location: 'Nairobi CBD', roi: '22%', minInvestment: 'KES 5M', risk: 'Low' },
    { name: 'Student Housing', location: 'Kileleshwa', roi: '32%', minInvestment: 'KES 15M', risk: 'High' },
    { name: 'Mixed-Use Development', location: 'Karen', roi: '26%', minInvestment: 'KES 20M', risk: 'Medium' },
  ];

  const portfolioDistribution = [
    { type: 'Residential', value: 'KES 120M', percentage: '49%', color: 'blue' },
    { type: 'Commercial', value: 'KES 85M', percentage: '35%', color: 'emerald' },
    { type: 'Industrial', value: 'KES 25M', percentage: '10%', color: 'amber' },
    { type: 'Land', value: 'KES 15M', percentage: '6%', color: 'purple' },
  ];

  return (
    <DashboardLayout 
      title="Investor Dashboard" 
      subtitle="Track your real estate investments and opportunities"
    >
      {/* Welcome Section */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Investments, Smart Returns</h1>
            <p className="text-gray-600 mt-1">Your portfolio has grown by 18.2% this quarter.</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center">
            <Plus className="w-4 h-4 mr-2" /> New Investment
          </button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {portfolioStats.map((stat, index) => (
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
              <span className={`text-sm font-medium text-${stat.color}-600 flex items-center`}>
                <ArrowUpRight className="w-3 h-3 mr-1" /> {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Portfolio Distribution */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Portfolio Distribution</h2>
            <button className="text-sm text-purple-600 hover:text-purple-700 flex items-center">
              <PieChart className="w-4 h-4 mr-1" /> Details
            </button>
          </div>
          
          <div className="space-y-4">
            {portfolioDistribution.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{item.type}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-${item.color}-500`}
                    style={{ width: item.percentage }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs text-${item.color}-600`}>{item.percentage}</span>
                  <span className="text-xs text-gray-500">of portfolio</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Trends */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Market Trends</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
              <BarChart className="w-4 h-4 mr-1" /> View Report
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { sector: 'Residential', trend: 'Up', change: '+8.2%', description: 'Strong demand in suburban areas' },
              { sector: 'Commercial', trend: 'Up', change: '+5.7%', description: 'Office spaces recovering post-pandemic' },
              { sector: 'Luxury', trend: 'Up', change: '+12.4%', description: 'High-end properties in high demand' },
              { sector: 'Rental', trend: 'Stable', change: '+2.1%', description: 'Steady rental yields maintained' },
            ].map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{trend.sector}</p>
                  <p className="text-xs text-gray-500">{trend.description}</p>
                </div>
                <div className="text-right">
                  <div className={`flex items-center justify-end ${
                    trend.change.includes('+') ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {trend.trend === 'Up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    <span className="font-semibold">{trend.change}</span>
                  </div>
                  <span className="text-xs text-gray-500">Quarterly</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment Opportunities */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Investment Opportunities</h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center">
              <Filter className="w-4 h-4 mr-1" /> Filter
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center">
              <Download className="w-4 h-4 mr-1" /> Export
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investmentOpportunities.map((opportunity, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{opportunity.name}</h3>
                  <p className="text-sm text-gray-500">{opportunity.location}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  opportunity.risk === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                  opportunity.risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {opportunity.risk} Risk
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-emerald-50 rounded">
                  <p className="text-2xl font-bold text-emerald-600">{opportunity.roi}</p>
                  <p className="text-xs text-emerald-700">Projected ROI</p>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-xl font-bold text-blue-600">{opportunity.minInvestment}</p>
                  <p className="text-xs text-blue-700">Min Investment</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center">
                  <Eye className="w-3 h-3 mr-1" /> Details
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> Invest
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvestorDashboard;