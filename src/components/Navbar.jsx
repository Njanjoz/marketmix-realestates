// src/components/Navbar.jsx - FIXED AND OPTIMIZED
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
  Eye, EyeOff, MousePointer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHomePage, setIsHomePage] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Pull-to-reveal states
  const [showHero, setShowHero] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0); // ADDED THIS
  
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
    
    // On mobile, always show regular nav
    if (isMobileDevice) {
      setShowRegularNav(true);
    }
  }, [location]);

  // Mouse hover detection for desktop
  useEffect(() => {
    if (isMobile) return;

    let hideTimeout;

    const handleMouseMove = (e) => {
      // Show regular nav when mouse is near top (top 50px)
      if (e.clientY < 50) {
        setIsHoveringTop(true);
        setShowRegularNav(true);
        clearTimeout(hideTimeout);
      } else {
        setIsHoveringTop(false);
        // Hide after delay if not at top
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
    let pullThreshold = 100; // Increased for gentler pull
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
      
      // Only allow gentle pull down (positive distance)
      if (distance > 0 && window.scrollY === 0) {
        setCurrentY(currentTouchY);
        
        // Calculate progress (0 to 1)
        const progress = Math.min(1, distance / pullThreshold);
        setPullProgress(progress);
        
        // Start showing hero at 20% progress (more gentle)
        if (progress > 0.2 && !showHero) {
          setShowHero(true);
        }
        
        // Hide hero if pulling back up
        if (progress < 0.15 && showHero) {
          setShowHero(false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (isTouching) {
        isTouching = false;
        setIsPulling(false);
        
        // If pulled enough (40%), keep hero visible
        if (pullProgress > 0.4) {
          setShowHero(true);
          // Auto-hide after 5 seconds (longer)
          clearTimeout(hideTimeout);
          hideTimeout = setTimeout(() => {
            setShowHero(false);
          }, 5000);
        } else {
          setShowHero(false);
        }
        
        // Smooth reset
        setTimeout(() => {
          setPullProgress(0);
          setStartY(0);
          setCurrentY(0);
        }, 300);
      }
    };

    // Mouse events for desktop (gentle drag)
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

    // Scroll detection
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsAtTop(scrollY === 0);
      
      // Hide hero when scrolling down
      if (scrollY > 50) {
        setShowHero(false);
        clearTimeout(hideTimeout);
      }
      
      // Show regular nav on mobile when scrolling up
      if (isMobile && scrollY < lastScrollY && scrollY > 100) {
        setShowRegularNav(true);
      }
      
      // Hide regular nav on mobile when scrolling down
      if (isMobile && scrollY > lastScrollY && scrollY > 100) {
        setShowRegularNav(false);
      }
      
      setLastScrollY(scrollY);
    };

    // Add event listeners
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

  // Hide hero when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHero && containerRef.current && !containerRef.current.contains(e.target)) {
        setShowHero(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHero]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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

  const navItems = [
    { name: 'Buy', path: '/properties?status=sale', icon: <Gem className="w-4 h-4" /> },
    { name: 'Rent', path: '/properties?status=rent', icon: <Home className="w-4 h-4" /> },
    { name: 'Explore', path: '/explore', icon: <Compass className="w-4 h-4" /> },
    { name: 'Luxury', path: '/luxury', icon: <Crown className="w-4 h-4" /> },
    { name: 'Agents', path: '/agents', icon: <User className="w-4 h-4" /> },
    { name: 'Contact', path: '/contact', icon: <Phone className="w-4 h-4" /> },
  ];

  // Pull indicator component - More subtle
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

  // Hero Banner Component - More elegant
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
        {/* Main Logo with elegant animation */}
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
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-2">
                <span className="bg-gradient-to-r from-white via-emerald-100 to-amber-100 bg-clip-text text-transparent">
                  MARKETMIX
                </span>
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
            <span className="text-base font-medium tracking-wide bg-gradient-to-r from-emerald-200 to-amber-200 bg-clip-text text-transparent">
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
            { value: '5,000+', label: 'Properties', gradient: 'from-emerald-400 to-green-400' },
            { value: '98%', label: 'Satisfaction', gradient: 'from-amber-400 to-yellow-400' },
            { value: '15+', label: 'Years', gradient: 'from-cyan-400 to-blue-400' },
            { value: '200+', label: 'Agents', gradient: 'from-purple-400 to-pink-400' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { scale: 0.8, opacity: 0 },
                visible: { scale: 1, opacity: 1 }
              }}
              className="text-center"
            >
              <div className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-white/60">{stat.label}</div>
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
            <span className="text-xs text-white/50">Scroll down or click outside to close</span>
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
                    <span className="text-base md:text-lg font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                      MarketMix
                    </span>
                    <span className="text-[9px] md:text-[10px] font-medium tracking-wider uppercase bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
                      Real Estate
                    </span>
                  </div>
                </motion.div>

                {/* Desktop Navigation - More compact */}
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
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsSearchOpen(true)}
                    className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                  </motion.button>
                  
                  {isMobile && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMenuOpen(true)}
                      className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Menu className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                    </motion.button>
                  )}
                  
                  {!isMobile && !currentUser && (
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
                  )}
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile-only: Pull hint */}
      {isHomePage && isMobile && !showHero && isAtTop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          className="fixed top-2 left-0 right-0 z-30 flex justify-center pointer-events-none"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
            <ArrowDownToLine className="w-3 h-3 text-emerald-300" />
            <span className="text-xs text-white/80">Pull down gently</span>
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
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm">
            <MousePointer className="w-3 h-3 text-amber-300" />
            <span className="text-xs text-white/60">Hover near top for menu</span>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;