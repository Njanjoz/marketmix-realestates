// src/components/seller/steps/StepPhotosMedia.jsx
import React from 'react';
import MediaUploader from '../shared/MediaUploader';
import { MEDIA_CATEGORIES } from '../constants/propertyTaxonomy';

const StepPhotosMedia = ({ data, update }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Upload photos of the property. Assign each photo to a category so tenants know what they're looking at.
        The first photo becomes the cover photo. You can reorder by dragging.
      </p>
      <MediaUploader
        categories={MEDIA_CATEGORIES}
        images={data.images || []}
        setImages={(imgs) => update((prev) => ({
          images: typeof imgs === 'function' ? imgs(prev.images || []) : imgs,
        }))}
      />
    </div>
  );
};

export default StepPhotosMedia;
