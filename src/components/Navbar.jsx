// src/components/Navbar.jsx - FULLY TRANSPARENT GLASS NAVBAR
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Home, User, Heart, Menu, X, Building2, 
  Phone, LogOut, ChevronDown, Star, MapPin, Filter,
  ChevronRight, Sparkles, Gem, Crown, Zap, 
  ArrowDownToLine, ArrowUpFromLine, RefreshCw,
  Target, Award, TrendingUp, Globe, Compass,
  Navigation, Map, Building, TreePine, Hotel,
  Eye, EyeOff, MousePointer, ShoppingBag, Bell,
  MessageSquare, Settings, ChevronLeft, CreditCard,
  Shield, Calendar, Bookmark, TrendingUp as TrendingUpIcon,
  Briefcase, DollarSign, ShieldCheck, Building2 as BuildingIcon,
  Key, Star as StarIcon, Lock, Mail, UserCircle,
  FileText, HelpCircle, LogOut as LogOutIcon,
  LayoutDashboard, Users, Package, BarChart,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, userProfile, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHomePage, setIsHomePage] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  
  // Check if we're on homepage and detect device
  useEffect(() => {
    setIsHomePage(location.pathname === '/');
    setIsDesktop(window.innerWidth >= 1024);
  }, [location]);

  // Handle scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
      if (window.scrollY > 50) {
        setShowHero(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gentle pull-to-reveal logic for desktop only
  useEffect(() => {
    if (!isHomePage || !isDesktop) return;

    let touchStartY = 0;
    let isTouching = false;
    let pullThreshold = 80;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        isTouching = true;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouching || window.scrollY > 0) return;
      
      const currentTouchY = e.touches[0].clientY;
      const distance = currentTouchY - touchStartY;
      
      if (distance > 0) {
        const progress = Math.min(1, distance / pullThreshold);
        setPullProgress(progress);
        
        if (progress > 0.2 && !showHero) {
          setShowHero(true);
        }
        
        if (progress < 0.15 && showHero) {
          setShowHero(false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isTouching) {
        isTouching = false;
        setIsPulling(false);
        
        if (pullProgress > 0.4) {
          setShowHero(true);
          setTimeout(() => {
            if (!isTouching) setShowHero(false);
          }, 5000);
        } else {
          setShowHero(false);
        }
        
        setTimeout(() => {
          setPullProgress(0);
        }, 300);
      }
    };

    const handleMouseDown = (e) => {
      if (window.scrollY === 0 && e.clientY < 50) {
        touchStartY = e.clientY;
        isTouching = true;
        setIsPulling(true);
      }
    };

    const handleMouseMove = (e) => {
      if (!isTouching || window.scrollY > 0) return;
      
      const distance = e.clientY - touchStartY;
      
      if (distance > 0) {
        const progress = Math.min(1, distance / pullThreshold);
        setPullProgress(progress);
        
        if (progress > 0.2 && !showHero) {
          setShowHero(true);
        }
        
        if (progress < 0.15 && showHero) {
          setShowHero(false);
        }
      }
    };

    const handleMouseUp = () => {
      if (isTouching) {
        isTouching = false;
        setIsPulling(false);
        
        if (pullProgress > 0.4) {
          setShowHero(true);
          setTimeout(() => {
            if (!isTouching) setShowHero(false);
          }, 5000);
        } else {
          setShowHero(false);
        }
        
        setTimeout(() => {
          setPullProgress(0);
        }, 300);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isHomePage, showHero, pullProgress, isDesktop]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (showHero && containerRef.current && !containerRef.current.contains(event.target)) {
        setShowHero(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHero]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsMenuOpen(false);
      setDropdownOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Google sign in failed:", error);
    }
  };

  const navItems = [
    { name: 'Buy', path: '/properties?status=sale', icon: <Gem className="w-4 h-4" /> },
    { name: 'Rent', path: '/properties?status=rent', icon: <Home className="w-4 h-4" /> },
    { name: 'Explore', path: '/explore', icon: <Compass className="w-4 h-4" /> },
    { name: 'Luxury', path: '/luxury', icon: <Crown className="w-4 h-4" /> },
    { name: 'Agents', path: '/agents', icon: <User className="w-4 h-4" /> },
    { name: 'Contact', path: '/contact', icon: <Phone className="w-4 h-4" /> },
  ];

  // Role-based dashboard links
  const getDashboardLinks = () => {
    const userType = userProfile?.userType || 'user';
    
    const baseLinks = [
      { name: 'My Profile', path: '/profile', icon: <UserCircle className="w-4 h-4" /> },
      { name: 'Favorites', path: '/favorites', icon: <Heart className="w-4 h-4" /> },
      { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-4 h-4" /> },
      { name: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
      { name: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" /> },
    ];

    if (userType === 'admin') {
      return [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, badge: 'Admin' },
        { name: 'Manage Users', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
        { name: 'Manage Properties', path: '/admin/properties', icon: <Package className="w-4 h-4" /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <BarChart className="w-4 h-4" /> },
        ...baseLinks
      ];
    } else if (userType === 'agent') {
      return [
        { name: 'Agent Dashboard', path: '/agent/dashboard', icon: <Briefcase className="w-4 h-4" />, badge: 'Agent' },
        { name: 'My Listings', path: '/agent/listings', icon: <Building className="w-4 h-4" /> },
        { name: 'Leads', path: '/agent/leads', icon: <TrendingUpIcon className="w-4 h-4" /> },
        ...baseLinks
      ];
    } else if (userType === 'seller' || userType === 'landlord') {
      return [
        { name: 'Seller Dashboard', path: '/seller/dashboard', icon: <Key className="w-4 h-4" />, badge: 'Seller' },
        { name: 'List Property', path: '/seller/list', icon: <Plus className="w-4 h-4" /> },
        { name: 'My Listings', path: '/seller/listings', icon: <Building className="w-4 h-4" /> },
        ...baseLinks
      ];
    } else if (userType === 'investor') {
      return [
        { name: 'Investor Dashboard', path: '/investor/dashboard', icon: <TrendingUpIcon className="w-4 h-4" />, badge: 'Investor' },
        { name: 'Investment Opportunities', path: '/investor/opportunities', icon: <StarIcon className="w-4 h-4" /> },
        ...baseLinks
      ];
    } else { // Regular user/buyer/renter
      return [
        { name: 'My Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        ...baseLinks
      ];
    }
  };

  const dashboardLinks = getDashboardLinks();

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New Property Match', description: 'A property matching your criteria was just listed', time: '2 min ago', read: false, type: 'property' },
    { id: 2, title: 'Price Drop Alert', description: 'Property in Karen is now KES 25M', time: '1 hour ago', read: false, type: 'price' },
    { id: 3, title: 'Viewing Confirmed', description: 'Your viewing at 3 PM today is confirmed', time: '2 hours ago', read: true, type: 'appointment' },
  ];

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // GLASS EFFECT STYLES - COMPLETELY TRANSPARENT
  const glassNavbarStyle = {
    background: 'rgba(255, 255, 255, 0.15)', // Very transparent white
    backdropFilter: 'blur(25px) saturate(200%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  const intenseGlassStyle = {
    background: 'rgba(255, 255, 255, 0.2)', // Slightly more opaque for contrast
    backdropFilter: 'blur(30px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 15px 45px rgba(0, 0, 0, 0.15)',
  };

  const lightGlassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(15px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  };

  const ultraGlassStyle = {
    background: 'rgba(255, 255, 255, 0.08)', // Ultra transparent
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
          style={intenseGlassStyle}
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
                    userProfile?.userType === 'admin' 
                      ? 'bg-red-500/25 text-red-800' 
                      : userProfile?.userType === 'agent'
                      ? 'bg-blue-500/25 text-blue-800'
                      : userProfile?.userType === 'seller'
                      ? 'bg-amber-500/25 text-amber-800'
                      : userProfile?.userType === 'investor'
                      ? 'bg-purple-500/25 text-purple-800'
                      : 'bg-emerald-500/25 text-emerald-800'
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
          
          {/* Dashboard Links */}
          <div className="p-2 max-h-96 overflow-y-auto">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">Dashboard</p>
              {dashboardLinks.slice(0, 6).map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-900 hover:text-gray-950 hover:bg-white/30 transition-all duration-200 mb-1"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${
                      item.badge ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.badge === 'Admin' ? 'bg-red-500/25 text-red-800' :
                      item.badge === 'Agent' ? 'bg-blue-500/25 text-blue-800' :
                      item.badge === 'Seller' ? 'bg-amber-500/25 text-amber-800' :
                      item.badge === 'Investor' ? 'bg-purple-500/25 text-purple-800' :
                      'bg-emerald-500/25 text-emerald-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
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
          style={intenseGlassStyle}
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
                    {notification.type === 'property' ? <Building className="w-4 h-4" /> :
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

  // Pull indicator component (Desktop only)
  const PullIndicator = () => (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 pointer-events-none"
      style={{
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, transparent 100%)',
        backdropFilter: 'blur(5px)',
      }}
      initial={{ y: -40, opacity: 0 }}
      animate={{ 
        y: isPulling ? 0 : -40,
        opacity: isPulling ? 1 : 0
      }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md">
        <motion.div
          animate={{ 
            rotate: pullProgress > 0.4 ? 180 : 0,
            scale: 1 + (pullProgress * 0.2)
          }}
          transition={{ duration: 0.2 }}
        >
          <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-300" />
        </motion.div>
        
        <div className="w-20 h-1 bg-white/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${pullProgress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        <span className="text-xs text-white/80">
          {pullProgress > 0.4 ? 'Release' : 'Pull'}
        </span>
      </div>
    </motion.div>
  );

  // Hero Banner Component (Desktop only)
  const HeroBanner = () => (
    <motion.div
      ref={containerRef}
      initial={{ y: -350, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        height: 280 + (pullProgress * 30)
      }}
      exit={{ y: -350, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 150,
        damping: 25,
        mass: 0.8
      }}
      className="fixed top-0 left-0 right-0 z-40 overflow-hidden"
      style={intenseGlassStyle}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-transparent to-amber-500/15"></div>
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 text-center relative">
        {/* Main Logo */}
        <motion.div
          className="mb-4"
          initial={{ scale: 0.9, y: -20 }}
          animate={{ 
            scale: 1 + (pullProgress * 0.05),
            y: 0,
            rotate: pullProgress > 0.8 ? [0, 1, -1, 0] : 0
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-block relative">
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl blur-xl"
              style={{ background: 'linear-gradient(45deg, #10B981, #FBBF24)' }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Glass container */}
            <div
              className="relative px-10 py-6 rounded-3xl"
              style={lightGlassStyle}
            >
              <h1 className="text-5xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                MARKETMIX
              </h1>
              
              {/* Animated underline */}
              <motion.div
                className="h-1 mx-auto"
                initial={{ width: 0 }}
                animate={{ width: '60%' }}
                transition={{ delay: 0.2, duration: 0.8 }}
                style={{
                  background: 'linear-gradient(90deg, transparent, #10B981, #FBBF24, transparent)',
                }}
              />
            </div>
            
            {/* Floating decorators */}
            <motion.div
              className="absolute -top-2 -left-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -right-2"
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </motion.div>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
            style={lightGlassStyle}
          >
            <Target className="w-4 h-4 text-emerald-500" />
            <span className="text-base font-medium tracking-wide text-gray-900">
              Premium Real Estate Excellence
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
        </motion.div>

        {/* Close hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="mt-4"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-700">Click outside or scroll to close</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Pull Indicator (Desktop only) */}
      {isHomePage && isDesktop && <PullIndicator />}

      {/* Hero Banner (Desktop only) */}
      <AnimatePresence>
        {showHero && isHomePage && isDesktop && <HeroBanner />}
      </AnimatePresence>

      {/* Main Navbar - COMPLETELY TRANSPARENT GLASS */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={glassNavbarStyle}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo with glass effect */}
            <Link to="/" className="flex items-center space-x-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-lg blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div 
                  className="relative p-1.5 md:p-2 rounded-lg"
                  style={ultraGlassStyle}
                >
                  <Home className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                </div>
              </motion.div>
              
              {/* Logo text with gradient */}
              <div className="flex flex-col">
                <motion.span 
                  className="text-lg md:text-xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  MarketMix
                </motion.span>
                <span className="text-[10px] md:text-[11px] font-medium tracking-wider uppercase text-gray-700">
                  Real Estate
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - with ultra glass buttons */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, idx) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Link
                    to={item.path}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 hover:text-emerald-600 transition-all duration-200"
                    style={ultraGlassStyle}
                  >
                    <span className="text-emerald-600">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Right Side Actions - with ultra glass buttons */}
            <div className="flex items-center space-x-2">
              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg transition-all duration-200"
                style={ultraGlassStyle}
              >
                <Search className="w-5 h-5 text-gray-700" />
              </motion.button>
              
              {/* Notifications Button (Logged in users) */}
              {currentUser && (
                <div className="relative" ref={notificationsRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-lg transition-all duration-200 relative"
                    style={ultraGlassStyle}
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-xs text-white rounded-full flex items-center justify-center shadow-md">
                        {unreadNotifications}
                      </span>
                    )}
                  </motion.button>
                  <NotificationsDropdown />
                </div>
              )}
              
              {/* User Profile Button (Logged in users) */}
              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200"
                    style={ultraGlassStyle}
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
                    <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </motion.button>
                  <UserProfileDropdown />
                </div>
              ) : (
                // Sign In Button (Not logged in) - with ultra glass effect
                <>
                  <Link
                    to="/login"
                    className="hidden lg:block px-4 py-2 text-sm font-medium text-gray-800 hover:text-emerald-600 rounded-lg transition-all duration-200"
                    style={ultraGlassStyle}
                  >
                    Sign In
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to="/register"
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-600 to-amber-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Join Free
                    </Link>
                  </motion.div>
                </>
              )}
              
              {/* Mobile Menu Button - with ultra glass effect */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg transition-all duration-200"
                style={ultraGlassStyle}
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Drawer - with transparent glass effect */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            
            {/* Drawer - with transparent glass */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto"
              style={intenseGlassStyle}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={ultraGlassStyle}
                    >
                      <Home className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">MarketMix</h2>
                      <p className="text-xs text-emerald-600">Real Estate</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    style={ultraGlassStyle}
                  >
                    <X className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* User Info - with glass effect */}
                {currentUser && (
                  <div 
                    className="mb-6 p-4 rounded-xl border border-white/25"
                    style={lightGlassStyle}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md">
                        <span className="text-lg font-bold text-white">
                          {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {userProfile?.name || currentUser.email?.split('@')[0] || 'User'}
                        </h3>
                        <p className="text-xs text-gray-800">{currentUser.email || 'user@example.com'}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                          userProfile?.userType === 'admin' 
                            ? 'bg-red-500/25 text-red-800' 
                            : 'bg-emerald-500/25 text-emerald-800'
                        }`}>
                          {userProfile?.userType === 'admin' ? 'Administrator' : 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links - with glass buttons */}
                <div className="space-y-1 mb-6">
                  <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </p>
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-900 hover:text-gray-950 hover:bg-white/30 transition-all"
                      style={ultraGlassStyle}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-emerald-600">{item.icon}</div>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </Link>
                  ))}
                </div>

                {/* User Links (Logged in) */}
                {currentUser && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-3 px-2">
                      My Account
                    </p>
                    <div className="space-y-1">
                      {dashboardLinks.slice(0, 5).map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-900 hover:text-gray-950 hover:bg-white/30 transition-all"
                          style={ultraGlassStyle}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-cyan-600">{item.icon}</div>
                            <span>{item.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </Link>
                      ))}
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}

                {/* Sign In/Register (Not logged in) */}
                {!currentUser && (
                  <div className="space-y-3">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-gray-900 hover:text-gray-950 transition-all"
                      style={ultraGlassStyle}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                    
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-amber-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      Sign In with Email
                    </Link>
                    
                    <div className="text-center">
                      <span className="text-sm text-gray-800">New to MarketMix? </span>
                      <Link
                        to="/register"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Create Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default Navbar;