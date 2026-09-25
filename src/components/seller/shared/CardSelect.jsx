// src/components/seller/shared/CardSelect.jsx
import React from 'react';
import { Check } from 'lucide-react';

const CardSelect = ({ options, value, onChange, columns = 2, allowCustom = false }) => {
  const isSelected = (id) => value === id;

  const colClass = columns === 3 ? 'sm:grid-cols-3' : columns === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-2';

  return (
    <div className={`grid grid-cols-1 ${colClass} gap-2`}>
      {options.map((opt) => {
        const id = typeof opt === 'string' ? opt : opt.id;
        const label = typeof opt === 'string' ? opt : opt.label;
        const description = typeof opt === 'string' ? '' : opt.description;
        const selected = isSelected(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`text-left p-3 rounded-lg border-2 transition relative
              ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 bg-white'}
            `}
          >
            {selected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            <p className="font-medium text-sm text-gray-900 pr-6">{label}</p>
            {description && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{description}</p>}
          </button>
        );
      })}
    </div>
  );
};

export default CardSelect;
