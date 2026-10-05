const POSTER_API_BASE = import.meta.env.VITE_YOUTUBE_API_URL || 'https://marketmix-youtube-server.onrender.com';

const getPosterApiUrl = (path) => `${POSTER_API_BASE.replace(/\/+$/, '')}/api/poster/${path}`;

const requestPosterAsset = async (path, data, fileName, fileType) => {
  const response = await fetch(getPosterApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = `Poster generation failed: HTTP ${response.status}`;
    try {
      const result = await response.json();
      if (result.error) message = result.error;
    } catch {
      // Keep the HTTP failure visible when the server response is not JSON.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  if (!blob.size) throw new Error('Poster service returned an empty image');
  return {
    file: new File([blob], fileName, { type: fileType }),
    hasPropertyPhoto: path === 'generate' ? response.headers.get('X-Poster-Photo') === 'loaded' : true,
  };
};

export const generatePromoPoster = (posterData) => requestPosterAsset(
  'generate',
  posterData,
  'marketmix-property-poster-a4.png',
  'image/png'
);

export const getPromoCoverImage = (photos) => requestPosterAsset(
  'cover',
  { photos },
  'marketmix-property-cover.jpg',
  'image/jpeg'
);
