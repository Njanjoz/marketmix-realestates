import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { storage } from '../../firebase/config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { isCapacitor } from '../../utils/platform';
import { pickImage } from '../../services/mediaService';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';
const YOUTUBE_BACKEND = (import.meta.env.VITE_YOUTUBE_API_URL || 'https://marketmix-youtube-server.onrender.com').replace(/\/+$/, '');

async function uploadAvailabilityVideo(file, bookingId, sellerName) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', `Vacancy evidence - ${bookingId}`);
  formData.append('description', `Live property vacancy evidence submitted by ${sellerName || 'MarketMix seller'} for booking ${bookingId}.`);
  const response = await fetch(`${YOUTUBE_BACKEND}/api/youtube/upload`, { method: 'POST', body: formData });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.jobId) throw new Error(result.error || 'Could not upload vacancy video to YouTube.');
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10 * 60 * 1000) {
    await new Promise((resolve) => window.setTimeout(resolve, 3000));
    const statusResponse = await fetch(`${YOUTUBE_BACKEND}/api/youtube/upload/${encodeURIComponent(result.jobId)}`);
    const status = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) throw new Error(status.error || 'Could not check the YouTube upload.');
    if (status.status === 'complete' && status.youtubeUrl) return status.youtubeUrl;
    if (status.status === 'failed') throw new Error(status.error || 'YouTube could not process the vacancy video.');
  }
  throw new Error('YouTube is still processing the video. Please wait and submit the form again after checking the upload status.');
}

export default function ViewingAvailabilityPage() {
  const { bookingId = '' } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState('');
  const [availableUnits, setAvailableUnits] = useState('1');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);

  const captureAvailabilityPhoto = async () => {
    if (photos.length >= 5) return toast.error('You can submit up to five vacancy photos.');
    try {
      const result = await pickImage({ source: 'camera', quality: 90 });
      if (!result.file) throw new Error('The camera did not return a photo. Please try again.');
      setPhotos((current) => [...current, result.file].slice(0, 5));
      toast.success('Live vacancy photo captured.');
    } catch (error) {
      console.error('Could not capture vacancy photo:', error);
      toast.error(error.message || 'Could not open the camera. Check camera permission and try again.');
    }
  };

  useEffect(() => {
    let active = true;
    if (!currentUser?.uid || !bookingId) return undefined;
    getDoc(doc(db, 'sightseeingBookings', bookingId)).then((snapshot) => {
      if (active) setBooking(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    }).catch((error) => {
      console.error('Could not load viewing request:', error);
      if (active) toast.error('Could not load this viewing request.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookingId, currentUser?.uid]);

  const submit = async (event) => {
    event.preventDefault();
    if (!currentUser) return navigate('/login', { state: { from: `/agent/viewing-availability/${bookingId}` } });
    if (available === '') return toast.error('Choose whether a unit is available.');
    const units = available === 'yes' ? Number(availableUnits) : 0;
    if (available === 'yes' && (!Number.isInteger(units) || units < 1)) return toast.error('Enter a valid number of available units.');
    if (available === 'yes' && photos.length === 0) return toast.error('Add live photos showing the currently empty available unit.');
    if (available === 'yes' && !video) return toast.error('Capture and upload a video of the empty available unit.');
    setSaving(true);
    try {
      const token = await currentUser.getIdToken();
      const evidencePhotoUrls = await Promise.all(photos.map(async (file, index) => {
        const imageRef = ref(storage, `site-seeing-availability-evidence/${bookingId}/${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
        await uploadBytes(imageRef, file);
        return getDownloadURL(imageRef);
      }));
      const availabilityVideoUrl = available === 'yes' ? await uploadAvailabilityVideo(video, bookingId, currentUser.displayName) : '';
      const response = await fetch(`${BACKEND}/api/bookings/site-seeing/${encodeURIComponent(bookingId)}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ available: available === 'yes', availableUnits: units, notes: notes.trim(), evidencePhotoUrls, availabilityVideoUrl }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not submit availability.');
      toast.success('Availability sent to MarketMix for review.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Could not submit availability.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-xl p-6 text-sm text-slate-600">Loading viewing request…</main>;
  if (!booking) return <main className="mx-auto max-w-xl p-6"><h1 className="text-xl font-bold">Viewing request not found</h1><p className="mt-2 text-sm text-slate-600">The request may have been removed or the link may be incomplete.</p></main>;

  return <main className="mx-auto max-w-xl p-4 py-8 sm:p-8">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">MarketMix Real Estates</p>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-950">Viewing availability check</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Check with the property owner, report the current unit availability, and include any changes or details the customer should know.</p>
      <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
        <p><strong>Property:</strong> {booking.propertyTitle || 'Property'}</p>
        <p><strong>Location:</strong> {booking.propertyLocation || 'Not listed'}</p>
        <p><strong>Customer:</strong> {booking.customerName || booking.buyerName || 'Customer'}</p>
        <p><strong>Request:</strong> {booking.packageName || booking.packageTitle || 'Site seeing'} - {booking.id}</p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset>
          <legend className="text-sm font-bold text-slate-800">Is a unit available?</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {[['yes', 'Available'], ['no', 'Unavailable']].map(([value, label]) => <button key={value} type="button" onClick={() => setAvailable(value)} className={`rounded-xl border px-4 py-3 text-sm font-bold ${available === value ? value === 'yes' ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-rose-700 bg-rose-50 text-rose-900' : 'border-slate-200 text-slate-700'}`}>{label}</button>)}
          </div>
        </fieldset>
        {available === 'yes' && <><label className="block text-sm font-bold text-slate-800">Available units<input type="number" min="1" step="1" value={availableUnits} onChange={(event) => setAvailableUnits(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" required /></label><div className="block text-sm font-bold text-slate-800">Live photos of the empty available unit{isCapacitor() ? <button type="button" onClick={captureAvailabilityPhoto} disabled={saving || photos.length >= 5} className="mt-2 block w-full rounded-xl border border-emerald-700 px-4 py-3 text-left font-semibold text-emerald-900 disabled:opacity-50">Open camera and capture photo ({photos.length}/5)</button> : <input type="file" accept="image/*" capture="environment" multiple required onChange={(event) => setPhotos(Array.from(event.target.files || []).slice(0, 5))} className="mt-2 block w-full text-sm" />}{photos.length > 0 && <p className="mt-2 text-xs font-medium text-slate-600">{photos.length} live photo{photos.length === 1 ? '' : 's'} ready to upload.</p>}</div><p className="-mt-3 text-xs text-slate-500">Capture up to five current photos with your phone camera. Admin must approve these and the video before the KSh 25 vacancy-confirmation credit is sent.</p><label className="block text-sm font-bold text-slate-800">Live video evidence of the empty unit<input type="file" accept="video/mp4,video/quicktime,video/webm,video/x-msvideo" capture="environment" required onChange={(event) => setVideo(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm" /></label><p className="-mt-3 text-xs text-slate-500">The video will upload to the MarketMix YouTube channel. Keep the upload page open until YouTube confirms it is ready for admin review.</p></>}
        <label className="block text-sm font-bold text-slate-800">Changes or notes for the admin<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={1000} placeholder="Rent change, unit type, move-in date, owner instructions, or other updates" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
        <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">For an available unit, submit live photos and a YouTube video of the empty room. Admin reviews the evidence; after approval the customer gets the evidence links and a visit-booking link, and your KSh 25 vacancy-confirmation credit is sent by M-Pesa. An unavailable report earns no credit.</p>
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Submitting...' : 'Submit availability to MarketMix'}</button>
      </form>
    </section>
  </main>;
}
