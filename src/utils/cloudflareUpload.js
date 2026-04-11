// src/utils/cloudflareUpload.js
const CLOUDFLARE_WORKER_URL = 'https://marketmix-uploader.johnnjanjo4.workers.dev';

/**
 * Upload a single file to Cloudflare R2
 * @param {File} file - The file to upload
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadFileToR2 = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { 
      url: data.url, 
      key: data.key,
    };
  } catch (error) {
    console.error('R2 Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudflare R2
 * @param {File[]} files - Array of files to upload
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Array<{url: string, key: string, file: File}>>}
 */
export const uploadMultipleFilesToR2 = async (files, onProgress) => {
  const results = [];
  let completed = 0;

  for (const file of files) {
    try {
      const result = await uploadFileToR2(file);
      results.push({ ...result, file });
      completed++;
      if (onProgress) {
        onProgress(completed, files.length);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      results.push({ error: error.message, file });
    }
  }

  return results;
};

/**
 * Delete a file from Cloudflare R2
 * @param {string} key - The file key to delete
 * @returns {Promise<void>}
 */
export const deleteFileFromR2 = async (key) => {
  try {
    await fetch(`${CLOUDFLARE_WORKER_URL}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    });
  } catch (error) {
    console.error('R2 Delete error:', error);
  }
};

/**
 * Get file preview URL (creates object URL)
 * @param {File} file - The file to preview
 * @returns {string} - Preview URL (call URL.revokeObjectURL() when done)
 */
export const getFilePreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke object URL to prevent memory leaks
 * @param {string} url - The object URL to revoke
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
