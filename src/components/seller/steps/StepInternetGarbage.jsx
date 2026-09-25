// src/components/seller/steps/StepInternetGarbage.jsx
import React from 'react';
import { Field, Select, TextInput } from '../shared/Field';
import MoneyInput from '../shared/MoneyInput';
import { INTERNET_OPTIONS, GARBAGE_OPTIONS, CLEANING_OPTIONS, LAND_LIKE } from '../constants/propertyTaxonomy';

const StepInternetGarbage = ({ data, update }) => {
  if (LAND_LIKE.has(data.propertyType)) {
    return <p className="text-gray-500 text-sm">Not applicable to land listings.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">Garbage & Cleaning</h3>
        <Field label="Garbage collection">
          <Select
            value={data.garbageCollection}
            onChange={(v) => update({ garbageCollection: v })}
            options={GARBAGE_OPTIONS}
            placeholder="Select"
          />
        </Field>
        {data.garbageCollection === 'Extra charge' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Amount (KSh)">
              <MoneyInput value={data.garbageCharge} onChange={(v) => update({ garbageCharge: v })} />
            </Field>
            <Field label="Frequency">
              <Select
                value={data.garbageFrequency}
                onChange={(v) => update({ garbageFrequency: v })}
                options={['Daily', 'Weekly', 'Monthly', 'Other']}
                placeholder="Select frequency"
              />
            </Field>
          </div>
        )}
        <Field label="Common-area cleaning">
          <Select
            value={data.commonCleaning}
            onChange={(v) => update({ commonCleaning: v })}
            options={CLEANING_OPTIONS}
            placeholder="Select"
          />
        </Field>
        <Field label="Laundry-area cleaning">
          <Select
            value={data.laundryCleaning}
            onChange={(v) => update({ laundryCleaning: v })}
            options={CLEANING_OPTIONS}
            placeholder="Select"
          />
        </Field>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">Internet</h3>
        <Field label="Internet availability" required>
          <Select
            value={data.internetOption}
            onChange={(v) => update({ internetOption: v })}
            options={INTERNET_OPTIONS}
            placeholder="Select internet option"
          />
        </Field>
        {['Wi-Fi included', 'Wi-Fi available at extra cost', 'Fibre available'].includes(data.internetOption) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Provider">
              <TextInput value={data.internetProvider} onChange={(v) => update({ internetProvider: v })} placeholder="e.g., Zuku, Safaricom" />
            </Field>
            <Field label="Monthly cost (KSh)">
              <MoneyInput value={data.internetCost} onChange={(v) => update({ internetCost: v })} />
            </Field>
            <Field label="Speed (if known)" className="sm:col-span-2">
              <TextInput value={data.internetSpeed} onChange={(v) => update({ internetSpeed: v })} placeholder="e.g., 10 Mbps" />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepInternetGarbage;
