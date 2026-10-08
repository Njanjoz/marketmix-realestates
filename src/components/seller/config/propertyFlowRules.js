// src/components/seller/config/propertyFlowRules.js
// Centralized decision brain for MarketMix property upload wizard flows based on Listing Type + Property Type.

import { LAND_LIKE, HOSTEL_LIKE } from '../constants/propertyTaxonomy';

export function getPropertyFlowConfig(listingType, propertyType) {
  const isLand = LAND_LIKE.has(propertyType);
  const isHostel = HOSTEL_LIKE.has(propertyType);
  const isShortStay = listingType === 'short_stay' || propertyType === 'urbannest';
  const isSale = listingType === 'sale';
  const isStudentRent = listingType === 'rent' && isHostel;

  // 10-stage experiences tailored by classification
  const activeStages = [
    'propertyAndSpace',
    isStudentRent ? 'studentInfo' : null,
    !isLand ? 'spaceOccupancy' : null,
    'priceCosts',
    'locationSurroundings',
    !isLand ? 'utilitiesServices' : null,
    'managementSecurity',
    'amenities',
    'mediaTour',
    'review',
  ].filter(Boolean);

  return {
    isLand,
    isHostel,
    isShortStay,
    isSale,
    isStudentRent,
    activeStages,
    showBedrooms: !isLand && !['single_room', 'bedsitter', 'studio_apartment'].includes(propertyType),
    showOccupancy: !isLand,
    showSharing: !isLand && occupancyIsMultiple(propertyType),
    showUtilities: !isLand,
    showSecurity: !isLand,
  };
}

function occupancyIsMultiple(propertyType) {
  return !['single_room', 'bedsitter', 'studio_apartment'].includes(propertyType);
}
