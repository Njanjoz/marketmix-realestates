// src/components/seller/shared/CheckboxGrid.jsx
import React from 'react';

const CheckboxGrid = ({ options, value = [], onChange, columns = 2 }) => {
  const toggle = (opt) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };

  const colClass = columns === 3 ? 'sm:grid-cols-3' : columns === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-2';

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-1.5`}>
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <label
            key={opt}
            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm
              ${checked ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}
            `}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt)}
              className="accent-emerald-600"
            />
            <span className="text-gray-700">{opt}</span>
          </label>
        );
      })}
    </div>
  );
};

export default CheckboxGrid;
