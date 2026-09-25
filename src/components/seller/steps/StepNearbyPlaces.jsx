// src/components/seller/steps/StepNearbyPlaces.jsx
import React, { useState } from 'react';
import { Field, TextInput, Select } from '../shared/Field';
import { Plus, Trash2 } from 'lucide-react';
import { NEARBY_PLACE_TYPES } from '../constants/propertyTaxonomy';

const StepNearbyPlaces = ({ data, update }) => {
  const [newPlace, setNewPlace] = useState({ type: '', name: '', distance: '', walkingTime: '' });
  const places = data.nearbyPlaces || [];

  const add = () => {
    if (!newPlace.type || !newPlace.name) return;
    update({ nearbyPlaces: [...places, newPlace] });
    setNewPlace({ type: '', name: '', distance: '', walkingTime: '' });
  };

  const remove = (i) => update({ nearbyPlaces: places.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Add important places near the property. Distance and walking time help tenants understand convenience.
      </p>

      {places.length > 0 && (
        <div className="space-y-2">
          {places.map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg text-sm">
              <div className="flex-1">
                <span className="font-medium">{p.type}:</span> {p.name}
                {p.distance && <span className="text-gray-500"> · {p.distance}</span>}
                {p.walkingTime && <span className="text-gray-500"> · {p.walkingTime} walk</span>}
              </div>
              <button type="button" onClick={() => remove(i)} className="p-1 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Select
          value={newPlace.type}
          onChange={(v) => setNewPlace({ ...newPlace, type: v })}
          options={NEARBY_PLACE_TYPES}
          placeholder="Place type"
        />
        <TextInput
          placeholder="Place name"
          value={newPlace.name}
          onChange={(v) => setNewPlace({ ...newPlace, name: v })}
        />
        <TextInput
          placeholder="Distance e.g., 500 m"
          value={newPlace.distance}
          onChange={(v) => setNewPlace({ ...newPlace, distance: v })}
        />
        <TextInput
          placeholder="Walking time e.g., 6 min"
          value={newPlace.walkingTime}
          onChange={(v) => setNewPlace({ ...newPlace, walkingTime: v })}
        />
      </div>
      <button type="button" onClick={add} className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
        <Plus className="w-4 h-4" /> Add nearby place
      </button>
    </div>
  );
};

export default StepNearbyPlaces;
