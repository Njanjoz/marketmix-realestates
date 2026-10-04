// src/utils/cloudflareUpload.js
const CLOUDFLARE_WORKER_URL = 'https://marketmix-uploader.johnnjanjo4.workers.dev';

export const isPersistableImageUrl = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return false;
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:image/');
};

export const sanitizeImageEntries = (entries = []) => {
  if (!Array.isArray(entries)) return [];

  return entries.reduce((cleaned, entry) => {
    if (typeof entry === 'string') {
      const value = entry.trim();
      if (isPersistableImageUrl(value)) {
        cleaned.push(value);
      }
      return cleaned;
    }

    if (!entry || typeof entry !== 'object') return cleaned;

    const candidate = entry.remoteUrl || entry.url || entry.src || entry.localPreviewUrl || entry.preview || entry.file;
    const normalized = typeof candidate === 'string' ? candidate.trim() : '';

    if (!isPersistableImageUrl(normalized)) return cleaned;

    cleaned.push({
      ...entry,
      url: normalized,
      remoteUrl: normalized,
      preview: normalized,
      localPreviewUrl: null,
      status: entry.status || 'uploaded',
    });

    return cleaned;
  }, []);
};

export const resizeImage = (file, maxWidth = 1200, maxHeight = 800) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => fail(new Error(`Image processing timed out after 30 seconds for ${file.name}`)), 30000);
    const fail = (error) => {
      clearTimeout(timeoutId);
      reject(error);
    };
    const succeed = (result) => {
      clearTimeout(timeoutId);
      resolve(result);
    };
    const reader = new FileReader();
    reader.onerror = () => fail(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => fail(new Error(`Could not decode ${file.name}`));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                fail(new Error(`Could not resize ${file.name}`));
                return;
              }
              succeed(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
            },
            file.type || 'image/jpeg',
            0.85
          );
        } catch (error) {
          fail(error);
        }
      };
      img.src = event.target.result;
    };
  });
};

export const uploadFileToR2 = (file, onProgress) => new Promise((resolve, reject) => {
  const formData = new FormData();
  formData.append('file', file);
  const request = new XMLHttpRequest();
  const fail = (error) => {
    console.error(`[Cloudflare upload] Failed ${file.name}:`, error);
    reject(error);
  };

  console.info(`[Cloudflare upload] Starting ${file.name} (${file.size} bytes)`);
  request.open('POST', `${CLOUDFLARE_WORKER_URL}/upload`);
  request.timeout = 45000;
  request.upload.onprogress = (event) => {
    if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
  };
  request.onload = () => {
    console.info(`[Cloudflare upload] ${file.name}: HTTP ${request.status}`);
    if (request.status < 200 || request.status >= 300) {
      const detail = request.responseText?.slice(0, 300);
      fail(new Error(`Upload failed: HTTP ${request.status}${detail ? ` - ${detail}` : ''}`));
      return;
    }

    try {
      const data = JSON.parse(request.responseText);
      if (!data?.url) throw new Error('Worker did not return a URL');
      const uploadedFile = { url: data.url, key: data.key };
      console.info(`[Cloudflare upload] Completed ${file.name}`, uploadedFile.url);
      resolve(uploadedFile);
    } catch (error) {
      fail(error);
    }
  };
  request.onerror = () => fail(new Error(`Network or CORS error uploading ${file.name} to Cloudflare`));
  request.ontimeout = () => fail(new Error(`Cloudflare upload timed out after 45 seconds for ${file.name}`));
  request.onabort = () => fail(new Error(`Cloudflare upload was cancelled for ${file.name}`));
  request.send(formData);
});

export const uploadMultipleFilesToR2 = async (files, onProgress) => {
  const results = [];
  let completed = 0;

  for (const file of files) {
    try {
      const result = await uploadFileToR2(file, (percent) => onProgress?.(completed, files.length, percent));
      results.push({ ...result, file });
      completed += 1;
      if (onProgress) {
        onProgress(completed, files.length, 0);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      results.push({ error: error.message, file });
    }
  }

  return results;
};

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

export const getFilePreviewUrl = (file) => URL.createObjectURL(file);

export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
