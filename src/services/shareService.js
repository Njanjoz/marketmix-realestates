import { isCapacitor } from '../utils/platform';

const getPropertyUrl = (property) => {
  if (property?.url || property?.propertyUrl) {
    return property.url || property.propertyUrl;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const id = property?.id || property?.propertyId;
  if (id) {
    try {
      return new URL(`/property/${encodeURIComponent(id)}`, window.location.origin).toString();
    } catch (error) {
      console.warn('Unable to create property share URL:', error);
    }
  }

  return window.location.href;
};

export const getPropertySharePayload = (property) => {
  const title = property?.title || 'MarketMix Property';
  const location = property?.location || property?.approximateLocation || 'Location available on request';
  const price = property?.rent || property?.price || property?.monthlyRent || 'Price available on request';
  const type = property?.propertyType || property?.type || 'Property';
  const url = getPropertyUrl(property);

  const media = Array.isArray(property?.media) ? property.media : [];
  const firstMediaString = media.find((item) => typeof item === 'string' && item);
  const firstMediaObject = media.find((item) => item && typeof item === 'object' && (item.url || item.remoteUrl || item.localPreviewUrl || item.preview));
  const imageUrl =
    firstMediaString ||
    firstMediaObject?.url ||
    firstMediaObject?.remoteUrl ||
    firstMediaObject?.localPreviewUrl ||
    firstMediaObject?.preview ||
    property?.coverImage ||
    property?.images?.[0] ||
    property?.publicMedia?.[0]?.url ||
    property?.publicMedia?.[0] ||
    property?.image ||
    '';

  const summary = [
    `*${title}*`,
    `Type: ${type}`,
    `Price: ${price}`,
    `Location: ${location}`,
    url ? `Link: ${url}` : '',
    imageUrl ? `Image: ${imageUrl}` : '',
  ].filter(Boolean).join('\n');

  return {
    title,
    summary,
    url,
    imageUrl,
    encodedText: encodeURIComponent(summary),
  };
};

export const shareProperty = async (property) => {
  const { title, summary, url } = getPropertySharePayload(property);
  const shareText = `${summary}${url ? `\n\nView property: ${url}` : ''}`;

  if (isCapacitor()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title,
        text: shareText,
        url: url || window.location.href,
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
      text: shareText,
      url: url || window.location.href,
    });
    return { source: 'web-share', shared: true };
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    return { source: 'whatsapp', shared: true };
  }

  if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareText);
    return { source: 'clipboard', shared: true };
  }

  return { source: 'manual', shared: false };
};
