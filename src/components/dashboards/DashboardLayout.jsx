// src/components/dashboard/DashboardLayout.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Home, Building, Heart, MessageSquare, 
  Bell, Settings, Users, Package, BarChart, Briefcase, 
  DollarSign, TrendingUp, Key, CreditCard, Shield, 
  FileText, HelpCircle, LogOut, ChevronRight, UserCircle,
  Calendar, PieChart, Eye, Edit, Plus, Filter, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children, title, subtitle }) => {
  const { userProfile, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = userProfile?.userType || 'user';
  const userName = userProfile?.name || currentUser?.email?.split('@')[0];

  // Get role-specific sidebar items
  const getSidebarItems = () => {
    const baseItems = [
      { icon: <LayoutDashboard />, label: 'Overview', path: '/dashboard' },
      { icon: <UserCircle />, label: 'My Profile', path: '/profile' },
      { icon: <Building />, label: 'Properties', path: '/dashboard/properties' },
      { icon: <Heart />, label: 'Favorites', path: '/favorites' },
      { icon: <MessageSquare />, label: 'Messages', path: '/messages' },
      { icon: <Bell />, label: 'Notifications', path: '/notifications' },
      { icon: <Settings />, label: 'Settings', path: '/settings' },
    ];

    if (userRole === 'admin') {
      return [
        { icon: <Shield />, label: 'Admin Dashboard', path: '/admin/dashboard' },
        { icon: <Users />, label: 'Manage Users', path: '/admin/users' },
        { icon: <Package />, label: 'Manage Properties', path: '/admin/properties' },
        { icon: <BarChart />, label: 'Analytics', path: '/admin/analytics' },
        ...baseItems
      ];
    } else if (userRole === 'agent') {
      return [
        { icon: <Briefcase />, label: 'Agent Dashboard', path: '/agent/dashboard' },
        { icon: <Building />, label: 'My Listings', path: '/agent/listings' },
        { icon: <TrendingUp />, label: 'Leads', path: '/agent/leads' },
        { icon: <DollarSign />, label: 'Commissions', path: '/agent/commissions' },
        ...baseItems
      ];
    } else if (userRole === 'seller' || userRole === 'landlord') {
      return [
        { icon: <Key />, label: 'Seller Dashboard', path: '/seller/dashboard' },
        { icon: <Plus />, label: 'List Property', path: '/seller/list' },
        { icon: <Building />, label: 'My Listings', path: '/seller/listings' },
        { icon: <CreditCard />, label: 'Offers', path: '/seller/offers' },
        ...baseItems
      ];
    } else if (userRole === 'investor') {
      return [
        { icon: <TrendingUp />, label: 'Investor Dashboard', path: '/investor/dashboard' },
        { icon: <Star />, label: 'Opportunities', path: '/investor/opportunities' },
        { icon: <Briefcase />, label: 'Portfolio', path: '/investor/portfolio' },
        { icon: <BarChart />, label: 'Market Analysis', path: '/investor/analysis' },
        ...baseItems
      ];
    }

    return baseItems;
  };

  const sidebarItems = getSidebarItems();

  const getRoleColor = () => {
    switch(userRole) {
      case 'admin': return 'from-red-500 to-pink-600';
      case 'agent': return 'from-blue-500 to-cyan-600';
      case 'seller': return 'from-amber-500 to-orange-600';
      case 'investor': return 'from-purple-500 to-violet-600';
      default: return 'from-emerald-500 to-teal-600';
    }
  };

  const getRoleLabel = () => {
    switch(userRole) {
      case 'admin': return 'Administrator';
      case 'agent': return 'Verified Agent';
      case 'seller': return 'Property Seller';
      case 'landlord': return 'Landlord';
      case 'investor': return 'Investor';
      default: return 'Premium Member';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className={`sticky top-0 z-40 bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <Home className="w-6 h-6" />
                <span className="font-bold text-lg">MarketMix</span>
              </Link>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="text-sm opacity-90">{subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs opacity-90">{getRoleLabel()}</p>
              </div>
              <Link 
                to="/" 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Back to Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-24">
              {/* User Info */}
              <div className="mb-6 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRoleColor()} flex items-center justify-center`}>
                    <span className="text-white font-bold">
                      {userName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    userRole === 'admin' ? 'bg-red-100 text-red-800' :
                    userRole === 'agent' ? 'bg-blue-100 text-blue-800' :
                    userRole === 'seller' ? 'bg-amber-100 text-amber-800' :
                    userRole === 'investor' ? 'bg-purple-100 text-purple-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {getRoleLabel()}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-l-4 border-emerald-500'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 text-emerald-600" />}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Properties Viewed</span>
                    <span className="text-sm font-semibold text-emerald-600">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Favorites</span>
                    <span className="text-sm font-semibold text-amber-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="text-sm font-semibold text-blue-600">8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;