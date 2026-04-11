// src/components/dashboards/AdminDashboard.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Building, BarChart, TrendingUp, DollarSign, Eye, 
  RefreshCw, Settings, Upload, Trash2, Edit, Plus, MapPin, 
  Bed, Bath, Square, Home, Tag, Star, Layout, 
  Globe, Mail, Phone, Award, CheckCircle, XCircle,
  Save, AlertCircle, Crown, Shield, Image as ImageIcon, 
  Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle,
  Maximize2, Crop, Loader
} from 'lucide-react';
import { db } from '../../firebase/config';
import { 
  collection, getDocs, query, orderBy, deleteDoc, doc, 
  addDoc, serverTimestamp, setDoc, getDoc 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

// Cloudflare R2 upload URL
const CLOUDFLARE_WORKER_URL = 'https://marketmix-uploader.johnnjanjo4.workers.dev';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('properties');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showHeroImageModal, setShowHeroImageModal] = useState(false);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  
  // Multiple images state
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Homepage settings
  const [homepageSettings, setHomepageSettings] = useState({
    hero: {
      title: 'Discover Timeless Properties in Kenya',
      subtitle: 'Premium real estate with uncompromising standards.',
      backgroundImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920',
      searchPlaceholder: 'Search properties by location or type...'
    },
    stats: [
      { number: '5,000+', label: 'Properties Listed' },
      { number: '98%', label: 'Client Satisfaction' },
      { number: '15+', label: 'Years Experience' },
      { number: '200+', label: 'Expert Agents' }
    ],
    propertyTypes: [
      { name: 'APARTMENTS', count: 0, type: 'apartment', enabled: true },
      { name: 'HOUSES', count: 0, type: 'house', enabled: true },
      { name: 'COMMERCIAL', count: 0, type: 'commercial', enabled: true },
      { name: 'LAND', count: 0, type: 'land', enabled: true },
      { name: 'VILLAS', count: 0, type: 'villa', enabled: true },
      { name: 'OFFICES', count: 0, type: 'office', enabled: true }
    ],
    cta: {
      title: 'Begin Your Property Journey',
      subtitle: 'Connect with our expert agents for personalized property consultations',
      button1Text: 'Browse Properties',
      button1Link: '/properties',
      button2Text: 'Schedule Consultation',
      button2Link: '/contact'
    },
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: ''
    },
    contactInfo: {
      email: 'info@realestate.com',
      phone: '+254 700 000 000',
      address: 'Nairobi, Kenya'
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    status: 'sale',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: ''
  });

  // Upload image to Cloudflare R2
  const uploadToCloudflare = async (file) => {
    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/upload`, {
        method: 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return { url: data.url, key: data.key };
    } catch (error) {
      console.error('Cloudflare upload error:', error);
      throw error;
    }
  };

  // Resize image before upload (client-side)
  const resizeImageFile = (file, maxWidth = 1200, maxHeight = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const imgElement = new Image();
        imgElement.src = e.target.result;
        imgElement.onload = () => {
          const canvas = document.createElement('canvas');
          let width = imgElement.width;
          let height = imgElement.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imgElement, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          }, file.type, 0.85);
        };
      };
    });
  };

  // Upload single image to Cloudflare with resize
  const uploadSingleImage = async (file, index) => {
    try {
      // Resize image first
      const resizedFile = await resizeImageFile(file);
      
      // Update status to uploading
      setUploadedImages(prev => prev.map((img, i) => 
        i === index ? { ...img, status: 'uploading' } : img
      ));
      
      // Upload to Cloudflare R2
      const result = await uploadToCloudflare(resizedFile);
      
      // Update with URL
      setUploadedImages(prev => prev.map((img, i) => 
        i === index ? { ...img, url: result.url, key: result.key, status: 'uploaded' } : img
      ));
      
      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedImages(prev => prev.map((img, i) => 
        i === index ? { ...img, status: 'error', error: error.message } : img
      ));
      return null;
    }
  };

  // Handle multiple image selection
  const handleMultipleImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Add previews
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      url: null,
      key: null
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
    setUploadingImages(true);
    
    // Upload each image
    for (let i = 0; i < newImages.length; i++) {
      const globalIndex = uploadedImages.length + i;
      await uploadSingleImage(newImages[i].file, globalIndex);
    }
    
    setUploadingImages(false);
    const successCount = uploadedImages.filter(img => img.status === 'uploaded').length + newImages.length;
    toast.success(`${successCount} image(s) uploaded successfully!`);
  };

  // Remove image from list
  const removeImage = (index) => {
    const imageToRemove = uploadedImages[index];
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Load properties
  const loadProperties = async () => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const propertiesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propertiesList);
      
      const typeCounts = {};
      propertiesList.forEach(prop => {
        const type = prop.propertyType || 'apartment';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      setHomepageSettings(prev => ({
        ...prev,
        propertyTypes: prev.propertyTypes.map(type => ({
          ...type,
          count: typeCounts[type.type] || 0
        }))
      }));
      
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load homepage settings
  const loadHomepageSettings = async () => {
    try {
      const settingsRef = doc(db, 'settings', 'homepage');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setHomepageSettings(prev => ({ ...prev, ...settingsSnap.data() }));
      }
    } catch (error) {
      console.error('Error loading homepage settings:', error);
    }
  };

  useEffect(() => {
    loadProperties();
    loadHomepageSettings();
  }, []);

  // Save homepage settings
  const saveHomepageSettings = async () => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'homepage');
      await setDoc(settingsRef, homepageSettings, { merge: true });
      toast.success('Homepage settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Hero image upload to Cloudflare
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingHeroImage(true);
    try {
      const resizedFile = await resizeImageFile(file, 1920, 1080);
      const result = await uploadToCloudflare(resizedFile);
      
      setHomepageSettings(prev => ({
        ...prev,
        hero: { ...prev.hero, backgroundImage: result.url }
      }));
      
      toast.success('Hero image updated!');
      setShowHeroImageModal(false);
    } catch (error) {
      console.error('Hero upload error:', error);
      toast.error('Failed to upload hero image');
    } finally {
      setUploadingHeroImage(false);
    }
  };

  // Add new property
  const handleAddProperty = async (e) => {
    e.preventDefault();
    
    const uploadedUrls = uploadedImages.filter(img => img.status === 'uploaded');
    if (uploadedUrls.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    setLoading(true);
    try {
      const propertyData = {
        ...formData,
        price: parseInt(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseInt(formData.area) || 0,
        images: uploadedUrls.map(img => img.url),
        imageKeys: uploadedUrls.map(img => img.key),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        featured: false,
        views: 0
      };
      
      await addDoc(collection(db, 'properties'), propertyData);
      toast.success('Property added successfully!');
      setShowPropertyModal(false);
      
      // Reset form
      setFormData({
        title: '', location: '', price: '', status: 'sale',
        bedrooms: '', bathrooms: '', area: '', description: ''
      });
      setUploadedImages([]);
      loadProperties();
      
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  // Delete property
  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteDoc(doc(db, 'properties', propertyId));
        toast.success('Property deleted');
        loadProperties();
      } catch (error) {
        console.error('Error deleting property:', error);
        toast.error('Failed to delete property');
      }
    }
  };

  const togglePropertyType = (index) => {
    setHomepageSettings(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.map((type, i) => 
        i === index ? { ...type, enabled: !type.enabled } : type
      )
    }));
  };

  const updateStat = (index, field, value) => {
    setHomepageSettings(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) => 
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const updateHero = (field, value) => {
    setHomepageSettings(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateCTA = (field, value) => {
    setHomepageSettings(prev => ({
      ...prev,
      cta: { ...prev.cta, [field]: value }
    }));
  };

  const sections = [
    { id: 'properties', label: 'Properties', icon: <Building size={18} /> },
    { id: 'hero', label: 'Hero Section', icon: <Layout size={18} /> },
    { id: 'stats', label: 'Statistics', icon: <TrendingUp size={18} /> },
    { id: 'propertyTypes', label: 'Property Types', icon: <Tag size={18} /> },
    { id: 'cta', label: 'Call to Action', icon: <MessageCircle size={18} /> },
    { id: 'settings', label: 'Site Settings', icon: <Settings size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your real estate platform</p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
          <button
            onClick={saveHomepageSettings}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-auto"
          >
            <Save size={18} /> Save All Changes
          </button>
        </div>

        {/* Properties Section */}
        {activeSection === 'properties' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Properties</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Images are automatically resized and uploaded to Cloudflare R2
                </p>
              </div>
              <button
                onClick={() => setShowPropertyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Plus size={18} /> Add Property
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No properties yet. Click "Add Property" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <img 
                      src={property.images?.[0] || 'https://placehold.co/400x300'} 
                      alt={property.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin size={14} /> {property.location}
                      </p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-emerald-600">
                          KES {property.price?.toLocaleString()}
                          {property.status === 'rent' && <span className="text-sm">/mo</span>}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          property.status === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {property.status === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><Bed size={14} /> {property.bedrooms || 0} Beds</span>
                        <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms || 0} Baths</span>
                        <span className="flex items-center gap-1"><Square size={14} /> {property.area || 0} sqft</span>
                      </div>
                      {property.images && property.images.length > 1 && (
                        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <ImageIcon size={12} /> {property.images.length} photos
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="w-full py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} className="inline mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hero Section */}
        {activeSection === 'hero' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Hero Section Settings</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Hero Image</label>
              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={homepageSettings.hero.backgroundImage} 
                  alt="Hero Background"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setShowHeroImageModal(true)}
                  className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-sm rounded-lg hover:bg-black transition-colors"
                >
                  Change Image
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Images are uploaded to Cloudflare R2 and automatically resized</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                <input
                  type="text"
                  value={homepageSettings.hero.title}
                  onChange={(e) => updateHero('title', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                <input
                  type="text"
                  value={homepageSettings.hero.subtitle}
                  onChange={(e) => updateHero('subtitle', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Placeholder</label>
                <input
                  type="text"
                  value={homepageSettings.hero.searchPlaceholder}
                  onChange={(e) => updateHero('searchPlaceholder', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        {activeSection === 'stats' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistics Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homepageSettings.stats.map((stat, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Stat {index + 1}</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={stat.number}
                      onChange={(e) => updateStat(index, 'number', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Number"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Label"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Property Types Section */}
        {activeSection === 'propertyTypes' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Types Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homepageSettings.propertyTypes.map((type, index) => (
                <div key={index} className={`border rounded-lg p-4 ${!type.enabled ? 'opacity-50 bg-gray-50' : ''}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-900">{type.name}</span>
                    <button
                      onClick={() => togglePropertyType(index)}
                      className={`px-2 py-1 rounded text-xs ${
                        type.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {type.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Type: {type.type}</p>
                    <p>Count: {type.count} listings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        {activeSection === 'cta' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Call to Action Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Title</label>
                <input
                  type="text"
                  value={homepageSettings.cta.title}
                  onChange={(e) => updateCTA('title', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Subtitle</label>
                <input
                  type="text"
                  value={homepageSettings.cta.subtitle}
                  onChange={(e) => updateCTA('subtitle', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button 1 Text</label>
                  <input
                    type="text"
                    value={homepageSettings.cta.button1Text}
                    onChange={(e) => updateCTA('button1Text', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button 1 Link</label>
                  <input
                    type="text"
                    value={homepageSettings.cta.button1Link}
                    onChange={(e) => updateCTA('button1Link', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button 2 Text</label>
                  <input
                    type="text"
                    value={homepageSettings.cta.button2Text}
                    onChange={(e) => updateCTA('button2Text', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button 2 Link</label>
                  <input
                    type="text"
                    value={homepageSettings.cta.button2Link}
                    onChange={(e) => updateCTA('button2Link', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={homepageSettings.contactInfo.email}
                    onChange={(e) => setHomepageSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={homepageSettings.contactInfo.phone}
                    onChange={(e) => setHomepageSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={homepageSettings.contactInfo.address}
                    onChange={(e) => setHomepageSettings(prev => ({
                      ...prev,
                      contactInfo: { ...prev.contactInfo, address: e.target.value }
                    }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Social Media Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(homepageSettings.socialLinks).map(([platform, url]) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{platform}</label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setHomepageSettings(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, [platform]: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-lg"
                      placeholder={`https://${platform}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add New Property</h2>
              <button onClick={() => setShowPropertyModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="p-6 space-y-4">
              {/* Multiple Images Upload to Cloudflare */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Images * (Upload multiple)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <label htmlFor="property-images" className="mt-2 cursor-pointer text-sm text-emerald-600 block">
                    Click to upload multiple images
                  </label>
                  <input 
                    id="property-images" 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    multiple
                    className="hidden" 
                    onChange={handleMultipleImagesChange}
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    <p>✓ Uploads to Cloudflare R2 (fast CDN)</p>
                    <p>✓ Images are automatically resized to 1200x800px</p>
                    <p>✓ First image will be the cover photo</p>
                  </div>
                </div>
                
                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Uploaded Images ({uploadedImages.filter(i => i.status === 'uploaded').length}/{uploadedImages.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                            src={img.preview} 
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          {img.status === 'uploading' && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                              <Loader className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                          {img.status === 'uploaded' && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                          {idx === 0 && img.status === 'uploaded' && (
                            <div className="absolute bottom-1 left-1 bg-emerald-600 text-white text-xs px-1 rounded">
                              Cover
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {uploadingImages && (
                  <div className="mt-2 text-center text-sm text-gray-500">
                    <Loader className="w-4 h-4 inline animate-spin mr-1" />
                    Uploading to Cloudflare...
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft)</label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || uploadedImages.filter(i => i.status === 'uploaded').length === 0}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Property'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Image Modal */}
      {showHeroImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload Hero Image</h2>
              <button onClick={() => setShowHeroImageModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <label htmlFor="hero-image" className="mt-2 cursor-pointer text-sm text-emerald-600 block">
                  Click to upload hero image
                </label>
                <input id="hero-image" type="file" accept="image/jpeg,image/png,image.webp" className="hidden" onChange={handleHeroImageUpload} />
                <div className="mt-3 text-xs text-gray-500">
                  <p>✓ Uploads to Cloudflare R2 (fast CDN)</p>
                  <p>✓ Auto-resizes to 1920x1080px</p>
                </div>
              </div>
              
              {uploadingHeroImage && (
                <div className="text-center py-2">
                  <Loader className="w-5 h-5 animate-spin text-emerald-600 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Uploading to Cloudflare...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;