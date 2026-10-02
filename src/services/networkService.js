import { isCapacitor } from '../utils/platform';

export const getNetworkStatus = async () => {
  if (isCapacitor()) {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return {
        online: status.connected,
        reconnecting: false,
        status: status.connected ? 'online' : 'offline',
        source: 'capacitor',
      };
    } catch (error) {
      console.warn('Capacitor network status unavailable:', error);
    }
  }

  return {
    online: navigator.onLine !== false,
    reconnecting: false,
    status: navigator.onLine !== false ? 'online' : 'offline',
    source: 'browser',
  };
};

export const subscribeToNetwork = (onChange) => {
  const handleBrowserUpdate = async () => {
    const nextStatus = await getNetworkStatus();
    onChange(nextStatus);
  };

  if (isCapacitor()) {
    let cleanup = () => {};

    import('@capacitor/network')
      .then(({ Network }) => {
        const listener = Network.addListener('networkStatusChange', async (status) => {
          onChange({
            online: status.connected,
            reconnecting: false,
            status: status.connected ? 'online' : 'offline',
            source: 'capacitor',
          });
        });
        cleanup = () => listener?.remove();
      })
      .catch(() => {
        // Fall back to browser listeners if Capacitor network API is unavailable.
      });

    window.addEventListener('online', handleBrowserUpdate);
    window.addEventListener('offline', handleBrowserUpdate);

    return () => {
      cleanup();
      window.removeEventListener('online', handleBrowserUpdate);
      window.removeEventListener('offline', handleBrowserUpdate);
    };
  }

  window.addEventListener('online', handleBrowserUpdate);
  window.addEventListener('offline', handleBrowserUpdate);

  return () => {
    window.removeEventListener('online', handleBrowserUpdate);
    window.removeEventListener('offline', handleBrowserUpdate);
  };
};
