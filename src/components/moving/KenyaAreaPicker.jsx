// src/components/moving/KenyaAreaPicker.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPinned, Search, Loader2 } from 'lucide-react';
import { formatKenyaArea, getKenyaSubCounties, getKenyaWards, KENYA_COUNTIES } from '../../utils/kenyaLocationOptions';
import { searchKenyaLocations } from '../../utils/transportLocationLookup';

const KenyaAreaPicker = ({ value = {}, onChange, areaLabel = 'Estate, neighbourhood or landmark', areaPlaceholder = 'Type a local place name', showSummary = true }) => {
  const [searchQuery, setSearchQuery] = useState(value.area || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const dropdownRef = useRef(null);
  const searchRequestId = useRef(0);

  const subCounties = useMemo(() => getKenyaSubCounties(value.county), [value.county]);
  const wards = useMemo(() => getKenyaWards(value.subCounty), [value.subCounty]);
  const setPart = (key, partValue) => onChange({ ...value, [key]: partValue });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Kenya places as the driver types; results are debounced, cached and
  // rate-limited through the shared location lookup service.
  useEffect(() => {
    const q = searchQuery.trim();
    const requestId = ++searchRequestId.current;
    if (q.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchKenyaLocations(q);
        if (requestId === searchRequestId.current) {
          setSuggestions(results);
          setShowDropdown(results.length > 0);
          setActiveSuggestion(-1);
        }
      } catch (err) {
        if (requestId === searchRequestId.current) console.error('Location search error:', err);
      } finally {
        if (requestId === searchRequestId.current) setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    const area = item.area?.area || item.label || item.displayName?.split(',')[0]?.trim() || searchQuery;
    const matchedArea = item.area || {};
    const county = matchedArea.county || value.county || '';
    setSearchQuery(area);
    onChange({
      ...value,
      ...matchedArea,
      area,
      county,
      subCounty: matchedArea.subCounty || value.subCounty || '',
      ward: matchedArea.ward || value.ward || '',
    });
    setShowDropdown(false);
    setActiveSuggestion(0);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault();
      setShowDropdown(true);
      setActiveSuggestion((index) => (index < 0 ? 0 : (index + 1) % suggestions.length));
    } else if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault();
      setShowDropdown(true);
      setActiveSuggestion((index) => (index < 0 ? suggestions.length - 1 : (index - 1 + suggestions.length) % suggestions.length));
    } else if (event.key === 'Enter') {
      // This input lives inside the onboarding form: Enter selects a place,
      // and never submits the entire form by accident.
      event.preventDefault();
      if (showDropdown && suggestions.length) handleSelectSuggestion(suggestions[Math.max(activeSuggestion, 0)]);
    } else if (event.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-3 relative" ref={dropdownRef}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-bold text-slate-700">County
          <span className="relative mt-1.5 block">
            <select
              value={value.county || ''}
              onChange={(event) => onChange({ ...value, county: event.target.value, subCounty: '', ward: '' })}
              className="mmx-glass-control w-full appearance-none rounded-xl border px-3 py-3 pr-9 text-sm font-medium text-slate-900 outline-none focus:border-emerald-700"
            >
              <option value="">Select county</option>
              {KENYA_COUNTIES.map((county) => <option key={county} value={county}>{county}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/>
          </span>
        </label>
        <label className="block text-xs font-bold text-slate-700">Sub-county
          <span className="relative mt-1.5 block">
            <select
              value={value.subCounty || ''}
              onChange={(event) => onChange({ ...value, subCounty: event.target.value, ward: '' })}
              disabled={!value.county}
              className="mmx-glass-control w-full appearance-none rounded-xl border px-3 py-3 pr-9 text-sm font-medium text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-55 focus:border-emerald-700"
            >
              <option value="">{value.county ? 'Select sub-county' : 'Choose county first'}</option>
              {subCounties.map((subCounty) => <option key={subCounty} value={subCounty}>{subCounty}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/>
          </span>
        </label>
        <label className="block text-xs font-bold text-slate-700">Ward
          <span className="relative mt-1.5 block">
            <select
              value={value.ward || ''}
              onChange={(event) => setPart('ward', event.target.value)}
              disabled={!value.subCounty || wards.length === 0}
              className="mmx-glass-control w-full appearance-none rounded-xl border px-3 py-3 pr-9 text-sm font-medium text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-55 focus:border-emerald-700"
            >
              <option value="">{!value.subCounty ? 'Choose sub-county first' : wards.length ? 'Select ward' : 'No ward mapping'}</option>
              {wards.map((ward) => <option key={ward} value={ward}>{ward}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/>
          </span>
        </label>
      </div>

      <label className="block text-xs font-bold text-slate-700 relative">{areaLabel}
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSuggestions([]);
              setShowDropdown(false);
              setActiveSuggestion(-1);
              setPart('area', event.target.value);
            }}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            onKeyDown={handleSearchKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showDropdown && suggestions.length > 0}
            aria-controls="kenya-area-suggestions"
            maxLength={120}
            placeholder={areaPlaceholder}
            className="mmx-glass-control w-full rounded-xl border pl-10 pr-9 py-3 text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-700 bg-white"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-emerald-600" />
          )}
        </div>

        {/* Live Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div id="kenya-area-suggestions" role="listbox" className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                role="option"
                aria-selected={idx === activeSuggestion}
                onMouseEnter={() => setActiveSuggestion(idx)}
                onClick={() => handleSelectSuggestion(item)}
                className={`flex w-full items-start gap-2 px-4 py-3 text-left text-xs font-medium text-slate-800 transition-colors ${idx === activeSuggestion ? 'bg-emerald-50' : 'hover:bg-emerald-50'}`}
              >
                <MapPinned className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-0.5 block line-clamp-2 text-[11px] font-normal text-slate-500">{item.displayName}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        {searching && searchQuery.trim().length >= 3 && suggestions.length === 0 && (
          <p role="status" className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500">Searching available places…</p>
        )}
      </label>

      {showSummary && (value.county || value.subCounty || value.ward || value.area) && (
        <p className="mmx-glass-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200">
          <MapPinned className="h-3.5 w-3.5 text-emerald-800"/>{formatKenyaArea(value)}
        </p>
      )}
    </div>
  );
};

export default KenyaAreaPicker;
