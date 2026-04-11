// src/components/seller/SellerPropertyEdit.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, Upload, MapPin, DollarSign, Bed, Bath, Square, Loader, CheckCircle, AlertCircle, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationPicker from '../LocationPicker';

const CLOUDFLARE_WORKER_URL = 'https://marketmix-uploader.johnnjanjo4.workers.dev';

const SellerPropertyEdit = ({ property, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState(property.images?.map(url => ({ url, status: 'uploaded', isExisting: true })) || []);
  const [removedImages, setRemovedImages] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(
    property.coordinates ? { lat: property.coordinates.lat, lng: property.coordinates.lng, address: property.location } : null
  );
  
  const [formData, setFormData] = useState({
    title: property.title || '',
    location: property.location || '',
    price: property.price || '',
    status: property.status || 'sale',
    propertyType: property.propertyType || 'house',
    bedrooms: property.bedrooms || '',
    bathrooms: property.bathrooms || '',
    area: property.area || '',
    description: property.description || '',
    coordinates: property.coordinates || null
  });

  const uploadToCloudflare = async (file) => {
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/upload`, { method: 'POST', body: formDataObj });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const data = await response.json();
    return { url: data.url, key: data.key };
  };

  const resizeImage = (file, maxWidth = 1200, maxHeight = 800) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
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
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
          }, file.type, 0.85);
        };
      };
    });
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file), status: 'pending' }));
    setUploadedImages(prev => [...prev, ...newImages]);
    setUploadingImages(true);
    
    for (let i = 0; i < newImages.length; i++) {
      const idx = uploadedImages.length + i;
      try {
        setUploadedImages(prev => prev.map((img, index) => index === idx ? { ...img, status: 'uploading' } : img));
        const resizedFile = await resizeImage(newImages[i].file);
        const result = await uploadToCloudflare(resizedFile);
        setUploadedImages(prev => prev.map((img, index) => index === idx ? { ...img, url: result.url, status: 'uploaded', isExisting: false } : img));
      } catch (error) {
        setUploadedImages(prev => prev.map((img, index) => index === idx ? { ...img, status: 'error' } : img));
      }
    }
    setUploadingImages(false);
    toast.success(`${newImages.length} image(s) uploaded!`);
  };

  const removeImage = (index) => {
    const img = uploadedImages[index];
    if (img.preview) URL.revokeObjectURL(img.preview);
    if (img.isExisting && img.url) {
      setRemovedImages(prev => [...prev, img.url]);
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({ 
      ...prev, 
      location: location?.address || '',
      coordinates: location?.lat ? { lat: location.lat, lng: location.lng } : null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentImages = uploadedImages.filter(img => img.status === 'uploaded' && img.url).map(img => img.url);
    if (currentImages.length === 0) {
      toast.error('Please keep at least one image');
      return;
    }
    
    setLoading(true);
    try {
      const propertyRef = doc(db, 'properties', property.id);
      await updateDoc(propertyRef, {
        ...formData,
        price: parseInt(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseInt(formData.area) || 0,
        images: currentImages,
        location: formData.location,
        coordinates: formData.coordinates,
        updatedAt: serverTimestamp(),
        approvalStatus: 'pending',
        previousApprovalStatus: property.approvalStatus
      });
      
      toast.success('Property updated! It will be reviewed again by admin.');
      onSuccess();
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Property</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property Images</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <label htmlFor="edit-images" className="mt-2 cursor-pointer text-sm text-emerald-600 block">Click to add more images</label>
              <input id="edit-images" type="file" accept="image/jpeg,image/png,image.webp" multiple className="hidden" onChange={handleImageSelect} />
            </div>
            
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Images ({uploadedImages.filter(i => i.status === 'uploaded').length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img.preview || img.url} className="w-full h-24 object-cover rounded-lg" />
                      {img.status === 'uploading' && <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center"><Loader className="w-5 h-5 text-white animate-spin" /></div>}
                      {img.isExisting && <div className="absolute top-1 right-1"><CheckCircle className="w-4 h-4 text-blue-500" /></div>}
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            
            {/* Location with GPS */}
            <div className="md:col-span-2">
              <LocationPicker 
                onLocationSelect={handleLocationSelect}
                initialLocation={selectedLocation}
                label="Property Location *"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
              <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="sale">For Sale</option><option value="rent">For Rent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select value={formData.propertyType} onChange={(e) => setFormData({...formData, propertyType: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="house">House</option><option value="apartment">Apartment</option>
                <option value="villa">Villa</option><option value="commercial">Commercial</option><option value="land">Land</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <input type="number" value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
              <input type="number" value={formData.bathrooms} onChange={(e) => setFormData({...formData, bathrooms: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area (sqft)</label>
              <input type="number" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows="4" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            <AlertCircle size={14} className="inline mr-2" />
            After editing, your property will need to be re-approved by an admin before it appears on the homepage.
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Property'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerPropertyEdit;
