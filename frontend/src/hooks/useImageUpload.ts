/**
 * useImageUpload Hook
 * Hook para subir imágenes a Cloudinary
 */

import { useState } from 'react';
import { uploadsApi } from '@/services/api';

export interface UploadedImage {
  url: string;
  path: string;
  file: File;
}

export function useImageUpload(folder: 'ads' | 'profiles' | 'banners' = 'ads') {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<UploadedImage | null> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const result = await uploadsApi.uploadImage(file, folder);

      setProgress(100);

      return {
        ...result,
        file,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (files: File[]): Promise<UploadedImage[]> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      const results = await uploadsApi.uploadMultiple(files, folder);

      setProgress(100);

      return results.map((result, index) => ({
        ...result,
        file: files[index],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
      return [];
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadImage,
    uploadMultiple,
    uploading,
    progress,
    error,
  };
}
