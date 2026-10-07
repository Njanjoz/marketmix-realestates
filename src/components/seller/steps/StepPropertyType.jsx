// src/components/seller/steps/StepPropertyType.jsx
import React from 'react';
import {
  BedSingle,
  BedDouble,
  Sofa,
  Hotel,
  House,
  LandPlot,
  Building2,
  Check,
} from 'lucide-react';
import { PROPERTY_TYPES } from '../constants/propertyTaxonomy';
import { Field } from '../shared/Field';

const propertyTypeIcons = {
  single_room: BedSingle,
  bedsitter: Sofa,
  studio_apartment: Building2,
  apartment: BedDouble,
  maisonette: House,
  bungalow: House,
  townhouse: Building2,
  duplex: Building2,
  standalone_house: House,
  semi_detached: House,
  student_hostel: Hotel,
  shared_house: Hotel,
  compound: Building2,
  urbannest: Hotel,
  guest_house: Hotel,
  serviced_apartment: Building2,
  land: LandPlot,
  commercial: Building2,
  other: Building2,
};

const StepPropertyType = ({ data, update, onNext }) => {
  const handleSelect = (id) => {
    const isShortStay = id === 'urbannest';
    update({
      propertyType: id,
      listingType: isShortStay ? 'rent' : data.listingType || 'rent',
      unitType: '',
      roomType: '',
      rentalModel: isShortStay ? 'Short-term' : '',
      occupancy: '1',
      sharingAllowed: false,
    });
    if (onNext) {
      setTimeout(() => onNext(), 300);
    }
  };

  return (
    <div className="space-y-4 mmx-step-enter">
      <Field
        label="What type of property are you listing?"
        required
        hint="Choose the closest match. Selecting an option immediately animates the preview and advances to relevant details."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROPERTY_TYPES.map((opt) => {
            const IconComponent = propertyTypeIcons[opt.id] || Building2;
            const selected = data.propertyType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all duration-300 relative flex items-start gap-3.5 group
                  ${
                    selected
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-md scale-[1.01] ring-2 ring-emerald-500/20'
                      : 'border-slate-200/80 hover:border-emerald-400 bg-white hover:shadow-sm'
                  }
                `}
              >
                <div
                  className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shrink-0
                    ${selected ? 'bg-emerald-600 text-white shadow-md scale-105' : 'bg-slate-100 text-slate-700'}
                  `}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1 pr-6">
                  <p className={`font-bold text-sm ${selected ? 'text-emerald-900' : 'text-slate-900'}`}>
                    {opt.label}
                  </p>
                  {opt.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
                      {opt.description}
                    </p>
                  )}
                </div>
                {selected && (
                  <span className="absolute top-4 right-4 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
};

export default StepPropertyType;
