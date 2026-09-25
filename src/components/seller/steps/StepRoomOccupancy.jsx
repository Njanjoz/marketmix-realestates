// src/components/seller/steps/StepRoomOccupancy.jsx
import React from 'react';
import { Field, TextInput, NumberInput, Select } from '../shared/Field';
import CardSelect from '../shared/CardSelect';
import CheckboxGrid from '../shared/CheckboxGrid';
import {
  ROOM_SIZES,
  SLEEPING_ARRANGEMENTS,
  ROOM_FURNITURE,
  BATHROOM_OPTIONS,
  KITCHEN_OPTIONS,
  LAND_LIKE,
} from '../constants/propertyTaxonomy';

const StepRoomOccupancy = ({ data, update }) => {
  const isLand = LAND_LIKE.has(data.propertyType);
  if (isLand) return <p className="text-gray-500 text-sm">Not applicable to land listings.</p>;

  const isCustomSize = data.roomSize === 'Custom dimensions';

  return (
    <div className="space-y-5">
      <Field label="Room size" required>
        <CardSelect
          options={ROOM_SIZES.map((s) => ({ id: s, label: s }))}
          value={data.roomSize}
          onChange={(v) => update({ roomSize: v })}
          columns={2}
        />
      </Field>

      {isCustomSize && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Length (ft)">
            <NumberInput value={data.roomLength} onChange={(v) => update({ roomLength: v })} placeholder="e.g., 12" />
          </Field>
          <Field label="Width (ft)">
            <NumberInput value={data.roomWidth} onChange={(v) => update({ roomWidth: v })} placeholder="e.g., 10" />
          </Field>
        </div>
      )}

      <Field label="Sleeping arrangement" required>
        <Select
          value={data.sleepingArrangement}
          onChange={(v) => update({ sleepingArrangement: v })}
          options={SLEEPING_ARRANGEMENTS}
          placeholder="Select arrangement"
        />
      </Field>

      <Field label="Furniture included">
        <CheckboxGrid
          options={ROOM_FURNITURE}
          value={data.roomFurniture || []}
          onChange={(v) => update({ roomFurniture: v })}
          columns={2}
        />
      </Field>

      <Field label="Bathroom" required>
        <Select
          value={data.bathroom}
          onChange={(v) => update({ bathroom: v })}
          options={BATHROOM_OPTIONS}
          placeholder="Select bathroom type"
        />
      </Field>

      <Field label="Kitchen" required>
        <Select
          value={data.kitchen}
          onChange={(v) => update({ kitchen: v })}
          options={KITCHEN_OPTIONS}
          placeholder="Select kitchen type"
        />
      </Field>

      <div className="border-t border-gray-200 pt-4 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm">Occupancy</h3>

        <Field label="How many people can live in this unit?" required>
          <Select
            value={data.occupancyCount}
            onChange={(v) => update({ occupancyCount: v })}
            options={['1', '2', '3', '4', '5+', 'Custom']}
            placeholder="Select"
          />
        </Field>

        {data.occupancyCount === 'Custom' && (
          <Field label="Custom occupancy number">
            <NumberInput value={data.occupancyCustom} onChange={(v) => update({ occupancyCustom: v })} />
          </Field>
        )}

        <Field label="Is sharing allowed?" required>
          <Select
            value={data.sharingAllowed}
            onChange={(v) => update({ sharingAllowed: v })}
            options={['No', 'Yes', 'Yes, with approval']}
            placeholder="Select"
          />
        </Field>

        <Field label="Current occupancy" required>
          <Select
            value={data.currentOccupancy}
            onChange={(v) => update({ currentOccupancy: v })}
            options={['Vacant', 'Partially occupied', 'Fully occupied', 'Available from future date']}
            placeholder="Select"
          />
        </Field>

        {data.currentOccupancy === 'Available from future date' && (
          <Field label="Availability date" required>
            <TextInput
              type="date"
              value={data.availabilityDate}
              onChange={(v) => update({ availabilityDate: v })}
            />
          </Field>
        )}
      </div>
    </div>
  );
};

export default StepRoomOccupancy;
