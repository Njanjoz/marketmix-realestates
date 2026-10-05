import React, { useState } from 'react';
import { LoaderCircle, MapPin, Search } from 'lucide-react';
import { searchKenyaLocations } from '../../utils/transportLocationLookup';

const KenyaLocationSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');

  const search = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setMessage('');
    setResults([]);
    try {
      const locations = await searchKenyaLocations(query);
      setResults(locations);
      if (!locations.length) setMessage('No matches found. Try another search or enter the county and area below.');
    } catch (error) {
      console.warn('Kenya destination search failed:', error);
      setMessage('Search is unavailable right now. Enter the county and area below instead.');
    } finally {
      setSearching(false);
    }
  };

  return <section className="mmx-glass-surface rounded-2xl border border-slate-200/80 p-4 sm:p-5">
    <form onSubmit={search}>
      <label htmlFor="transport-destination-search" className="block text-sm font-bold text-slate-800">Search for a destination</label>
      <p className="mt-1 text-xs leading-5 text-slate-500">Search a town, estate, landmark or street in Kenya. Matching area fields and the map pin fill in when map data is available; you can complete the county and area manually below.</p>
      <div className="mt-3 flex gap-2">
        <input id="transport-destination-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Kilimani, Nairobi" className="mmx-glass-control min-w-0 flex-1 rounded-xl border px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-700" />
        <button type="submit" disabled={searching || !query.trim()} className="mmx-liquid-primary inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55">
          {searching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="hidden sm:inline">{searching ? 'Searching' : 'Search'}</span>
        </button>
      </div>
    </form>
    {message && <p role="status" className="mt-3 text-xs leading-5 text-slate-600">{message}</p>}
    {results.length > 0 && <ul className="mt-3 max-h-64 divide-y divide-white/50 overflow-y-auto rounded-xl border border-white/60 bg-white/60">
      {results.map((result) => <li key={`${result.point.lat}:${result.point.lng}`}>
        <button type="button" onClick={() => { onSelect(result); setResults([]); setQuery(result.label); }} className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-emerald-50/80">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
          <span className="min-w-0"><span className="block text-sm font-bold text-slate-900">{result.label}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{result.displayName}</span></span>
        </button>
      </li>)}
    </ul>}
    <p className="mt-3 text-[10px] text-slate-500">Search results &#169; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap contributors</a>.</p>
  </section>;
};

export default KenyaLocationSearch;
