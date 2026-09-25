// src/components/seller/steps/StepPropertyType.jsx
import React from 'react';
import CardSelect from '../shared/CardSelect';
import { PROPERTY_TYPES } from '../constants/propertyTaxonomy';
import { Field } from '../shared/Field';

const StepPropertyType = ({ data, update }) => {
  const handleSelect = (id) => {
    // Reset downstream dependents when property type changes
    update({
      propertyType: id,
      unitType: '',
      roomType: '',
      rentalModel: '',
      occupancy: '',
    });
  };

  return (
    <div className="space-y-4">
      <Field
        label="What type of property are you listing?"
        required
        hint="Choose the closest match. You can describe more in the next steps."
      >
        <CardSelect
          options={PROPERTY_TYPES}
          value={data.propertyType}
          onChange={handleSelect}
          columns={2}
        />
      </Field>
    </div>
  );
};

export default StepPropertyType;
