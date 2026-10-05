import {
  getCounties,
  getSubCountiesByCounty,
  getWardsByConstituency,
} from 'osm-kenya-boundaries';

export const KENYA_COUNTIES = getCounties()
  .map((county) => county.name)
  .sort((a, b) => a.localeCompare(b));

export const getKenyaSubCounties = (countyName) => countyName
  ? getSubCountiesByCounty(countyName).map((item) => item.name).sort((a, b) => a.localeCompare(b))
  : [];

export const getKenyaWards = (subCountyName) => subCountyName
  ? getWardsByConstituency(subCountyName).map((item) => item.name).sort((a, b) => a.localeCompare(b))
  : [];

export const formatKenyaArea = ({ area, ward, subCounty, county } = {}) => [area, ward, subCounty, county]
  .map((part) => String(part || '').trim())
  .filter(Boolean)
  .filter((part, index, parts) => parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index)
  .join(', ');
