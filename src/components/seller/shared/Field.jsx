// src/components/seller/shared/Field.jsx
import React from 'react';

export const Field = ({ label, required, hint, error, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="ml-1 text-xs text-gray-400">(optional)</span>}
      </label>
    )}
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

export const TextInput = ({ value, onChange, ...rest }) => (
  <input
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    {...rest}
  />
);

export const NumberInput = ({ value, onChange, ...rest }) => (
  <input
    type="number"
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    {...rest}
  />
);

export const TextArea = ({ value, onChange, ...rest }) => (
  <textarea
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    {...rest}
  />
);

export const Select = ({ value, onChange, options, placeholder, ...rest }) => (
  <select
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
    {...rest}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => {
      const val = typeof opt === 'string' ? opt : opt.value;
      const lbl = typeof opt === 'string' ? opt : opt.label;
      return <option key={val} value={val}>{lbl}</option>;
    })}
  </select>
);
