import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ImagePlus, PackagePlus, Pencil, Power, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { resizeImage, uploadFileToR2 } from '../../utils/cloudflareUpload';
import MovingIllustration from '../../components/moving/MovingIllustration';
import '../../components/moving/LiquidGlass.css';

const VEHICLE_OPTIONS = [
  ['motorbike', 'Motorbike'], ['tuk', 'Tuk Tuk'], ['pickup', 'Pickup'], ['lorry', 'Lorry'],
];
const ITEM_OPTIONS = [
  ['bed', 'Bed'], ['mattress', 'Mattress'], ['sofa', 'Sofa'], ['table', 'Table'], ['chair', 'Chairs'],
  ['wardrobe', 'Wardrobe'], ['fridge', 'Fridge'], ['tv', 'TV & electronics'], ['washer', 'Washing machine'], ['box', 'Boxes'], ['other', 'Other items'],
];
const BLANK_FORM = { title: '', summary: '', suitableFor: '', vehicleId: 'pickup', priceLabel: '', includes: '', itemIds: [], active: true, displayOrder: 0 };

const MovingPackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(BLANK_FORM);
  const [editingId, setEditingId] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(collection(db, 'movingPackages'), (snapshot) => {
    const next = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    next.sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    setPackages(next);
  }, (error) => {
    console.error('Could not load moving packages:', error);
    toast.error('Could not load moving packages.');
  }), []);

  const parsedIncludes = useMemo(() => form.includes.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 12), [form.includes]);

  const resetForm = () => {
    setForm(BLANK_FORM);
    setEditingId('');
    setPosterFile(null);
    setPosterPreview('');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '', summary: item.summary || '', suitableFor: item.suitableFor || '',
      vehicleId: item.vehicleId || 'pickup', priceLabel: item.priceLabel || '',
      includes: (item.includes || []).join('\n'), itemIds: item.itemIds || [], active: item.active !== false,
      displayOrder: Number(item.displayOrder || 0),
    });
    setPosterPreview(item.coverImage || '');
    setPosterFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleItem = (id) => setForm((current) => ({ ...current, itemIds: current.itemIds.includes(id) ? current.itemIds.filter((item) => item !== id) : [...current.itemIds, id] }));

  const savePackage = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.summary.trim() || !form.suitableFor.trim()) {
      toast.error('Add a package name, short description and who it suits.');
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
        title: form.title.trim().slice(0, 80), summary: form.summary.trim().slice(0, 240),
        suitableFor: form.suitableFor.trim().slice(0, 180), vehicleId: form.vehicleId,
        vehicleLabel: VEHICLE_OPTIONS.find(([id]) => id === form.vehicleId)?.[1] || 'Pickup',
        priceLabel: form.priceLabel.trim().slice(0, 60), includes: parsedIncludes,
        itemIds: form.itemIds.slice(0, ITEM_OPTIONS.length), coverImage,
        active: Boolean(form.active), displayOrder: Math.max(0, Number(form.displayOrder) || 0),
        updatedAt: serverTimestamp(),
      };
      if (editingId) await updateDoc(doc(db, 'movingPackages', editingId), payload);
      else await addDoc(collection(db, 'movingPackages'), { ...payload, createdAt: serverTimestamp() });
      toast.success(editingId ? 'Package poster updated.' : 'Package poster published.');
      resetForm();
    } catch (error) {
      console.error('Could not save moving package:', error);
      toast.error(error.message || 'Could not save this package.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateDoc(doc(db, 'movingPackages', item.id), { active: item.active === false, updatedAt: serverTimestamp() });
      toast.success(item.active === false ? 'Package published.' : 'Package hidden from customers.');
    } catch (error) {
      console.error('Could not update package visibility:', error);
      toast.error('Could not update package visibility.');
    }
  };

  const removePackage = async (item) => {
    if (!window.confirm(`Delete “${item.title}”? Existing transport requests keep their saved package name.`)) return;
    try {
      await deleteDoc(doc(db, 'movingPackages', item.id));
      if (editingId === item.id) resetForm();
      toast.success('Package removed.');
    } catch (error) {
      console.error('Could not delete moving package:', error);
      toast.error('Could not remove this package.');
    }
  };

  return <main className="mmx-liquid-canvas min-h-screen px-4 py-8 sm:px-6">
    <section className="mx-auto max-w-7xl space-y-8">
      <header className="mmx-glass-surface rounded-[2rem] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-800">MarketMix admin</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Moving package posters</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Create package cards that customers can select before building a move request. Prices are displayed only when you enter an approved package price or quote label.</p></header>

      <form onSubmit={savePackage} className="mmx-glass-surface grid gap-6 rounded-[2rem] border p-5 shadow-[0_20px_60px_rgba(20,50,40,.08)] lg:grid-cols-[1fr_350px] lg:p-7">
        <div>
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-emerald-800">{editingId ? 'Edit poster' : 'New poster'}</p><h2 className="mt-1 text-xl font-bold text-slate-950">Package details</h2></div>{editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Cancel edit"><X className="h-4 w-4"/></button>}</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Package title<input required maxLength={80} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Small home move" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-700"/></label>
            <label className="text-sm font-semibold text-slate-700">Suggested vehicle<select value={form.vehicleId} onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-700">{VEHICLE_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Short description<textarea required rows="2" maxLength={240} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="A tidy move for a few essential items." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-700"/></label>
            <label className="text-sm font-semibold text-slate-700">Best suited for<input required maxLength={180} value={form.suitableFor} onChange={(event) => setForm((current) => ({ ...current, suitableFor: event.target.value }))} placeholder="Bedsitter or studio move" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-700"/></label>
            <label className="text-sm font-semibold text-slate-700">Price display (optional)<input maxLength={60} value={form.priceLabel} onChange={(event) => setForm((current) => ({ ...current, priceLabel: event.target.value }))} placeholder="Leave empty for provider quote" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-700"/><span className="mt-1 block text-[11px] font-normal text-slate-500">Only enter a verified price or an approved “From KSh…” label.</span></label>
            <label className="text-sm font-semibold text-slate-700">Poster order<input type="number" min="0" max="10000" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-700"/><span className="mt-1 block text-[11px] font-normal text-slate-500">Lower numbers appear first.</span></label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">What is included?<textarea rows="3" value={form.includes} onChange={(event) => setForm((current) => ({ ...current, includes: event.target.value }))} placeholder={'Transport for selected items\nDriver coordination\nLoading support, if available'} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-700"/><span className="mt-1 block text-[11px] font-normal text-slate-500">One poster bullet per line, up to 12.</span></label>
          </div>
          <fieldset className="mt-5"><legend className="text-sm font-bold text-slate-800">Items this package can preselect</legend><div className="mt-2 flex flex-wrap gap-2">{ITEM_OPTIONS.map(([id, label]) => <button type="button" key={id} aria-pressed={form.itemIds.includes(id)} onClick={() => toggleItem(id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${form.itemIds.includes(id) ? 'border-emerald-800 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600'}`}>{label}</button>)}</div></fieldset>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-5"><label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="accent-emerald-800"/>Show this poster to customers</label><button disabled={saving} type="submit" className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish package'}</button></div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Poster image</p><p className="mt-1 text-xs leading-5 text-slate-500">Upload a moving, vehicle or household photo. If skipped, the MarketMix transport illustration appears.</p>
          <label className="mt-3 flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center hover:border-emerald-500">
            {posterPreview ? <img src={posterPreview} alt="Package poster preview" className="h-48 w-full object-cover"/> : <><ImagePlus className="h-9 w-9 text-slate-400"/><span className="mt-2 text-sm font-bold text-slate-700">Add poster photo</span><span className="mt-1 text-xs text-slate-500">PNG, JPG or WebP</span></>}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setPosterFile(file); setPosterPreview(URL.createObjectURL(file)); }}/>
          </label>
          {posterPreview && <button type="button" onClick={() => { setPosterFile(null); setPosterPreview(''); }} className="mt-2 text-xs font-semibold text-rose-700">Remove image</button>}
          <div className="mmx-glass-surface-dark mt-5 overflow-hidden rounded-3xl p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-200">Poster preview</p><div className="relative mt-3 overflow-hidden rounded-2xl"><MovingIllustration kind={`vehicle:${form.vehicleId}`} className="w-full"/>{posterPreview && <img src={posterPreview} alt="" className="absolute inset-0 h-full w-full object-cover"/>}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-4 pt-12"><p className="text-lg font-extrabold">{form.title || 'Your package title'}</p><p className="mt-1 text-xs text-white/80">{form.priceLabel || 'Provider quote after request'}</p></div></div></div>
        </div>
      </form>

      <section><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-800">Published catalog</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Customer posters <span className="text-sm font-semibold text-slate-500">{packages.length}</span></h2></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{packages.map((item) => <article key={item.id} className={`mmx-glass-card overflow-hidden rounded-3xl border shadow-sm ${item.active === false ? 'opacity-65' : ''}`}><div className="relative h-48 bg-slate-100">{item.coverImage ? <img src={item.coverImage} alt={item.title} className="h-full w-full object-cover"/> : <MovingIllustration kind={`vehicle:${item.vehicleId || 'pickup'}`} className="h-full w-full"/>}<span className={`mmx-glass-pill absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${item.active === false ? 'text-slate-800' : 'text-emerald-950'}`}>{item.active === false ? 'Hidden' : 'Live on Transport'}</span></div><div className="bg-white/20 p-4 backdrop-blur-xl"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-extrabold text-slate-950">{item.title}</h3><span className="shrink-0 text-xs font-bold text-emerald-900">{item.priceLabel || 'Quote'}</span></div><p className="mt-1 text-sm leading-5 text-slate-700">{item.summary}</p><p className="mt-3 text-xs font-semibold text-slate-900">{item.vehicleLabel} · {item.suitableFor}</p>{item.includes?.length > 0 && <ul className="mt-3 space-y-1 text-xs text-slate-600">{item.includes.slice(0, 3).map((line) => <li key={line}>• {line}</li>)}</ul>}<div className="mt-4 flex gap-2 border-t border-white/60 pt-3"><button type="button" onClick={() => startEdit(item)} className="mmx-glass-action inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold text-slate-700"><Pencil className="h-3.5 w-3.5"/>Edit</button><button type="button" onClick={() => toggleActive(item)} className="mmx-glass-action inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold text-slate-700"><Power className="h-3.5 w-3.5"/>{item.active === false ? 'Publish' : 'Hide'}</button><button type="button" onClick={() => removePackage(item)} aria-label={`Delete ${item.title}`} className="mmx-glass-action grid h-10 w-10 place-items-center rounded-xl border text-rose-700"><Trash2 className="h-4 w-4"/></button></div></div></article>)}</div>{packages.length === 0 && <div className="mmx-glass-surface rounded-2xl border border-dashed p-10 text-center"><PackagePlus className="mx-auto h-8 w-8 text-slate-400"/><p className="mt-2 font-bold text-slate-800">No moving package posters yet</p><p className="mt-1 text-sm text-slate-500">Publish one above to show it on the transport page.</p></div>}</section>
    </section>
  </main>;
};

export default MovingPackagesPage;
