// src/components/seller/SellerPropertyUpload.jsx - Multi-step Wizard for Adding Properties
// Combines Page 1 (Property Type) and Page 3 (Basic Details) into Step 1 and adds a new property via addDoc

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

import WizardProgress from './shared/WizardProgress';
import { LAND_LIKE, HOSTEL_LIKE } from './constants/propertyTaxonomy';

import StepPropertyAndBasic from './steps/StepPropertyAndBasic';
import StepUnitRoom from './steps/StepUnitRoom';
import StepStudentInfo from './steps/StepStudentInfo';
import StepRoomOccupancy from './steps/StepRoomOccupancy';
import StepRentCosts from './steps/StepRentCosts';
import StepWaterUtilities from './steps/StepWaterUtilities';
import StepInternetGarbage from './steps/StepInternetGarbage';
import StepManagement from './steps/StepManagement';
import StepSecurity from './steps/StepSecurity';
import StepGateHouseRules from './steps/StepGateHouseRules';
import StepLocationTransport from './steps/StepLocationTransport';
import StepAmenities from './steps/StepAmenities';
import StepNearbyPlaces from './steps/StepNearbyPlaces';
import StepPhotosMedia from './steps/StepPhotosMedia';
import StepYouTubeTour from './steps/StepYouTubeTour';
import StepReview from './steps/StepReview';

const UPLOAD_STEPS = [
  { id: 'propertyAndBasic', label: 'Property & Details' },
  { id: 'unitRoom', label: 'Unit / Room' },
  { id: 'studentInfo', label: 'Student Info' },
  { id: 'roomOccupancy', label: 'Room & Occupancy' },
  { id: 'rentCosts', label: 'Price & Costs' },
  { id: 'locationTransport', label: 'Location & Transport' },
  { id: 'waterUtilities', label: 'Water & Utilities' },
  { id: 'internetGarbage', label: 'Internet & Garbage' },
  { id: 'management', label: 'Management' },
  { id: 'security', label: 'Security' },
  { id: 'gateHouseRules', label: 'Gate & Rules' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'nearbyPlaces', label: 'Nearby Places' },
  { id: 'photosMedia', label: 'Photos & Media' },
  { id: 'youTubeTour', label: 'YouTube Tour' },
  { id: 'review', label: 'Review & Submit' },
];

const initialData = {
  listingType: 'rent',
  propertyType: 'apartment',
  unitType: '',
  roomType: '',
  rentalModel: '',
  occupancy: '1',
  title: '',
  location: '',
  county: '',
  subCounty: '',
  ward: '',
  town: '',
  area: '',
  landmark: '',
  coordinates: null,
  price: '',
  deposit: '',
  billingCycle: 'monthly',
  bedrooms: '1',
  bathrooms: '1',
  areaSize: '',
  description: '',
  features: [],
  amenities: [],
  images: [],
  media: [],
};

const SellerPropertyUpload = ({ onClose, onSuccess }) => {
  const { currentUser, userProfile } = useAuth();
  const [data, setData] = useState(initialData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef(null);

  const steps = useMemo(() => {
    const isLand = LAND_LIKE.has(data.propertyType);
    const isHostel = HOSTEL_LIKE.has(data.propertyType);
    return UPLOAD_STEPS.filter((step) => {
      if (isLand && ['unitRoom', 'studentInfo', 'roomOccupancy', 'waterUtilities', 'internetGarbage', 'security', 'gateHouseRules'].includes(step.id)) {
        return false;
      }
      if (!isHostel && step.id === 'studentInfo') return false;
      return true;
    });
  }, [data.propertyType]);

  const currentStep = steps[currentStepIndex] || steps[0];

  const update = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  };

  const handleSaveAndExit = async () => {
    if (!data.title?.trim()) {
      toast.error('Please provide at least a property title');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...data,
        sellerId: currentUser?.uid || '',
        sellerEmail: currentUser?.email || '',
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'properties'), payload);
      toast.success('Property listing draft saved successfully!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error saving property draft:', error);
      toast.error('Failed to save property draft');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        sellerId: currentUser?.uid || '',
        sellerEmail: currentUser?.email || '',
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'properties'), payload);
      toast.success('New property listing submitted for review successfully!');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error('Error submitting new property:', error);
      toast.error('Failed to submit new property');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'propertyAndBasic': return <StepPropertyAndBasic data={data} update={update} />;
      case 'unitRoom': return <StepUnitRoom data={data} update={update} />;
      case 'studentInfo': return <StepStudentInfo data={data} update={update} />;
      case 'roomOccupancy': return <StepRoomOccupancy data={data} update={update} />;
      case 'rentCosts': return <StepRentCosts data={data} update={update} />;
      case 'waterUtilities': return <StepWaterUtilities data={data} update={update} />;
      case 'internetGarbage': return <StepInternetGarbage data={data} update={update} />;
      case 'management': return <StepManagement data={data} update={update} />;
      case 'security': return <StepSecurity data={data} update={update} />;
      case 'gateHouseRules': return <StepGateHouseRules data={data} update={update} />;
      case 'locationTransport': return <StepLocationTransport data={data} update={update} />;
      case 'amenities': return <StepAmenities data={data} update={update} />;
      case 'nearbyPlaces': return <StepNearbyPlaces data={data} update={update} />;
      case 'photosMedia': return <StepPhotosMedia data={data} update={update} />;
      case 'youTubeTour': return <StepYouTubeTour data={data} update={update} />;
      case 'review': return <StepReview data={data} update={update} onJump={(index) => setCurrentStepIndex(index)} />;
      default: return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Add New Property Listing</h2>
            <p className="text-xs text-slate-500">Step {currentStepIndex + 1} of {steps.length}: {currentStep.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-200/60 p-2 text-slate-600 hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Wizard Progress */}
        <div className="border-b border-slate-100 bg-white px-6 py-3">
          <WizardProgress steps={steps} currentStepIndex={currentStepIndex} onSelectStep={(idx) => setCurrentStepIndex(idx)} />
        </div>

        {/* Step Body */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/60">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-white">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {currentStepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={saving}
              className="mmx-liquid-primary inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-extrabold text-white shadow-lg disabled:opacity-50"
            >
              {saving && <Loader className="h-4 w-4 animate-spin" />}
              Submit New Listing for Review
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SellerPropertyUpload;
