/**
 * Uploads API Service - Backend Proxy
 */

import { apiClient, ApiError } from './client';

export const uploadsApi = {
  async uploadImage(
    file: File,
    folder: 'ads' | 'profiles' | 'banners' = 'ads'
  ): Promise<{ url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await apiClient.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Subir múltiples imágenes
   */
  async uploadMultiple(
    files: File[],
    folder: 'ads' | 'profiles' | 'banners' = 'ads'
  ): Promise<Array<{ url: string; path: string }>> {
    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  },
};
