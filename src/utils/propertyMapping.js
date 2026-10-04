// src/utils/propertyMapping.js

// FIELDS REQUIRED FOR SEARCH, COMPARISON, AND DISCOVERY (PUBLIC)
export const PUBLIC_FIELDS = [
  'title', 'propertyType', 'unitType', 'roomType', 'rentalModel', 'occupancy', 
  'status', 'price', 'currency', 'approximateLocation', 'institution', 
  'bedrooms', 'bathrooms', 'floors', 'floorNumber', 'furnished', 
  'publicAmenities', 'previewDescription', 'coverImage', 'verificationStatus', 
  'verificationLevel', 'createdAt', 'updatedAt', 'isProtected',
  
  // Comparative fields
  'depositAmount', 'paymentFrequency', 'waterIncluded', 'electricityIncluded', 
  'roadType', 'distanceToCampus', 'distanceToMainRoad'
];

// FIELDS REQUIRED FOR ENTITLEMENT (PROTECTED)
export const PROTECTED_FIELDS = [
  'propertyId', 'exactAddress', 'exactCoordinates', 'rentAmount', 'depositAmount', 
  'agencyFeeAmount', 'viewingFeeAmount', 'applicationFeeAmount', 'agreementFeeAmount',
  'keyDepositAmount', 'cleaningFeeAmount', 'otherFees', 'paymentFrequency',
  'waterCost', 'waterReliability', 'waterSource', 'waterStorage', 'hotWaterType',
  'electricityType', 'electricityTypicalCost', 'garbageCost', 'garbageFrequency',
  'commonAreaCleaning', 'laundryAreaCleaning', 'internetDetails',
  'nearestRoadName', 'walkingTimeToMainRoad', 'transportFareToCampus', 'transportFareToCBD',
  'floodingStatus', 'streetLighting', 'securityFeatures', 'managementDetails',
  'managementContact', 'emergencyContact', 'managerLivesOnSite', 'caretakerLivesOnSite',
  'gateLockedAt', 'gateOpenedAt', 'afterHoursAccess', 'visitorPolicy', 
  'overnightVisitors', 'curfew', 'noisePolicy', 'smokingPolicy', 'alcoholPolicy', 
  'petsPolicy', 'laundryHours', 'kitchenHours', 'fullDescription', 'fullGalleryKeys', 
  'youtubeVideoId', 'youtubeUrl'
];

const isPersistableImageUrl = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return false;
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:image/');
};

export const resolvePropertyImage = (property) => {
  if (!property) return '';

  const candidates = [
    property.coverImage,
    property.images,
    property.publicMedia,
    property.media,
    property.gallery,
    property.photos,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && isPersistableImageUrl(candidate)) {
      return candidate;
    }

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === 'string' && isPersistableImageUrl(item)) return item;
        if (item && typeof item === 'object') {
          const url = item.remoteUrl || item.url || item.src || item.localPreviewUrl || item.preview;
          if (isPersistableImageUrl(url)) return url;
        }
      }
    }

    if (candidate && typeof candidate === 'object') {
      const url = candidate.remoteUrl || candidate.url || candidate.src || candidate.localPreviewUrl || candidate.preview;
      if (isPersistableImageUrl(url)) return url;
    }
  }

  return '';
};
