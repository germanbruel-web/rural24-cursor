import React from 'react';
import { SimpleImageUploader } from '../../SimpleImageUploader/SimpleImageUploader';
import type { WizardBlockProps } from '../wizardTypes';
import type { WizardBlockConfig } from '../../../services/v2/wizardConfigService';

interface Props extends Pick<WizardBlockProps, 'uploadedImages' | 'uploadedImagesRef' | 'onImagesChange'> {
  config?: WizardBlockConfig;
}

export function ImagesBlock({ uploadedImages, uploadedImagesRef, onImagesChange, config }: Props) {
  const maxFiles = config?.max_images ?? 8;
  const successCount = uploadedImages.filter(img => img.status === 'success').length;

  function handleChange(images: typeof uploadedImages) {
    onImagesChange(images);
    uploadedImagesRef.current = images;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Fotos</h2>
        {successCount > 0 && (
          <span className="text-sm text-brand-600 font-medium">
            {successCount}/{maxFiles}
          </span>
        )}
      </div>
      <SimpleImageUploader
        maxFiles={maxFiles}
        folder="ads"
        onImagesChange={handleChange}
        existingImages={uploadedImages}
      />
    </div>
  );
}
