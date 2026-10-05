import express from 'express';
import { createCoverImage, createPosterPng } from '../services/posterService.js';

const router = express.Router();
const MAX_TEXT_LENGTH = 3000;

const isValidTextField = (value) => value === undefined || (
  typeof value === 'string' && value.length <= MAX_TEXT_LENGTH
);

router.post('/api/poster/cover', async (req, res) => {
  const { photos } = req.body || {};
  if (!Array.isArray(photos) || photos.length > 5 || photos.some((photo) => typeof photo !== 'string' || photo.length > 4096)) {
    return res.status(400).json({ error: 'Cover photo list is invalid' });
  }

  try {
    const image = await createCoverImage(photos);
    if (!image) return res.status(422).json({ error: 'The property cover photo could not be loaded by the poster service' });
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'attachment; filename="marketmix-property-cover.jpg"',
      'Cache-Control': 'no-store',
    });
    return res.send(image);
  } catch (error) {
    console.error('[Poster] Failed to prepare cover photo:', error.message);
    return res.status(500).json({ error: 'Could not prepare the property cover photo' });
  }
});

router.post('/api/poster/generate', async (req, res) => {
  const { photos, headline, caption, highlights, features, nearby, property, contact, theme, listingUrl, location, price, availability, deposit } = req.body || {};
  if (photos !== undefined && (!Array.isArray(photos) || photos.length > 5 || photos.some((photo) => typeof photo !== 'string' || photo.length > 4096))) {
    return res.status(400).json({ error: 'Poster photo list is invalid' });
  }
  if (![headline, caption, location, availability, deposit].every(isValidTextField) ||
      ['highlights', 'features', 'nearby'].some((field) => req.body?.[field] !== undefined && !isValidTextField(req.body[field]))) {
    return res.status(400).json({ error: 'Poster text is invalid or too long' });
  }
  if (property !== undefined && (!property || typeof property !== 'object' || Array.isArray(property))) {
    return res.status(400).json({ error: 'Poster property details are invalid' });
  }

  try {
    const { buffer, hasPropertyPhoto } = await createPosterPng({
      photos, headline, caption, highlights, features, nearby, property, contact, theme, listingUrl, location, price, availability, deposit,
    });
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="marketmix-property-poster-a4.png"',
      'X-Poster-Photo': hasPropertyPhoto ? 'loaded' : 'unavailable',
      'Cache-Control': 'no-store',
    });
    return res.send(buffer);
  } catch (error) {
    console.error('[Poster] Failed to generate poster:', error.message);
    return res.status(500).json({ error: 'Could not generate the property poster' });
  }
});

export default router;
