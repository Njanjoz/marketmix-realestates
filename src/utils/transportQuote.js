// Indicative local moving quote calibrated to the user's Nakuru tuk-tuk example.
// Road distance is approximated from the map pins; providers confirm the final fare.
export const TRANSPORT_QUOTE_BASE_KES = 1500;
export const TRANSPORT_QUOTE_BASE_KM = 3.2;
export const TRANSPORT_QUOTE_EXTRA_KM_KES = 70;
const ROAD_DISTANCE_FACTOR = 1.15;

export function estimateTransportQuote(pickup, destination) {
  const lat1 = Number(pickup?.lat ?? pickup?.latitude);
  const lon1 = Number(pickup?.lng ?? pickup?.longitude);
  const lat2 = Number(destination?.lat ?? destination?.latitude);
  const lon2 = Number(destination?.lng ?? destination?.longitude);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  const straightLineKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const estimatedRouteKm = straightLineKm * ROAD_DISTANCE_FACTOR;
  const rawPrice = TRANSPORT_QUOTE_BASE_KES
    + Math.max(0, estimatedRouteKm - TRANSPORT_QUOTE_BASE_KM) * TRANSPORT_QUOTE_EXTRA_KM_KES;

  return {
    estimatedRouteKm: Math.round(estimatedRouteKm * 10) / 10,
    estimatedPrice: Math.ceil(rawPrice / 50) * 50,
  };
}
