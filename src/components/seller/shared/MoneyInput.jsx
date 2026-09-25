// src/components/seller/shared/MoneyInput.jsx
import React from 'react';

const MoneyInput = ({ value, onChange, placeholder = '0', ...rest }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">KSh</span>
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-12 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      {...rest}
    />
  </div>
);

export default MoneyInput;
