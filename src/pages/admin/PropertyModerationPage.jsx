import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Edit3, Loader, MapPin, RefreshCw, Search, X } from 'lucide-react';
import { collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { resolvePropertyImage } from '../../utils/propertyMapping';

const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'all'];

const PropertyModerationPage = () => {
  const [properties, setProperties] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'properties'));
      setProperties(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (error) {
      console.error('Could not load property ads:', error);
      toast.error('Could not load property ads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const visibleProperties = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((property) => {
      const status = property.verificationStatus || property.approvalStatus || 'pending';
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesSearch = !term || `${property.title || ''} ${property.location || ''} ${property.userName || ''}`.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [properties, search, statusFilter]);

  const openEditor = (property) => {
    setEditing(property);
    setDraft({
      title: property.title || '',
      location: property.location || property.approximateLocation || '',
      price: property.price ?? property.rentAmount ?? '',
      propertyType: property.propertyType || property.unitType || 'Property',
      bedrooms: property.bedrooms ?? '',
      bathrooms: property.bathrooms ?? '',
      area: property.area ?? '',
      description: property.description || property.previewDescription || '',
      coverImage: resolvePropertyImage(property),
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editing || !draft) return;
    setSaving(true);
    try {
      const price = Number(draft.price);
      if (!draft.title.trim() || !draft.location.trim() || !Number.isFinite(price) || price < 0) {
        throw new Error('Enter a title, location, and valid non-negative price.');
      }
      if (draft.coverImage && !/^https?:\/\//i.test(draft.coverImage.trim())) {
        throw new Error('Cover image must be a public http(s) URL.');
      }

      await updateDoc(doc(db, 'properties', editing.id), {
        title: draft.title.trim(),
        location: draft.location.trim(),
        approximateLocation: draft.location.trim(),
        price,
        propertyType: draft.propertyType.trim() || 'Property',
        bedrooms: draft.bedrooms === '' ? null : Number(draft.bedrooms),
        bathrooms: draft.bathrooms === '' ? null : Number(draft.bathrooms),
        area: draft.area === '' ? null : Number(draft.area),
        description: draft.description.trim(),
        previewDescription: draft.description.trim(),
        coverImage: draft.coverImage.trim(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Property ad updated.');
      setEditing(null);
      setDraft(null);
      await loadProperties();
    } catch (error) {
      console.error('Could not update property ad:', error);
      toast.error(error.message || 'Could not update property ad.');
    } finally {
      setSaving(false);
    }
  };

  const setListingStatus = async (property, nextStatus) => {
    const reason = nextStatus === 'rejected' ? window.prompt('Reason for rejecting this ad (optional):') : null;
    if (nextStatus === 'rejected' && reason === null) return;

    setSaving(true);
    try {
      const approved = nextStatus === 'approved';
      await updateDoc(doc(db, 'properties', property.id), {
        verificationStatus: nextStatus,
        approvalStatus: nextStatus,
        featured: approved ? Boolean(property.featured) : false,
        homepagePlacements: approved ? (property.homepagePlacements || []) : [],
        ...(approved
          ? { approvedAt: serverTimestamp(), availabilityStatus: 'available' }
          : { rejectionReason: reason.trim(), rejectedAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      });
      toast.success(approved ? 'Property ad approved.' : 'Property ad rejected.');
      await loadProperties();
    } catch (error) {
      console.error(`Could not ${nextStatus} property ad:`, error);
      toast.error(`Could not ${nextStatus} property ad.`);
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold text-emerald-700">MarketMix admin</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Property ad moderation</h1>
            <p className="mt-1 text-sm text-slate-600">Edit listing details, then approve or reject each ad.</p>
          </div>
          <button type="button" onClick={loadProperties} disabled={loading} title="Refresh ads" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${statusFilter === status ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>
                {status} {status === 'all' ? properties.length : properties.filter((property) => (property.verificationStatus || property.approvalStatus || 'pending') === status).length}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, location, seller" className="min-w-0 bg-transparent text-sm outline-none" />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><Loader className="h-5 w-5 animate-spin" /> Loading property ads…</div>
        ) : visibleProperties.length === 0 ? (
          <div className="border-y border-slate-200 py-14 text-center text-sm text-slate-500">No {statusFilter === 'all' ? '' : `${statusFilter} `}property ads found.</div>
        ) : (
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {visibleProperties.map((property) => {
              const status = property.verificationStatus || property.approvalStatus || 'pending';
              const image = resolvePropertyImage(property);
              return (
                <article key={property.id} className="flex flex-col gap-4 py-5 sm:flex-row">
                  <div className="h-44 w-full shrink-0 overflow-hidden rounded-lg bg-slate-200 sm:h-32 sm:w-48">
                    {image ? <img src={image} alt={property.title || 'Property'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400">No photo</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{property.title || 'Untitled listing'}</h2>
                        <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0" />{property.location || property.approximateLocation || 'Location not provided'}</p>
                        <p className="mt-2 text-sm text-slate-700">{property.propertyType || property.unitType || 'Property'} · KSh {Number(property.price || property.rentAmount || 0).toLocaleString()}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{property.description || property.previewDescription || 'No description provided.'}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${status === 'approved' ? 'bg-emerald-100 text-emerald-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{status}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEditor(property)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"><Edit3 className="h-4 w-4" /> Edit ad</button>
                      {status !== 'approved' && <button type="button" disabled={saving} onClick={() => setListingStatus(property, 'approved')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Check className="h-4 w-4" /> Approve</button>}
                      {status !== 'rejected' && <button type="button" disabled={saving} onClick={() => setListingStatus(property, 'rejected')} className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"><X className="h-4 w-4" /> Reject</button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editing && draft && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && !saving && setEditing(null)}>
          <form onSubmit={saveEdit} className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-6">
            <div className="sticky top-0 z-10 -mx-4 -mt-4 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:-mx-6 sm:-mt-6 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">Edit property ad</h2>
              <button type="button" onClick={() => setEditing(null)} disabled={saving} aria-label="Close editor" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <label className="block text-sm font-medium text-slate-700">Headline<input required value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">Neighborhood / area<input required value={draft.location} onChange={(event) => updateDraft('location', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-sm font-medium text-slate-700">Price<input required type="number" min="0" value={draft.price} onChange={(event) => updateDraft('price', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-sm font-medium text-slate-700">Property type<input value={draft.propertyType} onChange={(event) => updateDraft('propertyType', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-sm font-medium text-slate-700">Cover photo URL<input type="url" value={draft.coverImage} onChange={(event) => updateDraft('coverImage', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-sm font-medium text-slate-700">Bedrooms<input type="number" min="0" value={draft.bedrooms} onChange={(event) => updateDraft('bedrooms', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-sm font-medium text-slate-700">Bathrooms<input type="number" min="0" value={draft.bathrooms} onChange={(event) => updateDraft('bathrooms', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">Area<input value={draft.area} onChange={(event) => updateDraft('area', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            </div>
            <label className="block text-sm font-medium text-slate-700">Ad description<textarea rows={5} value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white pt-4">
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? 'Saving…' : 'Save ad'}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default PropertyModerationPage;