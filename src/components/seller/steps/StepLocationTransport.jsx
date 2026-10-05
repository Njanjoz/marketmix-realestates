// src/components/seller/steps/StepLocationTransport.jsx
import React from 'react';
import { Field, TextInput, Select } from '../shared/Field';
import CheckboxGrid from '../shared/CheckboxGrid';
import LocationPicker from '../../LocationPicker';
import {
  ROAD_TYPES, ROAD_CONDITIONS, STREET_LIGHTING, FLOODING_HISTORY,
  TRANSPORT_OPTIONS,
} from '../constants/propertyTaxonomy';

const StepLocationTransport = ({ data, update }) => {
  return (
    <div className="space-y-5">
      {/* Location Picker */}
      <Field label="Property location" required hint="Use GPS or search to set map coordinates. If no place name is found, enter the neighborhood or a nearby landmark.">
        <LocationPicker
          initialLocation={data.locationData || null}
          onLocationSelect={(loc) => {
            update({
              locationData: loc,
              location: loc?.address || '',
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
