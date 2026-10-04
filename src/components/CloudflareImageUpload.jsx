// src/components/CloudflareImageUpload.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useCloudflareUpload } from '../hooks/useCloudflareUpload';
import { isPersistableImageUrl } from '../utils/cloudflareUpload';

const CloudflareImageUpload = ({ onUploadComplete, maxFiles = 10, accept = 'image/*' }) => {
  const [imageUrl, setImageUrl] = useState('');
  const {
    uploading,
    progress,
    uploadedFiles,
    error,
    uploadMultiple,
    removeFile,
  } = useCloudflareUpload();

  const handleUrlSubmit = () => {
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl || !isPersistableImageUrl(trimmedUrl)) return;

    onUploadComplete?.([
      {
        url: trimmedUrl,
        name: 'Remote image',
        previewUrl: trimmedUrl,
        status: 'success',
      },
    ]);
    setImageUrl('');
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const imageFiles = acceptedFiles.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const uploadedUrls = await uploadMultiple(imageFiles);
    if (onUploadComplete && uploadedUrls.length > 0) {
      onUploadComplete(
        uploadedUrls.map((item) => ({
          ...item,
          url: item.url,
          previewUrl: item.url,
          status: 'success',
        }))
      );
    }
  }, [uploadMultiple, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    maxFiles,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-500 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">
          {isDragActive ? 'Drop the images here...' : 'Drag & drop product images here, or click to select files'}
        </p>
        <p className="text-xs text-gray-500 mt-2">Maximum 5MB per image</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-600 mb-2">
          Or paste an image URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Add URL
          </button>
        </div>
      </div>

      {uploading && progress.total > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span>{progress.current >= progress.total ? 'Finishing uploads...' : `Uploading ${progress.current + 1} of ${progress.total}`}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, ((progress.current + progress.percent / 100) / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative border rounded-lg overflow-hidden group">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-100" />
              )}

              {file.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader className="w-6 h-6 text-white animate-spin" />
                </div>
              )}

              {file.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              )}

              {file.status === 'success' && (
                <div className="absolute top-1 right-1">
                  <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full" />
                </div>
              )}

              <button
                type="button"
                onClick={() => removeFile(file)}
                className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={file.status === 'uploading'}
              >
                <X className="w-3 h-3" />
              </button>

              <div className="absolute inset-x-0 bottom-0 bg-white/90 text-black text-xs px-1 py-0.5 truncate">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudflareImageUpload;
