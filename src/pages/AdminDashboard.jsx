// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useProperties } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, Edit, Eye, EyeOff, Settings, Layout, 
  Palette, Image, Text, Grid, Star, Home, Users,
  TrendingUp, BarChart, Globe, Smartphone, Monitor,
  Zap, RefreshCw, Save, Upload, Download, Filter,
  X, Check, ChevronDown, ChevronUp, AlertCircle,
  MessageSquare, Bell, CreditCard, Shield, Lock,
  Database, Server, Cpu, Wifi, Battery, Clock,
  Sun, Moon, Cloud, Wind, Droplets, Thermometer
} from 'lucide-react';

const AdminDashboard = () => {
  const { properties, addProperty, deleteProperty, updateProperty, featuredProperties, setFeaturedProperties } = useProperties();
  const { userProfile, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('properties');
  const [isAdding, setIsAdding] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({});
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    location: '',
    status: 'for-sale',
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    description: '',
    images: [''],
    featured: false,
    tags: []
  });

  // Homepage controls
  const [homepageConfig, setHomepageConfig] = useState({
    showHero: true,
    showStats: true,
    showFeatured: true,
    showTestimonials: true,
    showNewsletter: true,
    heroTitle: "Find Your Dream Property",
    heroSubtitle: "Premium Real Estate Excellence",
    theme: 'light',
    animationSpeed: 'normal',
    autoRotateFeatured: true,
    rotationInterval: 5000
  });

  // UI Controls
  const [uiControls, setUiControls] = useState({
    glassEffect: true,
    shadows: true,
    borderRadius: 'rounded-lg',
    spacing: 'normal',
    fontScale: 100,
    colorScheme: 'emerald',
    darkMode: false
  });

  // Site Analytics
  const [analytics, setAnalytics] = useState({
    visitorsToday: 1245,
    activeUsers: 87,
    pageViews: 3456,
    conversionRate: 3.2,
    popularProperties: [],
    recentActivity: []
  });

  // System Status
  const [systemStatus, setSystemStatus] = useState({
    server: 'online',
    database: 'connected',
    cache: 'healthy',
    api: 'stable',
    uptime: '99.9%'
  });

  // Check admin access
  if (!currentUser || userProfile?.userType !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300 mb-6">Admin privileges required</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Calculate dashboard stats
  useEffect(() => {
    const totalProperties = properties.length;
    const forSale = properties.filter(p => p.status === 'for-sale').length;
    const forRent = properties.filter(p => p.status === 'for-rent').length;
    const featured = properties.filter(p => p.featured).length;
    const totalValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
    
    setDashboardStats({
      totalProperties,
      forSale,
      forRent,
      featured,
      totalValue,
      averagePrice: totalProperties > 0 ? totalValue / totalProperties : 0
    });
  }, [properties]);

  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      const propertyData = {
        ...formData,
        price: Number(formData.price),
        area: Number(formData.area),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0
      };
      
      const res = await addProperty(propertyData);
      if (res.success) {
        toast.success("Property added successfully!");
        setIsAdding(false);
        setFormData({
          title: '',
          price: '',
          location: '',
          status: 'for-sale',
          bedrooms: 3,
          bathrooms: 2,
          area: 1200,
          description: '',
          images: [''],
          featured: false,
          tags: []
        });
      }
    } catch (error) {
      toast.error("Failed to add property");
      console.error(error);
    }
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await deleteProperty(id);
        toast.success("Property deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete property");
      }
    }
  };

  const handleToggleFeatured = (id) => {
    const isFeatured = featuredProperties.includes(id);
    let updated;
    
    if (isFeatured) {
      updated = featuredProperties.filter(fId => fId !== id);
    } else {
      updated = [...featuredProperties, id];
    }
    
    setFeaturedProperties(updated);
    toast.success(isFeatured ? "Removed from featured" : "Added to featured");
  };

  const handleSaveHomepageConfig = () => {
    // Save to localStorage or API
    localStorage.setItem('homepageConfig', JSON.stringify(homepageConfig));
    toast.success("Homepage configuration saved!");
  };

  const handleSaveUIControls = () => {
    localStorage.setItem('uiControls', JSON.stringify(uiControls));
    toast.success("UI settings saved!");
  };

  const handleExportData = () => {
    const data = {
      properties,
      homepageConfig,
      uiControls,
      analytics,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketmix-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Data exported successfully!");
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Handle imported data
        toast.success("Data imported successfully!");
      } catch (error) {
        toast.error("Invalid data file");
      }
    };
    reader.readAsText(file);
  };

  // Control Panels
  const ControlPanels = {
    properties: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Property Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isAdding ? "Cancel" : "Add Property"}
            </button>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 mb-6"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Property</h3>
              <form onSubmit={handleAddProperty} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  placeholder="Property Title"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="border border-gray-300 p-3 rounded-lg"
                  required
                />
                <input
                  placeholder="Price (KES)"
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="border border-gray-300 p-3 rounded-lg"
                  required
                />
                <input
                  placeholder="Location"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="border border-gray-300 p-3 rounded-lg"
                  required
                />
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="border border-gray-300 p-3 rounded-lg"
                >
                  <option value="for-sale">For Sale</option>
                  <option value="for-rent">For Rent</option>
                </select>
                <input
                  placeholder="Bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={e => setFormData({...formData, bedrooms: e.target.value})}
                  className="border border-gray-300 p-3 rounded-lg"
                />
                <input
                  placeholder="Area (sq ft)"
                  type="number"
                  value={formData.area}
                  onChange={e => setFormData({...formData, area: e.target.value})}
                  className="border border-gray-300 p-3 rounded-lg"
                />
                <div className="md:col-span-2 lg:col-span-3">
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="border border-gray-300 p-3 rounded-lg w-full h-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={e => setFormData({...formData, featured: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="featured" className="text-sm">Featured Property</label>
                </div>
                <button
                  type="submit"
                  className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Publish Property
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-semibold">All Properties ({properties.length})</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search properties..."
                className="border border-gray-300 px-3 py-1 rounded text-sm"
              />
              <select className="border border-gray-300 px-3 py-1 rounded text-sm">
                <option>All Status</option>
                <option>For Sale</option>
                <option>For Rent</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-sm">
                <tr>
                  <th className="p-4 text-left">Property</th>
                  <th className="p-4 text-left">Price</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Location</th>
                  <th className="p-4 text-left">Featured</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop, index) => (
                  <motion.tr
                    key={prop.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="font-medium">{prop.title}</div>
                      <div className="text-sm text-gray-500">{prop.bedrooms} beds, {prop.bathrooms} baths</div>
                    </td>
                    <td className="p-4 font-bold text-emerald-600">
                      KES {prop.price?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        prop.status === 'for-sale' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {prop.status === 'for-sale' ? 'For Sale' : 'For Rent'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{prop.location}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleFeatured(prop.id)}
                        className={`p-1.5 rounded-full ${
                          featuredProperties.includes(prop.id)
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Star className="w-4 h-4" fill={featuredProperties.includes(prop.id) ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(prop.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),

    homepage: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Homepage Controls</h2>
          <div className="flex gap-2">
            <button
              onClick={handleSaveHomepageConfig}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg flex items-center gap-2"
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreviewMode ? "Exit Preview" : "Preview"}
                            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Hero Section
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Show Hero Section</label>
                    <p className="text-sm text-gray-500">Display the main banner</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={homepageConfig.showHero}
                      onChange={e => setHomepageConfig({...homepageConfig, showHero: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hero Title</label>
                  <input
                    type="text"
                    value={homepageConfig.heroTitle}
                    onChange={e => setHomepageConfig({...homepageConfig, heroTitle: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hero Subtitle</label>
                  <input
                    type="text"
                    value={homepageConfig.heroSubtitle}
                    onChange={e => setHomepageConfig({...homepageConfig, heroSubtitle: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Features Toggle */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Show/Hide Sections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'showStats', label: 'Statistics Section', icon: <BarChart className="w-4 h-4" /> },
                  { key: 'showFeatured', label: 'Featured Properties', icon: <Star className="w-4 h-4" /> },
                  { key: 'showTestimonials', label: 'Testimonials', icon: <MessageSquare className="w-4 h-4" /> },
                  { key: 'showNewsletter', label: 'Newsletter', icon: <Bell className="w-4 h-4" /> },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-500">{item.icon}</div>
                      <span>{item.label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={homepageConfig[item.key]}
                        onChange={e => setHomepageConfig({...homepageConfig, [item.key]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Animation Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Animation & Effects</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Animation Speed</label>
                  <select
                    value={homepageConfig.animationSpeed}
                    onChange={e => setHomepageConfig({...homepageConfig, animationSpeed: e.target.value})}
                    className="w-full border border-gray-300 p-3 rounded-lg"
                  >
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium">Auto-rotate Featured</label>
                    <p className="text-sm text-gray-500">Automatically cycle featured properties</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={homepageConfig.autoRotateFeatured}
                      onChange={e => setHomepageConfig({...homepageConfig, autoRotateFeatured: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {homepageConfig.autoRotateFeatured && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rotation Interval (ms)
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="1000"
                      value={homepageConfig.rotationInterval}
                      onChange={e => setHomepageConfig({...homepageConfig, rotationInterval: e.target.value})}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-500 text-center">
                      {homepageConfig.rotationInterval}ms
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
              <div className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Home className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Homepage Preview</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${homepageConfig.showHero ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Hero Section: {homepageConfig.showHero ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${homepageConfig.showStats ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Stats: {homepageConfig.showStats ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${homepageConfig.showFeatured ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">Featured: {homepageConfig.showFeatured ? 'Visible' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                  <span className="text-sm">Clear Cache</span>
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                  <span className="text-sm">Reset to Default</span>
                  <X className="w-4 h-4" />
                </button>
                <button className="w-full p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-between transition-colors">
                  <span className="text-sm">Emergency Stop</span>
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    appearance: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Appearance & UI</h2>
          <button
            onClick={handleSaveUIControls}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save UI Settings
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual Controls */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Visual Controls
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Glass Effect</label>
                  <p className="text-sm text-gray-500">Frosted glass UI elements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uiControls.glassEffect}
                    onChange={e => setUiControls({...uiControls, glassEffect: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Shadows</label>
                  <p className="text-sm text-gray-500">Depth and elevation effects</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uiControls.shadows}
                    onChange={e => setUiControls({...uiControls, shadows: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Border Radius</label>
                <div className="flex gap-2">
                  {['none', 'sm', 'rounded', 'lg', 'xl'].map((radius) => (
                    <button
                      key={radius}
                      onClick={() => setUiControls({...uiControls, borderRadius: radius})}
                      className={`px-3 py-1.5 text-sm rounded ${
                        uiControls.borderRadius === radius
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {radius}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color Scheme</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Emerald', value: 'emerald', color: 'bg-emerald-500' },
                    { name: 'Blue', value: 'blue', color: 'bg-blue-500' },
                    { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
                    { name: 'Amber', value: 'amber', color: 'bg-amber-500' },
                  ].map((scheme) => (
                    <button
                      key={scheme.value}
                      onClick={() => setUiControls({...uiControls, colorScheme: scheme.value})}
                      className={`p-3 rounded-lg flex flex-col items-center gap-1 ${
                        uiControls.colorScheme === scheme.value
                          ? 'ring-2 ring-offset-2 ring-purple-500'
                          : ''
                      }`}
                    >
                      <div className={`w-8 h-8 ${scheme.color} rounded-full`}></div>
                      <span className="text-xs">{scheme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Typography & Spacing */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Text className="w-5 h-5" />
              Typography & Spacing
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Font Scale: {uiControls.fontScale}%
                </label>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="5"
                  value={uiControls.fontScale}
                  onChange={e => setUiControls({...uiControls, fontScale: e.target.value})}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Spacing</label>
                <div className="flex gap-2">
                  {['compact', 'normal', 'comfortable', 'relaxed'].map((spacing) => (
                    <button
                      key={spacing}
                      onClick={() => setUiControls({...uiControls, spacing})}
                      className={`px-3 py-1.5 text-sm rounded ${
                        uiControls.spacing === spacing
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {spacing}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium">Dark Mode</label>
                  <p className="text-sm text-gray-500">Switch to dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uiControls.darkMode}
                    onChange={e => setUiControls({...uiControls, darkMode: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),

    analytics: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Analytics & Monitoring</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Visitors Today', value: analytics.visitorsToday, icon: <Users className="w-5 h-5" />, change: '+12%' },
            { label: 'Active Users', value: analytics.activeUsers, icon: <Zap className="w-5 h-5" />, change: '+5%' },
            { label: 'Page Views', value: analytics.pageViews, icon: <Eye className="w-5 h-5" />, change: '+23%' },
            { label: 'Conversion Rate', value: `${analytics.conversionRate}%`, icon: <TrendingUp className="w-5 h-5" />, change: '+1.2%' },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {stat.icon}
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              {Object.entries(systemStatus).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      value === 'online' || value === 'connected' || value === 'healthy' || value === 'stable'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}></div>
                    <span className="capitalize">{key}</span>
                  </div>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Properties', value: dashboardStats.totalProperties },
                { label: 'For Sale', value: dashboardStats.forSale },
                { label: 'For Rent', value: dashboardStats.forRent },
                { label: 'Featured', value: dashboardStats.featured },
                { label: 'Total Value', value: `KES ${dashboardStats.totalValue?.toLocaleString()}` },
              ].map((stat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),

    system: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">System Controls</h2>
          <div className="flex gap-2">
            <label className="px-4 py-2 bg-gray-700 text-white rounded-lg flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Maintenance Mode
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Operations
            </h3>
            <div className="space-y-3">
              <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                <span>Backup Database</span>
                <Save className="w-4 h-4" />
              </button>
              <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                <span>Clear Old Data</span>
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                <span>Optimize Tables</span>
                <Zap className="w-4 h-4" />
              </button>
              <button className="w-full p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-between transition-colors">
                <span>Reset Database</span>
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5" />
              Server Controls
            </h3>
            <div className="space-y-3">
              <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                <span>Restart Services</span>
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                <span>Clear Cache</span>
                <X className="w-4 h-4" />
              </button>
              <button className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between transition-colors">
                <span>Check Updates</span>
                <Download className="w-4 h-4" />
              </button>
              <button className="w-full p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg flex items-center justify-between transition-colors">
                <span>Deploy Changes</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Control Center</h1>
              <p className="text-gray-300">Complete control over your real estate platform</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{userProfile?.name || currentUser?.email}</p>
                <p className="text-sm text-gray-400">Administrator</p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Back to site"
              >
                <Home className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'properties', label: 'Properties', icon: <Home className="w-4 h-4" /> },
              { id: 'homepage', label: 'Homepage', icon: <Layout className="w-4 h-4" /> },
              { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
              { id: 'analytics', label: 'Analytics', icon: <BarChart className="w-4 h-4" /> },
              { id: 'system', label: 'System', icon: <Settings className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8">
          {ControlPanels[activeTab]}
        </div>

        {/* Footer Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="text-sm text-gray-500">Last Updated</div>
            <div className="font-medium">{new Date().toLocaleTimeString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="text-sm text-gray-500">Memory Usage</div>
            <div className="font-medium">64%</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="text-sm text-gray-500">API Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Healthy</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="text-sm text-gray-500">Response Time</div>
            <div className="font-medium">128ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;