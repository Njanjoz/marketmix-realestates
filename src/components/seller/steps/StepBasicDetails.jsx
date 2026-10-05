// src/components/seller/steps/StepBasicDetails.jsx
import React from 'react';
import { Field, TextInput, TextArea, NumberInput, Select } from '../shared/Field';
import CheckboxGrid from '../shared/CheckboxGrid';
import {
  SUITABLE_FOR,
  GENDER_ACCOMMODATION,
  LAND_LIKE,
} from '../constants/propertyTaxonomy';

const StepBasicDetails = ({ data, update, errors = {} }) => {
  const isLand = LAND_LIKE.has(data.propertyType);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Property / listing name" required className="md:col-span-2">
          <TextInput
            value={data.propertyName}
            onChange={(v) => update({ propertyName: v })}
            placeholder="e.g., Sunrise Apartments, Kilimani"
          />
        </Field>

        <Field label="Listing title" required className="md:col-span-2" hint="Short, clear title tenants will see.">
          <TextInput
            value={data.title}
            onChange={(v) => update({ title: v })}
            placeholder="e.g., Spacious 2 Bedroom Apartment Near Campus"
          />
        </Field>

        <Field label="Listing type" required error={errors.listingType} hint="This controls whether the property appears under Buy or Rent.">
          <Select
            value={data.listingType || ''}
            onChange={(v) => update({ listingType: v })}
            options={[{ value: 'sale', label: 'For sale' }, { value: 'rent', label: 'For rent' }]}
            placeholder="Choose sale or rent"
          />
        </Field>

        <Field label="Description" required className="md:col-span-2">
          <TextArea
            rows={4}
            value={data.description}
            onChange={(v) => update({ description: v })}
            placeholder="Describe the property, its condition, and what makes it suitable."
          />
        </Field>

        {!isLand && (
          <>
            <Field label="Total bedrooms">
              <NumberInput value={data.totalBedrooms} onChange={(v) => update({ totalBedrooms: v })} placeholder="e.g., 2" />
            </Field>
            <Field label="Bathrooms">
              <NumberInput value={data.bathrooms} onChange={(v) => update({ bathrooms: v })} placeholder="e.g., 1" />
            </Field>
            <Field label="Floors in building">
              <NumberInput value={data.floors} onChange={(v) => update({ floors: v })} placeholder="e.g., 3" />
            </Field>
            <Field label="Floor number of this unit">
              <NumberInput value={data.floorNumber} onChange={(v) => update({ floorNumber: v })} placeholder="e.g., 2" />
            </Field>
            <Field label="Year built">
              <NumberInput value={data.yearBuilt} onChange={(v) => update({ yearBuilt: v })} placeholder="e.g., 2019" />
            </Field>
          </>
        )}

        {!isLand && (
          <Field label="Furnishing" required className="md:col-span-2">
            <Select
              value={data.furnished}
              onChange={(v) => update({ furnished: v })}
              options={['Fully furnished', 'Partially furnished', 'Unfurnished']}
              placeholder="Select furnishing status"
            />
          </Field>
        )}
      </div>

      <Field label="Suitable for" required hint="Select all groups this property is suitable for.">
        <CheckboxGrid
          options={SUITABLE_FOR}
          value={data.suitableFor || []}
          onChange={(v) => update({ suitableFor: v })}
          columns={2}
        />
      </Field>

      <Field label="Gender accommodation" required>
        <Select
          value={data.genderAccommodation}
          onChange={(v) => update({ genderAccommodation: v })}
          options={GENDER_ACCOMMODATION}
          placeholder="Select gender policy"
        />
      </Field>

      <Field label="Age restriction (if applicable)" hint="Leave blank if none.">
        <TextInput
          value={data.ageRestriction}
          onChange={(v) => update({ ageRestriction: v })}
          placeholder="e.g., 18–35 only"
        />
      </Field>
    </div>
  );
};

export default StepBasicDetails;
