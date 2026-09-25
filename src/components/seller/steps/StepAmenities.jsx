// src/components/seller/steps/StepAmenities.jsx
import React from 'react';
import { Field } from '../shared/Field';
import CheckboxGrid from '../shared/CheckboxGrid';
import { ROOM_AMENITIES, PROPERTY_AMENITIES, LAND_LIKE } from '../constants/propertyTaxonomy';

const StepAmenities = ({ data, update }) => {
  const isLand = LAND_LIKE.has(data.propertyType);

  return (
    <div className="space-y-5">
      {!isLand && (
        <Field label="Room amenities">
          <CheckboxGrid
            options={ROOM_AMENITIES}
            value={data.roomAmenities || []}
            onChange={(v) => update({ roomAmenities: v })}
            columns={2}
          />
        </Field>
      )}

      <Field label="Property amenities">
        <CheckboxGrid
          options={PROPERTY_AMENITIES}
          value={data.propertyAmenities || []}
          onChange={(v) => update({ propertyAmenities: v })}
          columns={2}
        />
      </Field>
    </div>
  );
};

export default StepAmenities;
