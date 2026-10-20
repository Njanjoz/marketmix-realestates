import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';

const SETTINGS_REF = doc(db, 'siteSeeingSettings', 'availabilityFee');

export default function SightseeingFeeSettings() {
  const [amount, setAmount] = useState('50');
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(SETTINGS_REF, (snapshot) => {
    const savedAmount = Number(snapshot.data()?.amount ?? 50);
    setAmount(String(Number.isInteger(savedAmount) && savedAmount >= 1 && savedAmount <= 500000 ? savedAmount : 50));
  }, (error) => {
    console.error('Could not load site-seeing fee:', error);
    toast.error('Could not load the site-seeing fee setting.');
  }), []);

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
    <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Availability-check fee</h2>
    <p className="mt-2 max-w-2xl text-sm text-slate-600">Customers pay this non-refundable fee when they request an agent vacancy check. It defaults to KSh 50 until an admin changes it.</p>
    <form onSubmit={save} className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end">
      <label htmlFor="site-seeing-availability-fee" className="flex-1 text-sm font-bold text-slate-800">Fee amount (KSh)
        <input id="site-seeing-availability-fee" type="number" min="1" max="500000" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
        <span className="mt-1 block text-xs font-normal text-slate-500">Whole amounts from KSh 1 to KSh 500,000.</span>
      </label>
      <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60">
        <Save size={16} /> {saving ? 'Saving…' : 'Save fee'}
      </button>
    </form>
  </section>;
}
