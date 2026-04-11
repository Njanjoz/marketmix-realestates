// src/hooks/useCloudflareUpload.js
import { useState, useCallback } from 'react';
import { uploadFileToR2, uploadMultipleFilesToR2, deleteFileFromR2, revokePreviewUrl } from '../utils/cloudflareUpload';

export const useCloudflareUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const uploadSingle = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    
    try {
      const result = await uploadFileToR2(file);
      const newFile = {
        file,
        url: result.url,
        key: result.key,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'success'
      };
      setUploadedFiles(prev => [...prev, newFile]);
      return newFile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(async (files) => {
    setUploading(true);
    setError(null);
    setProgress({ current: 0, total: files.length });
    
    // Add temporary previews for all files
    const tempFiles = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading'
    }));
    setUploadedFiles(prev => [...prev, ...tempFiles]);
    
    try {
      const results = await uploadMultipleFilesToR2(files, (completed, total) => {
        setProgress({ current: completed, total });
      });
      
      // Update files with uploaded URLs
      setUploadedFiles(prev => 
        prev.map(existingFile => {
          const result = results.find(r => r.file === existingFile.file);
          if (result && result.url) {
            return {
              ...existingFile,
              url: result.url,
              key: result.key,
              status: 'success'
            };
          } else if (result && result.error) {
            return {
              ...existingFile,
              status: 'error',
              error: result.error
            };
          }
          return existingFile;
        })
      );
      
      return results.filter(r => r.url);
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setUploading(false);
    }
  }, []);

  const removeFile = useCallback(async (fileToRemove) => {
    // Delete from R2 if it has a key
    if (fileToRemove.key) {
      await deleteFileFromR2(fileToRemove.key);
    }
    
    // Revoke preview URL
    if (fileToRemove.previewUrl) {
      revokePreviewUrl(fileToRemove.previewUrl);
    }
    
    // Remove from state
    setUploadedFiles(prev => prev.filter(f => f !== fileToRemove));
  }, []);

  const clearAllFiles = useCallback(async () => {
    // Delete all files from R2 that have keys
    for (const file of uploadedFiles) {
      if (file.key) {
        await deleteFileFromR2(file.key);
      }
      if (file.previewUrl) {
        revokePreviewUrl(file.previewUrl);
      }
    }
    setUploadedFiles([]);
    setProgress({ current: 0, total: 0 });
  }, [uploadedFiles]);

  const getSuccessFiles = useCallback(() => {
    return uploadedFiles.filter(f => f.status === 'success');
  }, [uploadedFiles]);

  const getUploadingFiles = useCallback(() => {
    return uploadedFiles.filter(f => f.status === 'uploading');
  }, [uploadedFiles]);

  const getErrorFiles = useCallback(() => {
    return uploadedFiles.filter(f => f.status === 'error');
  }, [uploadedFiles]);

  return {
    uploading,
    progress,
    uploadedFiles,
    error,
    uploadSingle,
    uploadMultiple,
    removeFile,
    clearAllFiles,
    getSuccessFiles,
    getUploadingFiles,
    getErrorFiles
  };
};
