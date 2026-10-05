const normalizeListingType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['sale', 'sell', 'buy', 'for sale', 'forsale'].includes(normalized)) return 'sale';
  if (['rent', 'rental', 'lease', 'for rent', 'for-rent'].includes(normalized)) return 'rent';
  return '';
};

export const getListingType = (property) => {
  const fields = [
    property?.listingType,
    property?.transactionType,
    property?.offerType,
    property?.status,
  ];
  return fields.map(normalizeListingType).find(Boolean) || '';
};

export const getListingTypeLabel = (property) => {
  const type = getListingType(property);
  return type === 'sale' ? 'For sale' : type === 'rent' ? 'For rent' : 'Listing type unavailable';
};
