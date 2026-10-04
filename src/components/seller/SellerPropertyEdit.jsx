// src/components/seller/SellerPropertyEdit.jsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import {
  doc, updateDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { X, ChevronLeft, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

import WizardProgress from './shared/WizardProgress';
import { WIZARD_STEPS } from './constants/wizardSteps';
import { LAND_LIKE, HOSTEL_LIKE } from './constants/propertyTaxonomy';

import StepPropertyType from './steps/StepPropertyType';
import StepUnitRoom from './steps/StepUnitRoom';
import StepBasicDetails from './steps/StepBasicDetails';
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

const normalizeImageEntries = (images = []) => {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => {
      if (!image) return null;

      if (typeof image === 'string') {
        return {
          id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          url: image,
          remoteUrl: image,
          r2Key: null,
          category: 'other',
          localPreviewUrl: null,
          status: 'uploaded',
          error: null,
        };
      }

      const remoteUrl = image.remoteUrl || image.url || image.src || image.localPreviewUrl || null;
      return {
        ...image,
        url: image.url ?? remoteUrl,
        remoteUrl: image.remoteUrl ?? remoteUrl,
        category: image.category || 'other',
        status: image.status || (remoteUrl ? 'uploaded' : 'previewing'),
      };
    })
    .filter(Boolean);
};

const hydrateImages = (property) => {
  const fromMedia = Array.isArray(property.media) ? property.media : [];
  const fromImages = Array.isArray(property.images) ? property.images : [];
  const fromPublic = Array.isArray(property.publicMedia) ? property.publicMedia : [];
  const raw = fromMedia.length > 0 ? fromMedia : (fromImages.length > 0 ? fromImages : fromPublic);
  return normalizeImageEntries(raw);
};

const initialData = {
  propertyType: 'house',
  unitType: 'Entire property',
  roomType: '',
  rentalModel: ['Monthly'],
  occupancy: '',
  totalUnits: '',
  availableUnits: '',
  propertyName: '',
  title: '',
  description: '',
  totalBedrooms: '',
  bathrooms: '',
  floors: '',
  floorNumber: '',
  yearBuilt: '',
  furnished: '',
  suitableFor: ['General'],
  genderAccommodation: 'Mixed',
  ageRestriction: '',
  institutionName: '',
  institutionType: '',
  campus: '',
  nearestCampusGate: '',
  distanceToCampus: '',
  walkingTimeToCampus: '',
  transportTimeToCampus: '',
  transportFareToCampus: '',
  studentHousingClassification: '',
  roomSize: '',
  roomLength: '',
  roomWidth: '',
  sleepingArrangement: '',
  roomFurniture: [],
  bathroom: '',
  kitchen: '',
  occupancyCount: '',
  occupancyCustom: '',
  sharingAllowed: '',
  currentOccupancy: '',
  availabilityDate: '',
  rentAmount: '',
  paymentFrequency: 'Monthly',
  depositType: "One month's rent",
  depositAmount: '',
  depositRefundable: 'Yes',
  recurringCharges: [],
  oneTimeFees: [],
  waterSource: '',
  waterIncluded: '',
  waterCharge: '',
  waterChargingMethod: '',
  waterReliability: '',
  waterStorage: [],
  hotWater: '',
  electricityType: '',
  electricityIncluded: '',
  electricityTypicalCost: '',
  electricityNotProvided: false,
  garbageCollection: '',
  garbageCharge: '',
  garbageFrequency: '',
  commonCleaning: '',
  laundryCleaning: '',
  internetOption: '',
  internetProvider: '',
  internetCost: '',
  internetSpeed: '',
  managerType: 'Landlord',
  managerName: '',
  managerPhone: '',
  managerWhatsApp: '',
  managerEmail: '',
  problemHandler: 'Landlord',
  onSitePerson: 'Landlord',
  managementAvailability: '24/7',
  emergencyContact: 'Yes',
  responseTime: 'Under 15 minutes',
  securityFeatures: {},
  hasGate: '',
  gateLocked: '',
  gateClosingTime: '',
  gateOpeningTime: '',
  afterHoursAccess: '',
  visitorPolicy: '',
  overnightVisitors: '',
  curfew: '',
  curfewTime: '',
  parties: '',
  musicPolicy: '',
  quietHoursFrom: '',
  quietHoursTo: '',
  gatherings: '',
  smoking: '',
  alcohol: '',
  pets: '',
  laundryHours: '',
  kitchenHours: '',
  location: '',
  coordinates: null,
  county: '',
  town: '',
  estate: '',
  nearestRoad: '',
  roadType: '',
  roadCondition: '',
  distanceToMainRoad: '',
  walkingTimeToMainRoad: '',
  nearestStage: '',
  distanceToStage: '',
  walkingTimeToStage: '',
  fareToCampus: '',
  fareToCBD: '',
  transportOptions: [],
  streetLighting: '',
  floodingHistory: '',
  roomAmenities: [],
  propertyAmenities: [],
  nearbyPlaces: [],
  images: [],
  youtubeUrl: '',
  youtubeVideoId: '',
};

