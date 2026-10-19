import { isCapacitor } from '../utils/platform';

export const getCurrentLocation = async (options = {}) => {
  const config = {
    enableHighAccuracy: true,
    timeout: 60000,
    maximumAge: 0,
    ...options,
  };

  if (isCapacitor()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    let permission = await Geolocation.checkPermissions();
    if (permission.location !== 'granted') permission = await Geolocation.requestPermissions({ permissions: ['location'] });
    if (permission.location !== 'granted') throw new Error('Location permission was denied. Enable location access in Android settings and try again.');

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: config.enableHighAccuracy,
      timeout: config.timeout,
      maximumAge: config.maximumAge,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? 0,
      source: 'GPS',
      timestamp: position.timestamp ?? Date.now(),
    };
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

export const watchLocation = async (onUpdate, options = {}) => {
  const config = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 5000,
    ...options,
  };

  if (isCapacitor()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    let permission = await Geolocation.checkPermissions();
    if (permission.location !== 'granted') permission = await Geolocation.requestPermissions({ permissions: ['location'] });
    if (permission.location !== 'granted') throw new Error('Location permission was denied. Enable location access in Android settings and try again.');
    const id = await Geolocation.watchPosition(config, (position, error) => onUpdate(position || null, error || null));
    return { native: true, id };
  }

  if (!navigator.geolocation) throw new Error('Geolocation is not supported in this environment.');
  const id = navigator.geolocation.watchPosition(
    (position) => onUpdate(position, null),
    (error) => onUpdate(null, error),
    config,
  );
  return { native: false, id };
};

export const clearLocationWatch = async (watch) => {
  if (!watch) return;
  if (watch.native) {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.clearWatch({ id: watch.id });
  } else if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watch.id);
  }
};
