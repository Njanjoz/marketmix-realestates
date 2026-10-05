// src/services/posterService.js - Pure Client-Side Canvas Poster & Cover Generator with Robust Multi-Tier Image Loading

import QRCode from 'qrcode';

const THEMES = {
  emerald: { bg: '#ecfdf5', badge: '#10b981', accent: '#0f766e', text: '#065f46', headerBg: '#0f766e' },
  blue: { bg: '#eff6ff', badge: '#2563eb', accent: '#1d4ed8', text: '#1e40af', headerBg: '#1d4ed8' },
  amber: { bg: '#fff7ed', badge: '#f59e0b', accent: '#b45309', text: '#92400e', headerBg: '#b45309' },
  midnight: { bg: '#1e293b', badge: '#38bdf8', accent: '#0f172a', text: '#e2e8f0', headerBg: '#0f172a' },
  sunset: { bg: '#fff1f2', badge: '#f43f5e', accent: '#be123c', text: '#881337', headerBg: '#9f1239' },
};

const loadImage = async (url) => {
  if (!url || typeof url !== 'string') return null;

  // Strategy 1: Standard load with anonymous CORS
  const img1 = await new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  if (img1) return img1;

  // Strategy 2: Fetch as blob to bypass CORS header restrictions
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img2 = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
      });
      if (img2) return img2;
    }
  } catch (err) {
    console.warn('[Poster] Blob fetch image loading fallback caught:', err);
  }

  // Strategy 3: Direct fallback without CORS
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

const exportCanvasBlob = async (canvas, mimeType = 'image/jpeg', quality = 0.9) => {
  return new Promise((resolve) => {
    try {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            resolve(blob);
          } else {
            fallbackDataUrl();
          }
        }, mimeType, quality);
      } else {
        fallbackDataUrl();
      }
    } catch (err) {
      console.warn('[Poster] toBlob failed, trying dataURL:', err);
      fallbackDataUrl();
    }

    function fallbackDataUrl() {
      try {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        if (dataUrl && dataUrl.startsWith('data:')) {
          const arr = dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          resolve(new Blob([u8arr], { type: mime }));
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('[Poster] dataURL fallback also failed:', e);
        resolve(null);
      }
    }
  });
};

export const getPromoCoverImage = async (photos = []) => {
  const photoUrl = Array.isArray(photos) ? photos.find(p => typeof p === 'string' && p.trim()) : null;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let img = await loadImage(photoUrl);
  let hasPhoto = false;

  if (img) {
    try {
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      hasPhoto = true;
    } catch {
      hasPhoto = false;
    }
  }

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

  let blob = await exportCanvasBlob(canvas, 'image/jpeg', 0.9);
  
  if (!blob) {
    canvas.width = 600;
    canvas.height = 450;
    const ctx2 = canvas.getContext('2d');
    ctx2.fillStyle = '#0f172a';
    ctx2.fillRect(0, 0, 600, 450);
    ctx2.fillStyle = '#ffffff';
    ctx2.font = 'bold 24px Arial, sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('MarketMix Real Estates', 300, 225);
    blob = await exportCanvasBlob(canvas, 'image/jpeg', 0.8);
  }

  if (blob) {
    return {
      file: new File([blob], 'marketmix-property-cover.jpg', { type: 'image/jpeg' }),
      hasPropertyPhoto: hasPhoto,
    };
  }

  throw new Error('Could not generate cover image');
};

