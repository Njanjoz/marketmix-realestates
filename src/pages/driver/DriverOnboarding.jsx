// src/pages/driver/DriverOnboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { submitDriverOnboarding } from '../../services/driverService';

export default function DriverOnboarding() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleId: userProfile?.driverProfile?.vehicleId || 'pickup',
    plate: userProfile?.driverProfile?.plate || '',
    licenseNumber: userProfile?.driverProfile?.licenseNumber || '',
    phone: userProfile?.driverProfile?.phone || '',
    photoUrl: userProfile?.driverProfile?.photoUrl || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plate || !form.licenseNumber || !form.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await submitDriverOnboarding(form);
      toast.success('Driver onboarding submitted successfully! Awaiting admin approval.');
      navigate('/driver/dashboard');
    } catch (err) {
      toast.error(err.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <Truck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h1 className="text-2xl font-extrabold text-slate-950">Driver Onboarding</h1>
          <p className="text-xs text-slate-500 mt-1">Provide your vehicle and license details to start accepting moves.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Vehicle Type</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            >
              <option value="motorbike">Motorbike</option>
              <option value="tuk">Tuk Tuk</option>
              <option value="pickup">Pickup</option>
              <option value="lorry">Lorry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">License Plate</label>
            <input
              type="text"
              required
              value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value })}
              placeholder="KAB 123Z"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Driver's License Number</label>
            <input
              type="text"
              required
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              placeholder="DL-987654"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Contact Phone Number</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="2547XXXXXXXX"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 shadow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Submit for Approval</span>
          </button>
        </form>
      </div>
    </main>
  );
}
