import { resolvePropertyImage } from '../utils/propertyMapping';

export const generatePropertyPoster = async (property = {}) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1500;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#FDF2F8');
  gradient.addColorStop(1, '#F8FAFC');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#111827';
  ctx.font = '700 62px sans-serif';
  ctx.fillText('MarketMix Real Estates', 80, 120);

  const coverImage = resolvePropertyImage(property) || property.imageUrl;
  const image = coverImage ? new Image() : null;
  if (image) {
    image.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
      image.onload = resolve;
      image.onerror = resolve;
      image.src = coverImage;
    });

    if (image.width > 0 && image.height > 0) {
      const x = 80;
      const y = 200;
      const width = canvas.width - 160;
      const height = 620;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(x, y, width, height);
      const ratio = Math.min(width / image.width, height / image.height);
      const drawWidth = image.width * ratio;
      const drawHeight = image.height * ratio;
      const drawX = x + (width - drawWidth) / 2;
      const drawY = y + (height - drawHeight) / 2;
      ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }
  }

  ctx.fillStyle = '#111827';
  ctx.font = '700 52px sans-serif';
  const title = (property.title || 'Property Listing').slice(0, 52);
  ctx.fillText(title, 80, 940);

  ctx.font = '500 36px sans-serif';
  ctx.fillStyle = '#374151';
  const rent = property.rent || property.monthlyRent || 'Price available';
  ctx.fillText(`Rent: ${rent}`, 80, 1000);
  ctx.fillText(`Type: ${property.propertyType || property.type || 'Property'}`, 80, 1055);
  ctx.fillText(`Property ID: ${property.id || 'N/A'}`, 80, 1165);
  ctx.fillText('Book a Site Visit', 80, 1260);

  ctx.fillStyle = '#DC2626';
  ctx.fillRect(80, 1300, 360, 68);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 32px sans-serif';
  ctx.fillText('Contact Agent', 110, 1348);

  return canvas.toDataURL('image/png');
};
