export const isCapacitor = () => {
  if (typeof window === 'undefined') return false;

  const capacitorGlobal = window.Capacitor;
  if (!capacitorGlobal) return false;

  if (typeof capacitorGlobal.isNativePlatform === 'function') {
    return capacitorGlobal.isNativePlatform();
  }

  return Boolean(capacitorGlobal.getPlatform);
};

export const isNativeApp = () => isCapacitor();
export const isWebApp = () => !isCapacitor();

export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  if (!window.Capacitor) return false;
  return window.Capacitor.getPlatform?.() === 'android';
};

export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  if (!window.Capacitor) return false;
  return window.Capacitor.getPlatform?.() === 'ios';
};

export const isWeb = () => typeof window !== 'undefined' && !isCapacitor();

export const getRuntimePlatform = () => {
  if (isAndroid()) return 'android';
  if (isIOS()) return 'ios';
  return 'web';
};
