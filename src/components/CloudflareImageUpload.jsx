// src/components/CloudflareImageUpload.jsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useCloudflareUpload } from '../hooks/useCloudflareUpload';

const CloudflareImageUpload = ({ onUploadComplete, maxFiles = 10, accept = 'image/*' }) => {
  const { 
    uploading, 
    progress, 
    uploadedFiles, 
    error, 
    uploadMultiple, 
    removeFile 
  } = useCloudflareUpload();

  const onDrop = useCallback(async (acceptedFiles) => {
    const imageFiles = acceptedFiles.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    
    const uploadedUrls = await uploadMultiple(imageFiles);
    if (onUploadComplete && uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls);
    }
  }, [uploadMultiple, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    maxFiles
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-500 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">
          {isDragActive
            ? 'Drop the images here...'
            : 'Drag & drop product images here, or click to select files'}
        </p>
        <p className="text-xs text-gray-500 mt-2">Maximum 5MB per image</p>
      </div>

      {/* Progress */}
      {uploading && progress.total > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span>Uploading...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Uploaded Files Grid */}
      {uploadedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative border rounded-lg overflow-hidden group">
              <img
                src={file.previewUrl}
                alt={file.name}
                className="w-full h-32 object-cover"
              />
              
              {/* Status Overlay */}
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
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeFile(file)}
                className="absolute top-1 left-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={file.status === 'uploading'}
              >
                <X className="w-3 h-3" />
              </button>
              
              {/* File Name */}
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
