// src/components/Navbar.jsx - COMPLETE RESET VERSION
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Home, User, Heart, Menu, X, Building2, 
  Phone, LogOut, ChevronDown, Star, MapPin, Filter,
  ChevronRight, Sparkles, Gem, Crown, Zap, 
  ArrowDownToLine, Target, Award, TrendingUp, Globe, Compass,
  Bell, MessageSquare, Settings, ChevronLeft, CreditCard,
  Shield, Calendar, Bookmark, Briefcase, DollarSign, 
  Key, Lock, Mail, UserCircle, LayoutDashboard, 
  LogOut as LogOutIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, userProfile, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHomePage, setIsHomePage] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Check if we're on homepage and detect device
  useEffect(() => {
    setIsHomePage(location.pathname === '/');
    setIsDesktop(window.innerWidth >= 1024);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
      setIsMenuOpen(false);
      setDropdownOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Google sign in failed:", error);
    }
  }, [googleSignIn]);

  const navItems = useMemo(() => [
    { name: 'Buy', path: '/properties?status=sale', icon: <Gem className="w-4 h-4" /> },
    { name: 'Rent', path: '/properties?status=rent', icon: <Home className="w-4 h-4" /> },
    { name: 'Explore', path: '/explore', icon: <Compass className="w-4 h-4" /> },
    { name: 'Luxury', path: '/luxury', icon: <Crown className="w-4 h-4" /> },
    { name: 'Agents', path: '/agents', icon: <User className="w-4 h-4" /> },
    { name: 'Contact', path: '/contact', icon: <Phone className="w-4 h-4" /> },
  ], []);

  // ✅ FIX: ALL dashboard links go to /dashboard ONLY
  const dashboardLinks = useMemo(() => {
    const userType = userProfile?.userType || userProfile?.role || 'user';
    
    // Get dashboard name based on role
    let dashboardName = 'My Dashboard';
    let badge = null;
    
    switch (userType) {
      case 'admin':
        dashboardName = 'Admin Dashboard';
        badge = 'Admin';
        break;
      case 'agent':
        dashboardName = 'Agent Dashboard';
        badge = 'Agent';
        break;
      case 'seller':
      case 'landlord':
        dashboardName = 'Seller Dashboard';
        badge = 'Seller';
        break;
      case 'investor':
        dashboardName = 'Investor Dashboard';
        badge = 'Investor';
        break;
      default:
        dashboardName = 'My Dashboard';
        break;
    }
    
    const baseLinks = [
      { name: 'My Profile', path: '/profile', icon: <UserCircle className="w-4 h-4" /> },
      { name: 'Favorites', path: '/favorites', icon: <Heart className="w-4 h-4" /> },
      { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-4 h-4" /> },
      { name: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
      { name: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
    ];
    
    // ✅ ONLY ONE DASHBOARD LINK - to /dashboard
    return [
      { 
        name: dashboardName, 
        path: '/dashboard', 
        icon: <LayoutDashboard className="w-4 h-4" />,
        badge: badge
      },
      ...baseLinks
    ];
  }, [userProfile?.userType, userProfile?.role]);

  // Mock notifications
  const notifications = useMemo(() => [
    { id: 1, title: 'New Property Match', description: 'A property matching your criteria was just listed', time: '2 min ago', read: false, type: 'property' },
    { id: 2, title: 'Price Drop Alert', description: 'Property in Karen is now KES 25M', time: '1 hour ago', read: false, type: 'price' },
    { id: 3, title: 'Viewing Confirmed', description: 'Your viewing at 3 PM today is confirmed', time: '2 hours ago', read: true, type: 'appointment' },
  ], []);

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Glass effect styles
  const glassNavbarStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(25px) saturate(200%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  const glassDropdownStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(30px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 15px 45px rgba(0, 0, 0, 0.15)',
  };

  const glassButtonStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  };

  // User Profile Dropdown
  const UserProfileDropdown = () => (
    <AnimatePresence>
      {dropdownOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50"
          style={glassDropdownStyle}
        >
          {/* User Profile Header */}
          <div className="p-4 border-b border-white/25">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-white">
                    {userProfile?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                {userProfile?.userType === 'admin' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userProfile?.name || currentUser?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-800 truncate">
                  {currentUser?.email || 'user@example.com'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    userProfile?.userType === 'admin' ? 'bg-red-500/25 text-red-800' : 
                    userProfile?.userType === 'agent' ? 'bg-blue-500/25 text-blue-800' :
                    userProfile?.userType === 'seller' ? 'bg-amber-500/25 text-amber-800' :
                    userProfile?.userType === 'investor' ? 'bg-purple-500/25 text-purple-800' :
                    'bg-emerald-500/25 text-emerald-800'
                  }`}>
                    {userProfile?.userType === 'admin' ? 'Administrator' : 
                     userProfile?.userType === 'agent' ? 'Verified Agent' :
                     userProfile?.userType === 'seller' ? 'Property Seller' :
                     userProfile?.userType === 'investor' ? 'Investor' :
                     'Premium Member'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dashboard Links - ALL GO TO /dashboard */}
          <div className="p-2">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">Dashboard</p>
              {dashboardLinks.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    console.log('🔗 Navigating to:', item.path);
                    setDropdownOpen(false);
                    navigate(item.path);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-900 hover:text-gray-950 hover:bg-white/30 transition-all duration-200 mb-1"
                >
                  <div className="flex items-center space-x-3">
                    <div className={item.badge ? 'text-amber-600' : 'text-emerald-600'}>
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/25 text-red-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Logout Button */}
            <div className="p-3 border-t border-white/25 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
              >
                <LogOutIcon className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Notifications Dropdown
  const NotificationsDropdown = () => (
    <AnimatePresence>
      {notificationsOpen && (
        <motion.div
          ref={notificationsRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50"
          style={glassDropdownStyle}
        >
          <div className="p-4 border-b border-white/25 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <span className="text-xs text-emerald-600 cursor-pointer hover:text-emerald-700">
              Mark all as read
            </span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-white/15 hover:bg-white/25 transition-colors ${
                  !notification.read ? 'bg-emerald-500/15' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.type === 'property' ? 'bg-blue-500/25 text-blue-600' :
                    notification.type === 'price' ? 'bg-green-500/25 text-green-600' :
                    'bg-amber-500/25 text-amber-600'
                  }`}>
                    {notification.type === 'property' ? <Building2 className="w-4 h-4" /> :
                     notification.type === 'price' ? <DollarSign className="w-4 h-4" /> :
                     <Calendar className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-800 mt-1">{notification.description}</p>
                    <p className="text-xs text-gray-600 mt-1">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-white/25">
            <Link
              to="/notifications"
              onClick={() => setNotificationsOpen(false)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15 transition-all duration-200"
            >
              <span>View All Notifications</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={glassNavbarStyle}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative p-1.5 md:p-2 rounded-lg" style={glassButtonStyle}>
                <Home className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
                  MarketMix
                </span>
                <span className="text-[10px] md:text-[11px] font-medium tracking-wider uppercase text-gray-700">
                  Real Estate
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:text-emerald-600 transition-all duration-200"
                  style={glassButtonStyle}
                >
                  <span className="text-emerald-600">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 rounded-lg transition-all duration-200" style={glassButtonStyle}>
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              
              {currentUser && (
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-lg transition-all duration-200 relative"
                    style={glassButtonStyle}
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-xs text-white rounded-full flex items-center justify-center shadow-md">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                  <NotificationsDropdown />
                </div>
              )}
              
              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200"
                    style={glassButtonStyle}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-white">
                        {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {userProfile?.name?.split(' ')[0] || currentUser.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-emerald-600 capitalize">
                        {userProfile?.userType || 'User'}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <UserProfileDropdown />
                </div>
              ) : (
                <>
                  <Link to="/login" className="hidden lg:block px-4 py-2 text-sm font-medium text-gray-800 hover:text-emerald-600 rounded-lg transition-all duration-200" style={glassButtonStyle}>
                    Sign In
                  </Link>
                  <Link to="/register" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-600 to-amber-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                    Join Free
                  </Link>
                </>
              )}
              
              <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 rounded-lg transition-all duration-200" style={glassButtonStyle}>
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer - Simplified */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto bg-white/20 backdrop-blur-xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-gray-900">MarketMix</h2>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg hover:bg-white/20">
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-900 hover:bg-white/30 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-emerald-600">{item.icon}</div>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </Link>
                  ))}
                </div>

                {currentUser && (
                  <div className="mt-6 pt-6 border-t border-white/25">
                    <p className="text-xs font-semibold text-gray-800 mb-3">My Account</p>
                    <div className="space-y-1">
                      {dashboardLinks.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => {
                            setIsMenuOpen(false);
                            navigate(item.path);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-900 hover:bg-white/30 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-cyan-600">{item.icon}</div>
                            <span>{item.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}

                {!currentUser && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-white/20"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Google</span>
                    </button>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center px-4 py-3 bg-emerald-600 text-white rounded-lg">
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;