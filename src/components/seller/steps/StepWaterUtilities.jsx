// src/components/seller/steps/StepWaterUtilities.jsx
import React from 'react';
import { Field, Select } from '../shared/Field';
import MoneyInput from '../shared/MoneyInput';
import CheckboxGrid from '../shared/CheckboxGrid';
import {
  WATER_SOURCES, WATER_RELIABILITY, WATER_CHARGING_METHOD, WATER_STORAGE,
  HOT_WATER, ELECTRICITY_TYPES, LAND_LIKE,
} from '../constants/propertyTaxonomy';

const StepWaterUtilities = ({ data, update }) => {
  if (LAND_LIKE.has(data.propertyType)) {
    return <p className="text-gray-500 text-sm">Utilities are not applicable to land listings.</p>;
  }

  return (
    <div className="space-y-5">
      {/* Water */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">Water</h3>
        <Field label="How is water supplied?" required>
          <Select
            value={data.waterSource}
            onChange={(v) => update({ waterSource: v })}
            options={WATER_SOURCES}
            placeholder="Select water source"
          />
        </Field>
        <Field label="Is water included in rent?" required>
          <Select
            value={data.waterIncluded}
            onChange={(v) => update({ waterIncluded: v === 'Yes' ? true : v === 'No' ? false : v })}
            options={['Yes', 'No']}
            placeholder="Select"
          />
        </Field>
        {data.waterIncluded === false && (
          <>
            <Field label="Water charge (KSh)">
              <MoneyInput value={data.waterCharge} onChange={(v) => update({ waterCharge: v })} />
            </Field>
            <Field label="Charging method">
              <Select
                value={data.waterChargingMethod}
                onChange={(v) => update({ waterChargingMethod: v })}
                options={WATER_CHARGING_METHOD}
                placeholder="Select method"
              />
            </Field>
          </>
        )}
        <Field label="Supply reliability">
          <Select
            value={data.waterReliability}
            onChange={(v) => update({ waterReliability: v })}
            options={WATER_RELIABILITY}
            placeholder="Select reliability"
          />
        </Field>
        <Field label="Water storage">
          <CheckboxGrid
            options={WATER_STORAGE}
            value={data.waterStorage || []}
            onChange={(v) => update({ waterStorage: v })}
            columns={2}
          />
        </Field>
        <Field label="Hot water">
          <Select
            value={data.hotWater}
            onChange={(v) => update({ hotWater: v })}
            options={HOT_WATER}
            placeholder="Select"
          />
        </Field>
      </div>

      {/* Electricity */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">Electricity</h3>
        <Field label="Electricity type" required>
          <Select
            value={data.electricityType}
            onChange={(v) => update({ electricityType: v })}
            options={ELECTRICITY_TYPES}
            placeholder="Select electricity type"
          />
        </Field>
        <Field label="Is electricity included in rent?">
          <Select
            value={data.electricityIncluded}
            onChange={(v) => update({ electricityIncluded: v === 'Yes' ? true : v === 'No' ? false : v })}
            options={['Yes', 'No']}
            placeholder="Select"
          />
        </Field>
        {data.electricityIncluded === false && (
          <Field label="Typical monthly electricity cost (KSh)" hint="Leave blank if you don't want to guess. Tenants can choose 'Not provided'.">
            <MoneyInput value={data.electricityTypicalCost} onChange={(v) => update({ electricityTypicalCost: v })} />
          </Field>
        )}
        <Field label="Electricity cost information">
          <Select
            value={data.electricityNotProvided ? 'Not provided' : 'Provided'}
            onChange={(v) => update({ electricityNotProvided: v === 'Not provided' })}
            options={['Provided', 'Not provided']}
          />
        </Field>
      </div>
    </div>
  );
};

export default StepWaterUtilities;
