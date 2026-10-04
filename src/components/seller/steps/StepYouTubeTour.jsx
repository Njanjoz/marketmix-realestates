// src/components/seller/steps/StepYouTubeTour.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Field, TextInput } from '../shared/Field';
import { Upload, Video, CheckCircle, AlertCircle, Loader, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';

const YOUTUBE_API_BASE = import.meta.env.VITE_YOUTUBE_API_URL || 'https://marketmix-youtube-server.onrender.com';
const getYoutubeApiUrl = (path) => {
  return `${YOUTUBE_API_BASE.replace(/\/+$/, '')}${path}`;
};

const uploadVideoWithProgress = (url, formData, onProgress) => new Promise((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.open('POST', url);
  request.timeout = 15 * 60 * 1000;
  request.upload.onprogress = (event) => {
    if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
  };
  request.onload = () => {
    console.info(`[Video upload] HTTP ${request.status}`);
    let result;
    try {
      result = JSON.parse(request.responseText);
    } catch {
      reject(new Error(`Video upload returned an invalid response (HTTP ${request.status})`));
      return;
    }
    if (request.status < 200 || request.status >= 300) {
      reject(new Error(result.error || `Video upload failed: HTTP ${request.status}`));
      return;
    }
    resolve(result);
  };
  request.onerror = () => reject(new Error('Network or CORS error uploading video'));
  request.ontimeout = () => reject(new Error('Video upload timed out after 15 minutes'));
  request.onabort = () => reject(new Error('Video upload was cancelled'));
  request.send(formData);
});

const waitForVideoUpload = async (jobId, onStatus) => {
  const statusUrl = getYoutubeApiUrl(`/api/youtube/upload/${encodeURIComponent(jobId)}`);
  const deadline = Date.now() + 30 * 60 * 1000;

  while (Date.now() < deadline) {
    const response = await fetch(statusUrl);
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || `Upload status failed: HTTP ${response.status}`);
    if (job.status === 'complete') return job;
    if (job.status === 'failed') throw new Error(job.error || 'YouTube upload failed');
    onStatus('Video received; YouTube is processing it…');
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error('YouTube is still processing this video. Check back before uploading it again.');
};

const extractYouTubeId = (url) => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

const StepYouTubeTour = ({ data = {}, update = () => {} }) => {
  const [url, setUrl] = useState(data.youtubeUrl || '');
  const [videoId, setVideoId] = useState(data.youtubeVideoId || '');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [channelStatus, setChannelStatus] = useState('checking');
  const inputRef = useRef(null);
  const [mode, setMode] = useState('upload'); // 'upload' or 'paste'

  const checkChannelStatus = async () => {
    const statusUrl = getYoutubeApiUrl('/api/youtube/status');
    setChannelStatus('checking');
    try {
      const response = await fetch(statusUrl);
      if (!response.ok) throw new Error(`Status request failed: HTTP ${response.status}`);
      const status = await response.json();
      setChannelStatus(status?.connected ? 'connected' : status?.reason || 'disconnected');
    } catch (statusError) {
      console.warn('[Video upload] YouTube API is unreachable:', statusError);
      setChannelStatus('offline');
    }
  };

  useEffect(() => {
    checkChannelStatus();
  }, []);

  useEffect(() => {
    if (!url) {
      setVideoId(null);
      setError('');
      update({ youtubeUrl: '', youtubeVideoId: '' });
      return;
    }
    const id = extractYouTubeId(url);
    if (id) {
      setVideoId(id);
      setError('');
      update({ youtubeUrl: url, youtubeVideoId: id });
    } else {
      setVideoId(null);
      setError('Invalid YouTube URL. Supported: youtube.com/watch?v=…, youtu.be/…, youtube.com/embed/…');
    }
  }, [url]); // eslint-disable-line

  const handleVideoFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video file (MP4, MOV, WebM)');
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    setUploadProgress('Uploading video to MarketMix YouTube channel…');
    setError('');
    const toastId = toast.loading('Uploading video to YouTube...');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', data.title || data.propertyName || 'MarketMix Property Tour');
    formData.append('description', data.description || 'Property tour video uploaded via MarketMix Seller Portal.');

    try {
      const uploadUrl = getYoutubeApiUrl('/api/youtube/upload');
      console.info(`[Video upload] Starting ${file.name} (${file.size} bytes)`);
      let result = await uploadVideoWithProgress(uploadUrl, formData, (percent) => {
        setUploadPercent(percent);
        setUploadProgress(percent >= 100
          ? 'Video sent; waiting for YouTube to finish processing…'
          : `Uploading video to MarketMix YouTube channel… ${percent}%`);
      });
      if (result.jobId) {
        result = await waitForVideoUpload(result.jobId, setUploadProgress);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload video to YouTube');
      }

      setUrl(result.youtubeUrl);
      setVideoId(result.videoId);
      update({ youtubeUrl: result.youtubeUrl, youtubeVideoId: result.videoId });
      toast.success('Video successfully uploaded to MarketMix YouTube channel!', { id: toastId });
    } catch (err) {
      console.error('[Video upload] Upload failed:', err);
      const rawMessage = err.message || 'Direct YouTube upload failed';
      const requiresReauthorization = /invalid_grant|expired or revoked|OAuth token is invalid/i.test(rawMessage);
      const message = requiresReauthorization
        ? 'YouTube authorization expired or was revoked. Reauthorize the Google account, update YOUTUBE_REFRESH_TOKEN in Render, and redeploy.'
        : rawMessage;
      if (requiresReauthorization) setChannelStatus('reauthorization_required');
      toast.error(`${message}. You can paste a YouTube URL instead.`, { id: toastId });
      setError(`${message}. You can paste a YouTube URL instead.`);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100">
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          <div>
            <h4 className="text-sm font-semibold text-red-900">MarketMix Official YouTube Channel Upload</h4>
            <p className="text-xs text-red-700">Drag & drop your video tour. It will be uploaded automatically to our YouTube channel.</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 text-xs font-medium rounded transition ${mode === 'upload' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-200'}`}
          >
            Drag & Drop
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`px-3 py-1 text-xs font-medium rounded transition ${mode === 'paste' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-200'}`}
          >
            Paste URL
          </button>
        </div>
      </div>

      <div
        role="status"
        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
          channelStatus === 'connected'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : channelStatus === 'checking'
              ? 'border-gray-200 bg-gray-50 text-gray-600'
              : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
      >
        <span>
          {channelStatus === 'checking' && 'Checking YouTube upload service…'}
          {channelStatus === 'connected' && 'YouTube upload service is connected.'}
          {channelStatus === 'disconnected' && 'The upload service is running, but its YouTube account is not authorized.'}
          {channelStatus === 'reauthorization_required' && 'The YouTube refresh token expired or was revoked. Update the token in Render after reauthorizing.'}
          {channelStatus === 'missing_credentials' && 'YouTube OAuth credentials are missing from the Render service.'}
          {channelStatus === 'configuration_error' && 'The YouTube service has an OAuth configuration error. Check the Render service logs.'}
          {channelStatus === 'offline' && 'YouTube upload service is unreachable. Check the Render service, then retry.'}
        </span>
        {(channelStatus === 'disconnected' || channelStatus === 'reauthorization_required') && (
          <a className="font-semibold underline" href={getYoutubeApiUrl('/auth/youtube')} target="_blank" rel="noreferrer">
            Reauthorize YouTube
          </a>
        )}
        {channelStatus === 'offline' && (
          <button type="button" className="font-semibold underline" onClick={checkChannelStatus}>
            Retry connection
          </button>
        )}
      </div>

      {mode === 'upload' ? (
        <div className="space-y-3">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleVideoFile(e.dataTransfer.files[0]);
            }}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white hover:border-red-400 transition"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
              {uploading ? <Loader className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <p className="text-sm font-medium text-gray-700">
              {uploading ? uploadProgress : 'Drag & drop your property video tour here, or '}
              {!uploading && (
                <button
                  type="button"
                  className="text-red-600 underline font-semibold hover:text-red-700"
                  onClick={() => inputRef.current?.click()}
                >
                  browse video
                </button>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports MP4, MOV, WebM, AVI (Direct YouTube upload)</p>
            {uploading && (
              <div className="mt-3 space-y-1">
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
                  role="progressbar"
                  aria-label="Video upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={uploadPercent}
                >
                  <div className="h-full bg-red-600 transition-[width]" style={{ width: `${uploadPercent}%` }} />
                </div>
                <p className="text-xs text-gray-500 text-right">{uploadPercent}%</p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleVideoFile(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      ) : (
        <Field
          label="YouTube property tour URL"
          hint="Paste a YouTube link. We will embed the video on the property details page."
        >
          <TextInput
            value={url}
            onChange={setUrl}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </Field>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {videoId && (
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <div className="bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 flex items-center gap-1.5 border-b border-red-100">
            <CheckCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Successfully connected to YouTube (ID: {videoId})</span>
          </div>
          <div className="aspect-video">
            <iframe
              title="YouTube tour preview"
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        This step is optional. You can skip it if you don't have a video tour.
      </p>
    </div>
  );
};

export default StepYouTubeTour;
