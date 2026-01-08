/**
 * Cloudinary Service - Infrastructure Layer
 * Maneja interacción directa con Cloudinary API
 */

import { v2 as cloudinary } from 'cloudinary';

// Validar variables de entorno al cargar el módulo
const CLOUDINARY_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Log de configuración (sin exponer secrets completos)
console.log('[CLOUDINARY CONFIG]', {
  cloud_name: CLOUDINARY_CONFIG.cloud_name || 'MISSING',
  api_key: CLOUDINARY_CONFIG.api_key ? `${CLOUDINARY_CONFIG.api_key.substring(0, 6)}...` : 'MISSING',
  api_secret: CLOUDINARY_CONFIG.api_secret ? '***' : 'MISSING'
});

// Validación crítica
if (!CLOUDINARY_CONFIG.cloud_name || !CLOUDINARY_CONFIG.api_key || !CLOUDINARY_CONFIG.api_secret) {
  throw new Error('CLOUDINARY CREDENTIALS NOT CONFIGURED! Check .env.local file');
}

// Configurar singleton
cloudinary.config(CLOUDINARY_CONFIG);

export interface CloudinaryUploadResult {
  url: string;
  path: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Subir imagen a Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'ads'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rural24/${folder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'webp', 'heic', 'heif'],
        transformation: [
          { quality: 'auto:good', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            path: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
          });
        } else {
          reject(new Error('Upload failed without error'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Borrar imagen de Cloudinary (hard delete)
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error(`[Cloudinary] Error deleting ${publicId}:`, error);
    return false;
  }
}

/**
 * Borrar múltiples imágenes (batch)
 */
export async function deleteManyFromCloudinary(publicIds: string[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = await Promise.allSettled(
    publicIds.map(id => deleteFromCloudinary(id))
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - success;
  const errors = results
    .filter(r => r.status === 'rejected')
    .map((r: any) => r.reason?.message || 'Unknown error');

  return { success, failed, errors };
}

/**
 * Verificar si existe imagen en Cloudinary
 */
export async function checkImageExists(publicId: string): Promise<boolean> {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtener stats de uso de Cloudinary
 */
export async function getCloudinaryUsage(): Promise<{
  credits_used: number;
  credits_limit: number;
  transformations: number;
  bandwidth_mb: number;
}> {
  try {
    const usage = await cloudinary.api.usage();
    return {
      credits_used: usage.credits.usage,
      credits_limit: usage.credits.limit,
      transformations: usage.transformations.usage,
      bandwidth_mb: usage.bandwidth.usage / (1024 * 1024)
    };
  } catch (error) {
    console.error('[Cloudinary] Error getting usage:', error);
    throw error;
  }
}
