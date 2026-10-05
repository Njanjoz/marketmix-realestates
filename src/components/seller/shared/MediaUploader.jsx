// src/components/seller/shared/MediaUploader.jsx
import React, { useRef, useState } from 'react';
import { Upload, X, Loader, CheckCircle, AlertCircle, Star, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { resizeImage, uploadFileToR2 } from '../../../utils/cloudflareUpload';

const MAX_IMAGES = 20;

// ─── helpers ─────────────────────────────────────────────
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const getImageName = (img) => {
  if (img.file?.name || img.name) return img.file?.name || img.name;
  try {
    return decodeURIComponent(new URL(img.remoteUrl).pathname.split('/').filter(Boolean).pop()) || 'Property photo';
  } catch {
    return 'Property photo';
  }
};

// ─── Image Card Component ──────────────────────────────
const ImageCard = ({ img, draggable, onDragStart, onDrop, onRetry, onCover, onRemove, isCover, catLabel }) => {
  const src = img.remoteUrl;
  const imageName = getImageName(img);

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
          <span>{img.phase === 'processing' ? 'Preparing image…' : `Uploading ${img.progress || 0}%`}</span>
          <div
            className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden mt-1"
            role="progressbar"
            aria-label={`Uploading ${img.file?.name || 'image'}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={img.progress || 0}
          >
            <div className="h-full bg-emerald-400 transition-[width]" style={{ width: img.phase === 'processing' ? '12%' : `${img.progress || 0}%` }} />
          </div>
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
        <span className="absolute top-8 left-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow">
          Cover ⭐
        </span>
      )}

      <span title={imageName} className="absolute bottom-2 left-2 right-2 bg-black/75 text-white text-[10px] px-2 py-1 rounded truncate">
        {imageName}
      </span>

      <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
        {catLabel}
      </span>

      <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition flex items-center justify-center gap-2">
        {!isCover && (
          <button
            type="button"
            onClick={onCover}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 shadow hover:bg-emerald-50"
            title="Set as property cover photo"
            aria-label="Set as property cover photo"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
            <span>Set cover</span>
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
  const [photoUrl, setPhotoUrl] = useState('');
  const inputRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [viewMode, setViewMode] = useState('category');

  const addImageFromUrl = () => {
    const trimmedUrl = photoUrl.trim();
    if (!trimmedUrl) {
      toast.error('Paste an image URL first.');
      return;
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      toast.error('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    setImages((currentImages) => {
      const remaining = MAX_IMAGES - currentImages.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return currentImages;
      }

      return [
        ...currentImages,
        {
          id: uid(),
          file: null,
          localPreviewUrl: trimmedUrl,
          remoteUrl: trimmedUrl,
          r2Key: null,
          status: 'uploaded',
          category: activeCategory,
          error: null,
        },
      ];
    });

    setPhotoUrl('');
    toast.success('Image URL added to this gallery.');
  };

  // Upload ONE image by its stable id. No indexes anywhere.
  const uploadOne = async (imgId, selectedFile = null) => {
    const file = selectedFile || images.find((i) => i.id === imgId)?.file;
    if (!file) return;

    setImages((prev) =>
      prev.map((im) => (im.id === imgId ? { ...im, status: 'uploading', error: null } : im))
    );

    try {
      console.info(`[Property media upload] Resizing ${file.name}`);
      const resized = await resizeImage(file);
      console.info(`[Property media upload] Resized ${file.name}; sending to Cloudflare`);
      setImages((prev) => prev.map((im) => im.id === imgId ? { ...im, phase: 'uploading' } : im));
      const result = await uploadFileToR2(resized, (progress) => {
        setImages((prev) => prev.map((im) => im.id === imgId ? { ...im, progress } : im));
      });
      setImages((prev) =>
        prev.map((im) =>
          im.id === imgId
            ? { ...im, remoteUrl: result.url, r2Key: result.key, status: 'uploaded', error: null }
            : im
        )
      );
    } catch (e) {
      console.error(`[Property media upload] Failed ${file.name}:`, e);
      setImages((prev) =>
        prev.map((im) =>
          im.id === imgId ? { ...im, status: 'error', error: e.message || 'Upload failed' } : im
        )
      );
    }
  };

  const handleFiles = (files, category) => {
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    const selectedFiles = Array.from(files).slice(0, remaining);
    const newImgs = selectedFiles.map((file) => ({
      id: uid(),
      file,
      localPreviewUrl: null,
      remoteUrl: null,
      r2Key: null,
      status: 'uploading',
      phase: 'processing',
      progress: 0,
      category,
      error: null,
    }));

    setImages((currentImages) => [...currentImages, ...newImgs]);
    newImgs.forEach((img) => uploadOne(img.id, img.file));
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

            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-2">
                Or paste an image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 min-w-0 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="button"
                  onClick={addImageFromUrl}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="font-medium">Photo previews · all categories ({images.length})</span>
            </div>

            {images.length === 0 ? (
              <p className="text-xs italic text-gray-400">Uploaded photos will appear here with their category and filename.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img) => (
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
