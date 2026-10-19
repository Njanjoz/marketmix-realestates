// src/components/LiveCameraModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, Check, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFileToR2 } from '../utils/cloudflareUpload';

const ANGLE_TEMPLATES = [
  { id: 'front', label: 'Front 3/4 Angle', tip: 'Fit front & headlights inside the shadow outline' },
  { id: 'side', label: 'Side Profile', tip: 'Fit entire vehicle length inside the profile shadow' },
  { id: 'rear', label: 'Rear / Cargo View', tip: 'Fit rear doors/box & license plate inside the outline' },
];

export default function LiveCameraModal({ isOpen, onClose, onCaptured, vehicleType = 'pickup' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [activeTemplate, setActiveTemplate] = useState('front');
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      return;
    }
    startCamera(facingMode);
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode) => {
    setPermissionError('');
    stopStream();
    let nativePlatform = false;
    try {
      // 1. Check Capacitor native camera first if in APK
      const { Capacitor } = await import('@capacitor/core');
      nativePlatform = Capacitor.isNativePlatform();
      if (nativePlatform) {
        const { Camera: CapCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: true,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt
        });
        if (image && image.webPath) {
          setLoading(true);
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const file = new File([blob], `${vehicleType}_${activeTemplate}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const uploaded = await uploadFileToR2(file);
          if (uploaded?.url) {
            onCaptured(uploaded.url, activeTemplate);
            toast.success(`${vehicleType} photo (${activeTemplate}) captured & uploaded!`);
            onClose();
          }
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Capacitor camera unavailable:', e);
      if (nativePlatform) {
        setPermissionError('Could not open the phone camera. Allow camera access in Android settings and try again.');
        setLoading(false);
        return;
      }
    }

    // A cancelled native camera prompt should not trigger a second WebView camera prompt.
    if (nativePlatform) return;

    // 2. Web browser getUserMedia (PC & Mobile Web)
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this browser.');
      }
      const constraints = {
        video: { facingMode: mode }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera permission/access error:', err);
      setPermissionError('Could not access camera. Please allow camera permissions in your browser settings.');
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const captureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Could not capture photo snapshot.');
        return;
      }
      setLoading(true);
      try {
        const file = new File([blob], `${vehicleType}_${activeTemplate}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const uploaded = await uploadFileToR2(file);
        if (uploaded?.url) {
          onCaptured(uploaded.url, activeTemplate);
          toast.success(`${vehicleType} photo (${activeTemplate}) captured & uploaded to Cloudflare!`);
          onClose();
        }
      } catch (err) {
        toast.error(err.message || 'Upload failed');
      } finally {
        setLoading(false);
      }
    }, 'image/jpeg', 0.85);
  };

  // Render dynamic SVG silhouette based on vehicleType and activeTemplate
  const renderVehicleSilhouette = () => {
    if (vehicleType === 'motorbike') {
      return (
        <svg className="w-28 h-32 text-emerald-400/55 fill-current animate-pulse" viewBox="0 0 24 24">
          <path d="M19 16c0-.55-.45-1-1-1s-1 .45-1 1 .45 1 1 1 1-.45 1-1zm-13-1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm14.37-3.9l-2.58-5.16A2.002 2.002 0 0015.65 6H13v2h2.65l1.5 3H11.5l-2-5H6v2h1.5l1.76 4.41C8.84 11.75 8.5 12.33 8.5 13c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-.28-.05-.55-.14-.8h3.28c-.09.25-.14.52-.14.8 0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-.59-.22-1.13-.59-1.55l.96-1.95z"/>
        </svg>
      );
    }
    if (vehicleType === 'tuk') {
      return (
        <svg className="w-44 h-28 text-emerald-400/55 fill-current animate-pulse" viewBox="0 0 24 24">
          <path d="M18 6h-2V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h1.1c.3 1.2 1.4 2 2.9 2s2.6-.8 2.9-2h2.2c.3 1.2 1.4 2 2.9 2s2.6-.8 2.9-2H18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-2h4v2h-4V4zm8 11h-1.5c-.5-1.2-1.7-2-3-2s-2.5.8-3 2H6V8h12v7z"/>
        </svg>
      );
    }
    if (vehicleType === 'lorry' || vehicleType === 'van') {
      return (
        <svg className="w-56 h-28 text-emerald-400/55 fill-current animate-pulse" viewBox="0 0 24 24">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1-9.5l1.96 2.5H17V8.5h2z"/>
        </svg>
      );
    }
    // Default Pickup
    return (
      <svg className="w-52 h-28 text-emerald-400/55 fill-current animate-pulse" viewBox="0 0 24 24">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Pro Photo ({vehicleType.toUpperCase()})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Angle Template Selector */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Select Angle Guide ({vehicleType})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ANGLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  activeTemplate === tmpl.id
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center italic">
            {ANGLE_TEMPLATES.find(t => t.id === activeTemplate)?.tip}
          </p>
        </div>

        {/* Viewport */}
        <div className="relative bg-black w-full aspect-[4/3] flex items-center justify-center overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center text-red-400 text-sm max-w-xs">
              {permissionError}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Dynamic Vehicle Silhouette Shadow Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-[320px] aspect-[16/10] border-2 border-dashed border-emerald-400/60 rounded-3xl bg-emerald-950/10 backdrop-blur-[1px] flex flex-col items-center justify-center relative">
              {renderVehicleSilhouette()}
              <span className="absolute bottom-2 bg-black/70 px-3 py-0.5 rounded-full text-[9px] font-bold text-emerald-300 tracking-wider uppercase">
                Fit {vehicleType} inside shadow ({activeTemplate})
              </span>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs font-semibold">Uploading {vehicleType} photo to Cloudflare...</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-900 border-t border-slate-800">
          <button
            type="button"
            onClick={toggleCamera}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Switch ({facingMode === 'environment' ? 'Back' : 'Front'})</span>
          </button>

          <button
            type="button"
            onClick={captureSnapshot}
            disabled={loading || !!permissionError}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 shadow-lg disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            <span>Capture & Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
