import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, MapPin, Loader, Bed, Bath, Square } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

const NearbyProperties = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyProperties, setNearbyProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCurrentLocation = () => {
    setDetecting(true);
    
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        await findNearbyProperties(latitude, longitude);
      },
      (err) => {
        let errorMessage = "Unable to get your location";
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = "Please allow location access to find nearby properties";
        }
        toast.error(errorMessage);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const findNearbyProperties = async (lat, lng) => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, where('approvalStatus', '==', 'approved'));
      const snapshot = await getDocs(q);
      
      const nearby = [];
      snapshot.forEach(doc => {
        const property = doc.data();
        if (property.coordinates && property.coordinates.lat) {
          const distance = calculateDistance(lat, lng, property.coordinates.lat, property.coordinates.lng);
          if (distance <= 10) {
            nearby.push({ id: doc.id, ...property, distance: distance.toFixed(1) });
          }
        }
      });
      
      nearby.sort((a, b) => a.distance - b.distance);
      setNearbyProperties(nearby.slice(0, 10));
      
      if (nearby.length === 0) {
        toast.info("No properties found within 10km of your location");
      } else {
        toast.success(`Found ${nearby.length} properties near you!`);
      }
    } catch (error) {
      console.error('Error finding nearby properties:', error);
      toast.error('Failed to find nearby properties');
    } finally {
      setLoading(false);
      setDetecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-emerald-600" />
          Properties Near You
        </h3>
        <p className="text-sm text-gray-500 mt-1">Find properties within 10km of your location</p>
      </div>
      
      <div className="p-4">
        {!userLocation && (
          <button
            onClick={getCurrentLocation}
            disabled={detecting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {detecting ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Crosshair className="w-5 h-5" />
            )}
            Detect My Location
          </button>
        )}
        
        {loading && (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-gray-500 mt-2">Finding properties near you...</p>
          </div>
        )}
        
        {!loading && nearbyProperties.length > 0 && (
          <div className="space-y-3 mt-4">
            {nearbyProperties.map((property) => (
              <Link
                key={property.id}
                to={`/property/${property.id}`}
                className="block p-3 border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  <img 
                    src={property.images?.[0] || 'https://placehold.co/80x60'} 
                    alt={property.title}
                    className="w-20 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{property.title}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {property.location}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.bedrooms || 0}</span>
                      <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms || 0}</span>
                      <span className="flex items-center gap-1"><Square className="w-3 h-3" /> {property.area || 0}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-600">
                      KES {property.price?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{property.distance} km away</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {!loading && nearbyProperties.length === 0 && userLocation && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No properties found near your location</p>
            <button
              onClick={() => findNearbyProperties(userLocation.lat, userLocation.lng)}
              className="mt-3 text-sm text-emerald-600 hover:text-emerald-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyProperties;
