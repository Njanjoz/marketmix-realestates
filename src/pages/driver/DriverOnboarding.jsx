// src/pages/driver/DriverOnboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Loader2, Camera, Image as ImageIcon, Trash2, MapPin, CheckCircle2, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { submitDriverOnboarding } from '../../services/driverService';
import CloudflareImageUpload from '../../components/CloudflareImageUpload';
import LiveCameraModal from '../../components/LiveCameraModal';
import KenyaAreaPicker from '../../components/moving/KenyaAreaPicker';
import CoordinateMapPicker from '../../components/moving/CoordinateMapPicker';

const CARRY_OPTIONS = [
  ['bed', 'Beds'], ['mattress', 'Mattresses'], ['sofa', 'Sofas'], ['table', 'Tables'],
  ['chair', 'Chairs'], ['wardrobe', 'Wardrobes'], ['fridge', 'Fridges'],
  ['tv', 'TVs & electronics'], ['washer', 'Washing machines'], ['box', 'Boxes'], ['other', 'Other household items'],
];
const getSavedItemRates = (profile = {}) => profile.itemRates && typeof profile.itemRates === 'object' && !Array.isArray(profile.itemRates)
  ? Object.fromEntries(Object.entries(profile.itemRates).map(([id, rate]) => [id, String(Math.max(0, Number(rate) || 0))]))
  : {};
const getSavedCargoCapacity = (profile = {}) => {
  if (profile.cargoCapacity && typeof profile.cargoCapacity === 'object' && !Array.isArray(profile.cargoCapacity)) {
    return Object.fromEntries(Object.entries(profile.cargoCapacity).filter(([, count]) => Number(count) > 0).map(([id, count]) => [id, Number(count)]));
  }
  return Object.fromEntries((Array.isArray(profile.canCarryItems) ? profile.canCarryItems : []).map((id) => [id, 1]));
};

