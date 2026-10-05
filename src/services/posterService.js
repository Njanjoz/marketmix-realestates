// src/services/posterService.js - Robust Canvas-Based Generator inspired by SellerPromote logic

import QRCode from 'qrcode';

const THEMES = {
  emerald: { bg: '#ecfdf5', badge: '#10b981', accent: '#0f766e', text: '#065f46', headerBg: '#0f766e' },
  blue: { bg: '#eff6ff', badge: '#2563eb', accent: '#1d4ed8', text: '#1e40af', headerBg: '#1d4ed8' },
  amber: { bg: '#fff7ed', badge: '#f59e0b', accent: '#b45309', text: '#92400e', headerBg: '#b45309' },
  midnight: { bg: '#1e293b', badge: '#38bdf8', accent: '#0f172a', text: '#e2e8f0', headerBg: '#0f172a' },
  sunset: { bg: '#fff1f2', badge: '#f43f5e', accent: '#be123c', text: '#881337', headerBg: '#9f1239' },
};

// Robust URL normalization from SellerPromote logic
const normalizeImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('gs://')) {
    const path = url.replace('gs://marketmix-realestates.appspot.com/', '');
    return `https://firebasestorage.googleapis.com/v0/b/marketmix-realestates.appspot.com/o/${encodeURIComponent(path)}?alt=media`;
  }
  return url;
};

// Resilient image loader with anonymous CORS and cache-busting retry
const loadImage = (url) => new Promise((resolve) => {
  const normalizedUrl = normalizeImageUrl(url);
  if (!normalizedUrl) {
    resolve(null);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => {
    // Retry with cache-buster if initial load fails (CORS/CDN issues)
    const retryImg = new Image();
    retryImg.crossOrigin = 'anonymous';
    retryImg.onload = () => resolve(retryImg);
    retryImg.onerror = () => resolve(null);
    retryImg.src = normalizedUrl + (normalizedUrl.includes('?') ? '&' : '?') + 'retry=' + Date.now();
  };
  img.src = normalizedUrl;
});

const drawRoundedRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const exportCanvasBlob = async (canvas, mimeType = 'image/jpeg', quality = 0.9) => {
  return new Promise((resolve) => {
    try {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) resolve(blob);
          else fallbackDataUrl();
        }, mimeType, quality);
      } else {
        fallbackDataUrl();
      }
    } catch (err) {
      console.warn('[Poster] toBlob failed, using dataURL fallback:', err);
      fallbackDataUrl();
    }

    function fallbackDataUrl() {
      try {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        resolve(new Blob([u8arr], { type: mime }));
      } catch (e) {
        console.error('[Poster] Export failed completely:', e);
        resolve(null);
      }
    }
  });
};

export const getPromoCoverImage = async (photos = [], propertyTitle = 'Property') => {
  const photoUrl = Array.isArray(photos) ? photos.find(p => typeof p === 'string' && p.trim()) : null;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = await loadImage(photoUrl);
  if (img) {
    const hRatio = canvas.width / img.width;
    const vRatio = canvas.height / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (canvas.width - img.width * ratio) / 2;
    const centerShiftY = (canvas.height - img.height * ratio) / 2;
    ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
  }

  // Overlay
  const bannerHeight = 160;
  const gradOverlay = ctx.createLinearGradient(0, canvas.height - bannerHeight, 0, canvas.height);
  gradOverlay.addColorStop(0, 'rgba(0,0,0,0)');
  gradOverlay.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = gradOverlay;
  ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MARKETMIX REAL ESTATES', 60, canvas.height - 90);
  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('Verified Property Listing · Tap to view details', 60, canvas.height - 50);

  const blob = await exportCanvasBlob(canvas, 'image/jpeg', 0.9);
  const safeTitle = propertyTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  
  return {
    file: new File([blob], `MarketMix_${safeTitle}_Cover.jpg`, { type: 'image/jpeg' }),
    hasPropertyPhoto: !!img,
  };
};

