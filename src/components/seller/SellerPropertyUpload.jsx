// src/components/seller/SellerPropertyUpload.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [previewCoverId, setPreviewCoverId] = useState(null);
  
  const getImageUrl = (img) => {
    if (!img) return null;
    return img.url || img.preview || img.remoteUrl || img.localPreviewUrl || (img.file instanceof File ? URL.createObjectURL(img.file) : null);
  };

  const coverImage = uploadedImages.find((img) => img.status === 'uploaded' && getImageUrl(img)) || uploadedImages[0];
  const previewCoverImage = uploadedImages.find((img) => String(img.id) === String(previewCoverId)) || coverImage;
  const isNewCoverSelection = Boolean(previewCoverImage && String(previewCoverImage.id) !== String(coverImage?.id));
  
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
      preview: URL.createObjectURL(file),
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
      if (idx < 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      return [item, ...copy];
    });
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
        listingType: formData.status,
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
        listingStatus: 'active',
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

  return createPortal((
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
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

            {coverImage && (
              <div className="mt-4 grid gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(14rem,1fr)]">
                <div className="relative aspect-[16/9] min-h-48 overflow-hidden rounded-xl bg-white shadow-sm sm:min-h-64 transition-all duration-500 ease-in-out">
                  {coverImage.url || coverImage.preview ? (
                    <img src={coverImage.url || coverImage.preview} alt="Selected property cover photo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">Cover photo is uploading</div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                    Property cover photo
                  </span>
                </div>
                <div className="flex flex-col justify-center px-1 py-2 sm:px-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Shown first across MarketMix</span>
                  <h3 className="mt-1 text-lg font-bold text-emerald-950">{coverImage.file?.name || 'Selected cover photo'}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-900/80">
                    This large image is used on property cards, details, and promotion posters.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-emerald-800">Choose Set cover or:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewCoverId(coverImage?.id);
                        setIsCoverModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                      Change cover photo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cover Change Modal */}
            {isCoverModalOpen && typeof document !== 'undefined' && createPortal((
              <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="upload-cover-photo-dialog-title">
                <div className="my-auto max-h-[90vh] w-full max-w-3xl space-y-6 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 id="upload-cover-photo-dialog-title" className="text-lg font-bold text-gray-900">Change Property Cover Photo</h3>
                      <p className="text-xs text-gray-500">Click any uploaded image below to select and preview it as the new cover.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCoverModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 1. All Uploaded Images Grid (User sees all images to select) */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                      1. Select an image ({uploadedImages.length} uploaded)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-56 overflow-y-auto p-2 border rounded-xl bg-gray-50">
                      {uploadedImages.map((img) => {
                        const imgUrl = img.url || img.preview;
                        const isSelected = previewCoverId != null && img.id != null && String(img.id) === String(previewCoverId);
                        return (
                          <button
                            key={`cover-select-${img.id}`}
                            type="button"
                            onClick={() => {
                              console.info("Selected cover image ID:", img.id);
                              setPreviewCoverId(img.id);
                            }}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? 'border-emerald-600 ring-2 ring-emerald-300 shadow-md bg-emerald-50'
                                : 'border-gray-200 hover:border-emerald-400 bg-white'
                            }`}
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">Loading</div>
                            )}
                            {isSelected && (
                              <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white shadow-md">
                                <CheckCircle className="h-4 w-4 text-emerald-700" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Live preview of the selected cover photo */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                      2. Live Preview (New Cover Photo)
                    </span>
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 border-2 border-emerald-500 shadow-md">
                      {getImageUrl(previewCoverImage) ? (
                        <img
                          src={getImageUrl(previewCoverImage)}
                          alt="Preview selected cover photo"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">No image selected</div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-md">
                        New Cover Preview ⭐
                      </span>
                    </div>
                  </div>

                  {isNewCoverSelection && (
                    <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                      <strong>Use {previewCoverImage.file?.name || 'this photo'} as the new cover photo?</strong>
                      <p className="mt-1 text-xs text-emerald-800">This photo will appear first on the property listing.</p>
                    </div>
                  )}

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setIsCoverModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isNewCoverSelection && previewCoverImage?.id != null) {
                          setCover(previewCoverImage.id);
                          toast.success('New cover photo applied successfully!');
                          setIsCoverModalOpen(false);
                        } else {
                          toast.error('Choose a different photo before changing the cover.');
                        }
                      }}
                      disabled={!isNewCoverSelection}
                      className="px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Use as new cover photo
                    </button>
                  </div>
                </div>
              </div>
              ), document.body)}

            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Images ({uploadedImages.filter(i => i.status === 'uploaded').length}/{uploadedImages.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      {img.url || img.preview ? (
                        <img src={img.url || img.preview} alt="Property" className="w-full h-24 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-gray-100" />
                      )}
                      {img.status === 'uploading' && (
                        <>
                          <span className="absolute right-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-slate-800 shadow">
                            {img.phase === 'processing' ? 'Preparing' : `Uploading ${img.progress}%`}
                          </span>
                          <div
                            className="absolute inset-x-0 bottom-0 h-1.5 overflow-hidden bg-black/20"
                            role="progressbar"
                            aria-label={`Uploading ${img.file?.name || 'image'}`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={img.progress}
                          >
                            <div className="h-full bg-emerald-400 transition-[width]" style={{ width: img.phase === 'processing' ? '12%' : `${img.progress}%` }} />
                          </div>
                        </>
                      )}
                      {img.status === 'error' && (
                        <div className="absolute right-1 top-1 rounded-full bg-red-700 p-1 shadow" title={img.error || 'Cloudflare upload failed'}>
                          <AlertCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {img.status === 'uploaded' && (
                        <div className="absolute top-1 right-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                      {img.id === coverImage?.id && img.status === 'uploaded' ? (
                        <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow">
                          Cover ⭐
                        </span>
                      ) : img.status === 'uploaded' && (
                        <button
                          type="button"
                          onClick={() => setCover(img.id)}
                          className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-yellow-700 shadow hover:bg-emerald-50"
                          title="Set as property cover photo"
                          aria-label="Set as property cover photo"
                        >
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />
                          <span className="text-[10px] font-semibold">Set cover</span>
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
  ), document.body);
};

export default SellerPropertyUpload;
