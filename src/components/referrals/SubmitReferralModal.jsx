// src/components/referrals/SubmitReferralModal.jsx - Property Referral Submission Modal

import React, { useState } from 'react';
import { X, Upload, Home, MapPin, DollarSign, Sparkles } from 'lucide-react';
import { submitPropertyReferral } from '../../services/referralService';
import toast from 'react-hot-toast';

export default function SubmitReferralModal({ currentUser, userProfile, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    propertyType: 'house',
    price: '',
    description: '',
    imageUrl: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.price) {
      toast.error('Please fill in all required property details.');
      return;
    }

    setLoading(true);
    try {
      const result = await submitPropertyReferral({
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || 'User',
        userPhone: userProfile?.phone || userProfile?.mobile || '',
        propertyData: {
          title: formData.title,
          location: formData.location,
          propertyType: formData.propertyType,
          price: Number(formData.price) || 0,
          description: formData.description || 'Referred property',
          images: formData.imageUrl ? [formData.imageUrl] : ['/images/property-hero.svg'],
          coverImage: formData.imageUrl || '/images/property-hero.svg',
        },
      });

      if (result.success) {
        toast.success(`Property submitted successfully! Referral Code: ${result.referralCode}`);
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to submit property referral.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Submit Property Referral</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Property Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., 2 Bedroom Apartment in Kilimani"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="bedsitter">Bedsitter</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Estimated Price (KSh) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 25000"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Location / Neighborhood *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Kilimani, Nairobi"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Photo URL (Optional)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="Paste a property image URL"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">Description & Notes</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Mention owner details or key property features..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
