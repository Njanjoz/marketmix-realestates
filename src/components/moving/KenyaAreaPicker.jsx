// src/components/moving/KenyaAreaPicker.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPinned, Search, Loader2 } from 'lucide-react';
import { formatKenyaArea, getKenyaSubCounties, getKenyaWards, KENYA_COUNTIES } from '../../utils/kenyaLocationOptions';

const KenyaAreaPicker = ({ value = {}, onChange, areaLabel = 'Estate, neighbourhood or landmark', areaPlaceholder = 'Type a local place name', showSummary = true }) => {
  const [searchQuery, setSearchQuery] = useState(value.area || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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

  // Fetch OpenStreetMap Nominatim suggestions as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Kenya')}&limit=5`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setShowDropdown(data.length > 0);
        }
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    const displayName = item.display_name || '';
    const parts = displayName.split(',').map(p => p.trim());
    const area = parts[0] || searchQuery;
    const county = parts.find(p => KENYA_COUNTIES.includes(p)) || value.county || '';
    
    setSearchQuery(area);
    onChange({ ...value, area, county: county || value.county });
    setShowDropdown(false);
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
              setPart('area', event.target.value);
            }}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
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
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-xs font-medium text-slate-800 transition-colors flex items-start gap-2"
              >
                <MapPinned className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{item.display_name}</span>
              </button>
            ))}
          </div>
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
