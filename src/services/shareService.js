import { isCapacitor } from '../utils/platform';

export const shareProperty = async (property) => {
  const title = property?.title || 'MarketMix Property';
  const location = property?.location || property?.approximateLocation || 'Location available on request';
  const price = property?.rent || property?.price || property?.monthlyRent || 'Price available on request';
  const summary = [
    title,
    `${price}`,
    location,
    property?.propertyType || property?.type || '',
    property?.url || property?.propertyUrl || '',
  ]
    .filter(Boolean)
    .join('\n');

  if (isCapacitor()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title,
        text: summary,
        url: property?.url || property?.propertyUrl || window.location.href,
        dialogTitle: 'Share property',
      });
      return { source: 'capacitor', shared: true };
    } catch (error) {
      console.warn('Capacitor share unavailable:', error);
    }
  }

  if (navigator.share) {
    await navigator.share({
      title,
      text: summary,
      url: property?.url || property?.propertyUrl || window.location.href,
    });
    return { source: 'web-share', shared: true };
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(summary + (property?.url || property?.propertyUrl || window.location.href));
    return { source: 'clipboard', shared: true };
  }

  return { source: 'manual', shared: false };
};
