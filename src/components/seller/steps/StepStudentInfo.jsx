// src/components/seller/steps/StepStudentInfo.jsx
import React from 'react';
import { Field, TextInput, Select } from '../shared/Field';
import CardSelect from '../shared/CardSelect';
import {
  INSTITUTION_TYPES,
  STUDENT_HOUSING_CLASSIFICATION,
} from '../constants/propertyTaxonomy';

const StepStudentInfo = ({ data, update }) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        This step helps students understand how convenient this property is for their campus.
      </div>

      <Field label="Which institution is this property convenient for?" required hint="Search or type the institution name.">
        <TextInput
          value={data.institutionName}
          onChange={(v) => update({ institutionName: v })}
          placeholder="e.g., University of Nairobi"
        />
      </Field>

      <Field label="Institution type" required>
        <Select
          value={data.institutionType}
          onChange={(v) => update({ institutionType: v })}
          options={INSTITUTION_TYPES}
          placeholder="Select type"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Campus name">
          <TextInput
            value={data.campus}
            onChange={(v) => update({ campus: v })}
            placeholder="e.g., Main Campus"
          />
        </Field>
        <Field label="Nearest campus gate">
          <TextInput
            value={data.nearestCampusGate}
            onChange={(v) => update({ nearestCampusGate: v })}
            placeholder="e.g., Gate C"
          />
        </Field>
        <Field label="Distance to campus" required>
          <TextInput
            value={data.distanceToCampus}
            onChange={(v) => update({ distanceToCampus: v })}
            placeholder="e.g., 1.2 km"
          />
        </Field>
        <Field label="Walking time" required>
          <TextInput
            value={data.walkingTimeToCampus}
            onChange={(v) => update({ walkingTimeToCampus: v })}
            placeholder="e.g., 15 minutes"
          />
        </Field>
        <Field label="Typical transport time">
          <TextInput
            value={data.transportTimeToCampus}
            onChange={(v) => update({ transportTimeToCampus: v })}
            placeholder="e.g., 5 minutes"
          />
        </Field>
        <Field label="Typical transport fare to campus">
          <TextInput
            value={data.transportFareToCampus}
            onChange={(v) => update({ transportFareToCampus: v })}
            placeholder="e.g., KSh 50"
          />
        </Field>
      </div>

      <Field label="Student housing classification" required>
        <CardSelect
          options={STUDENT_HOUSING_CLASSIFICATION.map((c) => ({ id: c, label: c }))}
          value={data.studentHousingClassification}
          onChange={(v) => update({ studentHousingClassification: v })}
          columns={2}
        />
      </Field>
    </div>
  );
};

export default StepStudentInfo;
