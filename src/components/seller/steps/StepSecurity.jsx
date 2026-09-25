// src/components/seller/steps/StepSecurity.jsx
import React from 'react';
import { SECURITY_FEATURES } from '../constants/propertyTaxonomy';

const StepSecurity = ({ data, update }) => {
  const security = data.securityFeatures || {};

  const setStatus = (feature, status) => {
    update({ securityFeatures: { ...security, [feature]: status } });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Mark each security feature as <strong>Yes</strong>, <strong>No</strong>, or <strong>Not specified</strong>.
        We do not summarize this as "safe" or "unsafe" — tenants see the actual features.
      </p>
      <div className="space-y-2">
        {SECURITY_FEATURES.map((f) => {
          const val = security[f] || 'Not specified';
          return (
            <div key={f} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200 bg-white">
              <span className="text-sm text-gray-700">{f}</span>
              <div className="flex gap-1">
                {['Yes', 'No', 'Not specified'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStatus(f, opt)}
                    className={`px-2 py-1 text-xs rounded border transition
                      ${val === opt
                        ? opt === 'Yes'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : opt === 'No'
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-gray-500 text-white border-gray-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepSecurity;
