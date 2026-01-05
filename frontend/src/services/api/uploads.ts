/**
 * Uploads API Service - Backend Proxy con Honeypot Anti-Bot
 */

import { fetchApi, ApiError, API_URL } from './client';

export const uploadsApi = {
  async uploadImage(
    file: File,
    folder: 'ads' | 'profiles' | 'banners' = 'ads'
  ): Promise<{ url: string; path: string }> {
    console.log(`[uploadsApi] 🚀 uploadImage called`);
    console.log(`[uploadsApi] 📁 Folder: ${folder}`);
    console.log(`[uploadsApi] 📄 File:`, {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    // HONEYPOT: Campo invisible para detectar bots
    // Los bots automatizados suelen llenar todos los campos
    // Los usuarios reales nunca ven este campo
    formData.append('website', ''); // Debe quedar vacío

    console.log(`[uploadsApi] 🌐 Fetching: ${API_URL}/api/uploads`);
    console.log(`[uploadsApi] 📡 Method: POST`);
    
    const response = await fetch(`${API_URL}/api/uploads`, {
      method: 'POST',
      body: formData,
      // No establecer Content-Type, el browser lo hace automáticamente con boundary
    });

    console.log(`[uploadsApi] 📨 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[uploadsApi] ❌ Upload failed:', error);
      
      // Manejar rate limiting específicamente
      if (response.status === 429) {
        const resetAt = error.resetAt ? new Date(error.resetAt).toLocaleTimeString() : 'pronto';
        throw new ApiError(
          `Demasiados uploads. Por favor intenta nuevamente a las ${resetAt}`,
          429
        );
      }
      
      throw new ApiError(error.message || error.error || 'Upload failed', response.status);
    }

    const data = await response.json();

    console.log('[uploadsApi] ✅ Upload successful:', {
      url: data.url,
      path: data.path,
      width: data.width,
      height: data.height
    });

    return {
      url: data.url,
      path: data.path,
    };
  },

  /**
   * Subir múltiples imágenes (máximo 5 por request)
   */
  async uploadMultiple(
    files: File[],
    folder: 'ads' | 'profiles' | 'banners' = 'ads'
  ): Promise<Array<{ url: string; path: string }>> {
    // Validación cliente: máximo 5 imágenes
    if (files.length > 5) {
      throw new Error('Máximo 5 imágenes permitidas por upload');
    }
    
    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  },

  /**
   * Eliminar imagen de Cloudinary
   */
  async deleteImage(url: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/api/uploads/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Delete failed', response.status);
    }

    const data = await response.json();
    return data.success;
  },

  /**
   * Eliminar múltiples imágenes (batch)
   */
  async deleteMany(urls: string[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const response = await fetch(`${API_URL}/api/uploads/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Delete failed', response.status);
    }

    return response.json();
  },
};