export default function DriverOnboarding() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [pinningLocation, setPinningLocation] = useState(false);

  const [form, setForm] = useState({
    vehicleId: userProfile?.driverProfile?.vehicleId || 'pickup',
    vehicleTemplate: userProfile?.driverProfile?.vehicleTemplate || 'fronack',
    ratePerKm: userProfile?.driverProfile?.ratePerKm == null ? '' : String(userProfile.driverProfile.ratePerKm),
    acceptsOnlinePayments: userProfile?.driverProfile?.acceptsOnlinePayments === true,
    cargoCapacity: getSavedCargoCapacity(userProfile?.driverProfile),
    itemRates: getSavedItemRates(userProfile?.driverProfile),
    plate: userProfile?.driverProfile?.plate || '',
    licenseNumber: userProfile?.driverProfile?.licenseNumber || '',
    phone: userProfile?.phoneNumber || userProfile?.phone || userProfile?.driverProfile?.phone || '',
    workCounty: userProfile?.driverProfile?.workCounty || '',
    workSubCounty: userProfile?.driverProfile?.workSubCounty || '',
    workWard: userProfile?.driverProfile?.workWard || '',
    workArea: userProfile?.driverProfile?.workArea || '',
    workCoordinates: userProfile?.driverProfile?.workCoordinates || null,
    photoUrl: userProfile?.driverProfile?.photoUrl || ''
  });

  const handleAreaChange = (area) => {
    setForm(prev => ({
      ...prev,
      workCounty: area.county || '',
      workSubCounty: area.subCounty || '',
      workWard: area.ward || '',
      workArea: area.area || ''
    }));
  };

  const handleMapPick = (point) => {
    setForm(prev => ({ ...prev, workCoordinates: point }));
    toast.success('Working area map pin saved!');
    setPinningLocation(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLookupBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const point = { lat, lng };
        setForm(prev => ({ ...prev, workCoordinates: point }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
            const place = data.address.suburb || data.address.neighbourhood || data.address.city || data.address.town || data.address.county || '';
            setForm(prev => ({ ...prev, workArea: place }));
          }
          toast.success('Current location found and saved!');
        } catch (e) {
          console.warn('Reverse geocode failed:', e);
          toast.success('GPS coordinates saved!');
        } finally {
          setLookupBusy(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('Could not retrieve your location. Please check permissions.');
        setLookupBusy(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleUploadComplete = (files) => {
    if (files && files.length > 0) {
      setForm(prev => ({ ...prev, photoUrl: files[0].url }));
      toast.success('Vehicle photo uploaded successfully!');
    }
  };

  const handleCameraCaptured = (url, angle) => {
    setForm(prev => ({ ...prev, photoUrl: url }));
    toast.success(`Vehicle photo (${angle}) captured successfully!`);
  };

  const handleRemovePhoto = () => {
    setForm(prev => ({ ...prev, photoUrl: '' }));
    toast('Photo removed. Take a new one or upload.', { icon: '🗑️' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plate || !form.licenseNumber || !form.phone || (!form.workArea && !form.workCoordinates) || !(Number(form.ratePerKm) > 0) || !Object.keys(form.cargoCapacity).length) {
      toast.error('Add your required details, working area or map pin, rate, and the quantity of at least one item type your vehicle can carry.');
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
      <div className="max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <Truck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h1 className="text-2xl font-extrabold text-slate-950">Driver Onboarding & Fleet</h1>
          <p className="text-xs text-slate-500 mt-1">Register your vehicle template, working area search/pin, and professional photos.</p>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Vehicle Template / Style</label>
            <select
              value={form.vehicleTemplate}
              onChange={(e) => setForm({ ...form, vehicleTemplate: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            >
              <option value="fronack">Fronack (Enclosed Box)</option>
              <option value="pickup">Open Pickup</option>
              <option value="lorry">Large Lorry / Carrier</option>
              <option value="van">Cargo Van</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Your {form.vehicleId} rate per kilometre (KSh)</label>
            <input type="number" min="1" step="1" required value={form.ratePerKm} onChange={(e) => setForm({ ...form, ratePerKm: e.target.value })} placeholder="Your fare for each trip kilometre" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" />
            <p className="mt-1 text-[10px] text-slate-500">Customers see your vehicle, distance to pickup and calculated trip quote before they choose.</p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
            <input type="checkbox" checked={form.acceptsOnlinePayments} onChange={(event) => setForm({ ...form, acceptsOnlinePayments: event.target.checked })} className="mt-1 h-4 w-4 accent-emerald-700" />
            <span><span className="block text-sm font-bold text-emerald-950">Accept website payments for transport jobs</span><span className="mt-1 block text-xs leading-5 text-emerald-900">For completed, online-paid moves, MarketMix deducts an 8% platform fee from your quote and requests the remaining 92% as your payout. Payouts are subject to approval and payment-provider settlement. Read the <a href="/terms" target="_blank" rel="noreferrer" className="font-bold underline">Terms of Service</a>.</span></span>
          </label>

          <fieldset className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-600">How many of each item can you carry?</legend>
            <p className="mb-3 text-xs leading-5 text-slate-500">Set your capacity and optional extra fee per item. Extra fees are added to your distance fare only for belongings you price.</p>
            <div className="space-y-2">
              {CARRY_OPTIONS.map(([id, label]) => {
                const capacity = form.cargoCapacity[id] || 0;
                return <div key={id} className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 ${capacity ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                  <input aria-label={`Can carry ${label}`} type="checkbox" checked={capacity > 0} onChange={(event) => setForm((prev) => {
                    const next = { ...prev.cargoCapacity };
                    if (event.target.checked) next[id] = 1;
                    else delete next[id];
                    return { ...prev, cargoCapacity: next };
                  })} className="h-4 w-4 accent-emerald-700" />
                  <span className="flex-1 text-xs font-semibold text-slate-800">{label}</span>
                  {capacity > 0 && <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">Max per trip<input aria-label={`Maximum ${label.toLowerCase()} per trip`} type="number" min="1" max="99" step="1" value={capacity} onChange={(event) => setForm((prev) => ({ ...prev, cargoCapacity: { ...prev.cargoCapacity, [id]: Math.min(99, Math.max(1, Number(event.target.value) || 1)) } }))} className="w-16 rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-slate-900" /></label>}
                  {capacity > 0 && <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">KSh/item<input aria-label={`${label} extra fee per item in KSh`} type="number" min="0" max="100000" step="50" value={form.itemRates[id] ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, itemRates: { ...prev.itemRates, [id]: event.target.value } }))} placeholder="0" className="w-20 rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-slate-900" /></label>}
                </div>;
              })}
            </div>
          </fieldset>

          {/* Transport Page Location Search & Pinning Logic for Working Area */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Preferred Working Area & Map Pin</label>
            <KenyaAreaPicker
              value={{ county: form.workCounty, subCounty: form.workSubCounty, ward: form.workWard, area: form.workArea }}
              onChange={handleAreaChange}
              areaLabel="Estate, neighbourhood or landmark"
              areaPlaceholder="e.g. Westlands, Kilimani, Mombasa Road"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={lookupBusy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
              >
                <Crosshair className="w-4 h-4" />
                <span>{lookupBusy ? 'Finding location…' : 'Find my current location'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPinningLocation(!pinningLocation)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                <MapPin className="w-4 h-4" />
                <span>{pinningLocation ? 'Close Map Pin' : (form.workCoordinates ? 'Adjust Map Pin' : 'Choose Pin on Map')}</span>
              </button>
            </div>
            {form.workCoordinates && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Map pin saved · ({form.workCoordinates.lat.toFixed(4)}, {form.workCoordinates.lng.toFixed(4)})
              </p>
            )}
            {pinningLocation && (
              <div className="mt-3">
                <CoordinateMapPicker point={form.workCoordinates} onPick={handleMapPick} />
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-1">Used as fallback for WhatsApp alerts and nearest driver matching if live GPS scanning fails.</p>
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Professional Vehicle Photo</label>
            
            {/* Live Camera Modal Trigger Button */}
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              className="w-full mb-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Open Pro Camera (Front, Side & Rear Guides)</span>
            </button>

            {/* Cloudflare Dropzone */}
            <div className="border rounded-2xl p-3 bg-slate-50">
              <CloudflareImageUpload maxFiles={1} onUploadComplete={handleUploadComplete} />
            </div>

            {form.photoUrl && (
              <div className="mt-3 flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={form.photoUrl} alt="Vehicle Preview" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-emerald-900 truncate">Photo uploaded</p>
                    <a href={form.photoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-700 underline truncate block">{form.photoUrl}</a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 shrink-0"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
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

      <LiveCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCaptured={handleCameraCaptured}
        vehicleType={form.vehicleId}
      />
    </main>
  );
}
