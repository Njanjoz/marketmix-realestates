import fs from 'fs'; 
import { promises as fsPromises } from 'fs';
import path from 'path';
import { google } from 'googleapis';

const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');
const CONFIG_PATH = path.join(process.cwd(), 'config.json');

let config = {};
try {
  const configFile = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(configFile);
} catch (e) {
  // ignore
}

const clientId = process.env.YOUTUBE_CLIENT_ID || config.clientId;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || config.clientSecret;
const redirectUri = process.env.YOUTUBE_REDIRECT_URI || config.redirectUri || 'http://localhost:5000/auth/youtube/callback';

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Helper to load credentials from tokens.json
const getAuthenticatedClient = async () => {
    const tokens = await fsPromises.readFile(TOKEN_PATH, 'utf8');
    oauth2Client.setCredentials(JSON.parse(tokens));
    return oauth2Client;
};

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
    prompt: 'consent'
  });
};

export const setCredentials = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  await fsPromises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
};

export const getStatus = async () => {
  try {
    await fsPromises.readFile(TOKEN_PATH, 'utf8');
    return { connected: true };
  } catch (e) {
    return { connected: false };
  }
};

export const uploadVideoToYouTube = async (filePath, title, description) => {
  const auth = await getAuthenticatedClient();
  const youtube = google.youtube({ version: 'v3', auth });
  
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title,
        description,
        categoryId: '22',
      },
      status: { privacyStatus: 'unlisted' },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });
  
  // Cleanup file after upload
  await fsPromises.unlink(filePath);
  
  return res.data;
};
