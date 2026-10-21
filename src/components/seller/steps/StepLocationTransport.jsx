// src/components/seller/steps/StepLocationTransport.jsx
import React, { useState } from 'react';
import { Field, TextInput, Select } from '../shared/Field';
import CheckboxGrid from '../shared/CheckboxGrid';
import LocationPicker from '../../LocationPicker';
import { hasTwoWordLocation } from '../locationValidation';
import {
  ROAD_TYPES, ROAD_CONDITIONS, STREET_LIGHTING, FLOODING_HISTORY,
  TRANSPORT_OPTIONS,
} from '../constants/propertyTaxonomy';

const StepLocationTransport = ({ data, update }) => {
  const [keywordDraft, setKeywordDraft] = useState('');
  const keywords = Array.isArray(data.searchKeywords) ? data.searchKeywords : [];
  const locationError = (data.location || data.coordinates) && !hasTwoWordLocation(data.location)
    ? 'Enter at least two words, such as “Rhonda Mazembe”.'
    : '';
  const addKeywords = (rawValue) => {
    const additions = String(rawValue || '').split(/[,\n]/).map((word) => word.trim()).filter(Boolean);
    if (!additions.length) return;
    const seen = new Set(keywords.map((word) => String(word).toLocaleLowerCase()));
    const next = [...keywords];
    additions.forEach((word) => {
      const key = word.toLocaleLowerCase();
      if (!seen.has(key)) { seen.add(key); next.push(word); }
    });
    update({ searchKeywords: next });
    setKeywordDraft('');
  };

  return (
    <div className="space-y-5">
      {/* Location Picker */}
      <Field label="Map pin" hint="Set the coordinates customers will use for distance calculations. Then enter a recognizable location name below.">
        <LocationPicker
          initialLocation={data.locationData || null}
          onLocationSelect={(loc) => {
            update({
              locationData: loc,
              coordinates: loc?.lat != null && loc?.lng != null ? { lat: loc.lat, lng: loc.lng } : null,
              county: loc?.county || data.county || '',
              constituency: loc?.constituency || data.constituency || '',
              ward: loc?.ward || data.ward || '',
              town: loc?.town || loc?.estate || data.town || '',
              estate: loc?.estate || loc?.ward || data.estate || '',
              nearestRoad: loc?.nearestRoad || data.nearestRoad || '',
              locationSource: loc?.locationSource || 'manual-map-selection',
              gpsAccuracy: loc?.gpsAccuracy || null,
              landmarks: loc?.landmarks || []
            });
          }}
          label=""
        />
      </Field>

      <Field label="Landmark or location name" required error={locationError} hint="Enter at least two words so customers can recognize the area, for example “Rhonda Mazembe”.">
        <TextInput
          id="location"
          value={data.location || ''}
          onChange={(value) => update({ location: value })}
          placeholder="e.g. Rhonda Mazembe"
          maxLength={160}
          aria-invalid={Boolean(locationError)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="County">
          <TextInput value={data.county} onChange={(v) => update({ county: v })} placeholder="e.g. Nakuru" />
        </Field>
        <Field label="Constituency">
          <TextInput value={data.constituency} onChange={(v) => update({ constituency: v })} placeholder="e.g. Nakuru Town West" />
        </Field>
        <Field label="Ward / Area">
          <TextInput value={data.ward} onChange={(v) => update({ ward: v })} placeholder="e.g. Kaptembwo" />
        </Field>
        <Field label="Town / City">
          <TextInput value={data.town} onChange={(v) => update({ town: v })} placeholder="e.g. Nakuru" />
        </Field>
        <Field label="Estate / Neighborhood">
          <TextInput value={data.estate} onChange={(v) => update({ estate: v })} placeholder="e.g. Kaptembwo" />
        </Field>
        <Field label="Nearest road">
          <TextInput value={data.nearestRoad} onChange={(v) => update({ nearestRoad: v })} placeholder="e.g. Pipeline Road" />
        </Field>
        <Field label="Other names people may search" hint="Add as many local names, landmarks, or informal area names as you like. Press Enter or use a comma after each one.">
          <div className="rounded-lg border border-gray-300 bg-white p-2">
            {keywords.length > 0 && <div className="mb-2 flex flex-wrap gap-2">
              {keywords.map((keyword, index) => <span key={`${keyword}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
                {keyword}
                <button type="button" aria-label={`Remove ${keyword}`} onClick={() => update({ searchKeywords: keywords.filter((_, i) => i !== index) })} className="ml-1 font-bold text-emerald-700">×</button>
              </span>)}
            </div>}
            <input
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addKeywords(keywordDraft); }
                if (event.key === 'Backspace' && !keywordDraft && keywords.length) update({ searchKeywords: keywords.slice(0, -1) });
              }}
              onBlur={() => addKeywords(keywordDraft)}
              placeholder="e.g. Kwa Bee, near the market"
              className="w-full border-0 px-2 py-2 text-sm outline-none focus:ring-0"
              aria-label="Add alternate property search names"
            />
          </div>
        </Field>
      </div>

      {/* Transport */}
      <div className="border-t border-gray-200 pt-4 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm">Access & Transport</h3>

        <Field label="Road type">
          <Select value={data.roadType} onChange={(v) => update({ roadType: v })} options={ROAD_TYPES} placeholder="Select" />
        </Field>
        <Field label="Road condition">
          <Select value={data.roadCondition} onChange={(v) => update({ roadCondition: v })} options={ROAD_CONDITIONS} placeholder="Select" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Distance to main road">
            <TextInput value={data.distanceToMainRoad} onChange={(v) => update({ distanceToMainRoad: v })} placeholder="e.g., 300 m" />
          </Field>
          <Field label="Walking time to main road">
            <TextInput value={data.walkingTimeToMainRoad} onChange={(v) => update({ walkingTimeToMainRoad: v })} placeholder="e.g., 4 min" />
          </Field>
        </div>

        <Field label="Nearest matatu/bus stage">
          <TextInput value={data.nearestStage} onChange={(v) => update({ nearestStage: v })} placeholder="e.g., Kaptembwo Stage" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Distance to stage">
            <TextInput value={data.distanceToStage} onChange={(v) => update({ distanceToStage: v })} placeholder="e.g., 500 m" />
          </Field>
          <Field label="Walking time to stage">
            <TextInput value={data.walkingTimeToStage} onChange={(v) => update({ walkingTimeToStage: v })} placeholder="e.g., 7 min" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Typical fare to campus">
            <TextInput value={data.fareToCampus} onChange={(v) => update({ fareToCampus: v })} placeholder="e.g., KSh 50" />
          </Field>
          <Field label="Typical fare to CBD">
            <TextInput value={data.fareToCBD} onChange={(v) => update({ fareToCBD: v })} placeholder="e.g., KSh 50" />
          </Field>
        </div>

        <Field label="Transport options">
          <CheckboxGrid options={TRANSPORT_OPTIONS} value={data.transportOptions || []} onChange={(v) => update({ transportOptions: v })} columns={2} />
        </Field>

        <Field label="Street lighting">
          <Select value={data.streetLighting} onChange={(v) => update({ streetLighting: v })} options={STREET_LIGHTING} placeholder="Select" />
        </Field>
        <Field label="Flooding history">
          <Select value={data.floodingHistory} onChange={(v) => update({ floodingHistory: v })} options={FLOODING_HISTORY} placeholder="Select" />
        </Field>
      </div>
    </div>
  );
};

export default StepLocationTransport;
