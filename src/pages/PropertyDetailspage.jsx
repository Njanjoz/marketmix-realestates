// src/pages/PropertyDetailspage.jsx - FIXED IMAGE DISPLAY
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Bed, Bath, Square, Heart, Share2, 
  Phone, Mail, MessageCircle, CheckCircle, X, ChevronLeft, 
  ChevronRight, Building, Calendar, DollarSign, Eye, 
  Facebook, Twitter, Copy, AlertCircle, Maximize2,
  Printer, Download, Shield, Award, Clock, Users, TrendingUp
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PropertyDetailspage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      setLoading(true);
      try {
        const propertyRef = doc(db, 'properties', id);
        const propertySnap = await getDoc(propertyRef);
        
        if (propertySnap.exists()) {
          const propertyData = { id: propertySnap.id, ...propertySnap.data() };
          setProperty(propertyData);
          
          // Increment view count
          await updateDoc(propertyRef, {
            views: increment(1)
          });
        } else {
          toast.error('Property not found');
          navigate('/properties');
        }
      } catch (error) {
        console.error('Error loading property:', error);
        toast.error('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };
    
    loadProperty();
  }, [id, navigate]);

  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleFavorite = () => {
    if (!currentUser) {
      toast.error('Please login to save favorites');
      navigate('/login');
      return;
    }
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleContact = (e) => {
    e.preventDefault();
    toast.success('Message sent! Agent will contact you shortly.');
    setShowContactForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Property Not Found</h2>
          <p className="text-gray-600 mt-2">The property you're looking for doesn't exist.</p>
          <Link to="/properties" className="mt-4 inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  const images = property.images || ['https://placehold.co/1200x800'];
  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Properties
        </button>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Image Gallery Section - FIXED: No stretching */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {/* Main Image - Using object-contain to prevent stretching */}
          <div className="relative bg-gray-100 flex items-center justify-center min-h-[400px] md:min-h-[500px]">
            <img
              src={currentImage}
              alt={property.title}
              className="w-full h-auto max-h-[500px] object-contain"
              onClick={() => setShowLightbox(true)}
              style={{ cursor: 'pointer' }}
            />
            
            {/* Image Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            
            {/* Favorite Button */}
            <button
              onClick={handleFavorite}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </button>

            {/* Expand Button */}
            <button
              onClick={() => setShowLightbox(true)}
              className="absolute bottom-4 left-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              title="View fullscreen"
            >
              <Maximize2 size={18} />
            </button>
          </div>
          
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-gray-50">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Price */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-500 mb-3">
                    <MapPin size={18} className="mr-1" />
                    <span>{property.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      property.status === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {property.status === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                    </span>
                    {property.featured && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600">
                    KES {property.price?.toLocaleString()}
                    {property.status === 'rent' && <span className="text-lg">/mo</span>}
                  </div>
                  {property.originalPrice && (
                    <div className="text-sm text-gray-400 line-through">
                      KES {property.originalPrice?.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bed className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <div className="font-semibold">{property.bedrooms || 0} Bedrooms</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Bath className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <div className="font-semibold">{property.bathrooms || 0} Bathrooms</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Square className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <div className="font-semibold">{property.area || 0} sqft</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Eye className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <div className="font-semibold">{property.views || 0} Views</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed">
                {property.description || 'No description available for this property.'}
              </p>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Property ID</span>
                  <span className="font-medium">{property.id?.slice(-8)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Property Type</span>
                  <span className="font-medium capitalize">{property.propertyType || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Listed On</span>
                  <span className="font-medium">
                    {property.createdAt ? new Date(property.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium">
                    {property.updatedAt ? new Date(property.updatedAt.toDate()).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Actions */}
          <div className="space-y-6">
            {/* Contact Agent Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Agent</h3>
              
              {!showContactForm ? (
                <button
                  onClick={() => setShowContactForm(true)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mb-3"
                >
                  <MessageCircle size={18} />
                  Send Message
                </button>
              ) : (
                <form onSubmit={handleContact} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    placeholder="I'm interested in this property..."
                    rows="3"
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </form>
              )}
              
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={handleShare}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 mb-2"
                >
                  <Share2 size={18} />
                  Share Property
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  Print Details
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Price per sqft</span>
                  <span className="font-medium">
                    KES {Math.round(property.price / (property.area || 1)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Property Status</span>
                  <span className="font-medium capitalize">{property.status || 'Available'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Fullscreen View */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
            onClick={() => setShowLightbox(false)}
          >
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={currentImage}
                alt={property.title}
                className="max-w-[95vw] max-h-[95vh] object-contain"
              />
              
              {/* Close Button */}
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
              >
                <X size={28} />
              </button>
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyDetailspage;