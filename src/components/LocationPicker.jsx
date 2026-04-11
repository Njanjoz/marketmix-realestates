import React, { useState } from 'react';
import { MapPin, Crosshair, Loader, CheckCircle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const LocationPicker = ({ onLocationSelect, initialLocation = null, label = "Property Location" }) => {
  const [location, setLocation] = useState(initialLocation || { lat: null, lng: null, address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          const newLocation = {
            lat: latitude,
            lng: longitude,
            address: address,
            source: 'gps'
          };
          
          setLocation(newLocation);
          onLocationSelect?.(newLocation);
          toast.success(`Location detected: ${address.substring(0, 50)}...`);
        } catch (err) {
          const newLocation = {
            lat: latitude,
            lng: longitude,
            address: `${latitude}, ${longitude}`,
            source: 'gps'
          };
          setLocation(newLocation);
          onLocationSelect?.(newLocation);
          toast.success("Location detected successfully");
        }
      },
      (err) => {
        let errorMessage = "Unable to get your location";
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Please allow location access to use this feature";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setError(errorMessage);
        toast.error(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    ).finally(() => {
      setLoading(false);
    });
  };

  const handleManualSubmit = () => {
    if (manualAddress.trim()) {
      const newLocation = {
        lat: null,
        lng: null,
        address: manualAddress,
        source: 'manual'
      };
      setLocation(newLocation);
      onLocationSelect?.(newLocation);
      setShowManualInput(false);
      setManualAddress('');
      toast.success("Location added manually");
    }
  };

  const clearLocation = () => {
    setLocation({ lat: null, lng: null, address: '' });
    onLocationSelect?.(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      {location.address && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800 truncate max-w-[250px]">
              {location.address}
            </span>
          </div>
          <button
            type="button"
            onClick={clearLocation}
            className="p-1 hover:bg-green-100 rounded-full"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
          Use My Current Location
        </button>
        
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Enter Manually
        </button>
      </div>
      
      {showManualInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Enter address (e.g., Karen, Nairobi)"
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleManualSubmit}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Add
          </button>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-600 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        <Crosshair className="w-3 h-3 inline mr-1" />
        Your location is only used to find nearby properties
      </p>
    </div>
  );
};

export default LocationPicker;
