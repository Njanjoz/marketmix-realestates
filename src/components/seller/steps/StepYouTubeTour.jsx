// src/components/seller/steps/StepYouTubeTour.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Field, TextInput } from '../shared/Field';
import { Upload, Video, CheckCircle, AlertCircle, Loader, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';

const YOUTUBE_API_BASE = import.meta.env.VITE_YOUTUBE_API_URL || 'https://marketmix-youtube-server.onrender.com';

const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const StepYouTubeTour = ({ data, update }) => {
  const [url, setUrl] = useState(data.youtubeUrl || '');
  const [videoId, setVideoId] = useState(data.youtubeVideoId || '');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [channelConnected, setChannelConnected] = useState(null);
  const inputRef = useRef(null);
  const [mode, setMode] = useState('upload'); // 'upload' or 'paste'

  useEffect(() => {
    // Check YouTube backend connection status
    fetch(`${YOUTUBE_API_BASE}/api/youtube/status`)
      .then(res => res.json())
      .then(data => setChannelConnected(data.connected))
      .catch(() => setChannelConnected(false));
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
    setUploadProgress('Uploading video to MarketMix YouTube channel…');
    const toastId = toast.loading('Uploading video to YouTube...');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', data.title || data.propertyName || 'MarketMix Property Tour');
    formData.append('description', data.description || 'Property tour video uploaded via MarketMix Seller Portal.');

    try {
      const res = await fetch(`${YOUTUBE_API_BASE}/api/youtube/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload video to YouTube');
      }

      setUrl(result.youtubeUrl);
      setVideoId(result.videoId);
      update({ youtubeUrl: result.youtubeUrl, youtubeVideoId: result.videoId });
      toast.success('Video successfully uploaded to MarketMix YouTube channel!', { id: toastId });
    } catch (err) {
      console.warn('YouTube API upload failed (fallback to URL paste mode):', err);
      toast.error('YouTube API unavailable. Please paste your YouTube video URL below instead.', { id: toastId });
      setMode('paste');
      setError('Direct YouTube API upload unavailable. Please paste your YouTube video link.');
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
