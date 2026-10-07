// src/pages/admin/AgencyPackagesPage.jsx - Admin Managed Agency Packages

import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ImagePlus, PackagePlus, Pencil, Save, Trash2, X, Shield, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resizeImage, uploadFileToR2 } from '../../utils/cloudflareUpload';

const CATEGORY_OPTIONS = [
  ['management', 'Full Property Management'],
  ['onboarding', 'Tenant Onboarding & Vetting'],
  ['valuation', 'Professional Valuation & Inspection'],
  ['legal', 'Legal & Contract Due Diligence'],
  ['letting', 'Exclusive Letting & Marketing']
];

const BLANK_FORM = {
  title: '',
  summary: '',
  category: 'management',
  commissionRate: '3.5% of monthly rent',
  feeLabel: 'KSh 15,000 / month',
  includes: '',
  active: true,
  displayOrder: 0
};

export default function AgencyPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [editingId, setEditingId] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, 'agencyPackages'), (snapshot) => {
      const next = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      next.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
      setPackages(next);
    }, (err) => {
      console.error('Error loading agency packages:', err);
      toast.error('Failed to load agency packages');
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
      category: item.category || 'management',
      commissionRate: item.commissionRate || '',
      feeLabel: item.feeLabel || '',
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
        category: form.category,
        categoryLabel: CATEGORY_OPTIONS.find(([id]) => id === form.category)?.[1] || 'Management',
        commissionRate: form.commissionRate.trim(),
        feeLabel: form.feeLabel.trim(),
        includes: parsedIncludes,
        coverImage,
        active: Boolean(form.active),
        displayOrder: Math.max(0, Number(form.displayOrder) || 0),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'agencyPackages', editingId), payload);
        toast.success('Agency package updated successfully');
      } else {
        await addDoc(collection(db, 'agencyPackages'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast.success('Agency package created successfully');
      }
      resetForm();
    } catch (error) {
      console.error('Error saving agency package:', error);
      toast.error('Failed to save agency package');
    } finally {
      setSaving(false);
    }
  };

  const removePackage = async (item) => {
    if (!window.confirm(`Delete agency package "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'agencyPackages', item.id));
      if (editingId === item.id) resetForm();
      toast.success('Agency package deleted');
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
            <Building2 className="w-4 h-4" />
            Admin Management
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Agency & Property Management Packages</h1>
          <p className="mt-1 text-sm text-slate-600">Configure professional agency services, tenant vetting, and management packages for landlords and sellers.</p>
        </header>

        <form onSubmit={savePackage} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm grid gap-6 lg:grid-cols-[1fr_350px]">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Agency Package' : 'New Agency Package'}</h2>
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
                  placeholder="Full Residential Management"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Category
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                >
                  {CATEGORY_OPTIONS.map(([id, label]) => (
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
                  placeholder="Comprehensive management covering tenant care, rent collection and maintenance."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Commission Rate
                <input
                  value={form.commissionRate}
                  onChange={e => setForm({ ...form, commissionRate: e.target.value })}
                  placeholder="3.5% of monthly rent"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Fee Label / Price
                <input
                  value={form.feeLabel}
                  onChange={e => setForm({ ...form, feeLabel: e.target.value })}
                  placeholder="KSh 15,000 / month"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                What's Included (one per line)
                <textarea
                  rows={3}
                  value={form.includes}
                  onChange={e => setForm({ ...form, includes: e.target.value })}
                  placeholder="Rent collection & M-Pesa statements\nQuarterly property inspection\nTenant vetting & credit check"
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
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Package'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-800 mb-1">Package Banner / Cover</p>
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center hover:border-emerald-500">
              {posterPreview ? (
                <img src={posterPreview} alt="" className="h-48 w-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-600">Upload Banner Image</span>
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
          <h2 className="text-xl font-bold text-slate-900 mb-4">Active Agency Packages ({packages.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map(item => (
              <div key={item.id} className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${item.active === false ? 'opacity-60' : ''}`}>
                {item.coverImage && (
                  <img src={item.coverImage} alt="" className="h-36 w-full object-cover rounded-2xl mb-4" />
                )}
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
                  {item.categoryLabel || 'Management'}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-600">{item.summary}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-900 border-t border-slate-100 pt-3">
                  <span>{item.feeLabel || item.commissionRate}</span>
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
                  <button
                    onClick={() => removePackage(item)}
                    className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
