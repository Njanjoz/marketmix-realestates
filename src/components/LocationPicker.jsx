// src/components/LocationPicker.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Crosshair, Loader, CheckCircle, AlertCircle, X, RefreshCw, Search, Landmark, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { search as searchKenyaBoundaries } from 'osm-kenya-boundaries';
import { getCurrentLocation } from '../services/locationService';
import { isCapacitor } from '../utils/platform';

const LocationPicker = ({ onLocationSelect, initialLocation = null, label = "Property Location" }) => {
  const [location, setLocation] = useState(initialLocation || { 
    lat: null, 
    lng: null, 
    address: '', 
    county: '', 
    constituency: '', 
    ward: '', 
    town: '', 
    estate: '', 
    nearestRoad: '',
    gpsAccuracy: null,
    locationSource: 'manual-map-selection', // 'device-gps', 'browser-location', 'manual-map-selection', 'search-selection'
    locationAccuracyStatus: 'unknown', // 'Excellent', 'Good', 'Approximate', 'Too inaccurate'
    landmarks: [] 
  });
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  const [mode, setMode] = useState('select'); // 'select', 'manual', 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [pendingCoordinates, setPendingCoordinates] = useState(null);
  const [pendingLocationName, setPendingLocationName] = useState('');
  const [loadingLandmarks, setLoadingLandmarks] = useState(false);
  
  const watchIdRef = useRef(null);
  const isManualOrSearchRef = useRef(false);
  const activeLocationRequestRef = useRef(false);

  // Clean up geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        console.log("GPS watcher cleared (unmount)");
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Fetch nearby landmarks using Overpass API (100% free, no API key)
  const fetchNearbyLandmarks = async (lat, lon) => {
    if (!lat || !lon) return [];
    setLoadingLandmarks(true);
    try {
      const overpassQuery = `
        [out:json][timeout:15];
        (
          node["amenity"~"hospital|pharmacy|supermarket|bank|police|school|university|college"](around:1000,${lat},${lon});
          node["highway"~"bus_stop|station"](around:1000,${lat},${lon});
          node["shop"~"supermarket|mall|convenience"](around:1000,${lat},${lon});
        );
        out body 20;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'text/plain' }
      });
      if (!res.ok) throw new Error('Overpass API request failed');
      const data = await res.json();
      const elements = data.elements || [];
      const landmarks = elements
        .filter(el => el.tags && (el.tags.name || el.tags.amenity || el.tags.shop || el.tags.highway))
        .map(el => ({
          name: el.tags.name || `${el.tags.amenity || el.tags.shop || el.tags.highway || 'Landmark'}`,
          type: el.tags.amenity || el.tags.shop || el.tags.highway || 'landmark',
          lat: el.lat,
          lon: el.lon
        }))
        .slice(0, 10);
      return landmarks;
    } catch (err) {
      console.warn("Failed to fetch nearby landmarks:", err);
      return [];
    } finally {
      setLoadingLandmarks(false);
    }
  };

  const parseAddressDetails = (addressObj) => {
    return {
      county: addressObj.county || addressObj.state || '',
      town: addressObj.city || addressObj.town || addressObj.village || '',
      estate: addressObj.suburb || addressObj.neighbourhood || addressObj.residential || '',
      nearestRoad: addressObj.road || addressObj.footpath || ''
    };
  };

  const getReadableLocationName = (result, details = {}) => {
    const candidates = [
      result?.name,
      result?.display_name,
      details.estate,
      details.town,
      details.nearestRoad,
      details.county,
    ];
    return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
  };

  const requestLocationName = (coordinateLocation) => {
    setLocation({ ...coordinateLocation, address: '' });
    setPendingCoordinates(coordinateLocation);
    setPendingLocationName('');
    setMode('select');
    setLoading(false);
    setStatusMessage('');
    setTimeoutOccurred(false);
    activeLocationRequestRef.current = false;
  };

  const confirmPendingLocationName = () => {
    const name = pendingLocationName.trim();
    if (!name || !pendingCoordinates) {
      toast.error('Enter a name for this location first.');
      return;
    }

    const newLocation = { ...pendingCoordinates, address: name };
    setLocation(newLocation);
    setPendingCoordinates(null);
    setPendingLocationName('');
    onLocationSelect?.(newLocation);
    toast.success('Location name saved with its map coordinates.');
  };

  const classifyAccuracy = (acc) => {
    if (acc <= 50) return 'Excellent';
    if (acc <= 100) return 'Good';
    if (acc <= 500) return 'Approximate';
    return 'Too inaccurate';
  };

  const processAcceptedPosition = async (latitude, longitude, accuracy) => {
    if (isManualOrSearchRef.current) {
      console.log('Ignoring GPS update because location was manually or search selected.');
      return;
    }

    const roundedAccuracy = accuracy ? Math.round(accuracy) : null;
    const accuracyStatus = roundedAccuracy !== null ? classifyAccuracy(roundedAccuracy) : 'Unknown';

    console.log(`GPS accuracy: ${roundedAccuracy} m (${accuracyStatus})`);

    if (accuracyStatus === 'Too inaccurate' || roundedAccuracy > 500) {
      setWarning('GPS accuracy is currently too low. Move outdoors or enable Precise Location and try again.');
      toast.error(`GPS accuracy is too low (±${roundedAccuracy}m)`);
      activeLocationRequestRef.current = false;
      return;
    }

    setWarning(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'MarketMixRealEstates/1.0' } }
      );
      if (!response.ok) throw new Error('Reverse geocoding request failed');
      const data = await response.json();
      const details = parseAddressDetails(data.address || {});
      const address = getReadableLocationName(data, details);
      const landmarks = await fetchNearbyLandmarks(latitude, longitude);

      const newLocation = {
        lat: latitude,
        lng: longitude,
        address,
        ...details,
        gpsAccuracy: roundedAccuracy,
        locationSource: 'device-gps',
        locationAccuracyStatus: accuracyStatus,
        landmarks,
      };

      if (!address) {
        requestLocationName(newLocation);
        return;
      }

      setLocation(newLocation);
      setPendingCoordinates(null);
      onLocationSelect?.(newLocation);
      setLoading(false);
      setTimeoutOccurred(false);
      activeLocationRequestRef.current = false;
      toast.success(`Location found — GPS accuracy ±${roundedAccuracy} m`);
    } catch (err) {
      const landmarks = await fetchNearbyLandmarks(latitude, longitude);
      const newLocation = {
        lat: latitude,
        lng: longitude,
        address: '',
        county: '',
        constituency: '',
        ward: '',
        town: '',
        estate: '',
        nearestRoad: '',
        gpsAccuracy: roundedAccuracy,
        locationSource: 'device-gps',
        locationAccuracyStatus: accuracyStatus,
        landmarks,
      };
      requestLocationName(newLocation);
      toast.success(`Location found — GPS accuracy ±${roundedAccuracy} m`);
    }
  };

  const getPreciseLocation = async () => {
    if (activeLocationRequestRef.current) return;
    activeLocationRequestRef.current = true;

    console.log("GPS request started");
    setLoading(true);
    setError(null);
    setWarning(null);
    setTimeoutOccurred(false);
    setStatusMessage("Getting your precise location…");
    isManualOrSearchRef.current = false;

    if (isCapacitor()) {
      try {
        const coords = await getCurrentLocation({ enableHighAccuracy: true, timeout: 60000, maximumAge: 0 });
        const { latitude, longitude, accuracy } = coords;
        await processAcceptedPosition(latitude, longitude, accuracy);
        activeLocationRequestRef.current = false;
        return;
      } catch (err) {
        console.warn('Capacitor geolocation failed:', err);
        setError('Location permission is not available on this device. Please enable location access and try again.');
        setLoading(false);
        activeLocationRequestRef.current = false;
        toast.error('Location permission denied');
        return;
      }
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      activeLocationRequestRef.current = false;
      toast.error("Geolocation not supported");
      return;
    }

    // 21. Prevent multiple simultaneous watchPosition calls. Clear existing watcher before starting new one.
    if (watchIdRef.current !== null) {
      console.log("GPS watcher cleared (restarting)");
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let bestPosition = null;
    let hasAcceptedGoodFix = false;

    // 1. Use navigator.geolocation.watchPosition() with enableHighAccuracy: true, timeout: 60000, maximumAge: 0
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log("GPS position received");
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`GPS accuracy: ${Math.round(accuracy)} m`);

        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // Update live status with accuracy
        setStatusMessage(`Searching for a more accurate GPS location… (±${Math.round(accuracy)}m)`);

        // If accuracy is good (<= 100m) and we haven't accepted yet
        if (accuracy <= 100 && !hasAcceptedGoodFix) {
          hasAcceptedGoodFix = true;
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            console.log("GPS watcher cleared (target accuracy reached)");
          }
          processAcceptedPosition(latitude, longitude, accuracy);
        }
      },
      (err) => {
        // 24. Handle all GeolocationPositionError codes
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) {
          console.log("GPS permission denied");
          setError("GPS permission denied. Please enable location permissions in your browser settings.");
          setLoading(false);
          toast.error("GPS permission denied");
        } else if (err.code === 2) {
          console.log("GPS position unavailable");
          setError("GPS position unavailable. Please search for your location or enter manually.");
          setLoading(false);
          toast.error("GPS position unavailable");
        } else if (err.code === 3) {
          console.log("GPS timeout");
          // 3. When error code 3 occurs (TIMEOUT): keep trying or show timeout options
          if (bestPosition) {
            // If we have a previous position from watchPosition, use it instead of failing
            const { latitude, longitude, accuracy } = bestPosition.coords;
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            processAcceptedPosition(latitude, longitude, accuracy);
          } else {
            setLoading(false);
            activeLocationRequestRef.current = false;
            setTimeoutOccurred(true);
            setError("GPS is taking longer than expected. Make sure Location is enabled and try moving outdoors.");
          }
        } else {
          console.log("GPS error:", err.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0
      }
    );

    watchIdRef.current = watchId;

    // Additional acquisition window safety timer (e.g. 15s to accept best position if watch doesn't get <=100m immediately)
    setTimeout(() => {
      if (loading && !hasAcceptedGoodFix) {
        if (bestPosition) {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            console.log("GPS watcher cleared (safety timer accepted best fix)");
          }
          const { latitude, longitude, accuracy } = bestPosition.coords;
          processAcceptedPosition(latitude, longitude, accuracy);
        }
      }
    }, 15000);
  };

  const cancelLoading = () => {
    if (watchIdRef.current !== null) {
      console.log("GPS watcher cleared (cancelled by user)");
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLoading(false);
    activeLocationRequestRef.current = false;
    setStatusMessage('');
    toast("Location detection cancelled", { icon: 'ℹ️' });
  };

  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    setSearchQuery(searchQuery);
    setSearching(true);
    setError(null);
    try {
      const boundaryMatches = searchKenyaBoundaries(searchQuery) || [];
      
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Kenya')}&addressdetails=1&limit=6`,
        { headers: { 'User-Agent': 'MarketMixRealEstates/1.0' } }
      );
      const nominatimData = await res.json();

      const combinedResults = [];
      
      boundaryMatches.forEach(b => {
        combinedResults.push({
          display_name: `${b.ward?.name || ''}, ${b.constituency?.name || ''} Constituency, ${b.county?.name || ''} County, Kenya`,
          county: b.county?.name || '',
          constituency: b.constituency?.name || '',
          ward: b.ward?.name || '',
          source: 'boundary'
        });
      });

      nominatimData.forEach(n => {
        const details = parseAddressDetails(n.address || {});
        combinedResults.push({
          display_name: n.display_name,
          lat: parseFloat(n.lat),
          lon: parseFloat(n.lon),
          ...details,
          source: 'nominatim'
        });
      });

      setSearchResults(combinedResults);
      if (combinedResults.length === 0) {
        toast("No locations found. Try a different search term or enter manually.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to search location");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = async (item) => {
    isManualOrSearchRef.current = true;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let lat = item.lat == null ? NaN : Number(item.lat);
    let lon = item.lon == null ? NaN : Number(item.lon);
    let displayName = item.display_name || '';

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(displayName)}&addressdetails=1&limit=1`,
          { headers: { 'User-Agent': 'MarketMixRealEstates/1.0' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
          displayName = data[0].display_name || displayName;
        }
      } catch (e) {
        console.warn("Geocoding boundary result failed:", e);
      }
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setError("We couldn't find map coordinates for that result. Try a more specific search or enter the location manually.");
      setMode('search');
      return;
    }

    let reverseData = null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'MarketMixRealEstates/1.0' } }
      );
      if (response.ok) reverseData = await response.json();
    } catch (err) {
      console.warn('Could not resolve a readable name for searched coordinates:', err);
    }

    const reverseDetails = parseAddressDetails(reverseData?.address || {});
    displayName = getReadableLocationName(reverseData, reverseDetails) || displayName;
    const landmarks = await fetchNearbyLandmarks(lat, lon);

    const newLocation = {
      lat,
      lng: lon,
      address: displayName,
      county: item.county || reverseDetails.county || '',
      constituency: item.constituency || '',
      ward: item.ward || '',
      town: item.town || reverseDetails.town || '',
      estate: item.estate || reverseDetails.estate || '',
      nearestRoad: item.nearestRoad || reverseDetails.nearestRoad || '',
      gpsAccuracy: null,
      locationSource: 'search-selection',
      locationAccuracyStatus: 'unknown',
      landmarks
    };

    if (!displayName.trim()) {
      requestLocationName(newLocation);
    } else {
      setLocation(newLocation);
      setPendingCoordinates(null);
      onLocationSelect?.(newLocation);
      setMode('select');
      toast.success("Location and nearby landmarks selected!");
    }
    setSearchResults([]);
    setSearchQuery('');
    setWarning(null);
    setError(null);
    setTimeoutOccurred(false);
  };

  const handleManualSubmit = () => {
    if (!manualAddress.trim()) {
      toast.error("Please enter a valid address");
      return;
    }
    isManualOrSearchRef.current = true;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const newLocation = {
      lat: null,
      lng: null,
      address: manualAddress,
      county: '',
      constituency: '',
      ward: '',
      town: manualAddress,
      estate: '',
      nearestRoad: '',
      gpsAccuracy: null,
      locationSource: 'manual-map-selection',
      locationAccuracyStatus: 'Excellent',
      landmarks: []
    };
    setLocation(newLocation);
    setPendingCoordinates(null);
    onLocationSelect?.(newLocation);
    setMode('select');
    setManualAddress('');
    setWarning(null);
    setError(null);
    setTimeoutOccurred(false);
    toast.success("Manual location saved");
  };

  const clearLocation = () => {
    if (watchIdRef.current !== null) {
      console.log("GPS watcher cleared (clear location)");
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    isManualOrSearchRef.current = false;
    setPendingCoordinates(null);
    setPendingLocationName('');
    setLocation({ 
      lat: null, 
      lng: null, 
      address: '', 
      county: '', 
      constituency: '', 
      ward: '', 
      town: '', 
      estate: '', 
      nearestRoad: '',
      gpsAccuracy: null,
      locationSource: 'manual-map-selection',
      locationAccuracyStatus: 'unknown',
      landmarks: [] 
    });
    setWarning(null);
    setError(null);
    setTimeoutOccurred(false);
    onLocationSelect?.(null);
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Selected Location Display */}
      {location.address ? (
        <div className={`p-3.5 rounded-lg border space-y-2.5 transition
          ${location.locationAccuracyStatus === 'Too inaccurate' 
            ? 'bg-amber-50 border-amber-300' 
            : 'bg-emerald-50 border-emerald-200'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              {location.locationAccuracyStatus === 'Too inaccurate' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <div className="text-sm truncate">
                <span className={`font-medium ${location.locationAccuracyStatus === 'Too inaccurate' ? 'text-amber-900' : 'text-emerald-900'}`}>
                  {location.address}
                </span>
                {location.gpsAccuracy !== null && (
                  <span className={`text-xs ml-2 font-semibold px-2 py-0.5 rounded-full inline-block
                    ${location.gpsAccuracy <= 50 
                      ? 'bg-emerald-200 text-emerald-900' 
                      : location.gpsAccuracy <= 100 
                      ? 'bg-green-200 text-green-900' 
                      : location.gpsAccuracy <= 500 
                      ? 'bg-yellow-200 text-yellow-900' 
                      : 'bg-red-200 text-red-900'}
                  `}>
                    GPS accuracy: ±{location.gpsAccuracy} m ({location.locationAccuracyStatus})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={getPreciseLocation}
                title="Refresh GPS Location"
                className="p-1.5 hover:bg-emerald-100 rounded-full text-emerald-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={clearLocation}
                title="Clear Location"
                className="p-1.5 hover:bg-emerald-100 rounded-full text-emerald-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {location.lat != null && location.lng != null && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
              <span>Coordinates: {Number(location.lat).toFixed(6)}, {Number(location.lng).toFixed(6)}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.lat},${location.lng}`)}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700 underline"
              >
                Open in Google Maps
              </a>
            </div>
          )}

          {/* Warning banner if accuracy is poor */}
          {warning && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-100/80 text-amber-900 rounded-md text-xs border border-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="font-semibold">GPS Accuracy Warning</p>
                <p>{warning}</p>
              </div>
            </div>
          )}

          {/* Hierarchy & Source Badges */}
          <div className="flex flex-wrap gap-1 text-xs pt-1">
            <span className="bg-white/80 text-gray-700 border border-gray-200 px-2 py-0.5 rounded">
              Source: <strong className="capitalize">{location.locationSource.replace('-', ' ')}</strong>
            </span>
            {location.county && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">County: {location.county}</span>}
            {location.constituency && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Constituency: {location.constituency}</span>}
            {location.ward && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Ward: {location.ward}</span>}
            {location.nearestRoad && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Road: {location.nearestRoad}</span>}
          </div>

          {/* Nearby Landmarks / POIs */}
          <div className="pt-2 border-t border-emerald-200/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
              <Landmark className="w-3.5 h-3.5" />
              <span>Nearby Landmarks & Amenities (within 1km):</span>
              {loadingLandmarks && <Loader className="w-3 h-3 animate-spin ml-1 text-emerald-600" />}
            </div>
            {location.landmarks && location.landmarks.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {location.landmarks.map((lm, idx) => (
                  <span key={`${lm.name}-${lm.type}-${idx}`} className="bg-white text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded text-[11px] shadow-sm">
                    📍 {lm.name} <span className="text-gray-400 capitalize">({String(lm.type).replace('_', ' ')})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-emerald-700 italic">
                {loadingLandmarks ? 'Detecting nearby hospitals, bus stops, supermarkets...' : 'No major landmarks detected in immediate vicinity.'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
          No location set yet. Use precise GPS, search Kenya boundaries & wards, or enter manually.
        </div>
      )}

      {pendingCoordinates && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            We found the map coordinates but couldn't identify the place name. Enter a neighborhood, estate, or nearby landmark.
          </p>
          <p className="text-xs text-amber-800">
            Coordinates: {Number(pendingCoordinates.lat).toFixed(6)}, {Number(pendingCoordinates.lng).toFixed(6)}
            {' · '}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pendingCoordinates.lat},${pendingCoordinates.lng}`)}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline"
            >
              Check this pin in Google Maps
            </a>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={pendingLocationName}
              onChange={(event) => setPendingLocationName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && confirmPendingLocationName()}
              placeholder="e.g. Kilimani, Nairobi"
              aria-label="Name for the selected map location"
              className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="button"
              onClick={confirmPendingLocationName}
              disabled={!pendingLocationName.trim()}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save name
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <button
              type="button"
              onClick={cancelLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm shadow-sm"
            >
              <Loader className="w-4 h-4 animate-spin" />
              {statusMessage || "Searching for a more accurate GPS location…"}
            </button>
          ) : (
            <button
              type="button"
              onClick={getPreciseLocation}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
            >
              <Crosshair className="w-4 h-4" />
              {location.address ? 'Refresh Precise GPS' : 'Get Precise GPS Location'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode(mode === 'search' ? 'select' : 'search')}
            className={`px-3 py-2.5 border rounded-lg transition flex items-center gap-1.5 text-sm font-medium
              ${mode === 'search' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}
            `}
          >
            <Search className="w-4 h-4" />
            Search Location
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'manual' ? 'select' : 'manual')}
            className={`px-3 py-2.5 border rounded-lg transition flex items-center gap-1.5 text-sm font-medium
              ${mode === 'manual' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}
            `}
          >
            <MapPin className="w-4 h-4" />
            Enter Manually
          </button>
        </div>

        {/* Timeout Occurred Options (Rule 19) */}
        {timeoutOccurred && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <p className="text-xs font-semibold text-amber-900">
              GPS is taking longer than expected. Make sure Location is enabled and try moving outdoors.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={getPreciseLocation}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => setMode('search')}
                className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-xs font-medium hover:bg-gray-50 transition"
              >
                Choose on Map / Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Mode (Kenya Boundaries + Nominatim) */}
      {mode === 'search' && (
        <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
              placeholder="Search ward, constituency, county or estate (e.g. Kaptembwo, Nakuru, Kilimani)..."
              className="flex-1 p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={searchAddress}
              disabled={searching}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              {searching ? <Loader className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-white border rounded-lg divide-y max-h-56 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.display_name || 'result'}-${item.source || 'source'}-${idx}`}
                  type="button"
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left p-2.5 text-xs hover:bg-emerald-50 transition flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-800">{item.display_name}</span>
                    {item.source === 'boundary' && (
                      <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">Official Boundary</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
          <label className="block text-xs font-medium text-gray-700">Type exact address or location details:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="e.g. Kaptembwo Stage, Nakuru"
              className="flex-1 p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleManualSubmit}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              Save Manual Location
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-400">
        GPS is only an aid for finding the property. The final property location is the location you explicitly confirm or select.
      </p>
    </div>
  );
};

export default LocationPicker;