const isStepVisible = (stepId, data) => {
  const isLand = LAND_LIKE.has(data.propertyType);
  const isHostel = HOSTEL_LIKE.has(data.propertyType);
  const suitableForStudents = (data.suitableFor || []).includes('Students');

  switch (stepId) {
    case 'studentInfo':
      return suitableForStudents || isHostel;
    case 'roomOccupancy':
      return !isLand;
    case 'waterUtilities':
    case 'internetGarbage':
    case 'amenities':
      return !isLand;
    default:
      return true;
  }
};

const validateStep = (stepId, data) => {
  const errors = {};
  const isLand = LAND_LIKE.has(data.propertyType);

  switch (stepId) {
    case 'propertyType':
      if (!data.propertyType) data.propertyType = 'house';
      break;
    case 'unitRoom':
      if (!data.unitType) data.unitType = 'Entire property';
      if (!data.rentalModel || data.rentalModel.length === 0) data.rentalModel = ['Monthly'];
      break;
    case 'basicDetails':
      if (!data.propertyName) data.propertyName = data.title || 'Property';
      if (!data.title) data.title = data.propertyName || 'Property Listing';
      if (!data.description) data.description = 'Property description';
      if (!data.genderAccommodation) data.genderAccommodation = 'Mixed';
      if (!data.suitableFor || data.suitableFor.length === 0) data.suitableFor = ['General'];
      break;
    case 'rentCosts':
      if (!data.rentAmount) data.rentAmount = data.price || 10000;
      if (!data.paymentFrequency) data.paymentFrequency = 'Monthly';
      if (!data.depositType) data.depositType = "One month's rent";
      break;
    case 'photosMedia': {
      const imgs = data.images || [];
      const uploadedCount = imgs.filter((i) => {
        if (typeof i === 'string') return i.length > 0;
        return Boolean(i && (i.remoteUrl || i.url || i.localPreviewUrl || i.file || i.status === 'uploaded' || i.status === 'previewing' || i.status === 'uploading'));
      }).length;
      if (uploadedCount === 0) {
        errors.images = 'Upload at least one image';
      }
      break;
    }
    default:
      break;
  }
  return errors;
};

const cleanUndefined = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, cleanUndefined(v)])
  );
};

