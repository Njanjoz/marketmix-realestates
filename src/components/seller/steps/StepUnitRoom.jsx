// src/components/seller/steps/StepUnitRoom.jsx
import React, { useMemo } from 'react';
import { Field, Select, TextInput } from '../shared/Field';
import CardSelect from '../shared/CardSelect';
import CheckboxGrid from '../shared/CheckboxGrid';
import {
  UNIT_OPTIONS_BY_PROPERTY,
  GENERAL_UNIT_OPTIONS,
  RENTAL_MODELS,
  OCCUPANCY_OPTIONS,
  LAND_LIKE,
  HOSTEL_LIKE,
} from '../constants/propertyTaxonomy';

const StepUnitRoom = ({ data, update }) => {
  const unitOptions = useMemo(() => {
    const list = UNIT_OPTIONS_BY_PROPERTY[data.propertyType] || GENERAL_UNIT_OPTIONS;
    return list.map((u) => ({ id: u, label: u }));
  }, [data.propertyType]);

  const isLand = LAND_LIKE.has(data.propertyType);
  const isHostel = HOSTEL_LIKE.has(data.propertyType);

  // Detect room-level rental model
  const roomRental = ['Individual room', 'Shared room', 'Bed space'].includes(data.rentalModel);

  if (isLand) {
    return (
      <div className="space-y-4">
        <Field label="Land type" required>
          <Select
            value={data.unitType}
            onChange={(v) => update({ unitType: v })}
            options={unitOptions.map((o) => o.label)}
            placeholder="Select land type"
          />
        </Field>
        <Field label="Rental model" required hint="How is the land being rented or sold?">
          <Select
            value={data.rentalModel}
            onChange={(v) => update({ rentalModel: v })}
            options={RENTAL_MODELS}
            placeholder="Select rental model"
          />
        </Field>
        <Field label="Available parcels / units">
          <TextInput
            type="number"
            value={data.availableUnits}
            onChange={(v) => update({ availableUnits: v })}
            placeholder="e.g., 1"
          />
        </Field>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Field
        label="What exactly will the tenant rent?"
        required
        hint="This is the unit, room or space being let — not the whole building."
      >
        <CardSelect
          options={unitOptions}
          value={data.unitType}
          onChange={(v) => update({ unitType: v })}
          columns={2}
        />
      </Field>

      <Field
        label="Rental model"
        required
        hint="Choose all that apply. E.g., an apartment can be rented per individual room on a monthly basis."
      >
        <CheckboxGrid
          options={RENTAL_MODELS}
          value={data.rentalModel ? (Array.isArray(data.rentalModel) ? data.rentalModel : [data.rentalModel]) : []}
          onChange={(v) => update({ rentalModel: v })}
          columns={2}
        />
      </Field>

      {roomRental && (
        <Field
          label="Room type"
          required
          hint="Describe the room being rented."
        >
          <Select
            value={data.roomType}
            onChange={(v) => update({ roomType: v })}
            options={[
              'Single Room', 'Double Room', 'Triple Room', 'Quadruple Room',
              'Shared Room', 'Bed Space', 'Ensuite Single', 'Non-Ensuite Single',
              'Ensuite Shared', 'Non-Ensuite Shared', 'Other',
            ]}
            placeholder="Select room type"
          />
        </Field>
      )}

      {isHostel && (
        <Field
          label="Occupancy per room"
          hint="How many people can share this room?"
        >
          <Select
            value={data.occupancy}
            onChange={(v) => update({ occupancy: v })}
            options={OCCUPANCY_OPTIONS}
            placeholder="Select occupancy"
          />
        </Field>
      )}

      <Field label="Number of units in this listing" hint="How many identical units are available under this listing?">
        <TextInput
          type="number"
          value={data.totalUnits}
          onChange={(v) => update({ totalUnits: v })}
          placeholder="e.g., 1"
        />
      </Field>

      <Field label="Available units right now">
        <TextInput
          type="number"
          value={data.availableUnits}
          onChange={(v) => update({ availableUnits: v })}
          placeholder="e.g., 1"
        />
      </Field>
    </div>
  );
};

export default StepUnitRoom;
