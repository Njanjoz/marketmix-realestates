import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';

const SETTINGS_REF = doc(db, 'siteSeeingSettings', 'availabilityFee');
const DEFAULT_PACKAGES = [
  { id: 'quick_view', title: 'Quick View', subtitle: 'A low-cost booking for one home you have already chosen.', price: 100, includes: ['One selected property', 'Viewing time and access request arranged', 'You travel to the property and meet there', 'No property search or transport included'] },
  { id: 'assisted_view', title: 'Assisted View', subtitle: 'Arrange a supported visit to two selected homes.', price: 250, includes: ['Up to two selected properties', 'Agent confirms availability and access', 'Meet-up point and directions coordinated', 'Guided viewing support and questions answered', 'Transport costs are not included'] },
  { id: 'student_hunt', title: 'Student Hunt', subtitle: 'Find affordable rooms and student accommodation near campus.', price: 300, includes: ['Student hostels, bedsitters and shared rooms', 'Set your monthly rent budget and preferred area', 'Choose up to 4 homes or get a matching shortlist', 'Best for students comparing places to live'] },
  { id: 'property_hunt', title: 'Property Hunt', subtitle: 'Compare different homes across property types and rent ranges.', price: 500, includes: ['Apartments, houses and other approved homes', 'Filter by property type, monthly rent and area', 'Choose up to 4 homes or get a matching shortlist', 'Best for renters comparing general housing options'] },
  { id: 'premium_hunt', title: 'Premium Hunt', subtitle: 'For users who want a personalized property search.', price: 1000, includes: ['Choose up to 6 properties', 'Set your budget, type and preferred area', 'Browse homes or request a random shortlist', 'Personalized agent guidance'] },
  { id: 'group_viewing', title: 'Group Viewing', subtitle: 'For friends, couples or roommates.', price: 150, includes: ['Multiple participants', 'Shared viewing', 'One booking', 'Property comparison'] },
];
const DEFAULT_PACKAGE_IDS = new Set(DEFAULT_PACKAGES.map(({ id }) => id));

