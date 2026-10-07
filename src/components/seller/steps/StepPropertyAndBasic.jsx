// src/components/seller/steps/StepPropertyAndBasic.jsx
import React from 'react';
import StepPropertyType from './StepPropertyType';
import StepBasicDetails from './StepBasicDetails';

const StepPropertyAndBasic = ({ data, update }) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-extrabold text-slate-900 mb-1">1. Property Type</h3>
        <p className="text-xs text-slate-500 mb-4">Select the category of property you are listing.</p>
        <StepPropertyType data={data} update={update} />
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-extrabold text-slate-900 mb-1">2. Basic Details</h3>
        <p className="text-xs text-slate-500 mb-4">Provide title, price, description and headline information.</p>
        <StepBasicDetails data={data} update={update} />
      </div>
    </div>
  );
};

export default StepPropertyAndBasic;
