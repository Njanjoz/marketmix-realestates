import React, { useEffect, useMemo, useState } from 'react';
import { X, MessageCircle, Sparkles, Phone, Mail, Share2, Download } from 'lucide-react';
import { resolvePropertyImage } from '../utils/propertyMapping';
import { getYouTubeTourUrl } from '../services/shareService';
import { generatePromoPoster as requestPromoPoster, getPromoCoverImage } from '../services/posterService';
import toast from 'react-hot-toast';

const FONT_OPTIONS = {
  'Arial, sans-serif': 'Modern Sans',
  'Georgia, serif': 'Classic Serif',
  'Courier New, monospace': 'Monospace',
};

const THEME_OPTIONS = {
  emerald: {
    badge: '#10b981',
    accent: '#0f766e',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    panel: '#ffffff',
  },
  blue: {
    badge: '#2563eb',
    accent: '#1d4ed8',
    gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    panel: '#ffffff',
  },
  amber: {
    badge: '#f59e0b',
    accent: '#b45309',
    gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    panel: '#ffffff',
  },
  midnight: {
    badge: '#38bdf8',
    accent: '#0f172a',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    panel: '#1e293b',
    text: '#f8fafc',
  },
  sunset: {
    badge: '#f43f5e',
    accent: '#be123c',
    gradient: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    panel: '#ffffff',
  },
};

const getPropertyUrl = (property) => {
  if (property?.url || property?.propertyUrl) return property.url || property.propertyUrl;

  if (typeof window === 'undefined') return '';
  const id = property?.id || property?.propertyId;
  if (!id) return window.location.href;

  try {
    return new URL(`/property/${encodeURIComponent(id)}`, window.location.origin).toString();
  } catch {
    return `${window.location.origin}/property/${encodeURIComponent(id)}`;
  }
};

const getContactDetails = ({ userProfile, currentUser }) => {
  const role = userProfile?.role;
  if (!['admin', 'seller', 'agent'].includes(role)) {
    return null;
  }

  const name = userProfile?.name || userProfile?.fullName || currentUser?.displayName || 'Contact';
  const phone = userProfile?.phone || userProfile?.mobile || userProfile?.managerPhone || '';
  const email = userProfile?.email || currentUser?.email || '';
  const phoneDigits = String(phone || '').replace(/\D/g, '');
  const whatsappNumber = phoneDigits.startsWith('0')
    ? `254${phoneDigits.slice(1)}`
    : phoneDigits.length === 9
      ? `254${phoneDigits}`
      : phoneDigits;

  return { name, phone, email, whatsappUrl: whatsappNumber ? `https://wa.me/${whatsappNumber}` : '' };
};

const getPropertyPhotos = (property) => {
  const photos = [];
  const addPhoto = (value) => {
    const url = typeof value === 'string'
      ? value
      : value?.remoteUrl || value?.url || value?.src || value?.localPreviewUrl || value?.preview;
    if (typeof url === 'string' && /^(https?:\/\/|data:image\/)/i.test(url) && !photos.includes(url)) {
      photos.push(url);
    }
  };

  addPhoto(property?.coverImage);
  for (const candidate of [property?.images, property?.publicMedia, property?.media, property?.gallery, property?.photos]) {
    if (Array.isArray(candidate)) candidate.forEach(addPhoto);
    else addPhoto(candidate);
  }

  const hero = resolvePropertyImage(property);
  if (hero && photos.includes(hero)) photos.splice(photos.indexOf(hero), 1);
  if (hero) photos.unshift(hero);
  return photos.slice(0, 5);
};

const getPublicLocation = (property) => (
  property?.approximateLocation || property?.estate || property?.neighborhood ||
  property?.ward || property?.town || property?.county || 'Area shared on inquiry'
);

const getInitialHighlights = (property) => {
  const amenities = [property?.publicAmenities, property?.propertyAmenities, property?.roomAmenities, property?.features,
    property?.amenities?.property, property?.amenities?.room]
    .flatMap((items) => Array.isArray(items) ? items : [])
    .map((item) => typeof item === 'string' ? item : item?.label || item?.name)
    .filter(Boolean);
  const highlights = [...amenities];
  const security = Object.entries(property?.securityFeatures || {})
    .filter(([, value]) => value === true || value === 'Yes' || value === 'Available')
    .map(([name]) => name.replace(/([A-Z])/g, ' $1'));
  highlights.push(...security);
  if (property?.waterIncluded === true || property?.waterIncluded === 'Yes') highlights.push('Water included');
  if (property?.electricityIncluded === true || property?.electricityIncluded === 'Yes') highlights.push('Electricity included');
  if (property?.walkingTimeToMainRoad) highlights.push(`${property.walkingTimeToMainRoad} walk to the main road`);
  else if (property?.distanceToMainRoad) highlights.push(`${property.distanceToMainRoad} from the main road`);
  return [...new Set(highlights)].slice(0, 5).join('\n');
};

