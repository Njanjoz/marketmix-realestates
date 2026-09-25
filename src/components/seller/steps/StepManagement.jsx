// src/components/seller/steps/StepManagement.jsx
import React from 'react';
import { Field, TextInput, Select } from '../shared/Field';
import {
  MANAGER_TYPES, MANAGEMENT_AVAILABILITY, RESPONSE_TIMES,
} from '../constants/propertyTaxonomy';

const StepManagement = ({ data, update }) => {
  return (
    <div className="space-y-5">
      <Field label="Who manages this property?" required>
        <Select
          value={data.managerType}
          onChange={(v) => update({ managerType: v })}
          options={MANAGER_TYPES}
          placeholder="Select manager type"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Manager name">
          <TextInput value={data.managerName} onChange={(v) => update({ managerName: v })} />
        </Field>
        <Field label="Phone">
          <TextInput value={data.managerPhone} onChange={(v) => update({ managerPhone: v })} placeholder="e.g., 0712 345 678" />
        </Field>
        <Field label="WhatsApp">
          <TextInput value={data.managerWhatsApp} onChange={(v) => update({ managerWhatsApp: v })} />
        </Field>
        <Field label="Email (if applicable)">
          <TextInput type="email" value={data.managerEmail} onChange={(v) => update({ managerEmail: v })} />
        </Field>
      </div>

      <Field label="Who handles tenant problems?">
        <Select
          value={data.problemHandler}
          onChange={(v) => update({ problemHandler: v })}
          options={MANAGER_TYPES}
          placeholder="Select"
        />
      </Field>

      <Field label="Who is physically available on site?">
        <Select
          value={data.onSitePerson}
          onChange={(v) => update({ onSitePerson: v })}
          options={['Landlord', 'Caretaker', 'Security guard', 'Manager', 'Nobody', 'Other']}
          placeholder="Select"
        />
      </Field>

      <Field label="Management availability">
        <Select
          value={data.managementAvailability}
          onChange={(v) => update({ managementAvailability: v })}
          options={MANAGEMENT_AVAILABILITY}
          placeholder="Select availability"
        />
      </Field>

      <Field label="Is there an emergency contact?">
        <Select
          value={data.emergencyContact}
          onChange={(v) => update({ emergencyContact: v })}
          options={['Yes', 'No']}
          placeholder="Select"
        />
      </Field>

      <Field label="Typical response time">
        <Select
          value={data.responseTime}
          onChange={(v) => update({ responseTime: v })}
          options={RESPONSE_TIMES}
          placeholder="Select response time"
        />
      </Field>

      <p className="text-xs text-gray-500">
        We do not compute a "management reliability score." That should come from factual information and verified tenant reviews.
      </p>
    </div>
  );
};

export default StepManagement;
