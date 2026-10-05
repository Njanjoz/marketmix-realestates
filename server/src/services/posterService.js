import QRCode from 'qrcode';
import sharp from 'sharp';
import process from 'node:process';
import { Buffer } from 'node:buffer';

const WIDTH = 1080;
const HEIGHT = Math.round(WIDTH * 297 / 210);
const FOOTER_HEIGHT = 220;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;
const THEMES = {
  emerald: { accent: '#0f766e' },
  blue: { accent: '#1d4ed8' },
  amber: { accent: '#b45309' },
};
const BASE_IMAGE_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'images.unsplash.com',
]);

const escapeXml = (value) => [...String(value ?? '')]
  .filter((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint === 9 || codePoint === 10 || codePoint === 13 || codePoint >= 32;
  })
  .join('')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const safeText = (value, maxLength = 240) => String(value ?? '').trim().slice(0, maxLength);

const wrapText = (value, maxChars, maxLines = 2) => {
  const words = safeText(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
};

const textMarkup = (value, x, y, options = {}) => {
  const {
    maxChars = 80,
    maxLines = 1,
    lineHeight = 28,
    fontSize = 20,
    fontWeight = 400,
    fill = '#334155',
  } = options;
  return wrapText(value, maxChars, maxLines)
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" fill="${fill}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="${fontWeight}">${escapeXml(line)}</text>`)
    .join('');
};

const allowedImageHosts = () => new Set([
  ...BASE_IMAGE_HOSTS,
  ...(process.env.POSTER_IMAGE_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
]);

const isAllowedImageHost = (hostname) => {
  const host = hostname.toLowerCase();
  return allowedImageHosts().has(host) || host.endsWith('.firebasestorage.app');
};

const fetchPosterPhoto = async (urlValue) => {
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !isAllowedImageHost(url.hostname)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'error' });
    if (!response.ok || !/^image\/(jpeg|png|webp|avif)$/i.test(response.headers.get('content-type') || '')) return null;
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_IMAGE_BYTES) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return null;
    return await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize(1200, 900, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  } catch (error) {
    console.warn('[Poster] Could not load a property photo:', error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const createCoverImage = async (photoUrls = []) => {
  const urls = Array.isArray(photoUrls) ? photoUrls.filter((photo) => typeof photo === 'string').slice(0, MAX_IMAGE_COUNT) : [];
  for (const url of urls) {
    const image = await fetchPosterPhoto(url);
    if (image) {
      return await sharp(image).resize(1600, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
    }
  }
  return null;
};

const createPlaceholderPhoto = () => Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="300"><rect width="1080" height="300" fill="#e2e8f0"/><path d="M0 250 250 80l180 130 190-170 460 280v-20H0z" fill="#cbd5e1"/><text x="540" y="275" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#475569">PROPERTY PHOTO UNAVAILABLE</text></svg>'
);

const validPublicUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};

export const createPosterPng = async (input = {}) => {
  const suppliedPhotos = Array.isArray(input.photos)
    ? input.photos.filter((photo) => typeof photo === 'string').slice(0, MAX_IMAGE_COUNT)
    : [];
  const photos = (await Promise.all(suppliedPhotos.map(fetchPosterPhoto))).filter(Boolean);
  const hasPropertyPhoto = photos.length > 0;
  if (!photos.length) photos.push(await sharp(createPlaceholderPhoto()).png().toBuffer());

  const property = input.property && typeof input.property === 'object' ? input.property : {};
  const headline = safeText(input.headline || property.title || 'Property Listing');
  const caption = safeText(input.caption || 'A great property for you.');
  const location = safeText(input.location || property.approximateLocation || property.town || 'Area shared on inquiry');
  const propertyType = safeText(property.propertyType || property.unitType || 'PROPERTY', 80);
  const accent = THEMES[input.theme]?.accent || THEMES.emerald.accent;
  const listingUrl = validPublicUrl(input.listingUrl);
  const price = Number(input.price || property.price || property.rentAmount || property.rent || 0);
  const frequency = safeText(property.paymentFrequency || (property.status === 'rent' ? 'Monthly' : ''), 32);
  const details = [
    property.bedrooms !== undefined && property.bedrooms !== '' ? `${property.bedrooms} bedroom${Number(property.bedrooms) === 1 ? '' : 's'}` : '',
    property.bathrooms !== undefined && property.bathrooms !== '' ? `${property.bathrooms} bathroom${Number(property.bathrooms) === 1 ? '' : 's'}` : '',
    property.area ? `Area: ${safeText(property.area, 60)}` : '',
    input.availability ? safeText(input.availability, 60) : '',
    input.deposit ? `Deposit: ${safeText(input.deposit, 60)}` : '',
  ].filter(Boolean);
  const sections = [
    ["WHY YOU'LL LOVE IT", input.highlights],
    ['FEATURES', input.features],
    ['NEARBY', input.nearby],
  ];

  const composites = [
    {
      input: await sharp(photos[0]).resize(WIDTH, 300, { fit: 'cover', position: 'centre' }).png().toBuffer(),
      left: 0,
      top: 72,
    },
  ];
  if (photos.length > 1) {
    const thumbnails = photos.slice(1, 5);
    const gap = 8;
    const thumbWidth = Math.floor((WIDTH - gap * (thumbnails.length - 1)) / thumbnails.length);
    for (const [index, photo] of thumbnails.entries()) {
      const thumb = await sharp(photo).resize(thumbWidth, 70, { fit: 'cover' }).png().toBuffer();
      composites.push({ input: thumb, left: index * (thumbWidth + gap), top: 380 });
    }
  }

  const footerY = HEIGHT - FOOTER_HEIGHT;
  const markup = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<rect width="1080" height="72" fill="${accent}"/>`,
    '<text x="56" y="47" fill="#fff" font-family="Arial,sans-serif" font-size="25" font-weight="700">MARKETMIX REAL ESTATES</text>',
    textMarkup(`${propertyType}${property.status === 'rent' ? ' · TO LET' : property.status === 'sale' ? ' · FOR SALE' : ''}`, 58, photos.length > 1 ? 492 : 427, {
      maxChars: 62,
      fontSize: 19,
      fontWeight: 700,
      fill: accent,
    }),
  ];
  let y = photos.length > 1 ? 542 : 477;
  markup.push(textMarkup(headline, 58, y, { maxChars: 38, maxLines: 2, lineHeight: 48, fontSize: 42, fontWeight: 700, fill: '#0f172a' }));
  y += wrapText(headline, 38, 2).length * 48 + 4;
  markup.push(textMarkup(caption, 58, y, { maxChars: 85, maxLines: 2, lineHeight: 28, fontSize: 22, fill: '#475569' }));
  y += wrapText(caption, 85, 2).length * 28 + 12;
  markup.push(`<rect x="42" y="${y}" width="996" height="76" rx="16" fill="#ecfdf5"/>`);
  markup.push(textMarkup(`KSh ${price.toLocaleString()}${frequency ? ` / ${frequency.toUpperCase()}` : ''}`, 64, y + 50, { maxChars: 48, fontSize: 39, fontWeight: 700, fill: accent }));
  y += 102;
  markup.push(textMarkup(`AREA · ${location}`, 58, y, { maxChars: 84, fontSize: 22, fontWeight: 700 }));
  y += 38;
  if (details.length) {
    markup.push(textMarkup(details.join(' · '), 58, y, { maxChars: 105, maxLines: 2, lineHeight: 24, fontSize: 18 }));
    y += wrapText(details.join(' · '), 105, 2).length * 24 + 8;
  }

  for (const [title, values] of sections) {
    const points = (Array.isArray(values) ? values : String(values || '').split(/\r?\n/))
      .map((point) => safeText(point, 120))
      .filter(Boolean)
      .slice(0, 3);
    const availableRows = Math.floor((footerY - 24 - y - 31) / 23);
    const visiblePoints = points.slice(0, Math.max(0, Math.min(points.length, availableRows)));
    if (!visiblePoints.length) continue;
    markup.push(`<text x="58" y="${y + 18}" fill="#0f172a" font-family="Arial,sans-serif" font-size="18" font-weight="700">${escapeXml(title)}</text>`);
    y += 28;
    for (const point of visiblePoints) {
      markup.push(textMarkup(`• ${point}`, 66, y + 16, { maxChars: 100, fontSize: 17 }));
      y += 23;
    }
    y += 4;
  }

  markup.push(`<rect x="0" y="${footerY}" width="${WIDTH}" height="${FOOTER_HEIGHT}" fill="${accent}"/>`);
  markup.push(`<text x="58" y="${footerY + 45}" fill="#fff" font-family="Arial,sans-serif" font-size="27" font-weight="700">BOOK A SITE VISIT</text>`);
  markup.push(`<text x="58" y="${footerY + 80}" fill="#fff" font-family="Arial,sans-serif" font-size="21">MarketMix Real Estates</text>`);
  const phone = safeText(input.contact?.phone, 60);
  const email = safeText(input.contact?.email, 100);
  if (phone || email) {
    markup.push(textMarkup(phone ? `Call / WhatsApp: ${phone}` : email, 58, footerY + 116, { maxChars: 60, maxLines: 2, lineHeight: 25, fontSize: 19, fontWeight: phone ? 700 : 400, fill: '#fff' }));
  }
  if (listingUrl) {
    markup.push(`<text x="58" y="${footerY + 185}" fill="#fff" font-family="Arial,sans-serif" font-size="15">Scan the QR code for listing details</text>`);
  }
  markup.push('</svg>');
  composites.push({ input: Buffer.from(markup.join('')), top: 0, left: 0 });

  if (listingUrl) {
    try {
      const qr = await QRCode.toBuffer(listingUrl, { type: 'png', width: 144, margin: 1, errorCorrectionLevel: 'M' });
      composites.push({ input: qr, left: 870, top: footerY + 18 });
    } catch (error) {
      console.warn('[Poster] Could not create listing QR code:', error.message);
    }
  }

  const buffer = await sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 4, background: '#ffffff' },
  }).composite(composites).png().toBuffer();
  return { buffer, hasPropertyPhoto };
};