const getInitialFeatures = (property) => {
  const features = [];
  if (property?.roomType) features.push(property.roomType);
  if (property?.furnished === true || property?.furnished === 'Yes') features.push('Furnished');
  if (property?.hasKitchen === true || property?.kitchen) features.push(property.kitchen || 'Kitchen / cooking area');
  if (property?.bathroom) features.push(property.bathroom);
  if (property?.parking === true || property?.parking === 'Yes') features.push('Parking available');
  if (property?.internetOption && property.internetOption !== 'None') features.push(`Internet: ${property.internetOption}`);
  if (property?.garbageCollection && property.garbageCollection !== 'None') features.push('Garbage collection');
  return [...new Set(features)].slice(0, 5).join('\n');
};

const getInitialNearby = (property) => {
  const places = Array.isArray(property?.nearbyPlaces)
    ? property.nearbyPlaces.map((place) => typeof place === 'string' ? place : place?.name || place?.label).filter(Boolean)
    : [];
  if (property?.institutionName || property?.institution) places.push(property.institutionName || property.institution);
  if (property?.nearestStage) places.push(`Public transport: ${property.nearestStage}`);
  if (property?.distanceToCampus) places.push(`Campus / school: ${property.distanceToCampus}`);
  return [...new Set(places)].slice(0, 5).join('\n');
};

const getAvailabilityLabel = (property) => {
  const status = String(property?.availabilityStatus || '').toLowerCase();
  if (status === 'available' || status === 'vacant') return 'Available now';
  if (property?.availabilityDate) return `Available ${property.availabilityDate}`;
  return '';
};

const getDepositLabel = (property) => {
  if (property?.depositType) return property.depositType;
  const deposit = Number(property?.depositAmount || 0);
  return deposit > 0 ? `KSh ${deposit.toLocaleString()}` : '';
};

