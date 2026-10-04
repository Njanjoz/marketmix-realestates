import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import youtubeRoutes from './routes/youtube.js';

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = new Set([
  'https://marketmix-realestates.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);
const corsOptions = {
  origin(origin, callback) {
    const isVercelPreview = /^https:\/\/marketmix-realestates(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(origin || '');
    callback(null, !origin || allowedOrigins.has(origin) || isVercelPreview);
  },
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', youtubeRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
server.requestTimeout = 20 * 60 * 1000;
server.headersTimeout = 21 * 60 * 1000;
