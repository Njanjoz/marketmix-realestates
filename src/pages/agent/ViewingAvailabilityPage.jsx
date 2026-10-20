import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { uploadFileToR2, resizeImage } from '../../utils/cloudflareUpload';
import { useAuth } from '../../context/AuthContext';
import { isCapacitor } from '../../utils/platform';
import { pickImage } from '../../services/mediaService';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://backened-lt67.onrender.com';
const YOUTUBE_BACKEND = (import.meta.env.VITE_YOUTUBE_API_URL || 'https://marketmix-youtube-server.onrender.com').replace(/\/+$/, '');

async function uploadAvailabilityVideo(file, bookingId, sellerName, onProgress, onProcessing) {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', `Vacancy evidence - ${bookingId}`);
  formData.append('description', `Live property vacancy evidence submitted by ${sellerName || 'MarketMix seller'} for booking ${bookingId}.`);
  const result = await new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${YOUTUBE_BACKEND}/api/youtube/upload`);
    request.timeout = 10 * 60 * 1000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      let body = {};
      try { body = JSON.parse(request.responseText || '{}'); } catch { /* Show the upload service error below. */ }
      if (request.status < 200 || request.status >= 300) return reject(new Error(body.error || 'Could not upload vacancy video to YouTube.'));
      resolve(body);
    };
    request.onerror = () => reject(new Error('Video upload failed. Check your connection and try again.'));
    request.ontimeout = () => reject(new Error('Video upload timed out. Please try again.'));
    request.send(formData);
  });
  if (!result.success || !result.jobId) throw new Error(result.error || 'Could not upload vacancy video to YouTube.');
  onProcessing?.();
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
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadStage, setUploadStage] = useState('');
  const photoPickerRef = useRef(null);
  const photoCameraRef = useRef(null);
  const videoPickerRef = useRef(null);
  const videoCameraRef = useRef(null);

  const captureAvailabilityPhoto = async () => {
    if (photos.length >= 5) return toast.error('You can submit up to five vacancy photos.');
    try {
      if (!isCapacitor()) {
        photoCameraRef.current?.click();
        return;
      }
      const result = await pickImage({ source: 'camera', quality: 90 });
      if (!result.file) throw new Error('The camera did not return a photo. Please try again.');
      setPhotos((current) => [...current, result.file].slice(0, 5));
      toast.success('Live vacancy photo captured.');
    } catch (error) {
      console.error('Could not capture vacancy photo:', error);
      toast.error(error.message || 'Could not open the camera. Check camera permission and try again.');
    }
  };

  const addPhotos = (files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    const remaining = Math.max(0, 5 - photos.length);
    if (selected.length > remaining) toast(`You can submit up to five photos. Added ${remaining} photo${remaining === 1 ? '' : 's'}.`);
    setPhotos((current) => [...current, ...selected.slice(0, Math.max(0, 5 - current.length))]);
  };

  const addCapturedPhoto = (file) => {
    if (!file) return;
    setPhotos((current) => [...current, file].slice(0, 5));
    toast.success('Live vacancy photo added.');
  };

  const uploadPhoto = async (file, onProgress) => {
    const optimizedFile = await resizeImage(file, 1600, 1200);
    const uploaded = await uploadFileToR2(optimizedFile, onProgress);
    return uploaded.url;
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
    setUploadProgress(0);
    setUploadStage('Preparing your evidence…');
    try {
      const token = await currentUser.getIdToken();
      const photoBytes = photos.map((file) => file.size || 0);
      const photoProgress = photos.map(() => 0);
      if (photos.length) setUploadStage('Uploading vacancy photos…');
      const evidencePhotoUrls = await Promise.all(photos.map((file, index) => uploadPhoto(file, (percent) => {
        photoProgress[index] = percent;
        const total = photoBytes.reduce((sum, size) => sum + size, 0);
        const uploaded = photoProgress.reduce((sum, progress, photoIndex) => sum + (photoBytes[photoIndex] * progress / 100), 0);
        setUploadProgress(total ? Math.min(45, Math.round((uploaded / total) * 45)) : 45);
      })));
      let availabilityVideoUrl = '';
      if (available === 'yes') {
        setUploadStage('Uploading vacancy video…');
        availabilityVideoUrl = await uploadAvailabilityVideo(video, bookingId, currentUser.displayName,
          (percent) => setUploadProgress(45 + Math.round(percent * 0.45)),
          () => { setUploadStage('Video uploaded. YouTube is preparing it for review…'); setUploadProgress(92); }
        );
      }
      setUploadStage('Saving your availability report…');
      setUploadProgress(97);
      const response = await fetch(`${BACKEND}/api/bookings/site-seeing/${encodeURIComponent(bookingId)}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ available: available === 'yes', availableUnits: units, notes: notes.trim(), evidencePhotoUrls, availabilityVideoUrl }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not submit availability.');
      setUploadProgress(100);
      setUploadStage('Submitted successfully.');
      toast.success('Availability sent to MarketMix for review.');
      navigate('/dashboard');
    } catch (error) {
      setUploadStage('Upload failed. Your report was not submitted. Please try again.');
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
        {available === 'yes' && <>
          <label className="block text-sm font-bold text-slate-800">Available units<input type="number" min="1" step="1" value={availableUnits} onChange={(event) => setAvailableUnits(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" required /></label>
          <section className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800">Live photos of the empty available unit</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">Add up to five current photos. Choose photos already on your device, or take new photos with your camera.</p>
            <input ref={photoPickerRef} type="file" accept="image/*" multiple onChange={(event) => { addPhotos(event.target.files); event.target.value = ''; }} className="hidden" />
            <input ref={photoCameraRef} type="file" accept="image/*" capture="environment" onChange={(event) => addCapturedPhoto(event.target.files?.[0])} className="hidden" />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => photoPickerRef.current?.click()} disabled={saving || photos.length >= 5} className="rounded-xl border border-emerald-800 px-4 py-3 text-sm font-bold text-emerald-900 disabled:opacity-50">Choose photo files</button>
              <button type="button" onClick={captureAvailabilityPhoto} disabled={saving || photos.length >= 5} className="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Take a photo now</button>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">{photos.length}/5 photos selected{photos.length ? ` · ${photos.map((photo) => photo.name || 'Camera photo').join(', ')}` : ''}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800">Video of the empty available unit</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">Choose a video you already recorded, or record a new video now. It will upload to the MarketMix YouTube channel for admin review.</p>
            <input ref={videoPickerRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-msvideo" onChange={(event) => setVideo(event.target.files?.[0] || null)} className="hidden" />
            <input ref={videoCameraRef} type="file" accept="video/*" capture="environment" onChange={(event) => setVideo(event.target.files?.[0] || null)} className="hidden" />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => videoPickerRef.current?.click()} disabled={saving} className="rounded-xl border border-emerald-800 px-4 py-3 text-sm font-bold text-emerald-900 disabled:opacity-50">Choose an existing video</button>
              <button type="button" onClick={() => videoCameraRef.current?.click()} disabled={saving} className="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">Record a video now</button>
            </div>
            <p className="mt-2 break-all text-xs font-medium text-slate-600">{video ? `Selected: ${video.name}` : 'No video selected yet.'}</p>
          </section>
          <p className="-mt-2 text-xs text-slate-500">Admin must approve the live photos and video before the KSh 25 vacancy-confirmation credit is sent.</p>
        </>}
        <label className="block text-sm font-bold text-slate-800">Changes or notes for the admin<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} maxLength={1000} placeholder="Rent change, unit type, move-in date, owner instructions, or other updates" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal" /></label>
        <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">For an available unit, submit live photos and a YouTube video of the empty room. Admin reviews the evidence; after approval the customer gets the evidence links and a visit-booking link, and your KSh 25 vacancy-confirmation credit is sent by M-Pesa. An unavailable report earns no credit.</p>
        {uploadProgress !== null && <div className={`rounded-2xl border p-4 ${uploadStage.startsWith('Upload failed') ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`} aria-live="polite">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-800"><span>{uploadStage}</span><span>{uploadProgress}%</span></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="Evidence upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
            <div className={`h-full rounded-full transition-all duration-500 ${uploadStage.startsWith('Upload failed') ? 'bg-rose-600' : 'bg-emerald-700'} ${uploadStage.startsWith('Video uploaded') ? 'animate-pulse' : ''}`} style={{ width: `${uploadProgress}%` }} />
          </div>
          {saving && <p className="mt-2 text-[11px] text-slate-600">Please keep this page open until the upload and report submission finish.</p>}
        </div>}
        <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-800 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Uploading evidence and submitting…' : 'Submit availability to MarketMix'}</button>
      </form>
    </section>
  </main>;
}
