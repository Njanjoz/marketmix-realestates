import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Globe, Loader, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE = (import.meta.env.VITE_YOUTUBE_API_URL || 'https://marketmix-youtube-server.onrender.com').replace(/\/+$/, '');

const ApiDomainsPage = () => {
  const { currentUser } = useAuth();
  const [origins, setOrigins] = useState([]);
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const request = useCallback(async (path, options = {}) => {
    const token = await currentUser.getIdToken();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
  }, [currentUser]);

  const loadOrigins = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const result = await request('/api/admin/allowed-origins');
      setOrigins(result.allowedOrigins || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load allowed domains.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, request]);

  useEffect(() => {
    loadOrigins();
  }, [loadOrigins]);

  const addOrigin = (event) => {
    event.preventDefault();
    setError('');
    try {
      const input = domainInput.trim();
      const url = new URL(input);
      const isLocal = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
      if ((url.protocol !== 'https:' && !isLocal) || url.origin !== input) {
        throw new Error('Enter an origin only, such as https://example.com, without a page path.');
      }
      if (origins.includes(url.origin)) throw new Error('That origin is already in the list.');
      setOrigins((current) => [...current, url.origin]);
      setDomainInput('');
    } catch (addError) {
      setError(addError.message || 'Enter a valid website origin.');
    }
  };

  const saveOrigins = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await request('/api/admin/allowed-origins', {
        method: 'PUT',
        body: JSON.stringify({ allowedOrigins: origins }),
      });
      setOrigins(result.allowedOrigins || []);
      toast.success('Allowed domains updated.');
    } catch (saveError) {
      setError(saveError.message || 'Could not save allowed domains.');
      toast.error('Could not save allowed domains.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <section className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><Globe className="h-4 w-4" /> YouTube API settings</div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Allowed website domains</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">Manage which MarketMix website origins can call the YouTube upload API. Changes apply immediately.</p>
          </div>
          <a href={`${API_BASE}/health`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            API health <ExternalLink className="h-4 w-4" />
          </a>
        </header>

        <form onSubmit={addOrigin} className="flex flex-col gap-2 sm:flex-row">
          <input type="url" value={domainInput} onChange={(event) => setDomainInput(event.target.value)} placeholder="https://your-new-domain.com" aria-label="Website origin" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"><Plus className="h-4 w-4" /> Add domain</button>
        </form>
        <p className="-mt-4 text-xs text-slate-500">Use HTTPS and enter only the site origin, with no page path.</p>

        {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

        <section className="border-t border-slate-200 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-800">Configured origins</h2>
            <button type="button" onClick={loadOrigins} disabled={loading} title="Reload domains" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader className="h-4 w-4 animate-spin" /> Loading domains…</div>
          ) : origins.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">No domains loaded. Check the Render service and Firebase Admin setup.</p>
          ) : (
            <ul className="divide-y divide-slate-200 border-y border-slate-200">
              {origins.map((origin) => (
                <li key={origin} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 break-all text-sm text-slate-800">{origin}</span>
                  <button type="button" onClick={() => setOrigins((current) => current.filter((item) => item !== origin))} aria-label={`Remove ${origin}`} title="Remove domain" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex justify-end border-t border-slate-200 pt-5">
          <button type="button" onClick={saveOrigins} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50">
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </section>
    </main>
  );
};

export default ApiDomainsPage;