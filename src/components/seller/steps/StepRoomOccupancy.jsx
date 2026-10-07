// src/components/seller/steps/StepRoomOccupancy.jsx
import React from 'react';
import { Field, TextInput, NumberInput, Select } from '../shared/Field';
import CardSelect from '../shared/CardSelect';
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

  const occupancyVal = String(data.occupancy || '1');
  const isMultipleOccupancy = occupancyVal !== '1';
  const isSharingYes = data.sharingAllowed === true || data.sharingAllowed === 'Yes' || data.sharingAllowed === 'Yes, with approval';

  return (
    <div className="space-y-5 mmx-step-enter">
      <Field label="How many people can live in this unit?" required hint="Selecting 1 keeps the wizard streamlined without sharing questions.">
        <Select
          value={data.occupancy}
          onChange={(v) => update({ occupancy: v, sharingAllowed: v === '1' ? false : data.sharingAllowed })}
          options={['1', '2', '3', '4', '5+', 'Custom']}
          placeholder="Select occupancy"
        />
      </Field>

      {data.occupancy === 'Custom' && (
        <Field label="Custom occupancy number">
          <NumberInput value={data.occupancyCustom} onChange={(v) => update({ occupancyCustom: v })} placeholder="e.g. 6" />
        </Field>
      )}

      {/* Conditional sharing question revealed only when occupancy > 1 */}
      {isMultipleOccupancy && (
        <div className="space-y-4 pt-3 border-t border-slate-100 mmx-step-enter">
          <Field label="Is sharing allowed?" required hint="Can multiple tenants share this space?">
            <Select
              value={data.sharingAllowed === true ? 'Yes' : data.sharingAllowed === false ? 'No' : data.sharingAllowed}
              onChange={(v) => update({ sharingAllowed: v === 'Yes' || v === 'Yes, with approval' ? v : false })}
              options={['No', 'Yes', 'Yes, with approval']}
              placeholder="Select sharing option"
            />
          </Field>

          {/* Conditional sharing details revealed only when sharing is Yes */}
          {isSharingYes && (
            <div className="space-y-4 pt-3 border-t border-slate-100 mmx-step-enter bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800">Sharing Preferences & Rules</h4>
              <Field label="Sleeping arrangement" required>
                <Select
                  value={data.sleepingArrangement}
                  onChange={(v) => update({ sleepingArrangement: v })}
                  options={SLEEPING_ARRANGEMENTS}
                  placeholder="Select arrangement"
                />
              </Field>
            </div>
          )}
        </div>
      )}

      <Field label="Room size" required>
        <CardSelect
          options={ROOM_SIZES.map((s) => ({ id: s, label: s }))}
          value={data.roomSize}
          onChange={(v) => update({ roomSize: v })}
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
    </div>
  );
};

export default StepRoomOccupancy;
