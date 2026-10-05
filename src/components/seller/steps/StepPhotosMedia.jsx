// src/components/seller/steps/StepPhotosMedia.jsx
import React from 'react';
import MediaUploader from '../shared/MediaUploader';
import { MEDIA_CATEGORIES } from '../constants/propertyTaxonomy';

const StepPhotosMedia = ({ data, update }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Upload photos and assign each one a category. Choose <strong>Set as cover</strong> on the photo you want
        property seekers to see first; it will also be used on property cards and promotion posters. Drag to reorder the rest.
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
