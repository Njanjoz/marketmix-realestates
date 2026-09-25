// src/components/seller/steps/StepGateHouseRules.jsx
import React from 'react';
import { Field, Select, TextInput } from '../shared/Field';
import {
  GATE_LOCKED, AFTER_HOURS_ACCESS, VISITOR_POLICY, OVERNIGHT_VISITORS,
  CURFEW_OPTIONS, PARTY_POLICY, MUSIC_POLICY, GATHERING_POLICY,
  SMOKING_POLICY, ALCOHOL_POLICY, PETS_POLICY, HOURS_POLICY,
} from '../constants/propertyTaxonomy';

const StepGateHouseRules = ({ data, update }) => {
  const hasQuietHours = ['Allowed until specific time', 'Quiet hours enforced'].includes(data.musicPolicy);

  return (
    <div className="space-y-5">
      {/* Gate */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">Gate & Access</h3>
        <Field label="Does the property have a gate?">
          <Select value={data.hasGate} onChange={(v) => update({ hasGate: v })} options={['Yes', 'No']} placeholder="Select" />
        </Field>
        {data.hasGate === 'Yes' && (
          <>
            <Field label="Gate normally locked">
              <Select value={data.gateLocked} onChange={(v) => update({ gateLocked: v })} options={GATE_LOCKED} placeholder="Select" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gate closing time">
                <TextInput type="time" value={data.gateClosingTime} onChange={(v) => update({ gateClosingTime: v })} />
              </Field>
              <Field label="Gate opening time">
                <TextInput type="time" value={data.gateOpeningTime} onChange={(v) => update({ gateOpeningTime: v })} />
              </Field>
            </div>
            <Field label="After-hours access">
              <Select value={data.afterHoursAccess} onChange={(v) => update({ afterHoursAccess: v })} options={AFTER_HOURS_ACCESS} placeholder="Select" />
            </Field>
          </>
        )}
        <Field label="Visitor policy">
          <Select value={data.visitorPolicy} onChange={(v) => update({ visitorPolicy: v })} options={VISITOR_POLICY} placeholder="Select" />
        </Field>
        <Field label="Overnight visitors">
          <Select value={data.overnightVisitors} onChange={(v) => update({ overnightVisitors: v })} options={OVERNIGHT_VISITORS} placeholder="Select" />
        </Field>
        <Field label="Curfew">
          <Select value={data.curfew} onChange={(v) => update({ curfew: v })} options={CURFEW_OPTIONS} placeholder="Select" />
        </Field>
        {data.curfew === 'Specific time' && (
          <Field label="Curfew time">
            <TextInput type="time" value={data.curfewTime} onChange={(v) => update({ curfewTime: v })} />
          </Field>
        )}
      </div>

      {/* House Rules */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">House Rules & Lifestyle</h3>
        <Field label="Parties">
          <Select value={data.parties} onChange={(v) => update({ parties: v })} options={PARTY_POLICY} placeholder="Select" />
        </Field>
        <Field label="Loud music">
          <Select value={data.musicPolicy} onChange={(v) => update({ musicPolicy: v })} options={MUSIC_POLICY} placeholder="Select" />
        </Field>
        {hasQuietHours && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quiet hours from">
              <TextInput type="time" value={data.quietHoursFrom} onChange={(v) => update({ quietHoursFrom: v })} />
            </Field>
            <Field label="Quiet hours to">
              <TextInput type="time" value={data.quietHoursTo} onChange={(v) => update({ quietHoursTo: v })} />
            </Field>
          </div>
        )}
        <Field label="Gatherings">
          <Select value={data.gatherings} onChange={(v) => update({ gatherings: v })} options={GATHERING_POLICY} placeholder="Select" />
        </Field>
        <Field label="Smoking">
          <Select value={data.smoking} onChange={(v) => update({ smoking: v })} options={SMOKING_POLICY} placeholder="Select" />
        </Field>
        <Field label="Alcohol">
          <Select value={data.alcohol} onChange={(v) => update({ alcohol: v })} options={ALCOHOL_POLICY} placeholder="Select" />
        </Field>
        <Field label="Pets">
          <Select value={data.pets} onChange={(v) => update({ pets: v })} options={PETS_POLICY} placeholder="Select" />
        </Field>
        <Field label="Laundry hours">
          <Select value={data.laundryHours} onChange={(v) => update({ laundryHours: v })} options={HOURS_POLICY} placeholder="Select" />
        </Field>
        <Field label="Kitchen hours">
          <Select value={data.kitchenHours} onChange={(v) => update({ kitchenHours: v })} options={HOURS_POLICY} placeholder="Select" />
        </Field>
      </div>
    </div>
  );
};

export default StepGateHouseRules;
