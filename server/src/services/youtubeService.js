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

const getStoredTokens = async () => {
  let fileTokens = {};
  try {
    const raw = await fsPromises.readFile(TOKEN_PATH, 'utf8');
    fileTokens = JSON.parse(raw);
  } catch (e) {
    // ignore missing or stale tokens file
  }

  return {
    access_token: process.env.YOUTUBE_ACCESS_TOKEN || fileTokens.access_token || undefined,
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN || fileTokens.refresh_token || config.refreshToken || undefined,
    expiry_date: fileTokens.expiry_date || undefined,
  };
};

// Helper to load credentials from tokens.json or Render env vars
const getAuthenticatedClient = async () => {
  const tokens = await getStoredTokens();

  if (!tokens.refresh_token && !tokens.access_token) {
    throw new Error('Missing YouTube OAuth credentials. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI and YOUTUBE_REFRESH_TOKEN in Render environment.');
  }

  oauth2Client.setCredentials(tokens);

  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    if (error?.message?.includes('invalid_grant') || error?.code === 'invalid_grant') {
      throw new Error('YouTube OAuth token is invalid or expired. Re-authorize the Google account against your Render callback URL and update YOUTUBE_REFRESH_TOKEN.');
    }
    throw error;
  }

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
    await getAuthenticatedClient();
    return { connected: true };
  } catch (error) {
    const message = error?.message || '';
    if (message.includes('invalid_grant') || message.includes('invalid or expired')) {
      return { connected: false, reason: 'reauthorization_required' };
    }
    if (message.includes('Missing YouTube OAuth credentials')) {
      return { connected: false, reason: 'missing_credentials' };
    }
    return { connected: false, reason: 'configuration_error' };
  }
};

export const uploadVideoToYouTube = async (filePath, title, description) => {
  try {
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
  } catch (error) {
    const message = error?.message || '';
    if (message.includes('invalid_grant') || error?.code === 'invalid_grant') {
      throw new Error('YouTube upload failed on Render because the Google OAuth refresh token is stale or invalid. Re-authorize the YouTube account and set the new YOUTUBE_REFRESH_TOKEN in Render.');
    }
    throw error;
  }
};
