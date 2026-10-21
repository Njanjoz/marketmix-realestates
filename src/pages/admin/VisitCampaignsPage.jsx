import React, { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { CalendarDays, ImagePlus, Save, Trash2, UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { resizeImage, uploadFileToR2 } from '../../utils/cloudflareUpload';

const TOUR_TYPES = [['property_tour', 'Property tour'], ['investment_safari', 'Investment tour'], ['student_housing', 'Student housing tour'], ['neighborhood_visit', 'Neighborhood visit']];
const EMPTY = { title: '', tourType: 'property_tour', location: '', summary: '', duration: '', includes: '', startDate: '', endDate: '', price: '', campaignTarget: '', offlineRegistrationCount: '', registrationCountOverride: '', coverImage: '', active: true };

export default function VisitCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState('');
  const [saving, setSaving] = useState(false);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [posterDragOver, setPosterDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const offCampaigns = onSnapshot(collection(db, 'visitCampaigns'), (snapshot) => {
      setCampaigns(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => String(a.startDate || '').localeCompare(String(b.startDate || ''))));
    }, (error) => { console.error('Could not load visit campaigns:', error); toast.error('Could not load campaigns.'); });
    const offStats = onSnapshot(collection(db, 'visitCampaignStats'), (snapshot) => {
      const next = {};
      snapshot.docs.forEach((item) => { next[item.id] = Number(item.data()?.registeredCount) || 0; });
      setStats(next);
    });
    return () => { offCampaigns(); offStats(); };
  }, []);

  const beginEdit = (campaign) => {
    setEditingId(campaign.id);
    setForm({ ...EMPTY, ...campaign,
      price: String(campaign.price ?? ''),
      includes: Array.isArray(campaign.includes) ? campaign.includes.join('\n') : '',
      campaignTarget: campaign.campaignTarget == null ? '' : String(campaign.campaignTarget),
      offlineRegistrationCount: String(campaign.offlineRegistrationCount || 0),
      registrationCountOverride: campaign.registrationCountOverride == null ? '' : String(campaign.registrationCountOverride),
    });
    setPosterFile(null);
    setPosterPreview((current) => {
      if (current.startsWith('blob:')) URL.revokeObjectURL(current);
      return campaign.coverImage || '';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearPosterPreview = () => {
    setPosterPreview((current) => {
      if (current.startsWith('blob:')) URL.revokeObjectURL(current);
      return '';
    });
  };

  const choosePoster = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Choose a JPG, PNG or WebP poster image.');
    if (file.size > 10 * 1024 * 1024) return toast.error('Poster images must be 10 MB or smaller.');
    setPosterPreview((current) => {
      if (current.startsWith('blob:')) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setPosterFile(file);
  };

  const clearForm = () => {
    setForm(EMPTY);
    setEditingId('');
    setPosterFile(null);
    clearPosterPreview();
    setUploadProgress(0);
  };

  const saveCampaign = async (event) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.title.trim() || !form.location.trim() || !form.summary.trim() || !form.startDate || !form.endDate || !Number.isInteger(price) || price < 1) {
      return toast.error('Enter a title, location, description, date range, and whole-shilling price.');
    }
    if (form.endDate < form.startDate) return toast.error('Campaign end date must be on or after its start date.');
    setSaving(true);
    try {
      let coverImage = posterFile ? '' : form.coverImage.trim();
      if (posterFile) {
        const resized = await resizeImage(posterFile, 1600, 1000);
        const uploaded = await uploadFileToR2(resized, setUploadProgress);
        coverImage = uploaded.url;
      }
      const payload = {
        title: form.title.trim().slice(0, 120), location: form.location.trim().slice(0, 160),
        tourType: form.tourType,
        tourTypeLabel: TOUR_TYPES.find(([id]) => id === form.tourType)?.[1] || 'Property tour',
        summary: form.summary.trim().slice(0, 1200), duration: form.duration.trim().slice(0, 100),
        includes: form.includes.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 12),
        startDate: form.startDate, endDate: form.endDate, price,
        campaignTarget: form.campaignTarget === '' ? null : Math.max(1, Math.floor(Number(form.campaignTarget) || 1)),
        offlineRegistrationCount: Math.max(0, Math.floor(Number(form.offlineRegistrationCount) || 0)),
        registrationCountOverride: form.registrationCountOverride === '' ? null : Math.max(0, Math.floor(Number(form.registrationCountOverride) || 0)),
        coverImage, active: Boolean(form.active), updatedAt: serverTimestamp(),
      };
      if (editingId) await setDoc(doc(db, 'visitCampaigns', editingId), payload, { merge: true });
      else await setDoc(doc(collection(db, 'visitCampaigns')), { ...payload, createdAt: serverTimestamp() });
      toast.success(editingId ? 'Campaign updated.' : 'Campaign created.');
      clearForm();
    } catch (error) {
      console.error('Could not save visit campaign:', error);
      toast.error('Could not save campaign. Check admin access and try again.');
    } finally { setSaving(false); }
  };

  const removeCampaign = async (campaign) => {
    if (!window.confirm(`Delete “${campaign.title}” from visit campaigns? Existing paid registrations and their records will be retained.`)) return;
    try {
      await deleteDoc(doc(db, 'visitCampaigns', campaign.id));
      if (editingId === campaign.id) clearForm();
      toast.success('Campaign removed.');
    } catch (error) { console.error(error); toast.error('Could not remove campaign.'); }
  };

  const upcoming = useMemo(() => campaigns.filter((item) => item.active !== false && item.endDate >= new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10)), [campaigns]);

  return <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Admin · group visits</p><h1 className="mt-1 text-3xl font-extrabold text-slate-950">Visit campaigns</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">Create homepage tour campaigns with their destination, dates, price, package details and poster in one place.</p></header>
    <form onSubmit={saveCampaign} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <div className="flex items-center justify-between sm:col-span-2"><h2 className="text-lg font-bold text-slate-900">{editingId ? 'Edit campaign' : 'Create a campaign'}</h2>{editingId && <button type="button" onClick={clearForm} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><X size={15} /> Cancel edit</button>}</div>
      <label className="text-sm font-semibold text-slate-700">Campaign title<input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Tour package type<select value={form.tourType} onChange={(e) => setForm({ ...form, tourType: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5">{TOUR_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-700">Destination / meeting area<input required maxLength={160} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Price per attendee (KSh)<input required min="1" step="1" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Duration<input maxLength={100} placeholder="e.g. Half day" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Starts<input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Ends / registration closes<input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Planned attendee target<input min="1" step="1" type="number" value={form.campaignTarget} onChange={(e) => setForm({ ...form, campaignTarget: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700">Offline registrations<input min="0" step="1" type="number" value={form.offlineRegistrationCount} onChange={(e) => setForm({ ...form, offlineRegistrationCount: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <div className="sm:col-span-2">
        <span className="text-sm font-semibold text-slate-700">Homepage campaign poster</span>
        <label
          onDragOver={(event) => { event.preventDefault(); setPosterDragOver(true); }}
          onDragLeave={(event) => { event.preventDefault(); setPosterDragOver(false); }}
          onDrop={(event) => { event.preventDefault(); setPosterDragOver(false); choosePoster(event.dataTransfer.files?.[0]); }}
          className={`mt-1 flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition ${posterDragOver ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-emerald-500'}`}
        >
          {posterPreview ? <img src={posterPreview} alt="Campaign poster preview" className="h-52 w-full object-cover" /> : <><ImagePlus className="h-8 w-8 text-slate-400" /><span className="mt-2 text-sm font-bold text-slate-700">Drop poster here or click to browse</span><span className="mt-1 text-xs text-slate-500">JPG, PNG or WebP · up to 10 MB · uploaded to Cloudflare</span></>}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => choosePoster(event.target.files?.[0])} />
        </label>
        {posterFile && <p className="mt-2 text-xs text-slate-600">Selected: {posterFile.name}</p>}
        {posterPreview && <button type="button" onClick={() => { setPosterFile(null); clearPosterPreview(); setForm((current) => ({ ...current, coverImage: '' })); }} className="mt-2 text-xs font-bold text-rose-700">Remove poster</button>}
        {saving && uploadProgress > 0 && posterFile && <p className="mt-2 text-xs font-semibold text-emerald-800"><UploadCloud className="mr-1 inline h-4 w-4" />Uploading poster: {uploadProgress}%</p>}
      </div>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Details<textarea required rows="4" maxLength={1200} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Tour package includes <span className="font-normal text-slate-500">(one item per line)</span><textarea rows="3" maxLength={1200} value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} placeholder="Guided property visits\nTransport between locations\nRefreshments" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" /></label>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-emerald-700" />Visible and open for registration</label>
      <div className="flex justify-end gap-2 sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save size={16} />{saving ? posterFile && uploadProgress > 0 ? `Uploading ${uploadProgress}%…` : 'Saving…' : editingId ? 'Save changes' : 'Create campaign'}</button></div>
    </form>
    <section className="grid gap-4 md:grid-cols-2">
      {campaigns.map((campaign) => {
        const count = campaign.registrationCountOverride != null ? Number(campaign.registrationCountOverride) : (Number(stats[campaign.id]) || 0) + (Number(campaign.offlineRegistrationCount) || 0);
        return <article key={campaign.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {campaign.coverImage && <img src={campaign.coverImage} alt="" className="h-48 w-full object-cover" />}
          <div className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">{campaign.tourTypeLabel || 'Property tour'}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{campaign.title}</h2><p className="mt-1 text-sm text-slate-600">{campaign.location} · KSh {Number(campaign.price).toLocaleString('en-KE')} each</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${campaign.active === false ? 'bg-slate-100 text-slate-600' : upcoming.includes(campaign) ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>{campaign.active === false ? 'Hidden' : upcoming.includes(campaign) ? 'Open' : 'Closed'}</span></div>
            <p className="mt-3 line-clamp-3 text-sm text-slate-600">{campaign.summary}</p><p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-900"><CalendarDays size={16} />{campaign.startDate} – {campaign.endDate}</p><p className="mt-1 text-sm text-slate-700">{count} registered{campaign.campaignTarget ? ` of ${campaign.campaignTarget} planned` : ''} · {Number(stats[campaign.id]) || 0} paid online</p>
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => beginEdit(campaign)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">Edit</button><button type="button" onClick={() => removeCampaign(campaign)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-800"><Trash2 size={15} />Delete</button></div>
          </div>
        </article>;
      })}
      {campaigns.length === 0 && <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-600">No group visit campaigns yet.</p>}
    </section>
  </main>;
}
