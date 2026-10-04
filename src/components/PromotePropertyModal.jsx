import React, { useMemo, useState } from 'react';
import { X, MessageCircle, Sparkles, Phone, Mail, Share2, Download } from 'lucide-react';
import { resolvePropertyImage } from '../utils/propertyMapping';

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
};

const getPropertyUrl = (property) => {
  if (property?.url || property?.propertyUrl) return property.url || property.propertyUrl;

  if (typeof window === 'undefined') return '';
  const id = property?.id || property?.propertyId;
  if (!id) return window.location.href;

  try {
    return new URL(`/property/${encodeURIComponent(id)}`, window.location.origin).toString();
  } catch (error) {
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

const getInitialHighlights = (property) => {
  const highlights = [];
  if (property?.bedrooms !== undefined && property?.bedrooms !== null && property?.bedrooms !== '') {
    highlights.push(`Bedrooms: ${property.bedrooms}`);
  }
  if (property?.bathrooms !== undefined && property?.bathrooms !== null && property?.bathrooms !== '') {
    highlights.push(`Bathrooms: ${property.bathrooms}`);
  }
  if (property?.area) highlights.push(`Area: ${property.area}`);
  if (Array.isArray(property?.features)) {
    highlights.push(...property.features.map((item) => typeof item === 'string' ? item : item?.label || item?.name).filter(Boolean));
  }
  return highlights.slice(0, 5).join('\n');
};

const drawWrappedText = (context, text, x, y, maxWidth, lineHeight, maxLines) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((textLine, index) => {
    context.fillText(textLine, x, y + index * lineHeight, maxWidth);
  });
  return y + Math.min(lines.length, maxLines) * lineHeight;
};

const createPromoSticker = ({ imageUrl, headline, caption, highlights, property, contact, theme }) => new Promise((resolve, reject) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    try {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const imageHeight = 570;
      const scale = Math.max(canvas.width / image.width, imageHeight / image.height);
      const cropWidth = canvas.width / scale;
      const cropHeight = imageHeight / scale;
      context.drawImage(image, (image.width - cropWidth) / 2, (image.height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, imageHeight);

      context.fillStyle = theme.badge;
      context.fillRect(0, imageHeight, canvas.width, 12);
      context.fillStyle = '#0f172a';
      context.font = 'bold 54px sans-serif';
      let y = drawWrappedText(context, headline || 'Property Listing', 64, 660, 952, 62, 2) + 12;

      context.fillStyle = '#475569';
      context.font = '30px sans-serif';
      y = drawWrappedText(context, caption, 64, y, 952, 42, 2) + 28;

      context.fillStyle = theme.accent;
      context.font = 'bold 34px sans-serif';
      y = drawWrappedText(context, `KES ${Number(property?.price || property?.rentAmount || property?.rent || 0).toLocaleString()}  ·  ${property?.location || property?.approximateLocation || 'Location on request'}`, 64, y, 952, 44, 2) + 4;

      context.fillStyle = '#334155';
      context.font = '26px sans-serif';
      y = drawWrappedText(context, `${property?.propertyType || property?.unitType || 'Property'}${property?.status ? `  ·  ${property.status}` : ''}`, 64, y, 952, 36, 1) + 18;

      const points = String(highlights || '').split(/\r?\n/).map((point) => point.trim()).filter(Boolean).slice(0, 4);
      if (points.length) {
        context.fillStyle = '#0f172a';
        context.font = 'bold 25px sans-serif';
        context.fillText('KEY DETAILS', 64, y);
        y += 38;
        context.fillStyle = '#334155';
        context.font = '24px sans-serif';
        points.forEach((point) => {
          y = drawWrappedText(context, `• ${point}`, 70, y, 940, 32, 1) + 4;
        });
      }

      if (contact?.phone || contact?.email) {
        context.fillStyle = '#f1f5f9';
        context.fillRect(0, 1240, canvas.width, 110);
        context.fillStyle = '#0f172a';
        context.font = 'bold 24px sans-serif';
        context.fillText(contact.name, 64, 1282);
        context.font = '22px sans-serif';
        context.fillText(contact.phone ? `WhatsApp: ${contact.phone}` : contact.email, 64, 1320, 952);
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Could not create promo image'));
          return;
        }
        resolve(new File([blob], 'property-promo.png', { type: 'image/png' }));
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  };
  image.onerror = () => reject(new Error('Could not load the property photo for sharing'));
  image.src = imageUrl;
});

const buildPromotedPropertyMessage = ({ property, headline, caption, highlights, imageUrl, includeContact, userProfile, currentUser }) => {
  const title = property?.title || 'Property Listing';
  const location = property?.location || property?.approximateLocation || 'Location available on request';
  const price = property?.price || property?.rentAmount || property?.rent || 0;
  const type = property?.propertyType || property?.unitType || 'Property';
  const url = getPropertyUrl(property);
  const points = String(highlights || '').split(/\r?\n/).map((point) => point.trim()).filter(Boolean);

  const lines = [
    headline || `${title} • ${location}`,
    '',
    caption || `Beautiful ${type.toLowerCase()} in ${location}.`,
    '',
    'PROPERTY DETAILS',
    `• Price: KES ${Number(price || 0).toLocaleString()}`,
    `• Location: ${location}`,
    `• Type: ${type}`,
    ...points.map((point) => `• ${point}`),
  ];

  if (url) {
    lines.push(`View property: ${url}`);
  }

  if (imageUrl) lines.push(`Property photo: ${imageUrl}`);

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
  const imageUrl = resolvePropertyImage(property) || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200';
  const role = userProfile?.role || 'user';
  const canShowContact = ['admin', 'seller', 'agent'].includes(role);

  const [themeKey, setThemeKey] = useState('emerald');
  const [headline, setHeadline] = useState(property?.title || 'Premium Property for You');
  const [caption, setCaption] = useState(
    property?.description || `Amazing ${property?.propertyType || 'property'} in ${property?.location || 'Kenya'}.`
  );
  const [highlights, setHighlights] = useState(() => getInitialHighlights(property));
  const [includeContact, setIncludeContact] = useState(canShowContact);
  const [sharing, setSharing] = useState(false);

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
      imageUrl,
      includeContact: includeContact && canShowContact,
      userProfile,
      currentUser,
    }),
    [property, headline, caption, highlights, imageUrl, includeContact, canShowContact, userProfile, currentUser]
  );

  const downloadPromoImage = async () => {
    try {
      const file = await createPromoSticker({ imageUrl, headline, caption, highlights, property, contact, theme });
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('[Property share] Could not create promo image:', error);
    }
  };

  const shareToWhatsApp = async () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
    if (!navigator.share) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setSharing(true);
    try {
      const file = await createPromoSticker({ imageUrl, headline, caption, highlights, property, contact, theme });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: headline, text: finalMessage });
      } else {
        await navigator.share({ title: headline, text: finalMessage, url: imageUrl });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.warn('[Property share] Image sharing unavailable; opening WhatsApp text share:', error);
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl sm:rounded-[28px] border border-white/50 bg-white shadow-2xl">
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
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Promo message</label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Key points · one per line</label>
                <textarea
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  rows={4}
                  placeholder={'Bedrooms: 3\nBathrooms: 2\nNear public transport'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Theme</label>
                <div className="flex gap-2">
                  {Object.entries(THEME_OPTIONS).map(([key, option]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setThemeKey(key)}
                      className={`w-8 h-8 rounded-full border-2 ${themeKey === key ? 'border-slate-800' : 'border-white'} shadow-sm`}
                      style={{ background: option.gradient }}
                      title={key}
                    />
                  ))}
                </div>
              </div>

              {canShowContact && (
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeContact}
                    onChange={(e) => setIncludeContact(e.target.checked)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Include my WhatsApp number and contact details
                </label>
              )}
            </div>
          </div>

          <div className="min-w-0 p-4 sm:p-5 bg-white">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Preview</div>
              <button type="button" onClick={shareToWhatsApp} disabled={sharing} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                <Share2 className="w-3.5 h-3.5" />
                {sharing ? 'Preparing share…' : 'Share property'}
              </button>
              <button type="button" onClick={downloadPromoImage} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Download className="w-3.5 h-3.5" />
                Download card
              </button>
            </div>

            <div className="rounded-[24px] p-3 border border-slate-200" style={{ background: theme.gradient }}>
              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                <img src={imageUrl} alt={property?.title || 'Property'} className="h-36 sm:h-52 w-full object-cover" />
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: theme.badge }}>
                      {property?.propertyType || 'Property'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{property?.location || 'Location'}</span>
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 leading-snug">{headline}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{caption}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="rounded-lg bg-slate-100 px-2 py-1.5">Price: KES {Number(property?.price || property?.rentAmount || 0).toLocaleString()}</div>
                    {property?.bedrooms !== undefined && <div className="rounded-lg bg-slate-100 px-2 py-1.5">Bedrooms: {property.bedrooms}</div>}
                    {property?.bathrooms !== undefined && <div className="rounded-lg bg-slate-100 px-2 py-1.5">Bathrooms: {property.bathrooms}</div>}
                    {property?.area && <div className="rounded-lg bg-slate-100 px-2 py-1.5">Area: {property.area}</div>}
                  </div>

                  {highlights.split(/\r?\n/).map((point) => point.trim()).filter(Boolean).length > 0 && (
                    <div className="mt-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Key details</div>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {highlights.split(/\r?\n/).map((point) => point.trim()).filter(Boolean).map((point, index) => (
                          <li key={`${point}-${index}`} className="flex gap-2"><span className="text-emerald-600">•</span><span>{point}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}

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