export default function SightseeingFeeSettings() {
  const [amount, setAmount] = useState('50');
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [savingPackageId, setSavingPackageId] = useState('');

  useEffect(() => onSnapshot(SETTINGS_REF, (snapshot) => {
    const savedAmount = Number(snapshot.data()?.amount ?? 50);
    setAmount(String(Number.isInteger(savedAmount) && savedAmount >= 1 && savedAmount <= 500000 ? savedAmount : 50));
  }, (error) => {
    console.error('Could not load site-seeing fee:', error);
    toast.error('Could not load the site-seeing fee setting.');
  }), []);

  useEffect(() => onSnapshot(collection(db, 'sightseeingPackages'), (snapshot) => {
    const saved = new Map(snapshot.docs.map((entry) => [entry.id, { id: entry.id, ...entry.data() }]));
    const defaults = DEFAULT_PACKAGES.map((item) => {
      const data = saved.get(item.id) || {};
      return { ...item, ...data, id: item.id, subtitle: data.subtitle || data.summary || item.subtitle,
        includes: Array.isArray(data.includes) ? data.includes : item.includes,
        price: Number(data.price ?? item.price), active: data.active !== false };
    });
    const custom = snapshot.docs.filter((entry) => !DEFAULT_PACKAGE_IDS.has(entry.id)).map((entry) => {
      const data = entry.data() || {};
      return { ...data, id: entry.id, subtitle: data.subtitle || data.summary || '',
        includes: Array.isArray(data.includes) ? data.includes : [], price: Number(data.price) || 0,
        active: data.active !== false };
    });
    setPackages([...defaults, ...custom].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)));
  }, (error) => {
    console.error('Could not load site-seeing packages:', error);
    toast.error('Could not load property tour package settings.');
  }), []);

  const updatePackageField = (packageId, field, value) => {
    setPackages((current) => current.map((item) => item.id === packageId ? { ...item, [field]: value } : item));
  };

  const savePackage = async (item) => {
    const price = Number(item.price);
    if (!String(item.title || '').trim() || !String(item.subtitle || '').trim() || !Number.isInteger(price) || price < 1 || price > 500000) {
      toast.error('Enter a package title, description, and whole-shilling price.');
      return;
    }
    setSavingPackageId(item.id);
    try {
      const includes = Array.isArray(item.includes) ? item.includes : String(item.includes || '').split('\n');
      const normalizedIncludes = includes.map((line) => String(line).trim()).filter(Boolean).slice(0, 12);
      await setDoc(doc(db, 'sightseeingPackages', item.id), {
        title: String(item.title).trim().slice(0, 80), subtitle: String(item.subtitle).trim().slice(0, 240),
        summary: String(item.subtitle).trim().slice(0, 240), price, priceLabel: `KSh ${price.toLocaleString('en-KE')}`,
        includes: normalizedIncludes, active: item.active !== false, updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success(`${item.title} saved.`);
    } catch (error) {
      console.error('Could not save site-seeing package:', error);
      toast.error(error.message || 'Could not save this property tour package.');
    } finally { setSavingPackageId(''); }
  };

  const removeCustomPackage = async (item) => {
    if (DEFAULT_PACKAGE_IDS.has(item.id) || !window.confirm(`Delete the “${item.title}” package?`)) return;
    try {
      await deleteDoc(doc(db, 'sightseeingPackages', item.id));
      toast.success('Package deleted.');
    } catch (error) {
      console.error('Could not delete site-seeing package:', error);
      toast.error(error.message || 'Could not delete this package.');
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value < 1 || value > 500000) {
      toast.error('Enter a whole KSh amount from 1 to 500,000.');
      return;
    }
    setSaving(true);
    try {
      await setDoc(SETTINGS_REF, { amount: value, updatedAt: serverTimestamp() });
      toast.success(`Availability-check fee set to KSh ${value.toLocaleString()}.`);
    } catch (error) {
      console.error('Could not save site-seeing fee:', error);
      toast.error('Could not save the site-seeing fee. Check your admin access and try again.');
    } finally {
      setSaving(false);
    }
  };

  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-800">Site-seeing settings</p>
    <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Property booking fee & tour packages</h2>
    <p className="mt-2 max-w-2xl text-sm text-slate-600">Set the fee for an agent vacancy check. Customers pay it when they request availability confirmation.</p>
    <form onSubmit={save} className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
      <label htmlFor="site-seeing-availability-fee" className="flex-1 text-sm font-bold text-slate-800">Fee amount (KSh)
        <input id="site-seeing-availability-fee" type="number" min="1" max="500000" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
        <span className="mt-1 block text-xs font-normal text-slate-500">Whole amounts from KSh 1 to KSh 500,000.</span>
      </label>
      <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60">
        <Save size={16} /> {saving ? 'Saving…' : 'Save fee'}
      </button>
    </form>
    <div className="mt-10 border-t border-slate-200 pt-8">
      <p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-800">Site-seeing page</p>
      <h3 className="mt-2 text-xl font-extrabold text-slate-950">Property tour packages</h3>
      <p className="mt-1 text-sm text-slate-600">Edit the package options shown at the linked site-seeing page, including prices and inclusions.</p>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {packages.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <label className="text-xs font-bold text-slate-700">Package name<input value={item.title || ''} onChange={(event) => updatePackageField(item.id, 'title', event.target.value)} maxLength={80} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-700">Price (KSh)<input type="number" min="1" max="500000" step="1" value={item.price ?? ''} onChange={(event) => updatePackageField(item.id, 'price', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" /></label>
          </div>
          <label className="mt-3 block text-xs font-bold text-slate-700">Description<textarea rows="2" maxLength={240} value={item.subtitle || ''} onChange={(event) => updatePackageField(item.id, 'subtitle', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" /></label>
          <label className="mt-3 block text-xs font-bold text-slate-700">Package includes <span className="font-normal text-slate-500">(one item per line)</span><textarea rows="3" value={(item.includes || []).join('\n')} onChange={(event) => updatePackageField(item.id, 'includes', event.target.value.split('\n'))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" /></label>
          <div className="mt-3 flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={item.active !== false} onChange={(event) => updatePackageField(item.id, 'active', event.target.checked)} className="accent-emerald-700" />Show on site-seeing page</label>
            <div className="flex gap-2"><button type="button" disabled={savingPackageId === item.id} onClick={() => savePackage(item)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Save size={14} />{savingPackageId === item.id ? 'Saving…' : 'Save package'}</button>{!DEFAULT_PACKAGE_IDS.has(item.id) && <button type="button" onClick={() => removeCustomPackage(item)} aria-label={`Delete ${item.title}`} className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 size={14} /></button>}</div>
          </div>
        </article>)}
      </div>
    </div>
  </section>;
}
