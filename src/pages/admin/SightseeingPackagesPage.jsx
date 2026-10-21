// src/pages/admin/SightseeingPackagesPage.jsx - Admin Managed Sightseeing & Property Tours

import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ImagePlus, Pencil, Save, Trash2, X, Compass, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { resizeImage, uploadFileToR2 } from '../../utils/cloudflareUpload';

const TOUR_TYPES = [
  ['luxury_villa', 'Luxury Villa & Mansion Tour'],
  ['investment_safari', 'Coastal & Upcountry Investment Safari'],
  ['student_housing', 'Campus & Student Housing Tour'],
  ['commercial', 'Commercial & Retail Space Visit']
];

const DEFAULT_PACKAGES = [
  { id: 'quick_view', title: 'Quick View', summary: 'A low-cost booking for one home you have already chosen.', price: 100, priceLabel: 'KSh 100', includes: ['One selected property', 'Viewing time and access request arranged', 'You travel to the property and meet there', 'No property search or transport included'] },
  { id: 'assisted_view', title: 'Assisted View', summary: 'Arrange a supported visit to two selected homes.', price: 250, priceLabel: 'KSh 250', includes: ['Up to two selected properties', 'Agent confirms availability and access', 'Meet-up point and directions coordinated', 'Guided viewing support and questions answered', 'Transport costs are not included'] },
  { id: 'student_hunt', title: 'Student Hunt', summary: 'Find affordable rooms and student accommodation near campus.', price: 300, priceLabel: 'KSh 300', includes: ['Student hostels, bedsitters and shared rooms', 'Set your monthly rent budget and preferred area', 'Choose up to 4 homes or get a matching shortlist', 'Best for students comparing places to live'] },
  { id: 'property_hunt', title: 'Property Hunt', summary: 'Compare different homes across property types and rent ranges.', price: 500, priceLabel: 'KSh 500', includes: ['Apartments, houses and other approved homes', 'Filter by property type, monthly rent and area', 'Choose up to 4 homes or get a matching shortlist', 'Best for renters comparing general housing options'] },
  { id: 'premium_hunt', title: 'Premium Hunt', summary: 'For users who want a personalized property search.', price: 1000, priceLabel: 'KSh 1,000', includes: ['Choose up to 6 properties', 'Set your budget, type and preferred area', 'Browse homes or request a random shortlist', 'Personalized agent guidance'] },
  { id: 'group_viewing', title: 'Group Viewing', summary: 'For friends, couples or roommates.', price: 150, priceLabel: 'KSh 150 / person', includes: ['Multiple participants', 'Shared viewing', 'One booking', 'Property comparison'] },
];
const DEFAULT_PACKAGE_IDS = new Set(DEFAULT_PACKAGES.map((item) => item.id));

const BLANK_FORM = {
  title: '',
  summary: '',
  tourType: 'luxury_villa',
  location: 'Nairobi & Environs',
  duration: 'Full Day (6 Hours)',
  priceLabel: '',
  price: 3500,
  includes: '',
  active: true,
  displayOrder: 0
};

