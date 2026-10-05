import React, { useMemo } from 'react';
import { ChevronDown, MapPinned } from 'lucide-react';
import { formatKenyaArea, getKenyaSubCounties, getKenyaWards, KENYA_COUNTIES } from '../../utils/kenyaLocationOptions';

const KenyaAreaPicker = ({ value = {}, onChange, areaLabel = 'Estate, neighbourhood or landmark', areaPlaceholder = 'Type a local place name', showSummary = true }) => {
  const subCounties = useMemo(() => getKenyaSubCounties(value.county), [value.county]);
  const wards = useMemo(() => getKenyaWards(value.subCounty), [value.subCounty]);
  const setPart = (key, partValue) => onChange({ ...value, [key]: partValue });

  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block text-xs font-bold text-slate-700">County
        <span className="relative mt-1.5 block"><select value={value.county || ''} onChange={(event) => onChange({ ...value, county: event.target.value, subCounty: '', ward: '' })} className="mmx-glass-control w-full appearance-none rounded-xl border px-3 py-3 pr-9 text-sm font-medium text-slate-900 outline-none focus:border-emerald-700"><option value="">Select county</option>{KENYA_COUNTIES.map((county) => <option key={county} value={county}>{county}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/></span>
      </label>
      <label className="block text-xs font-bold text-slate-700">Sub-county
        <span className="relative mt-1.5 block"><select value={value.subCounty || ''} onChange={(event) => onChange({ ...value, subCounty: event.target.value, ward: '' })} disabled={!value.county} className="mmx-glass-control w-full appearance-none rounded-xl border px-3 py-3 pr-9 text-sm font-medium text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-55 focus:border-emerald-700"><option value="">{value.county ? 'Select sub-county' : 'Choose county first'}</option>{subCounties.map((subCounty) => <option key={subCounty} value={subCounty}>{subCounty}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/></span>
      </label>
      <label className="block text-xs font-bold text-slate-700">Ward
        <span className="relative mt-1.5 block"><select value={value.ward || ''} onChange={(event) => setPart('ward', event.target.value)} disabled={!value.subCounty || wards.length === 0} className="mmx-glass-control w-full appearance-none rounded-xl border px-3 py-3 pr-9 text-sm font-medium text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-55 focus:border-emerald-700"><option value="">{!value.subCounty ? 'Choose sub-county first' : wards.length ? 'Select ward' : 'No ward mapping available'}</option>{wards.map((ward) => <option key={ward} value={ward}>{ward}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"/></span>
      </label>
    </div>
    <label className="block text-xs font-bold text-slate-700">{areaLabel}
      <input value={value.area || ''} onChange={(event) => setPart('area', event.target.value)} maxLength={120} placeholder={areaPlaceholder} className="mmx-glass-control mt-1.5 w-full rounded-xl border px-3 py-3 text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-700" />
    </label>
    {showSummary && (value.county || value.subCounty || value.ward || value.area) && <p className="mmx-glass-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-emerald-950"><MapPinned className="h-3.5 w-3.5 text-emerald-800"/>{formatKenyaArea(value)}</p>}
    {value.subCounty && wards.length === 0 && <p className="text-[11px] leading-4 text-slate-500">The boundaries dataset has no wards linked to this sub-county. Add the ward or landmark in the local place field.</p>}
  </div>;
};

export default KenyaAreaPicker;
