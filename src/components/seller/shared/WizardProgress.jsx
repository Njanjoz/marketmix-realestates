// src/components/seller/shared/WizardProgress.jsx
import React from 'react';
import { Check } from 'lucide-react';

const WizardProgress = ({ steps, currentIndex, onJump }) => {
  return (
    <div className="w-full overflow-x-auto border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1 min-w-max">
        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => onJump && idx < currentIndex && onJump(idx)}
                disabled={idx > currentIndex}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition
                  ${isCurrent ? 'bg-emerald-600 text-white' : ''}
                  ${isDone ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : ''}
                  ${!isDone && !isCurrent ? 'text-gray-400 cursor-not-allowed' : ''}
                `}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px]
                  ${isCurrent ? 'bg-white text-emerald-600' : ''}
                  ${isDone ? 'bg-emerald-600 text-white' : ''}
                  ${!isDone && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                `}>
                  {isDone ? <Check className="w-2.5 h-2.5" /> : idx + 1}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={`h-px w-3 ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;