export default function SightseeingPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [editingId, setEditingId] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, 'sightseeingPackages'), (snapshot) => {
      const savedById = new Map(snapshot.docs.map((entry) => [entry.id, { id: entry.id, ...entry.data() }]));
      const defaults = DEFAULT_PACKAGES.map((item) => ({ ...item, ...(savedById.get(item.id) || {}), id: item.id }));
      const custom = snapshot.docs.filter((entry) => !DEFAULT_PACKAGE_IDS.has(entry.id)).map((entry) => ({ id: entry.id, ...entry.data() }));
      const next = [...defaults, ...custom];
      next.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
      setPackages(next);
    }, (err) => {
      console.error('Error loading sightseeing packages:', err);
      toast.error('Failed to load sightseeing packages');
    });
  }, []);

  const parsedIncludes = useMemo(() => 
    form.includes.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 12),
    [form.includes]
  );

  const resetForm = () => {
    setForm(BLANK_FORM);
    setEditingId('');
    setPosterFile(null);
    setPosterPreview('');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      summary: item.summary || '',
      tourType: item.tourType || 'luxury_villa',
      location: item.location || '',
      duration: item.duration || '',
      priceLabel: item.priceLabel || `KSh ${Number(item.price || 0).toLocaleString('en-KE')}`,
      price: Number(item.price) || Number(String(item.priceLabel || '').replace(/[^0-9.]/g, '')) || 0,
      includes: (item.includes || []).join('\n'),
      active: item.active !== false,
      displayOrder: Number(item.displayOrder || 0)
    });
    setPosterPreview(item.coverImage || '');
    setPosterFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savePackage = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error('Title and summary are required');
      return;
    }
    const price = Number(form.price);
    if (!Number.isInteger(price) || price < 50 || price > 500000) {
      toast.error('Enter a package price from KSh 50 to KSh 500,000');
      return;
    }
    setSaving(true);
    try {
      let coverImage = posterPreview;
      if (posterFile) {
        const resized = await resizeImage(posterFile);
        const uploaded = await uploadFileToR2(resized);
        coverImage = uploaded.url;
      }

      const payload = {
        title: form.title.trim().slice(0, 80),
        summary: form.summary.trim().slice(0, 240),
        tourType: form.tourType,
        tourTypeLabel: TOUR_TYPES.find(([id]) => id === form.tourType)?.[1] || 'Property Tour',
        location: form.location.trim(),
        duration: form.duration.trim(),
        priceLabel: form.priceLabel.trim() || `KSh ${price.toLocaleString('en-KE')}`,
        price,
        includes: parsedIncludes,
        coverImage,
        active: Boolean(form.active),
        displayOrder: Math.max(0, Number(form.displayOrder) || 0),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await setDoc(doc(db, 'sightseeingPackages', editingId), payload, { merge: true });
        toast.success('Sightseeing package updated successfully');
      } else {
        await addDoc(collection(db, 'sightseeingPackages'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast.success('Sightseeing package created successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving sightseeing package:', error);
      toast.error('Failed to save sightseeing package');
    } finally {
      setSaving(false);
    }
  };

  const removePackage = async (item) => {
    if (!window.confirm(`Delete sightseeing package "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'sightseeingPackages', item.id));
      if (editingId === item.id) resetForm();
      toast.success('Sightseeing package deleted');
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            Admin Management
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Sightseeing & Property Tour Packages</h1>
          <p className="mt-1 text-sm text-slate-600">Curate luxury property tours, investment safaris, and neighborhood inspection packages for buyers and investors.</p>
        </header>

        <form onSubmit={savePackage} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm grid gap-6 lg:grid-cols-[1fr_350px]">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Sightseeing Package' : 'New Sightseeing Package'}</h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Package Title
                <input
                  required
                  maxLength={80}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Karen & Runda Luxury Villa Safari"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Tour Type
                <select
                  value={form.tourType}
                  onChange={e => setForm({ ...form, tourType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                >
                  {TOUR_TYPES.map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                Short Summary
                <textarea
                  required
                  rows={2}
                  maxLength={240}
                  value={form.summary}
                  onChange={e => setForm({ ...form, summary: e.target.value })}
                  placeholder="Guided private tour of top-tier gated estates and premium mansions."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Location / Route
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="Nairobi & Environs"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Duration
                <input
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                  placeholder="Full Day (6 Hours)"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Price display text (optional)
                <input
                  value={form.priceLabel}
                  onChange={e => setForm({ ...form, priceLabel: e.target.value })}
                  placeholder="KSh 3,500 / person"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Website checkout price (KSh)
                <input
                  required
                  type="number"
                  min="50"
                  max="500000"
                  step="1"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Display Order
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={e => setForm({ ...form, displayOrder: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                What's Included (one per line)
                <textarea
                  rows={3}
                  value={form.includes}
                  onChange={e => setForm({ ...form, includes: e.target.value })}
                  placeholder="Chauffeur-driven private vehicle\nProfessional property consultant guide\nRefreshments & property prospectus brochures"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="accent-emerald-600"
                />
                Active & Visible to Clients
              </label>
              <button
                disabled={saving}
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Tour'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800 mb-1">Tour Banner / Cover</p>
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center hover:border-emerald-500">
              {posterPreview ? (
                <img src={posterPreview} alt="" className="h-48 w-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-600">Upload Tour Banner</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPosterFile(file);
                  setPosterPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            {posterPreview && (
              <button
                type="button"
                onClick={() => { setPosterFile(null); setPosterPreview(''); }}
                className="mt-2 text-xs font-semibold text-rose-600"
              >
                Remove image
              </button>
            )}
          </div>
        </form>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Active Sightseeing Packages ({packages.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map(item => (
              <div key={item.id} className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${item.active === false ? 'opacity-60' : ''}`}>
                {item.coverImage && (
                  <img src={item.coverImage} alt="" className="h-36 w-full object-cover rounded-2xl mb-4" />
                )}
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
                  {item.tourTypeLabel || 'Property Tour'}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-600">{item.summary}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-900 border-t border-slate-100 pt-3">
                  <span>KSh {Number(item.price || String(item.priceLabel || '').replace(/[^0-9.]/g, '') || 0).toLocaleString('en-KE')}</span>
                  <span className={item.active !== false ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.active !== false ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => startEdit(item)}
                    className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  {!DEFAULT_PACKAGE_IDS.has(item.id) && <button
                    onClick={() => removePackage(item)}
                    className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
