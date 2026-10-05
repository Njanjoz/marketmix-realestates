// src/services/posterService.js - Pure Client-Side Canvas Poster & Cover Generator (CORS Resilient)

const THEMES = {
  emerald: { bg: '#ecfdf5', badge: '#10b981', accent: '#0f766e', text: '#065f46' },
  blue: { bg: '#eff6ff', badge: '#2563eb', accent: '#1d4ed8', text: '#1e40af' },
  amber: { bg: '#fff7ed', badge: '#f59e0b', accent: '#b45309', text: '#92400e' },
};

const loadImage = (url) => new Promise((resolve) => {
  if (!url || typeof url !== 'string') {
    resolve(null);
    return;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => {
    // Retry without crossOrigin if CORS outright blocks anonymous
    const imgFallback = new Image();
    imgFallback.onload = () => resolve(imgFallback);
    imgFallback.onerror = () => resolve(null);
    imgFallback.src = url;
  };
  img.src = url;
});

const exportCanvasBlob = (canvas, mimeType, quality) => new Promise((resolve) => {
  try {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, mimeType, quality);
  } catch (err) {
    console.warn('[Poster] Tainted canvas detected or export error:', err);
    resolve(null);
  }
});

export const getPromoCoverImage = async (photos = []) => {
  const photoUrl = Array.isArray(photos) ? photos.find(p => typeof p === 'string' && p.trim()) : null;
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  let ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let img = await loadImage(photoUrl);
  let blob = null;

  if (img) {
    try {
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      
      // Try exporting with image
      blob = await exportCanvasBlob(canvas, 'image/jpeg', 0.9);
    } catch {
      blob = null; // Canvas tainted
    }
  }

  // If tainted or image failed, re-render clean without external image
  if (!blob) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MARKETMIX REAL ESTATES', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Verified Property Listing', canvas.width / 2, canvas.height / 2 + 30);

    blob = await exportCanvasBlob(canvas, 'image/jpeg', 0.9);
  }

  // Bottom overlay banner
  if (blob) {
    return {
      file: new File([blob], 'marketmix-property-cover.jpg', { type: 'image/jpeg' }),
      hasPropertyPhoto: !!img,
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

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header banner
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, canvas.width, 120);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MARKETMIX REAL ESTATES', canvas.width / 2, 72);

  // Image area
  const imgX = 80;
  const imgY = 160;
  const imgW = canvas.width - 160;
  const imgH = 650;

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(imgX, imgY, imgW, imgH);

  let img = await loadImage(photoUrl);
  let blob = null;

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
    } catch {
      img = null;
    }
  }

  // Draw rest of poster content
  let currentY = imgY + imgH + 60;

  const propertyType = posterData.property?.propertyType || posterData.property?.unitType || 'PROPERTY';
  ctx.fillStyle = theme.badge;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(80, currentY, 180, 44, 22);
    ctx.fill();
  } else {
    ctx.fillRect(80, currentY, 180, 44);
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(propertyType.toUpperCase(), 170, currentY + 28);

  ctx.fillStyle = '#64748b';
  ctx.font = '20px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(posterData.location || '', canvas.width - 80, currentY + 28);

  currentY += 70;

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 38px Arial, sans-serif';
  ctx.textAlign = 'left';
  const headline = posterData.headline || posterData.property?.title || 'Premium Property';
  ctx.fillText(headline, 80, currentY, canvas.width - 160);

  currentY += 50;

  ctx.fillStyle = theme.bg;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(80, currentY, canvas.width - 160, 80, 16);
    ctx.fill();
  } else {
    ctx.fillRect(80, currentY, canvas.width - 160, 80);
  }

  ctx.fillStyle = theme.text;
  ctx.font = 'bold 34px Arial, sans-serif';
  const priceVal = Number(posterData.price || 0).toLocaleString();
  const freq = posterData.property?.paymentFrequency ? ` / ${posterData.property.paymentFrequency}` : '';
  ctx.fillText(`KSh ${priceVal}${freq}`, 110, currentY + 52);

  currentY += 110;

  const drawSection = (title, items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(title.toUpperCase(), 80, currentY);
    currentY += 30;

    ctx.fillStyle = '#334155';
    ctx.font = '20px Arial, sans-serif';
    for (const item of items.slice(0, 4)) {
      ctx.fillText(`• ${item}`, 100, currentY);
      currentY += 32;
    }
    currentY += 15;
  };

  drawSection("Why you'll love it", posterData.highlights);
  drawSection("Features", posterData.features);
  drawSection("Nearby", posterData.nearby);

  if (posterData.contact && posterData.contact.phone) {
    currentY = Math.max(currentY, 1550);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(80, currentY, canvas.width - 160, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CONTACT: ${posterData.contact.phone} ${posterData.contact.email ? `| ${posterData.contact.email}` : ''}`, canvas.width / 2, currentY + 58);
  }

  blob = await exportCanvasBlob(canvas, 'image/png', 0.95);

  // Fallback if tainted
  if (!blob) {
    // Redraw without clipping image
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.fillStyle = '#64748b';
    ctx.font = '28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Property Poster', canvas.width / 2, imgY + imgH / 2);
    blob = await exportCanvasBlob(canvas, 'image/png', 0.95);
  }

  if (blob) {
    return {
      file: new File([blob], 'marketmix-property-poster-a4.png', { type: 'image/png' }),
      hasPropertyPhoto: !!img,
    };
  }

  throw new Error('Could not generate A4 poster');
};
