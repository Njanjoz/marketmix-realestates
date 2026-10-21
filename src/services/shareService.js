import { isCapacitor } from '../utils/platform';
import { resolvePropertyImage } from '../utils/propertyMapping';
import { canonicalizeSharedUrl, getPublicAppUrl } from '../utils/publicUrl';

const getPropertyUrl = (property) => {
  if (property?.url || property?.propertyUrl) {
    return canonicalizeSharedUrl(property.url || property.propertyUrl);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const id = property?.id || property?.propertyId;
  if (id) {
    return getPublicAppUrl(`/property/${encodeURIComponent(id)}`);
  }

  return getPublicAppUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`);
};

export const getYouTubeTourUrl = (property) => {
  const videoId = String(property?.youtubeVideoId || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return `https://youtu.be/${videoId}`;
  }

  const youtubeUrl = String(property?.youtubeUrl || '').trim();
  return /^https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(youtubeUrl) ? youtubeUrl : '';
};

export const getPropertySharePayload = (property) => {
  const title = property?.title || 'MarketMix Property';
  const price = property?.rent || property?.price || property?.monthlyRent || 'Price available on request';
  const type = property?.propertyType || property?.type || 'Property';
  const url = getPropertyUrl(property);
  const youtubeTourUrl = getYouTubeTourUrl(property);

  const imageUrl = resolvePropertyImage(property) || property?.image || '';

  const summary = [
    `*${title}*`,
    `Type: ${type}`,
    `Price: ${price}`,
    url ? `Link: ${url}` : '',
    youtubeTourUrl ? `YouTube property tour: ${youtubeTourUrl}` : '',
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
        url: url || getPublicAppUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`),
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
      url: url || getPublicAppUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`),
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
