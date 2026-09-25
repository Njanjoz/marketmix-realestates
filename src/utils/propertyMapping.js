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