const sanitizeShareText = (value, property) => {
  let text = String(value || '');
  const privateAddress = property?.exactAddress;
  if (typeof privateAddress === 'string' && privateAddress.trim()) {
    text = text.replace(new RegExp(privateAddress.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), 'nearby neighborhood');
  }

  const coordinates = property?.exactCoordinates || property?.coordinates;
  const coordinatePairs = Array.isArray(coordinates)
    ? coordinates
    : coordinates && typeof coordinates === 'object'
      ? [coordinates.lat, coordinates.lng]
      : [];
  if (coordinatePairs.length === 2 && coordinatePairs.every((value) => Number.isFinite(Number(value)))) {
    const pairPattern = new RegExp(`${String(coordinatePairs[0]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[,/]\\s*${String(coordinatePairs[1]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    text = text.replace(pairPattern, '');
  }
  return text.trim();
};

const supportsPromoFileSharing = (file) => {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function' || !file) {
    return false;
  }

  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};

const downloadPosterFile = (file) => {
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = file.name;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
};

const openWhatsAppWithMessage = (message) => {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const link = document.createElement('a');
  link.href = whatsappUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const buildPromotedPropertyMessage = ({ property, headline, caption, highlights, features, nearby, includeContact, userProfile, currentUser }) => {
  const title = sanitizeShareText(property?.title || 'Property Listing', property);
  const location = sanitizeShareText(getPublicLocation(property), property);
  const price = property?.price || property?.rentAmount || property?.rent || 0;
  const type = property?.propertyType || property?.unitType || 'Property';
  const url = getPropertyUrl(property);
  const youtubeTourUrl = getYouTubeTourUrl(property);
  const points = String(highlights || '').split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).slice(0, 5);
  const featurePoints = String(features || '').split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).slice(0, 4);
  const nearbyPoints = String(nearby || '').split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).slice(0, 4);
  const safeHeadline = sanitizeShareText(headline || `${title} · ${location}`, property);
  const safeCaption = sanitizeShareText(caption || `A great ${type.toLowerCase()} in ${location}.`, property);
  const frequency = property?.paymentFrequency || (property?.status === 'rent' ? 'Monthly' : '');
  const availability = getAvailabilityLabel(property);
  const deposit = getDepositLabel(property);

  const lines = [
    'MARKETMIX REAL ESTATES',
    safeHeadline,
    '',
    safeCaption,
    '',
    'WHY YOU’LL LOVE IT',
    ...points.map((point) => `• ${point}`),
    '',
    'PROPERTY DETAILS',
    `• Price: KSh ${Number(price || 0).toLocaleString()}${frequency ? ` / ${frequency}` : ''}`,
    `• Location: ${location}`,
    `• Type: ${type}`,
    ...[
      property?.bedrooms !== undefined && property?.bedrooms !== '' ? `• Bedrooms: ${property.bedrooms}` : '',
      property?.bathrooms !== undefined && property?.bathrooms !== '' ? `• Bathrooms: ${property.bathrooms}` : '',
      property?.area ? `• Area: ${property.area}` : '',
      availability ? `• Availability: ${availability}` : '',
      deposit ? `• Deposit: ${deposit}` : '',
    ].filter(Boolean),
    '',
    'FEATURES',
    ...featurePoints.map((point) => `• ${point}`),
    '',
    'NEARBY',
    ...nearbyPoints.map((point) => `• ${point}`),
  ];

  if (url) {
    lines.push(`View property: ${url}`);
  }
  if (youtubeTourUrl) {
    lines.push(`YouTube property tour: ${youtubeTourUrl}`);
  }

  lines.push('', 'BOOK A SITE VISIT');

  const contact = includeContact ? getContactDetails({ userProfile, currentUser }) : null;
  if (contact) {
    lines.push('', `Contact: ${contact.name}`);
    if (contact.phone) lines.push(`WhatsApp: ${contact.phone}`);
    if (contact.whatsappUrl) lines.push(contact.whatsappUrl);
    if (contact.email) lines.push(`Email: ${contact.email}`);
  }

  return lines.join('\n');
};

export default function PromotePropertyModal({ property, currentUser, userProfile, onClose }) {
  const photos = useMemo(() => getPropertyPhotos(property), [property]);
  const posterPhotos = photos.length ? photos : ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200'];
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);
  const imageUrl = posterPhotos[heroPhotoIndex] || posterPhotos[0];
  const publicLocation = getPublicLocation(property);
  const role = userProfile?.role || 'user';
  const canShowContact = ['admin', 'seller', 'agent'].includes(role);

  const [themeKey, setThemeKey] = useState('emerald');
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [sectionsOrder, setSectionsOrder] = useState(['highlights', 'features', 'nearby']);
  const [headline, setHeadline] = useState(property?.title || 'Premium Property for You');
  const [caption, setCaption] = useState(
    property?.description || `Amazing ${property?.propertyType || 'property'} in ${property?.location || 'Kenya'}.`
  );
  const [highlights, setHighlights] = useState(() => getInitialHighlights(property));
  const [features, setFeatures] = useState(() => getInitialFeatures(property));
  const [nearby, setNearby] = useState(() => getInitialNearby(property));
  const [includeContact, setIncludeContact] = useState(canShowContact);
  const [sharing, setSharing] = useState(false);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverLoading, setCoverLoading] = useState(true);
  const [coverError, setCoverError] = useState('');

  const moveSection = (index, direction) => {
    const next = [...sectionsOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setSectionsOrder(next);
    setPosterFile(null);
    setPosterPreviewUrl('');
  };

  const theme = THEME_OPTIONS[themeKey] || THEME_OPTIONS.emerald;
  const contact = includeContact && canShowContact
    ? getContactDetails({ userProfile, currentUser })
    : null;

  const finalMessage = useMemo(
    () => buildPromotedPropertyMessage({
      property,
      headline,
      caption,
      highlights,
      features,
      nearby,
      includeContact: includeContact && canShowContact,
      userProfile,
      currentUser,
    }),
    [property, headline, caption, highlights, features, nearby, includeContact, canShowContact, userProfile, currentUser]
  );

  useEffect(() => {
    if (!posterPreviewUrl) return undefined;
    return () => URL.revokeObjectURL(posterPreviewUrl);
  }, [posterPreviewUrl]);

  useEffect(() => {
    let cancelled = false;
    setCoverLoading(true);
    setCoverError('');
    setCoverFile(null);

    getPromoCoverImage([imageUrl], property?.title || 'Property')
      .then(({ file }) => {
        if (!cancelled) setCoverFile(file);
      })
      .catch((error) => {
        console.error('[Property share] Could not prepare cover photo:', error);
        if (!cancelled) setCoverError(error.message || 'Could not prepare the cover photo');
      })
      .finally(() => {
        if (!cancelled) setCoverLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const cachePromoPoster = (file) => {
    setPosterFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPosterPreviewUrl(objectUrl);
    return objectUrl;
  };

  const updatePosterContent = (update, value) => {
    update(value);
    setPosterFile(null);
    setPosterPreviewUrl('');
  };

  const createPoster = () => requestPromoPoster({
    photos: posterPhotos,
    headline,
    caption,
    highlights: highlights.split(/\r?\n/).filter(Boolean).slice(0, 5),
    features: features.split(/\r?\n/).filter(Boolean).slice(0, 4),
    nearby: nearby.split(/\r?\n/).filter(Boolean).slice(0, 4),
    property: {
      title: property?.title,
      propertyType: property?.propertyType,
      unitType: property?.unitType,
      status: property?.status,
      price: property?.price,
      rentAmount: property?.rentAmount,
      rent: property?.rent,
      paymentFrequency: property?.paymentFrequency,
      bedrooms: property?.bedrooms,
      bathrooms: property?.bathrooms,
      area: property?.area,
    },
    location: publicLocation,
    price: property?.price || property?.rentAmount || property?.rent || 0,
    availability: getAvailabilityLabel(property),
    deposit: getDepositLabel(property),
    listingUrl: getPropertyUrl(property),
    contact: contact ? { phone: contact.phone, email: contact.email } : null,
    theme: themeKey,
    fontFamily,
    sectionsOrder,
  });

  const generatePromoPoster = async () => {
    try {
      const { file, hasPropertyPhoto } = await createPoster();
      cachePromoPoster(file);
      if (hasPropertyPhoto) {
        toast.success('A4 poster ready. Use Download A4 poster to save it.');
      } else {
        toast.error('Poster created with a photo placeholder. Add the image host to POSTER_IMAGE_HOSTS on the poster server to load property photos.');
      }
    } catch (error) {
      console.error('[Property share] Could not generate poster:', error);
      toast.error(error.message || 'Could not generate the promo poster');
    }
  };

  const downloadPromoImage = async () => {
    if (!posterFile) {
      toast.error('Generate the A4 poster first, then download it.');
      return false;
    }

    try {
      downloadPosterFile(posterFile);
      toast.success('A4 promo poster downloaded');
      return true;
    } catch (error) {
      console.error('[Property share] Could not create promo image:', error);
      toast.error(error.message || 'Could not create the promo poster');
      return false;
    }
  };

  const shareToWhatsApp = async () => {
    if (!coverFile) {
      toast.error(coverError || 'The cover photo is still being prepared. Please try again shortly.');
      return;
    }

    setSharing(true);
    try {
      const propertyUrl = getPropertyUrl(property);
      const fileName = `MarketMix_${(property?.title || 'Property').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.jpg`;
      const coverFileForShare = new File([coverFile], fileName, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [coverFileForShare] })) {
        try {
          await navigator.share({
            title: property?.title || 'MarketMix property',
            text: finalMessage,
            files: [coverFileForShare],
            url: propertyUrl,
          });
          toast.success('Cover photo and listing text shared successfully!');
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
          console.warn('[Property share] Native cover sharing failed; using download and WhatsApp fallback:', error);
        }
      }

      downloadPosterFile(coverFileForShare);
      await new Promise((r) => setTimeout(r, 800));
      openWhatsAppWithMessage(finalMessage);
      toast.success('Cover photo downloaded! WhatsApp opened with listing text. Attach the photo before sending.');
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[Property share] Could not open WhatsApp or prepare cover photo:', error);
      toast.error(error.message || 'Could not prepare the cover photo for WhatsApp.');
    } finally {
      setSharing(false);
    }
  };

  const downloadCoverPhoto = () => {
    if (!coverFile) {
      toast.error(coverError || 'The cover photo is still being prepared. Please try again shortly.');
      return;
    }
    downloadPosterFile(coverFile);
    toast.success('Property cover photo downloaded');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl sm:rounded-[28px] border border-white/50 bg-white shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Promote listing</div>
            <h3 className="text-xl font-bold text-slate-900">Property promo card</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-200 text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0 p-4 sm:p-5 bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-200">
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Edit your promo card
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Headline</label>
                <input
                  value={headline}
                  onChange={(e) => updatePosterContent(setHeadline, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Promo message</label>
                <textarea
                  value={caption}
                  onChange={(e) => updatePosterContent(setCaption, e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Key points · one per line</label>
                  <div className="flex gap-1">
                    {['✓', '⭐', '📍', '🏡', '💡', '•'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          const lines = highlights ? highlights.split(/\r?\n/) : [];
                          const updated = lines.map((l) => l.startsWith(emoji) ? l : `${emoji} ${l}`).join('\n');
                          updatePosterContent(setHighlights, updated);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 text-[11px] font-medium text-slate-700"
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={highlights}
                  onChange={(e) => updatePosterContent(setHighlights, e.target.value)}
                  rows={4}
                  placeholder={'Bedrooms: 3\nBathrooms: 2\nNear public transport'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Features · one per line</label>
                  <div className="flex gap-1">
                    {['✓', '⭐', '📍', '🏡', '💡', '•'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          const lines = features ? features.split(/\r?\n/) : [];
                          const updated = lines.map((l) => l.startsWith(emoji) ? l : `${emoji} ${l}`).join('\n');
                          updatePosterContent(setFeatures, updated);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 text-[11px] font-medium text-slate-700"
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={features}
                  onChange={(e) => updatePosterContent(setFeatures, e.target.value)}
                  rows={3}
                  placeholder="Private bathroom\nKitchen / cooking area\nParking available"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">Nearby · one per line</label>
                  <div className="flex gap-1">
                    {['✓', '⭐', '📍', '🏡', '💡', '•'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          const lines = nearby ? nearby.split(/\r?\n/) : [];
                          const updated = lines.map((l) => l.startsWith(emoji) ? l : `${emoji} ${l}`).join('\n');
                          updatePosterContent(setNearby, updated);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 text-[11px] font-medium text-slate-700"
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={nearby}
                  onChange={(e) => updatePosterContent(setNearby, e.target.value)}
                  rows={3}
                  placeholder="Public transport\nShopping centre\nCampus / school"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Font Family</label>
                <select
                  value={fontFamily}
                  onChange={(e) => updatePosterContent(setFontFamily, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base sm:text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {Object.entries(FONT_OPTIONS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Theme & Colors</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(THEME_OPTIONS).map(([key, option]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updatePosterContent(setThemeKey, key)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 ${themeKey === key ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white'} transition-all`}
                    >
                      <div className="w-6 h-6 rounded-full shadow-sm" style={{ background: option.gradient }} />
                      <span className="text-[10px] font-semibold text-slate-700 capitalize">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Layout & Section Order</label>
                <div className="space-y-1.5">
                  {sectionsOrder.map((sectionKey, index) => (
                    <div key={sectionKey} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                      <span className="capitalize">{sectionKey === 'highlights' ? 'Why you’ll love it' : sectionKey}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveSection(index, 'up')} disabled={index === 0} className="rounded-lg px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40">↑</button>
                        <button type="button" onClick={() => moveSection(index, 'down')} disabled={index === sectionsOrder.length - 1} className="rounded-lg px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40">↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {canShowContact && (
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeContact}
                    onChange={(e) => updatePosterContent(setIncludeContact, e.target.checked)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Include my WhatsApp number and contact details
                </label>
              )}
            </div>
          </div>

          <div className="min-w-0 p-4 sm:p-5 bg-white">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Preview</div>
              <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                <button type="button" onClick={generatePromoPoster} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Sparkles className="w-3.5 h-3.5" /> {posterFile ? 'Regenerate poster' : 'Generate poster'}
                </button>
                <button type="button" onClick={downloadCoverPhoto} disabled={coverLoading || !coverFile} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">
                  <Download className="w-3.5 h-3.5" /> {coverLoading ? 'Preparing cover photo…' : 'Download cover photo'}
                </button>
                <button type="button" onClick={downloadPromoImage} disabled={!posterFile} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                  <Download className="w-3.5 h-3.5" /> Download A4 poster
                </button>
                <button type="button" onClick={shareToWhatsApp} disabled={sharing || coverLoading || !coverFile} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
                  <Share2 className="w-3.5 h-3.5" />
                  {sharing ? 'Sharing cover photo…' : 'Share cover photo'}
                </button>
              </div>
            </div>
            {coverError && (
              <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                {coverError}
              </p>
            )}
            <p className="mb-3 text-xs text-slate-600">
              Share cover photo sends the main property photo with the listing text. On phones, choose WhatsApp in the share sheet; on desktop, the cover photo downloads and WhatsApp opens with the text. Download cover photo saves the original cover; Download A4 poster saves the designed poster separately. Both images are prepared by the server, avoiding browser image CORS.
            </p>

            <div className="rounded-[24px] p-3 border border-slate-200" style={{ background: theme.gradient }}>
              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                <img src={imageUrl} alt={property?.title || 'Property'} className="h-36 sm:h-52 w-full object-cover" />
                {posterPhotos.length > 1 && (
                  <div className="grid grid-cols-4 gap-1 p-1">
                    {posterPhotos.slice(0, 5).map((photo, index) => (
                      <button key={photo} type="button" onClick={() => updatePosterContent(setHeroPhotoIndex, index)} aria-label={`Use property photo ${index + 1} as the poster cover`} className={`overflow-hidden rounded ${heroPhotoIndex === index ? 'ring-2 ring-emerald-600' : ''}`}>
                        <img src={photo} alt={`Property view ${index + 1}`} className="h-14 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: theme.badge }}>
                      {property?.propertyType || 'Property'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{publicLocation}</span>
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 leading-snug">{sanitizeShareText(headline, property)}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{sanitizeShareText(caption, property)}</p>

                  <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xl font-bold text-emerald-900">
                    KSh {Number(property?.price || property?.rentAmount || property?.rent || 0).toLocaleString()}
                    {(property?.paymentFrequency || property?.status === 'rent') && <span className="ml-1 text-xs font-semibold">/ {(property?.paymentFrequency || 'Monthly').toUpperCase()}</span>}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    {property?.bedrooms !== undefined && <div className="rounded-lg bg-slate-100 px-2 py-1.5">Bedrooms: {property.bedrooms}</div>}
                    {property?.bathrooms !== undefined && <div className="rounded-lg bg-slate-100 px-2 py-1.5">Bathrooms: {property.bathrooms}</div>}
                    {property?.area && <div className="rounded-lg bg-slate-100 px-2 py-1.5">Area: {property.area}</div>}
                    {getAvailabilityLabel(property) && <div className="rounded-lg bg-slate-100 px-2 py-1.5">{getAvailabilityLabel(property)}</div>}
                    {getDepositLabel(property) && <div className="rounded-lg bg-slate-100 px-2 py-1.5">Deposit: {getDepositLabel(property)}</div>}
                  </div>

                  {highlights.split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Why you’ll love it</div>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {highlights.split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).slice(0, 5).map((point, index) => (
                          <li key={`${point}-${index}`} className="flex gap-2"><span className="text-emerald-600">•</span><span>{point}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {features.split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Features</div>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {features.split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).slice(0, 4).map((point, index) => (
                          <li key={`${point}-${index}`} className="flex gap-2"><span className="text-emerald-600">•</span><span>{point}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nearby.split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Nearby</div>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {nearby.split(/\r?\n/).map((point) => sanitizeShareText(point, property)).filter(Boolean).slice(0, 4).map((point, index) => (
                          <li key={`${point}-${index}`} className="flex gap-2"><span className="text-emerald-600">•</span><span>{point}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-white">
                    Book a site visit
                  </div>

                  {contact && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        <Phone className="w-3.5 h-3.5" />
                        Contact · {contact.name}
                      </div>
                      {contact.phone && (
                        <a href={contact.whatsappUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-700">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          WhatsApp: {contact.phone}
                        </a>
                      )}
                      {contact.email && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {contact.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {posterPreviewUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                <img src={posterPreviewUrl} alt="Generated MarketMix property poster" className="mx-auto max-h-[560px] w-auto rounded-lg object-contain" />
              </div>
            )}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                <MessageCircle className="w-3.5 h-3.5" />
                Final WhatsApp text
              </div>
              <pre className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-700 font-sans bg-white border border-slate-200 rounded-lg p-3 max-h-32 sm:max-h-52 overflow-auto">
                {finalMessage}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
