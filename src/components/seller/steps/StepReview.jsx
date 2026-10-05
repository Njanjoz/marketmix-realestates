// src/components/seller/steps/StepReview.jsx
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import CostSummary from '../shared/CostSummary';

const Row = ({ label, value }) => (
  value ? (
    <div className="flex justify-between text-sm py-1 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  ) : null
);

const Section = ({ title, children }) => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-1">
    <h3 className="font-semibold text-gray-800 text-sm mb-2">{title}</h3>
    {children}
  </div>
);

const StepReview = ({ data }) => {
  const validImages = (data.images || []).filter((i) => i.status === 'uploaded' || i.remoteUrl || i.url || i.localPreviewUrl || i.file);

  const checks = [
    { label: 'Listing type', ok: ['sale', 'rent'].includes(data.listingType) },
    { label: 'Price', ok: !!data.rentAmount },
    { label: 'Deposit', ok: !!data.depositType },
    { label: 'Utilities', ok: !!data.waterSource && !!data.electricityType },
    { label: 'Location', ok: !!data.coordinates },
    { label: 'Management', ok: !!data.managerType },
    { label: 'Security', ok: !!data.securityFeatures && Object.keys(data.securityFeatures).length > 0 },
    { label: 'Photos', ok: validImages.length > 0 },
  ];

  const optionalWarnings = [];
  const uploadedCats = new Set(validImages.map((i) => i.category));
  if (!uploadedCats.has('bathroom')) optionalWarnings.push('Bathroom photo missing');
  if (!uploadedCats.has('road')) optionalWarnings.push('Road photo missing');

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="font-semibold text-emerald-900 text-sm mb-2">Listing completeness</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 text-xs">
              {c.ok ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className={c.ok ? 'text-emerald-800' : 'text-amber-700'}>{c.label}</span>
            </div>
          ))}
        </div>
        {optionalWarnings.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {optionalWarnings.map((w) => (
              <p key={w} className="text-xs text-amber-700">⚠ {w}</p>
            ))}
          </div>
        )}
      </div>

      <Section title="Property">
        <Row label="Listing type" value={data.listingType === 'sale' ? 'For sale' : data.listingType === 'rent' ? 'For rent' : ''} />
        <Row label="Property type" value={data.propertyType} />
        <Row label="Unit type" value={data.unitType} />
        <Row label="Room type" value={data.roomType} />
        <Row label="Rental model" value={Array.isArray(data.rentalModel) ? data.rentalModel.join(', ') : data.rentalModel} />
        <Row label="Occupancy" value={data.occupancy} />
        <Row label="Title" value={data.title} />
        <Row label="Description" value={data.description} />
      </Section>

      <Section title="Rent & Costs">
        <Row label="Rent" value={data.rentAmount ? `KSh ${Number(data.rentAmount).toLocaleString()}` : ''} />
        <Row label="Payment frequency" value={data.paymentFrequency} />
        <Row label="Deposit" value={data.depositType} />
        <CostSummary
          costs={{
            rent: data.rentAmount,
            paymentFrequency: data.paymentFrequency,
            depositAmount: data.depositType === "One month's rent" ? Number(data.rentAmount || 0) : Number(data.depositAmount || 0),
            recurringCharges: data.recurringCharges || [],
            oneTimeFees: data.oneTimeFees || [],
          }}
        />
      </Section>

      <Section title="Utilities">
        <Row label="Water source" value={data.waterSource} />
        <Row label="Water included" value={data.waterIncluded === true ? 'Yes' : data.waterIncluded === false ? 'No' : ''} />
        <Row label="Electricity type" value={data.electricityType} />
        <Row label="Internet" value={data.internetOption} />
        <Row label="Garbage" value={data.garbageCollection} />
      </Section>

      <Section title="Management">
        <Row label="Manager" value={data.managerType} />
        <Row label="Name" value={data.managerName} />
        <Row label="Phone" value={data.managerPhone} />
        <Row label="Availability" value={data.managementAvailability} />
        <Row label="Response time" value={data.responseTime} />
      </Section>

      <Section title="Security">
        {data.securityFeatures && Object.entries(data.securityFeatures).length > 0 ? (
          Object.entries(data.securityFeatures)
            .filter(([, v]) => v === 'Yes')
            .map(([k]) => <Row key={k} label={k} value="Yes" />)
        ) : (
          <p className="text-xs text-gray-500">No security features specified.</p>
        )}
      </Section>

      <Section title="House Rules">
        <Row label="Parties" value={data.parties} />
        <Row label="Music" value={data.musicPolicy} />
        <Row label="Smoking" value={data.smoking} />
        <Row label="Pets" value={data.pets} />
        <Row label="Visitors" value={data.visitorPolicy} />
      </Section>

      <Section title="Location & Transport">
        <Row label="Address" value={data.location} />
        <Row label="Coordinates" value={data.coordinates ? `${data.coordinates.lat.toFixed(5)}, ${data.coordinates.lng.toFixed(5)}` : ''} />
        <Row label="Distance to campus" value={data.distanceToCampus} />
        <Row label="Road type" value={data.roadType} />
        <Row label="Nearest stage" value={data.nearestStage} />
      </Section>

      <Section title="Media">
        <Row label="Photos uploaded" value={`${validImages.length} image(s)`} />
        <Row label="YouTube tour" value={data.youtubeVideoId ? `https://youtu.be/${data.youtubeVideoId}` : 'None'} />
      </Section>

      <p className="text-xs text-gray-500">
        By submitting, your listing will be reviewed by an admin before appearing publicly. Verification status will be set to <strong>pending</strong>.
      </p>
    </div>
  );
};

export default StepReview;
