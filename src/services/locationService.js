import { isCapacitor } from '../utils/platform';

export const getCurrentLocation = async (options = {}) => {
  const config = {
    enableHighAccuracy: true,
    timeout: 60000,
    maximumAge: 0,
    ...options,
  };

  if (isCapacitor()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: config.enableHighAccuracy,
        timeout: config.timeout,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? 0,
        source: 'GPS',
        timestamp: position.timestamp ?? Date.now(),
      };
    } catch (error) {
      console.warn('Capacitor location unavailable, falling back to browser geolocation:', error);
    }
  }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported in this environment.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 0,
          source: 'browser',
          timestamp: position.timestamp ?? Date.now(),
        });
      },
      (error) => reject(error),
      config
    );
  });
};
