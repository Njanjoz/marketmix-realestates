// src/components/Navbar.jsx - COMPLETE WITH USER PROFILE DROPDOWN
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
  LayoutDashboard, Users, Package, BarChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, userProfile } = useAuth();
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
  
  // Pull-to-reveal states
  const [showHero, setShowHero] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Desktop hover states
  const [showRegularNav, setShowRegularNav] = useState(false);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check if we're on homepage and detect device
  useEffect(() => {
    setIsHomePage(location.pathname === '/');
    const isMobileDevice = window.innerWidth < 768;
    setIsMobile(isMobileDevice);
    setIsDesktop(window.innerWidth >= 1024);
    
    if (isMobileDevice) {
      setShowRegularNav(true);
    }
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
      if (showHero && containerRef.current && !containerRef.current.contains(event.target)) {
        setShowHero(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHero]);

  // Mouse hover detection for desktop
  useEffect(() => {
    if (isMobile) return;

    let hideTimeout;

    const handleMouseMove = (e) => {
      if (e.clientY < 50) {
        setIsHoveringTop(true);
        setShowRegularNav(true);
        clearTimeout(hideTimeout);
      } else {
        setIsHoveringTop(false);
        if (window.scrollY > 100) {
          hideTimeout = setTimeout(() => {
            if (!isHoveringTop) setShowRegularNav(false);
          }, 1000);
        }
      }
    };

    const handleMouseLeave = () => {
      setIsHoveringTop(false);
      if (window.scrollY > 100) {
        hideTimeout = setTimeout(() => {
          setShowRegularNav(false);
        }, 1000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(hideTimeout);
    };
  }, [isMobile, isHoveringTop]);

  // Gentle pull-to-reveal logic
  useEffect(() => {
    let touchStartY = 0;
    let isTouching = false;
    let pullThreshold = 100;
    let hideTimeout;

    const handleTouchStart = (e) => {
      if (isHomePage && window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        isTouching = true;
        setIsPulling(true);
        setStartY(touchStartY);
      }
    };

    const handleTouchMove = (e) => {
      if (!isTouching || !isHomePage) return;
      
      const currentTouchY = e.touches[0].clientY;
      const distance = currentTouchY - touchStartY;
      
      if (distance > 0 && window.scrollY === 0) {
        setCurrentY(currentTouchY);
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
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            setShowHero(false);
          }, 5000);
        } else {
          setShowHero(false);
        }
        
        setTimeout(() => {
          setPullProgress(0);
          setStartY(0);
          setCurrentY(0);
        }, 300);
      }
    };

    const handleMouseDown = (e) => {
      if (isHomePage && window.scrollY === 0 && e.clientY < 50) {
        touchStartY = e.clientY;
        isTouching = true;
        setIsPulling(true);
        setStartY(touchStartY);
      }
    };

    const handleMouseMove = (e) => {
      if (!isTouching || !isHomePage) return;
      
      const distance = e.clientY - touchStartY;
      
      if (distance > 0 && window.scrollY === 0) {
        setCurrentY(e.clientY);
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
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            setShowHero(false);
          }, 5000);
        } else {
          setShowHero(false);
        }
        
        setTimeout(() => {
          setPullProgress(0);
          setStartY(0);
          setCurrentY(0);
        }, 300);
      }
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsAtTop(scrollY === 0);
      
      if (scrollY > 50) {
        setShowHero(false);
        clearTimeout(hideTimeout);
      }
      
      if (isMobile && scrollY < lastScrollY && scrollY > 100) {
        setShowRegularNav(true);
      }
      
      if (isMobile && scrollY > lastScrollY && scrollY > 100) {
        setShowRegularNav(false);
      }
      
      setLastScrollY(scrollY);
    };

    if (isHomePage) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(hideTimeout);
    };
  }, [isHomePage, showHero, pullProgress, lastScrollY, isMobile]);

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
      { name: 'My Profile', path: '/dashboard/profile', icon: <UserCircle className="w-4 h-4" /> },
      { name: 'My Properties', path: '/dashboard/properties', icon: <BuildingIcon className="w-4 h-4" /> },
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
        { name: 'System Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
        ...baseLinks
      ];
    } else if (userType === 'agent') {
      return [
        { name: 'Agent Dashboard', path: '/agent/dashboard', icon: <Briefcase className="w-4 h-4" />, badge: 'Agent' },
        { name: 'My Listings', path: '/agent/listings', icon: <Building className="w-4 h-4" /> },
        { name: 'Leads', path: '/agent/leads', icon: <TrendingUpIcon className="w-4 h-4" /> },
        { name: 'Commissions', path: '/agent/commissions', icon: <DollarSign className="w-4 h-4" /> },
        ...baseLinks
      ];
    } else if (userType === 'seller' || userType === 'landlord') {
      return [
        { name: 'Seller Dashboard', path: '/seller/dashboard', icon: <Key className="w-4 h-4" />, badge: 'Seller' },
        { name: 'List Property', path: '/seller/list', icon: <Plus className="w-4 h-4" /> },
        { name: 'My Listings', path: '/seller/listings', icon: <Building className="w-4 h-4" /> },
        { name: 'Offers', path: '/seller/offers', icon: <CreditCard className="w-4 h-4" /> },
        ...baseLinks
      ];
    } else if (userType === 'investor') {
      return [
        { name: 'Investor Dashboard', path: '/investor/dashboard', icon: <TrendingUpIcon className="w-4 h-4" />, badge: 'Investor' },
        { name: 'Investment Opportunities', path: '/investor/opportunities', icon: <StarIcon className="w-4 h-4" /> },
        { name: 'Portfolio', path: '/investor/portfolio', icon: <Briefcase className="w-4 h-4" /> },
        { name: 'Market Analysis', path: '/investor/analysis', icon: <BarChart className="w-4 h-4" /> },
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

  // Account links (shown to all logged in users)
  const accountLinks = [
    { name: 'Account Settings', path: '/account/settings', icon: <Settings className="w-4 h-4" /> },
    { name: 'Security', path: '/account/security', icon: <Lock className="w-4 h-4" /> },
    { name: 'Billing', path: '/account/billing', icon: <CreditCard className="w-4 h-4" /> },
    { name: 'Help & Support', path: '/help', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New Property Match', description: 'A property matching your criteria was just listed', time: '2 min ago', read: false, type: 'property' },
    { id: 2, title: 'Price Drop Alert', description: 'Property in Karen is now KES 25M', time: '1 hour ago', read: false, type: 'price' },
    { id: 3, title: 'Viewing Confirmed', description: 'Your viewing at 3 PM today is confirmed', time: '2 hours ago', read: true, type: 'appointment' },
    { id: 4, title: 'Agent Response', description: 'John replied to your inquiry', time: '1 day ago', read: true, type: 'message' },
  ];

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Glass effect styles
  const glassStyle = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  };

  const intenseGlassStyle = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
    backdropFilter: 'blur(25px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  };

  const darkGlassStyle = {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  };

  // User Profile Component
  const UserProfileDropdown = () => (
    <AnimatePresence>
      {dropdownOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50"
          style={darkGlassStyle}
        >
          {/* User Profile Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {userProfile?.name?.charAt(0) || currentUser?.email?.charAt(0)}
                  </span>
                </div>
                {userProfile?.userType === 'admin' && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {userProfile?.name || currentUser?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {currentUser?.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    userProfile?.userType === 'admin' 
                      ? 'bg-red-500/20 text-red-300' 
                      : userProfile?.userType === 'agent'
                      ? 'bg-blue-500/20 text-blue-300'
                      : userProfile?.userType === 'seller'
                      ? 'bg-amber-500/20 text-amber-300'
                      : userProfile?.userType === 'investor'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {userProfile?.userType === 'admin' ? 'Administrator' : 
                     userProfile?.userType === 'agent' ? 'Verified Agent' :
                     userProfile?.userType === 'seller' ? 'Property Seller' :
                     userProfile?.userType === 'investor' ? 'Investor' :
                     'Premium Member'}
                  </span>
                  <span className="text-xs text-white/40">•</span>
                  <span className="text-xs text-white/40">
                    Member since {userProfile?.createdAt ? new Date(userProfile.createdAt).getFullYear() : '2024'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dashboard Links */}
          <div className="p-2 max-h-96 overflow-y-auto">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Dashboard</p>
              {dashboardLinks.slice(0, 6).map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 mb-1"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${
                      item.badge ? 'text-amber-300' : 'text-emerald-300'
                    }`}>
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.badge === 'Admin' ? 'bg-red-500/20 text-red-300' :
                      item.badge === 'Agent' ? 'bg-blue-500/20 text-blue-300' :
                      item.badge === 'Seller' ? 'bg-amber-500/20 text-amber-300' :
                      item.badge === 'Investor' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              
              {/* View All Dashboard Links */}
              {dashboardLinks.length > 6 && (
                <Link
                  to="/dashboard"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sm text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 transition-all duration-200 mt-2"
                >
                  <span>View All Dashboard Features</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              )}
            </div>

            {/* Account Settings */}
            <div className="px-3 py-2 border-t border-white/10 mt-2">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Account</p>
              {accountLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 mb-1"
                >
                  <div className="text-cyan-300">{item.icon}</div>
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Logout Button */}
            <div className="p-3 border-t border-white/10 mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm text-white/90 hover:text-white bg-red-500/20 hover:bg-red-500/30 transition-all duration-200"
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
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl z-50"
          style={darkGlassStyle}
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <span className="text-xs text-emerald-300 cursor-pointer hover:text-emerald-200">
              Mark all as read
            </span>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  !notification.read ? 'bg-emerald-500/5' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.type === 'property' ? 'bg-blue-500/20 text-blue-300' :
                    notification.type === 'price' ? 'bg-green-500/20 text-green-300' :
                    notification.type === 'appointment' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {notification.type === 'property' ? <Building className="w-4 h-4" /> :
                     notification.type === 'price' ? <DollarSign className="w-4 h-4" /> :
                     notification.type === 'appointment' ? <Calendar className="w-4 h-4" /> :
                     <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{notification.title}</p>
                    <p className="text-xs text-white/60 mt-1">{notification.description}</p>
                    <p className="text-xs text-white/40 mt-1">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-white/10">
            <Link
              to="/notifications"
              onClick={() => setNotificationsOpen(false)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 transition-all duration-200"
            >
              <span>View All Notifications</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Pull indicator component
  const PullIndicator = () => (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2"
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
      <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
        <motion.div
          animate={{ 
            rotate: pullProgress > 0.4 ? 180 : 0,
            scale: 1 + (pullProgress * 0.2)
          }}
          transition={{ duration: 0.2 }}
        >
          <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-300" />
        </motion.div>
        
        <div className="w-20 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${pullProgress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        <span className="text-xs text-white/70">
          {pullProgress > 0.4 ? 'Release' : 'Pull'}
        </span>
      </div>
    </motion.div>
  );

  // Hero Banner Component
  const HeroBanner = () => (
    <motion.div
      ref={containerRef}
      initial={{ y: -350, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        height: 300 + (pullProgress * 30)
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
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-amber-900/20"></div>
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
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-10 text-center relative">
        {/* Main Logo */}
        <motion.div
          className="mb-6"
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
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Glass container */}
            <div
              className="relative px-10 py-6 md:px-14 md:py-8 rounded-3xl"
              style={glassStyle}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-2 text-white">
                MARKETMIX
              </h1>
              
              {/* Animated underline */}
              <motion.div
                className="h-0.5 mx-auto"
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
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
            style={glassStyle}
          >
            <Target className="w-4 h-4 text-emerald-300" />
            <span className="text-base font-medium tracking-wide text-white drop-shadow-sm">
              Premium Real Estate Excellence
            </span>
            <Award className="w-4 h-4 text-amber-300" />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-2xl mx-auto mb-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.4
              }
            }
          }}
        >
          {[
            { value: '5,000+', label: 'Properties', color: 'text-emerald-300' },
            { value: '98%', label: 'Satisfaction', color: 'text-amber-300' },
            { value: '15+', label: 'Years', color: 'text-cyan-300' },
            { value: '200+', label: 'Agents', color: 'text-purple-300' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { scale: 0.8, opacity: 0 },
                visible: { scale: 1, opacity: 1 }
              }}
              className="text-center"
            >
              <div className={`text-xl md:text-2xl font-bold ${stat.color} mb-1 drop-shadow-sm`}>
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Close hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="mt-4"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-white/70">Scroll down or click outside to close</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Pull Indicator */}
      {isHomePage && <PullIndicator />}

      {/* Hero Banner - Shows on gentle pull */}
      <AnimatePresence>
        {showHero && isHomePage && <HeroBanner />}
      </AnimatePresence>

      {/* Regular Navbar - Desktop: hover reveal, Mobile: always visible */}
      <AnimatePresence>
        {(showRegularNav || isMobile) && !showHero && (
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 z-50"
            style={glassStyle}
            onMouseEnter={() => !isMobile && setShowRegularNav(true)}
            onMouseLeave={() => {
              if (!isMobile && !isHoveringTop && window.scrollY > 100) {
                setTimeout(() => setShowRegularNav(false), 800);
              }
            }}
          >
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-14 md:h-16">
                {/* Logo */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 md:space-x-3 cursor-pointer group"
                  onClick={() => navigate('/')}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative p-1.5 md:p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-amber-600">
                      <Home className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base md:text-lg font-bold text-white">
                      MarketMix
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium tracking-wider uppercase text-emerald-300">
                      Real Estate
                    </span>
                  </div>
                </motion.div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center space-x-0.5">
                  {navItems.map((item, idx) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Link
                        to={item.path}
                        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                      >
                        <span className="text-emerald-300">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 md:space-x-2">
                  {/* Search Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSearchOpen(true)}
                    className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </motion.button>
                  
                  {/* Notifications Button (Logged in users) */}
                  {currentUser && (
                    <div className="relative" ref={notificationsRef}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                      >
                        <Bell className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        {unreadNotifications > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-xs rounded-full flex items-center justify-center">
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
                        className="flex items-center space-x-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                      >
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0)}
                          </span>
                        </div>
                        <div className="hidden md:block text-left">
                          <div className="text-xs font-medium text-white">
                            {userProfile?.name?.split(' ')[0] || currentUser.email?.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-emerald-300 capitalize">
                            {userProfile?.userType || 'User'}
                          </div>
                        </div>
                        <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-white transition-transform ${
                          dropdownOpen ? 'rotate-180' : ''
                        }`} />
                      </motion.button>
                      <UserProfileDropdown />
                    </div>
                  ) : (
                    // Sign In Button (Not logged in)
                    !isMobile && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <Link
                          to="/login"
                          className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-600 to-amber-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Sign In
                        </Link>
                      </motion.div>
                    )
                  )}
                  
                  {/* Mobile Menu Button */}
                  {isMobile && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMenuOpen(true)}
                      className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Menu className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 h-full w-80 bg-gradient-to-b from-gray-900 to-black z-50 overflow-y-auto"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-emerald-600 to-amber-600 rounded-lg">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">MarketMix</h2>
                      <p className="text-xs text-emerald-300">Real Estate</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* User Info */}
                {currentUser && (
                  <div className="mb-6 p-4 rounded-xl bg-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white">
                          {userProfile?.name || currentUser.email?.split('@')[0]}
                        </h3>
                        <p className="text-xs text-white/60">{currentUser.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                          userProfile?.userType === 'admin' 
                            ? 'bg-red-500/20 text-red-300' 
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {userProfile?.userType === 'admin' ? 'Administrator' : 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-emerald-300">{item.icon}</div>
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ))}
                </div>

                {/* User Links (Logged in) */}
                {currentUser && (
                  <>
                    <div className="my-4 border-t border-white/10 pt-4">
                      <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 px-4">
                        My Account
                      </h4>
                      <div className="space-y-1">
                        {dashboardLinks.slice(0, 4).map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="text-cyan-300">{item.icon}</div>
                              <span>{item.name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white/90 hover:text-white bg-red-500/20 hover:bg-red-500/30 transition-all"
                      >
                        <LogOutIcon className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Sign In Button (Not logged in) */}
                {!currentUser && (
                  <div className="mt-8 space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-amber-600 text-white rounded-lg font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center px-4 py-3 border border-emerald-500 text-emerald-300 rounded-lg font-medium"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile-only: Pull hint */}
      {isHomePage && isMobile && !showHero && isAtTop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="fixed top-2 left-0 right-0 z-30 flex justify-center pointer-events-none"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
            <ArrowDownToLine className="w-3 h-3 text-emerald-300" />
            <span className="text-xs text-white">Pull down gently</span>
          </div>
        </motion.div>
      )}

      {/* Desktop-only: Hover hint */}
      {isHomePage && isDesktop && !showRegularNav && !showHero && isAtTop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="fixed top-1 left-0 right-0 z-30 flex justify-center pointer-events-none"
        >
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            <MousePointer className="w-3 h-3 text-amber-300" />
            <span className="text-xs text-white">Hover near top for menu</span>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;