// src/components/seller/SellerPropertyUpload.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Upload, MapPin, DollarSign, Bed, Bath, Square, Loader, CheckCircle, AlertCircle, Crosshair, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationPicker from '../LocationPicker';
import { resizeImage, uploadFileToR2, sanitizeImageEntries } from '../../utils/cloudflareUpload';

const SellerPropertyUpload = ({ onClose, onSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    price: '',
    status: 'sale',
    propertyType: 'house',
    bedrooms: '',
    bathrooms: '',
    area: '',
    description: '',
    features: [],
    coordinates: null
  });

  // Handle multiple image selection with stable unique IDs
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newImages = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      preview: null,
      status: 'uploading',
      phase: 'processing',
      progress: 0,
      url: null
    }));
    
    setUploadedImages(prev => [...prev, ...newImages]);
    setUploadingImages(true);
    let failedCount = 0;
    
    for (const imgItem of newImages) {
      try {
        console.info(`[Property upload] Resizing ${imgItem.file.name}`);
        const resizedFile = await resizeImage(imgItem.file);
        console.info(`[Property upload] Resized ${imgItem.file.name}; sending to Cloudflare`);
        setUploadedImages(prev => prev.map(img =>
          img.id === imgItem.id ? { ...img, phase: 'uploading' } : img
        ));
        const result = await uploadFileToR2(resizedFile, progress => {
          setUploadedImages(prev => prev.map(img =>
            img.id === imgItem.id ? { ...img, progress } : img
          ));
        });
        
        setUploadedImages(prev => prev.map(img => 
          img.id === imgItem.id ? { ...img, url: result.url, key: result.key, status: 'uploaded', error: null } : img
        ));
      } catch (error) {
        failedCount += 1;
        console.error(`[Property upload] Failed ${imgItem.file.name}:`, error);
        setUploadedImages(prev => prev.map(img => 
          img.id === imgItem.id ? { ...img, status: 'error', error: error.message || 'Upload failed' } : img
        ));
      }
    }
    
    setUploadingImages(false);
    if (failedCount === 0) {
      toast.success(`${newImages.length} image(s) uploaded successfully!`);
    } else {
      toast.error(`${failedCount} image(s) failed to upload. Retry before submitting.`);
    }
  };

  const removeImage = (id) => {
    setUploadedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const setCover = (id) => {
    setUploadedImages(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      return [item, ...copy];
    });
    toast.success('Set as property cover photo');
  };

  const addImageFromUrl = () => {
    const value = urlInput.trim();
    if (!value) {
      toast.error('Paste an image URL first.');
      return;
    }

    if (!/^https?:\/\//i.test(value)) {
      toast.error('Please enter a valid image URL.');
      return;
    }

    const newImage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file: null,
      preview: value,
      status: 'uploaded',
      url: value,
      key: null,
    };

    setUploadedImages(prev => [...prev, newImage]);
    setUrlInput('');
    toast.success('Image URL added.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const sanitizedImages = sanitizeImageEntries(uploadedImages);
    const uploadedUrls = sanitizedImages.filter((img) => typeof img === 'string' ? true : (img?.url || img?.remoteUrl));
    const hasPendingBlob = uploadedImages.some(img => img.status === 'uploading' || img.status === 'previewing' || String(img.preview || '').startsWith('blob:'));
    if (uploadedUrls.length === 0) {
      toast.error('Please upload at least one valid image');
      return;
    }
    if (hasPendingBlob) {
      toast.error('Please wait for all selected images to finish uploading before submitting.');
      return;
    }
    
    setLoading(true);
    try {
      const formattedMedia = uploadedUrls.map((img) => ({
        url: typeof img === 'string' ? img : (img.url || img.remoteUrl),
        key: typeof img === 'string' ? null : (img.key || null),
        category: 'other'
      }));
      const publicUrls = uploadedUrls.map((img) => typeof img === 'string' ? img : (img.url || img.remoteUrl));

      const propertyData = {
        ...formData,
        price: parseInt(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseInt(formData.area) || 0,
        coverImage: publicUrls[0],
        images: publicUrls,
        publicMedia: publicUrls,
        media: formattedMedia,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userProfile?.name || currentUser.displayName,
        userType: 'seller',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        availabilityStatus: 'available',
        approvalStatus: 'pending',
        verificationStatus: 'pending',
        featured: false,
        views: 0,
        inquiries: 0,
        coordinates: selectedLocation?.lat != null && selectedLocation?.lng != null
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : null
      };
      
      await addDoc(collection(db, 'properties'), propertyData);
      toast.success('Property listed successfully! Waiting for admin approval.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">List New Property</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Images * (Upload up to 10 images)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <label htmlFor="property-images" className="mt-2 cursor-pointer text-sm text-emerald-600 block">
                Click to upload images
              </label>
              <input 
                id="property-images" 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                multiple
                className="hidden" 
                onChange={handleImageSelect}
              />
              <p className="text-xs text-gray-500 mt-2">Upload up to 10 images, then choose the star on any photo to make it the property cover.</p>
            </div>

            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-2">Add image by URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 min-w-0 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="button"
                  onClick={addImageFromUrl}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Add URL
                </button>
              </div>
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Images ({uploadedImages.filter(i => i.status === 'uploaded').length}/{uploadedImages.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={img.id} className="relative group">
                      {img.url || img.preview ? (
                        <img src={img.url || img.preview} alt="Property" className="w-full h-24 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-gray-100" />
                      )}
                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/60 rounded-lg flex flex-col items-center justify-center gap-2 px-3">
                          <Loader className="w-5 h-5 text-white animate-spin" />
                          <span className="text-[10px] text-white">
                            {img.phase === 'processing' ? 'Preparing image…' : `Uploading ${img.progress}%`}
                          </span>
                          <div
                            className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-label={`Uploading ${img.file?.name || 'image'}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={img.progress}
                          >
                            <div className="h-full bg-emerald-400 transition-[width]" style={{ width: img.phase === 'processing' ? '12%' : `${img.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/70 rounded-lg flex items-center justify-center" title={img.error || 'Cloudflare upload failed'}>
                          <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {img.status === 'uploaded' && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                      {idx === 0 && img.status === 'uploaded' ? (
                        <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow">
                          Cover ⭐
                        </span>
                      ) : img.status === 'uploaded' && (
                        <button
                          type="button"
                          onClick={() => setCover(img.id)}
                          className="absolute bottom-1 left-1 p-1 bg-white rounded-full shadow hover:bg-emerald-50 text-yellow-600"
                          title="Set as property cover photo"
                          aria-label="Set as property cover photo"
                        >
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., Modern 3-Bedroom Villa with Pool"
              />
            </div>
            
            {/* Location with GPS */}
            <div className="md:col-span-2">
              <LocationPicker 
                onLocationSelect={(loc) => {
                  setSelectedLocation(loc);
                  setFormData(prev => ({ 
                    ...prev, 
                    location: loc?.address || '',
                    coordinates: loc?.lat != null && loc?.lng != null ? { lat: loc.lat, lng: loc.lng } : null
                  }));
                }}
                label="Property Location *"
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
                placeholder="e.g., 8500000"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft)</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({...formData, area: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="1800"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="Describe your property in detail..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingImages || uploadedImages.filter(i => i.status === 'uploaded').length === 0}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Listing Property...' : 'List Property'}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Your property will be reviewed by admin before appearing on the homepage
          </p>
        </form>
      </div>
    </div>
  );
};

export default SellerPropertyUpload;