const SellerPropertyEdit = ({ property, onClose, onSuccess }) => {
  const { currentUser, userProfile } = useAuth();

  const ownerId = property?.ownerId || property?.userId;
  const isOwner = ownerId && currentUser?.uid === ownerId;

  const [data, setData] = useState(() => {
    const p = property || {};
    const houseRules = p.houseRules || {};
    const gate = p.gate || {};
    const availability = p.availability || {};
    const approx = p.approxLocation || {};
    const mgmt = p.management || p.landlordContact || {};

    return cleanUndefined({
      ...initialData,
      ...p,
      ...mgmt,
      propertyType: p.propertyType || 'house',
      unitType: p.unitType || 'Entire property',
      rentalModel: p.rentalModel?.length ? p.rentalModel : ['Monthly'],
      propertyName: p.propertyName || p.title || 'Property',
      title: p.title || p.propertyName || 'Property Listing',
      description: p.description || 'Property description',
      genderAccommodation: p.genderAccommodation || 'Mixed',
      suitableFor: p.suitableFor?.length ? p.suitableFor : ['General'],
      rentAmount: p.rentAmount ?? p.price ?? 10000,
      paymentFrequency: p.paymentFrequency || 'Monthly',
      depositType: p.depositType || "One month's rent",
      totalBedrooms: p.totalBedrooms ?? p.bedrooms ?? '',
      roomAmenities: p.roomAmenities || p.amenities?.room || [],
      propertyAmenities: p.propertyAmenities || p.amenities?.property || [],
      ...houseRules,
      ...gate,
      ...availability,
      managerType: p.managerType || mgmt.managerType || 'Landlord',
      managerName: p.managerName || mgmt.managerName || '',
      managerPhone: p.managerPhone || mgmt.managerPhone || '',
      managerWhatsApp: p.managerWhatsApp || mgmt.managerWhatsApp || '',
      managerEmail: p.managerEmail || mgmt.managerEmail || '',
      problemHandler: p.problemHandler || mgmt.problemHandler || 'Landlord',
      onSitePerson: p.onSitePerson || mgmt.onSitePerson || 'Landlord',
      managementAvailability: p.managementAvailability || mgmt.managementAvailability || '24/7',
      emergencyContact: p.emergencyContact || mgmt.emergencyContact || 'Yes',
      responseTime: p.responseTime || mgmt.responseTime || 'Under 15 minutes',
      county: approx.county || p.county || '',
      town: approx.town || p.town || '',
      estate: approx.estate || p.estate || '',
      nearestRoad: approx.nearestRoad || p.nearestRoad || '',
      images: hydrateImages(p),
    });
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef(null);

  const visibleSteps = useMemo(
    () => WIZARD_STEPS.filter((s) => isStepVisible(s.id, data)),
    [data]
  );

  const currentStep = visibleSteps[Math.min(stepIndex, Math.max(visibleSteps.length - 1, 0))] || visibleSteps[0];

  useEffect(() => {
    if (visibleSteps.length === 0) return;
    if (stepIndex >= visibleSteps.length) {
      setStepIndex(visibleSteps.length - 1);
      return;
    }
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIndex, visibleSteps]);

  const update = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const goNext = () => {
    if (!currentStep || visibleSteps.length === 0) return;

    const errs = validateStep(currentStep.id, data);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setStepIndex((prev) => {
      const nextIndex = Math.min(prev + 1, visibleSteps.length - 1);
      return nextIndex === prev ? prev : nextIndex;
    });
    setErrors({});
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      setErrors({});
    }
  };

  const jumpTo = (idx) => {
    if (idx < stepIndex) {
      setStepIndex(idx);
      setErrors({});
    }
  };

  const submit = async () => {
    for (const step of visibleSteps) {
      const errs = validateStep(step.id, data);
      if (Object.keys(errs).length > 0) {
        toast.error(`Please complete the "${step.label}" step`);
        const idx = visibleSteps.findIndex((s) => s.id === step.id);
        if (idx >= 0) setStepIndex(idx);
        setErrors(errs);
        return;
      }
    }

    if (!currentUser || !isOwner) {
      toast.error('You can only edit your own listings');
      return;
    }

    setSubmitting(true);
    try {
      const pid = property.propertyId || property.id;
      if (!pid) throw new Error('Property ID is missing');

      const normalizedImages = normalizeImageEntries(data.images || []);
      const hasPendingUploads = normalizedImages.some((i) => {
        const isBlobPreview = typeof (i?.localPreviewUrl || i?.remoteUrl || i?.url) === 'string' &&
          (i.localPreviewUrl || i.remoteUrl || i.url).startsWith('blob:');
        return (i.status === 'previewing' || i.status === 'uploading') && !isBlobPreview;
      });

      if (hasPendingUploads) {
        toast.error('Please wait for the image uploads to finish before saving the listing.');
        setSubmitting(false);
        return;
      }

      const uploadedImages = normalizedImages
        .filter((i) => i.remoteUrl || i.url || i.localPreviewUrl || i.file)
        .map((i) => {
          const url = i.remoteUrl || i.url || i.localPreviewUrl || '';
          const cleanUrl = typeof url === 'string' && url.startsWith('blob:') ? '' : url;
          return {
            url: cleanUrl,
            key: i.r2Key || i.key || null,
            category: i.category || 'other',
          };
        })
        .filter((i) => i.url && !i.url.startsWith('blob:'));

      const publicMedia = uploadedImages.map((i) => i.url);

      const snap = await getDoc(doc(db, 'properties', pid));
      const existing = snap.exists() ? snap.data() : {};

      const updatePayload = cleanUndefined({
        ...existing,
        propertyId: pid,
        propertyType: data.propertyType,
        unitType: data.unitType,
        roomType: data.roomType,
        rentalModel: data.rentalModel,
        occupancy: data.occupancy,
        title: data.title,
        propertyName: data.propertyName,
        description: data.description,
        campus: data.campus,
        institutionName: data.institutionName,
        institutionType: data.institutionType,
        studentHousingClassification: data.studentHousingClassification,
        rentAmount: Number(data.rentAmount) || 0,
        price: Number(data.rentAmount) || 0,
        paymentFrequency: data.paymentFrequency,
        depositType: data.depositType,
        depositAmount:
          data.depositType === "One month's rent"
            ? Number(data.rentAmount) || 0
            : Number(data.depositAmount || 0),
        depositRefundable: data.depositRefundable,
        recurringCharges: data.recurringCharges || [],
        oneTimeFees: data.oneTimeFees || [],
        waterIncluded: data.waterIncluded,
        waterSource: data.waterSource,
        waterReliability: data.waterReliability,
        waterStorage: data.waterStorage,
        hotWater: data.hotWater,
        electricityType: data.electricityType,
        electricityIncluded: data.electricityIncluded,
        internetOption: data.internetOption,
        internetProvider: data.internetProvider,
        garbageCollection: data.garbageCollection,
        commonCleaning: data.commonCleaning,
        laundryCleaning: data.laundryCleaning,
        roadType: data.roadType,
        roadCondition: data.roadCondition,
        distanceToCampus: data.distanceToCampus,
        distanceToMainRoad: data.distanceToMainRoad,
        walkingTimeToCampus: data.walkingTimeToCampus,
        walkingTimeToMainRoad: data.walkingTimeToMainRoad,
        nearestStage: data.nearestStage,
        distanceToStage: data.distanceToStage,
        walkingTimeToStage: data.walkingTimeToStage,
        fareToCampus: data.fareToCampus,
        fareToCBD: data.fareToCBD,
        transportOptions: data.transportOptions,
        streetLighting: data.streetLighting,
        floodingHistory: data.floodingHistory,
        amenities: {
          room: data.roomAmenities || [],
          property: data.propertyAmenities || [],
        },
        roomAmenities: data.roomAmenities || [],
        propertyAmenities: data.propertyAmenities || [],
        securityFeatures: data.securityFeatures || {},
        managerType: data.managerType,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerWhatsApp: data.managerWhatsApp,
        managerEmail: data.managerEmail,
        problemHandler: data.problemHandler,
        onSitePerson: data.onSitePerson,
        managementAvailability: data.managementAvailability,
        emergencyContact: data.emergencyContact,
        responseTime: data.responseTime,
        management: {
          managerType: data.managerType,
          managerName: data.managerName,
          managerPhone: data.managerPhone,
          managerWhatsApp: data.managerWhatsApp,
          managerEmail: data.managerEmail,
          problemHandler: data.problemHandler,
          onSitePerson: data.onSitePerson,
          managementAvailability: data.managementAvailability,
          emergencyContact: data.emergencyContact,
          responseTime: data.responseTime,
        },
        houseRules: {
          parties: data.parties,
          musicPolicy: data.musicPolicy,
          quietHoursFrom: data.quietHoursFrom,
          quietHoursTo: data.quietHoursTo,
          gatherings: data.gatherings,
          smoking: data.smoking,
          alcohol: data.alcohol,
          pets: data.pets,
          laundryHours: data.laundryHours,
          kitchenHours: data.kitchenHours,
          visitorPolicy: data.visitorPolicy,
          overnightVisitors: data.overnightVisitors,
          curfew: data.curfew,
          curfewTime: data.curfewTime,
        },
        gate: {
          hasGate: data.hasGate,
          gateLocked: data.gateLocked,
          gateClosingTime: data.gateClosingTime,
          gateOpeningTime: data.gateOpeningTime,
          afterHoursAccess: data.afterHoursAccess,
        },
        approxLocation: {
          county: data.county,
          town: data.town,
          estate: data.estate,
          nearestRoad: data.nearestRoad,
        },
        location: data.location,
        publicMedia,
        media: uploadedImages,
        nearbyPlaces: data.nearbyPlaces,
        availability: {
          currentOccupancy: data.currentOccupancy,
          availabilityDate: data.availabilityDate,
          availableUnits: data.availableUnits,
          totalUnits: data.totalUnits,
        },
        bedrooms: Number(data.totalBedrooms) || 0,
        bathrooms: Number(data.bathrooms) || 0,
        area: 0,
        images: publicMedia,
        status: data.status || 'active',
        approvalStatus: 'pending',
        previousApprovalStatus: existing.approvalStatus || property.approvalStatus,
        verificationStatus: 'pending',
        userId: property.userId || currentUser.uid,
        ownerId: property.ownerId || currentUser.uid,
        userEmail: property.userEmail || currentUser.email,
        userName: property.userName || userProfile?.name || currentUser.displayName || '',
        userType: 'seller',
        updatedAt: serverTimestamp(),
        youtubeVideoId: data.youtubeVideoId || '',
      });

      const protectedData = cleanUndefined({
        propertyId: pid,
        ownerId: property.ownerId || currentUser.uid,
        userId: property.userId || currentUser.uid,
        exactLocation: data.coordinates,
        landlordContact: {
          managerType: data.managerType,
          managerName: data.managerName,
          managerPhone: data.managerPhone,
          managerWhatsApp: data.managerWhatsApp,
          managerEmail: data.managerEmail,
          problemHandler: data.problemHandler,
          onSitePerson: data.onSitePerson,
          managementAvailability: data.managementAvailability,
          emergencyContact: data.emergencyContact,
          responseTime: data.responseTime,
        },
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'properties', pid), updatePayload);
      await updateDoc(doc(db, 'properties_protected', pid), protectedData).catch(() => {});

      toast.success('Property updated successfully! Sent for admin review.');
      onSuccess?.({ propertyId: pid });
      onClose();
    } catch (e) {
      console.error('Error updating property:', e);
      toast.error(e.message || 'Failed to update property');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'propertyType': return <StepPropertyType data={data} update={update} />;
      case 'unitRoom': return <StepUnitRoom data={data} update={update} />;
      case 'basicDetails': return <StepBasicDetails data={data} update={update} />;
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
      case 'youtubeTour': return <StepYouTubeTour data={data} update={update} />;
      case 'review': return <StepReview data={data} />;
      default: return null;
    }
  };

  if (!isOwner) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Not allowed</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">You can only edit your own listings.</p>
          <button onClick={onClose} className="w-full py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-3xl my-4 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Property Wizard</h2>
            <p className="text-xs text-gray-500">
              Step {stepIndex + 1} of {visibleSteps.length} · {currentStep.label}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg" disabled={submitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <WizardProgress steps={visibleSteps} currentIndex={stepIndex} onJump={jumpTo} />

        <div ref={bodyRef} className="p-5 overflow-y-auto flex-1">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-xs text-red-700 space-y-0.5">
                {Object.values(errors).map((e, i) => (
                  <p key={i}>• {e}</p>
                ))}
              </div>
            </div>
          )}
          {renderStepContent()}
        </div>

        <div className="border-t border-gray-200 px-5 py-3 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            {stepIndex < visibleSteps.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1 px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-sm disabled:opacity-50"
              >
                {submitting && <Loader className="w-4 h-4 animate-spin" />}
                Update Property
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPropertyEdit;
