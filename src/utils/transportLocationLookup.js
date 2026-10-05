import { getKenyaSubCounties, getKenyaWards, KENYA_COUNTIES } from './kenyaLocationOptions';

const nominatimCache = new Map();
let nominatimQueue = Promise.resolve();
let lastNominatimRequestAt = 0;

const fetchNominatimJson = async (url, cacheKey) => {
  if (nominatimCache.has(cacheKey)) return nominatimCache.get(cacheKey);
  const request = nominatimQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastNominatimRequestAt));
    if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
    lastNominatimRequestAt = Date.now();
    const response = await fetch(url);
    if (!response.ok) throw new Error('Location lookup is unavailable.');
    const result = await response.json();
    nominatimCache.set(cacheKey, result);
    return result;
  });
  nominatimQueue = request.catch(() => undefined);
  return request;
};

const normalizeAdminName = (value) => String(value || '')
  .toLocaleLowerCase()
  .replace(/\b(county|constituency|sub[\s-]?county|ward|district|municipality|city)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const findKnownName = (options, values) => {
  const normalizedOptions = options.map((option) => ({ option, normalized: normalizeAdminName(option) }));
  for (const value of values) {
    const normalizedValue = normalizeAdminName(value);
    if (!normalizedValue) continue;
    const exact = normalizedOptions.find((item) => item.normalized === normalizedValue);
    if (exact) return exact.option;
    if (normalizedValue.length < 4) continue;
    const containing = normalizedOptions.find((item) => normalizedValue.startsWith(`${item.normalized} `) || item.normalized.startsWith(`${normalizedValue} `));
    if (containing) return containing.option;
  }
  return '';
};

export const parseKenyaLocationAddress = (address = {}, fallbackName = '') => {
  const county = findKnownName(KENYA_COUNTIES, [
    address.state,
    address.region,
    address.county,
    address.state_district,
    address.city,
    address.town,
  ]);
  const subCounty = county ? findKnownName(getKenyaSubCounties(county), [
    address.county,
    address.city_district,
    address.state_district,
    address.municipality,
    address.district,
    address.borough,
    address.constituency,
    address.city,
    address.town,
  ]) : '';
  const ward = subCounty ? findKnownName(getKenyaWards(subCounty), [
    address.ward,
    address.city_district,
    address.suburb,
    address.neighbourhood,
    address.residential,
    address.quarter,
    address.village,
    address.hamlet,
  ]) : '';
  const area = [
    fallbackName,
    address.neighbourhood,
    address.suburb,
    address.residential,
    address.quarter,
    address.village,
    address.hamlet,
    address.town,
    address.city,
    address.road,
  ].map((value) => String(value || '').trim()).find((value) => value && ![county, subCounty, ward].some((part) => part && normalizeAdminName(part) === normalizeAdminName(value))) || '';

  return { county, subCounty, ward, area };
};

export const reverseGeocodeKenyaPoint = async ({ lat, lng }) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'en',
  });
  const cacheKey = `reverse:${Number(lat).toFixed(5)}:${Number(lng).toFixed(5)}`;
  const result = await fetchNominatimJson(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, cacheKey);
  return {
    label: result.name || result.address?.neighbourhood || result.address?.suburb || result.address?.town || result.address?.city || '',
    area: parseKenyaLocationAddress(result.address || {}, result.name || ''),
  };
};

export const searchKenyaLocations = async (query) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: `${query.trim()}, Kenya`,
    countrycodes: 'ke',
    addressdetails: '1',
    limit: '6',
    'accept-language': 'en',
  });
  const cacheKey = `search:${query.trim().toLocaleLowerCase()}`;
  const results = await fetchNominatimJson(`https://nominatim.openstreetmap.org/search?${params.toString()}`, cacheKey);
  return results.map((result) => ({
    label: result.name || result.display_name?.split(',').slice(0, 2).join(',').trim() || 'Selected location',
    displayName: result.display_name || result.name || 'Selected location',
    point: { lat: Number(result.lat), lng: Number(result.lon) },
    area: parseKenyaLocationAddress(result.address || {}, result.name || ''),
  })).filter((result) => Number.isFinite(result.point.lat) && Number.isFinite(result.point.lng));
};
