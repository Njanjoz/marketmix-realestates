// src/components/seller/shared/MediaUploader.jsx
import React, { useRef, useState } from 'react';
import { Upload, X, Loader, CheckCircle, AlertCircle, Star, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const CLOUDFLARE_WORKER_URL = 'https://marketmix-uploader.johnnjanjo4.workers.dev';
const MAX_IMAGES = 20;

// ─── helpers ─────────────────────────────────────────────
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const resizeImage = (file, maxWidth = 1200, maxHeight = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image load failed'));
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
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('canvas.toBlob returned null'));
              resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
            },
            file.type,
            0.85
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
  });
};

const uploadToCloudflare = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch(`${CLOUDFLARE_WORKER_URL}/upload`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    if (!data?.url) throw new Error('Worker did not return a URL');
    return { url: data.url, key: data.key };
  } catch (error) {
    console.warn('Cloudflare R2 worker CORS/network error, using local Data URL fallback:', error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result, key: `local-${Date.now()}-${file.name}` });
      reader.onerror = (err) => reject(new Error('Failed to read file locally'));
      reader.readAsDataURL(file);
    });
  }
};

// ─── Image Card Component ──────────────────────────────
const ImageCard = ({ img, draggable, onDragStart, onDrop, onRetry, onCover, onRemove, isCover, catLabel }) => {
  const src = img.localPreviewUrl || img.remoteUrl;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={(e) => draggable && e.preventDefault()}
      onDrop={onDrop}
      className={`relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {src ? (
        <img src={src} alt={catLabel} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <ImageIcon className="w-6 h-6" />
        </div>
      )}

      {img.status === 'uploading' && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-xs gap-1">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Uploading…</span>
        </div>
      )}
      {img.status === 'uploaded' && (
        <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-emerald-500 bg-white rounded-full shadow" />
      )}
      {img.status === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center text-white text-xs gap-1 font-medium"
        >
          <AlertCircle className="w-4 h-4" />
          Retry Upload
        </button>
      )}

      {isCover && (
        <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow">
          Cover ⭐
        </span>
      )}

      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
        {catLabel}
      </span>

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
        {!isCover && (
          <button
            type="button"
            onClick={onCover}
            className="p-1.5 bg-white rounded-full shadow hover:bg-emerald-50 text-yellow-600"
            title="Set as property cover photo"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 bg-white rounded-full shadow hover:bg-red-50 text-red-600"
          title="Remove photo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── component ───────────────────────────────────────────
const MediaUploader = ({ categories, images, setImages }) => {
  const [dragOver, setDragOver] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const inputRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [viewMode, setViewMode] = useState('category');

  // Upload ONE image by its stable id. No indexes anywhere.
  const uploadOne = async (imgId) => {
    const target = images.find((i) => i.id === imgId);
    if (!target || !target.file) return;

    setImages((prev) =>
      prev.map((im) => (im.id === imgId ? { ...im, status: 'uploading', error: null } : im))
    );

    try {
      const resized = await resizeImage(target.file);
      const result = await uploadToCloudflare(resized);
      setImages((prev) =>
        prev.map((im) =>
          im.id === imgId
            ? { ...im, remoteUrl: result.url, r2Key: result.key, status: 'uploaded', error: null }
            : im
        )
      );
    } catch (e) {
      console.error('Upload error:', e);
      setImages((prev) =>
        prev.map((im) =>
          im.id === imgId ? { ...im, status: 'error', error: e.message || 'Upload failed' } : im
        )
      );
    }
  };

  const handleFiles = (files, category) => {
    if (!files || files.length === 0) return;

    setImages((currentImages) => {
      const remaining = MAX_IMAGES - currentImages.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return currentImages;
      }
      const arr = Array.from(files).slice(0, remaining);

      const newImgs = arr.map((file) => ({
        id: uid(),
        file,
        localPreviewUrl: URL.createObjectURL(file),
        remoteUrl: null,
        r2Key: null,
        status: 'previewing', // previewing | uploading | uploaded | error
        category,
        error: null,
      }));

      // Kick off uploads AFTER state has committed
      queueMicrotask(() => newImgs.forEach((img) => uploadOne(img.id)));

      return [...currentImages, ...newImgs];
    });
  };

  const retry = (id) => uploadOne(id);

  const remove = (id) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.localPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(img.localPreviewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const setCover = (id) => {
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      return [item, ...copy];
    });
    toast.success('Set as property cover photo');
  };

  const move = (fromId, toId) => {
    if (fromId === toId) return;
    setImages((prev) => {
      const from = prev.findIndex((i) => i.id === fromId);
      const to = prev.findIndex((i) => i.id === toId);
      if (from === -1 || to === -1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const activeCategoryObj = categories.find((c) => c.id === activeCategory) || categories[0];
  const categoryImages = images.filter((img) => img.category === activeCategory);
  const coverId = images[0]?.id; // true global cover

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">Category Photo Uploader & Preview</h4>
          <p className="text-xs text-emerald-700">Select a category below, upload photos, and preview them instantly.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('category')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              viewMode === 'category'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Category View ({activeCategoryObj.label})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition ${
              viewMode === 'all'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            All Photos ({images.length}/{MAX_IMAGES})
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-gray-100">
        {categories.map((c) => {
          const count = images.filter((img) => img.category === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCategory(c.id);
                setViewMode('category');
              }}
              className={`px-3 py-1.5 text-xs rounded-full border transition flex items-center gap-1.5 ${
                activeCategory === c.id
                  ? 'bg-emerald-600 text-white border-emerald-600 font-medium shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              <span>{c.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 rounded-full text-[10px] ${
                    activeCategory === c.id
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category view */}
      {viewMode === 'category' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
              Uploading for: <span className="text-emerald-600">{activeCategoryObj.label}</span>
            </span>
            <span className="text-xs text-gray-500">{activeCategoryObj.prompt}</span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files, activeCategory);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition bg-white ${
              dragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Drag & drop photos for{' '}
              <strong className="text-emerald-700">{activeCategoryObj.label}</strong>, or{' '}
              <button
                type="button"
                className="text-emerald-600 underline font-semibold hover:text-emerald-700"
                onClick={() => inputRef.current?.click()}
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports JPEG, PNG, WEBP (Auto-resized for fast loading)</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files, activeCategory);
                e.target.value = '';
              }}
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-medium">
                Previews for "{activeCategoryObj.label}" ({categoryImages.length})
              </span>
              {categoryImages.length === 0 && (
                <span className="italic text-gray-400">No photos uploaded for this category yet.</span>
              )}
            </div>

            {categoryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categoryImages.map((img) => (
                  <ImageCard
                    key={`category-${img.id}`}
                    img={img}
                    draggable={false}
                    isCover={img.id === coverId}
                    catLabel={categories.find((c) => c.id === img.category)?.label || 'Other'}
                    onRetry={() => retry(img.id)}
                    onCover={() => setCover(img.id)}
                    onRemove={() => remove(img.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All view */}
      {viewMode === 'all' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="font-medium">
              All Uploaded Photos ({images.length}/{MAX_IMAGES}) · Drag to reorder · Click ★ to set cover
            </span>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-xs">
              <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              No photos uploaded yet. Select a category above and upload photos.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <ImageCard
                  key={`all-${img.id}`}
                  img={img}
                  draggable={true}
                  onDragStart={() => setDraggedId(img.id)}
                  onDrop={() => {
                    if (draggedId) {
                      move(draggedId, img.id);
                      setDraggedId(null);
                    }
                  }}
                  isCover={img.id === coverId}
                  catLabel={categories.find((c) => c.id === img.category)?.label || 'Other'}
                  onRetry={() => retry(img.id)}
                  onCover={() => setCover(img.id)}
                  onRemove={() => remove(img.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