export const generatePromoPoster = async (posterData = {}) => {
  const photoUrl = Array.isArray(posterData.photos) ? posterData.photos.find(p => typeof p === 'string' && p.trim()) : null;
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');

  const themeKey = posterData.theme || 'emerald';
  const theme = THEMES[themeKey] || THEMES.emerald;
  const fontFamily = posterData.fontFamily || 'Arial, sans-serif';

  // Background
  ctx.fillStyle = themeKey === 'midnight' ? '#0f172a' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header
  ctx.fillStyle = theme.headerBg;
  ctx.fillRect(0, 0, canvas.width, 130);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 38px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MARKETMIX REAL ESTATES', canvas.width / 2, 65);

  // Image Area
  const imgX = 80, imgY = 170, imgW = 1080, imgH = 620;
  ctx.fillStyle = '#f1f5f9';
  drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 16);
  ctx.fill();

  const img = await loadImage(photoUrl);
  if (img) {
    ctx.save();
    drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 16);
    ctx.clip();
    const hRatio = imgW / img.width;
    const vRatio = imgH / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = imgX + (imgW - img.width * ratio) / 2;
    const centerShiftY = imgY + (imgH - img.height * ratio) / 2;
    ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
    ctx.restore();
  }

  let currentY = 850;

  // Badge & Location
  const propertyType = (posterData.property?.propertyType || posterData.property?.unitType || 'PROPERTY').toUpperCase();
  ctx.fillStyle = theme.badge;
  drawRoundedRect(ctx, 80, currentY - 30, 200, 46, 23);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 18px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(propertyType, 180, currentY - 7);

  ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
  ctx.font = `20px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText(posterData.location || '', 1160, currentY - 7);

  currentY += 80;

  // Headline
  ctx.fillStyle = themeKey === 'midnight' ? '#ffffff' : '#0f172a';
  ctx.font = `bold 42px ${fontFamily}`;
  ctx.textAlign = 'left';
  ctx.fillText(posterData.headline || 'Premium Property', 80, currentY);

  currentY += 60;

  // Price Box
  ctx.fillStyle = theme.bg;
  drawRoundedRect(ctx, 80, currentY - 40, 1080, 90, 16);
  ctx.fill();
  ctx.fillStyle = theme.text;
  ctx.font = `bold 38px ${fontFamily}`;
  const priceVal = Number(posterData.price || 0).toLocaleString();
  const freq = posterData.property?.paymentFrequency ? ` / ${posterData.property.paymentFrequency}` : '';
  ctx.fillText(`KSh ${priceVal}${freq}`, 110, currentY + 7);

  currentY += 120;

  // Sections
  const order = Array.isArray(posterData.sectionsOrder) ? posterData.sectionsOrder : ['highlights', 'features', 'nearby'];
  const titles = { highlights: "WHY YOU'LL LOVE IT", features: "FEATURES", nearby: "NEARBY" };
  const data = { highlights: posterData.highlights, features: posterData.features, nearby: posterData.nearby };

  order.forEach(key => {
    const items = data[key];
    if (!Array.isArray(items) || items.length === 0) return;
    if (currentY > 1450) return; // Basic overflow prevention

    ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
    ctx.font = `bold 22px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(titles[key], 80, currentY);
    currentY += 35;

    ctx.fillStyle = themeKey === 'midnight' ? '#cbd5e1' : '#334155';
    ctx.font = `20px ${fontFamily}`;
    items.slice(0, 4).forEach(item => {
      ctx.fillText(`• ${item}`, 100, currentY);
      currentY += 35;
    });
    currentY += 20;
  });

  // Footer & QR
  const footerY = 1600;
  if (posterData.contact?.phone) {
    ctx.fillStyle = themeKey === 'midnight' ? '#1e293b' : '#0f172a';
    drawRoundedRect(ctx, 80, footerY, 880, 90, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 22px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(`CONTACT: ${posterData.contact.phone}${posterData.contact.email ? ` | ${posterData.contact.email}` : ''}`, 120, footerY + 45);
  }

  if (posterData.listingUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(posterData.listingUrl, { width: 200, margin: 1 });
      const qrImg = await loadImage(qrDataUrl);
      if (qrImg) {
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(ctx, 1000, footerY - 80, 160, 160, 16);
        ctx.fill();
        ctx.drawImage(qrImg, 1010, footerY - 70, 140, 140);
        ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
        ctx.font = `14px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('Scan to view', 1080, footerY + 105);
      }
    } catch (e) { console.warn(e); }
  }

  const blob = await exportCanvasBlob(canvas, 'image/png', 0.95);
  const propertyTitle = posterData.property?.title || posterData.headline || 'Property';
  const safeTitle = propertyTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);

  return {
    file: new File([blob], `MarketMix_${safeTitle}_Poster.png`, { type: 'image/png' }),
    hasPropertyPhoto: !!img,
  };
};
