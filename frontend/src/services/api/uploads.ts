/**
 * Uploads API Service — proxy hacia el BFF (Next.js /api/uploads)
 */

import { ApiError, API_URL } from './client';
import { supabase } from '../supabaseClient';

/**
 * Objeto rico devuelto por Cloudinary tras cada upload.
 * Se persiste como JSONB en `ads.images[]` para habilitar
 * transformaciones on-the-fly sin re-procesar URLs.
 */
export interface MediaInfo {
  /** public_id completo en Cloudinary (incluye ruta de carpeta) */
  public_id: string;
  /** URL segura (https) de la imagen original */
  url: string;
  /** Versión de Cloudinary — usada para cache-busting en transformaciones */
  version: number;
  /** Formato resultante ('webp', 'jpg', 'png' …) */
  format: string;
  width: number;
  height: number;
  bytes: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

export const uploadsApi = {
  /**
   * Sube una imagen al BFF → Cloudinary.
   * Retorna MediaInfo completo para persistir en DB.
   */
  async uploadImage(
    file: File,
    folder: 'ads' | 'profiles' | 'banners' | 'app-icons' = 'ads',
  ): Promise<MediaInfo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    // HONEYPOT: debe quedar vacío — los bots lo llenan automáticamente
    formData.append('website', '');

    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 429) {
        const resetAt = error.resetAt ? new Date(error.resetAt).toLocaleTimeString() : 'pronto';
        throw new ApiError(
          `Demasiados uploads. Intentá nuevamente a las ${resetAt}`,
          429,
        );
      }

      throw new ApiError(error.message || error.error || 'Upload fallido', response.status);
    }

    const data = await response.json();

    return {
      public_id: data.public_id,
      url: data.url,
      version: data.version,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  },

  /**
   * Sube múltiples imágenes (máximo 5 por request)
   */
  async uploadMultiple(
    files: File[],
    folder: 'ads' | 'profiles' | 'banners' = 'ads',
  ): Promise<MediaInfo[]> {
    if (files.length > 5) {
      throw new Error('Máximo 5 imágenes permitidas por upload');
    }
    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  },

  /**
   * Elimina una imagen de Cloudinary vía BFF
   */
  async deleteImage(publicId: string): Promise<boolean> {
    const response = await fetch(`${API_URL}/api/uploads/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Delete fallido', response.status);
    }

    const data = await response.json();
    return data.success;
  },

  /**
   * Elimina múltiples imágenes (batch)
   */
  async deleteMany(publicIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const response = await fetch(`${API_URL}/api/uploads/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_ids: publicIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message || 'Delete fallido', response.status);
    }

    return response.json();
  },
};