export const generatePromoPoster = async (posterData = {}) => {
  const photos = Array.isArray(posterData.photos) ? posterData.photos : [];
  const photoUrl = photos.find(p => typeof p === 'string' && p.trim());
  
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');

  const themeKey = posterData.theme || 'emerald';
  const theme = THEMES[themeKey] || THEMES.emerald;
  const fontFamily = posterData.fontFamily || 'Arial, sans-serif';

  ctx.fillStyle = themeKey === 'midnight' ? '#0f172a' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = theme.headerBg;
  ctx.fillRect(0, 0, canvas.width, 130);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 38px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText('MARKETMIX REAL ESTATES', canvas.width / 2, 78);

  const imgX = 80;
  const imgY = 170;
  const imgW = canvas.width - 160;
  const imgH = 620;

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(imgX, imgY, imgW, imgH);

  let img = await loadImage(photoUrl);
  let hasPhoto = false;
  if (img) {
    try {
      const hRatio = imgW / img.width;
      const vRatio = imgH / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = imgX + (imgW - img.width * ratio) / 2;
      const centerShiftY = imgY + (imgH - img.height * ratio) / 2;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(imgX, imgY, imgW, imgH);
      ctx.clip();
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      ctx.restore();
      hasPhoto = true;
    } catch {
      hasPhoto = false;
    }
  }

  let currentY = imgY + imgH + 50;

  const propertyType = posterData.property?.propertyType || posterData.property?.unitType || 'PROPERTY';
  ctx.fillStyle = theme.badge;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(80, currentY, 200, 46, 23);
    ctx.fill();
  } else {
    ctx.fillRect(80, currentY, 200, 46);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 18px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillText(propertyType.toUpperCase(), 180, currentY + 29);

  ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
  ctx.font = `20px ${fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText(posterData.location || '', canvas.width - 80, currentY + 29);

  currentY += 75;

  ctx.fillStyle = themeKey === 'midnight' ? '#ffffff' : '#0f172a';
  ctx.font = `bold 40px ${fontFamily}`;
  ctx.textAlign = 'left';
  const headline = posterData.headline || posterData.property?.title || 'Premium Property';
  ctx.fillText(headline, 80, currentY, canvas.width - 160);

  currentY += 55;

  ctx.fillStyle = theme.bg;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(80, currentY, canvas.width - 160, 85, 16);
    ctx.fill();
  } else {
    ctx.fillRect(80, currentY, canvas.width - 160, 85);
  }

  ctx.fillStyle = theme.text;
  ctx.font = `bold 36px ${fontFamily}`;
  const priceVal = Number(posterData.price || 0).toLocaleString();
  const freq = posterData.property?.paymentFrequency ? ` / ${posterData.property.paymentFrequency}` : '';
  ctx.fillText(`KSh ${priceVal}${freq}`, 110, currentY + 55);

  currentY += 115;

  // Render sections based on user's reordered sequence
  const sectionsMap = {
    highlights: () => {
      const items = posterData.highlights;
      if (!Array.isArray(items) || items.length === 0) return;
      ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
      ctx.font = `bold 20px ${fontFamily}`;
      ctx.fillText("WHY YOU'LL LOVE IT", 80, currentY);
      currentY += 32;

      ctx.fillStyle = themeKey === 'midnight' ? '#cbd5e1' : '#334155';
      ctx.font = `20px ${fontFamily}`;
      for (const item of items.slice(0, 4)) {
        ctx.fillText(`• ${item}`, 100, currentY);
        currentY += 34;
      }
      currentY += 15;
    },
    features: () => {
      const items = posterData.features;
      if (!Array.isArray(items) || items.length === 0) return;
      ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
      ctx.font = `bold 20px ${fontFamily}`;
      ctx.fillText("FEATURES", 80, currentY);
      currentY += 32;

      ctx.fillStyle = themeKey === 'midnight' ? '#cbd5e1' : '#334155';
      ctx.font = `20px ${fontFamily}`;
      for (const item of items.slice(0, 4)) {
        ctx.fillText(`• ${item}`, 100, currentY);
        currentY += 34;
      }
      currentY += 15;
    },
    nearby: () => {
      const items = posterData.nearby;
      if (!Array.isArray(items) || items.length === 0) return;
      ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
      ctx.font = `bold 20px ${fontFamily}`;
      ctx.fillText("NEARBY", 80, currentY);
      currentY += 32;

      ctx.fillStyle = themeKey === 'midnight' ? '#cbd5e1' : '#334155';
      ctx.font = `20px ${fontFamily}`;
      for (const item of items.slice(0, 4)) {
        ctx.fillText(`• ${item}`, 100, currentY);
        currentY += 34;
      }
      currentY += 15;
    }
  };

  const order = Array.isArray(posterData.sectionsOrder) ? posterData.sectionsOrder : ['highlights', 'features', 'nearby'];
  for (const key of order) {
    if (sectionsMap[key]) sectionsMap[key]();
  }

  if (posterData.listingUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(posterData.listingUrl, { width: 180, margin: 1 });
      const qrImg = await loadImage(qrDataUrl);
      if (qrImg) {
        const qrSize = 140;
        const qrX = canvas.width - 80 - qrSize;
        const qrY = canvas.height - 80 - qrSize;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        ctx.fillStyle = themeKey === 'midnight' ? '#94a3b8' : '#64748b';
        ctx.font = `14px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('Scan to view', qrX + qrSize / 2, qrY + qrSize + 24);
      }
    } catch (err) {
      console.warn('[Poster] QR generation failed:', err);
    }
  }

  if (posterData.contact && posterData.contact.phone) {
    const contactY = canvas.height - 110;
    ctx.fillStyle = themeKey === 'midnight' ? '#1e293b' : '#0f172a';
    ctx.fillRect(80, contactY, canvas.width - 260, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 20px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(`CONTACT: ${posterData.contact.phone} ${posterData.contact.email ? `| ${posterData.contact.email}` : ''}`, 110, contactY + 46);
  }

  let blob = await exportCanvasBlob(canvas, 'image/png', 0.95);
  if (!blob) {
    canvas.width = 600;
    canvas.height = 850;
    const ctx2 = canvas.getContext('2d');
    ctx2.fillStyle = '#ffffff';
    ctx2.fillRect(0, 0, 600, 850);
    ctx2.fillStyle = '#0f172a';
    ctx2.font = 'bold 24px Arial, sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('MarketMix Property Poster', 300, 425);
    blob = await exportCanvasBlob(canvas, 'image/png', 0.85);
  }

  if (blob) {
    return {
      file: new File([blob], 'marketmix-property-poster-a4.png', { type: 'image/png' }),
      hasPropertyPhoto: hasPhoto,
    };
  }

  throw new Error('Could not generate A4 poster');
};
