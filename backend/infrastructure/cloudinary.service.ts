/**
 * Cloudinary Service - Infrastructure Layer
 * Maneja interacción directa con Cloudinary API.
 *
 * Estructura de carpetas:
 *   rural24/app/{sub}                    — assets estáticos (sin env prefix)
 *   rural24/{env}/cms/{folder}           — contenido CMS
 *   rural24/{env}/ugc/{entity}/{YYYY}/{MM} — UGC por entidad y mes
 */

import { v2 as cloudinary } from 'cloudinary';
import {
  MEDIA_ROOTS,
  CMS_FOLDERS,
  APP_FOLDERS,
  type MediaEntity,
} from '@/lib/media-config';

// Validar variables de entorno al cargar el módulo
const CLOUDINARY_CONFIG = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

console.log('[CLOUDINARY CONFIG]', {
  cloud_name: CLOUDINARY_CONFIG.cloud_name || 'MISSING',
  api_key: CLOUDINARY_CONFIG.api_key ? `${CLOUDINARY_CONFIG.api_key.substring(0, 6)}...` : 'MISSING',
  api_secret: CLOUDINARY_CONFIG.api_secret ? '***' : 'MISSING',
});

if (!CLOUDINARY_CONFIG.cloud_name || !CLOUDINARY_CONFIG.api_key || !CLOUDINARY_CONFIG.api_secret) {
  throw new Error('CLOUDINARY CREDENTIALS NOT CONFIGURED! Check .env.local file');
}

cloudinary.config(CLOUDINARY_CONFIG);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  url: string;
  /** public_id completo (incluye la ruta de carpeta) */
  public_id: string;
  version: number;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye la ruta de carpeta en Cloudinary según el tipo de contenido.
 *
 * @param folder  - Nombre de carpeta o entity ('ads' | 'users' | 'banners' | 'app-icons' …)
 * @param entity  - Entity UGC explícita (override de folder para UGC)
 */
export function buildFolder(folder: string, entity?: MediaEntity): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  // 1. Assets estáticos — compartidos entre entornos
  if ((APP_FOLDERS as readonly string[]).includes(folder)) {
    const sub = folder.replace('app-', '');
    return `${MEDIA_ROOTS.app}/${sub}`;
  }

  // 2. CMS — separado por entorno
  if ((CMS_FOLDERS as readonly string[]).includes(folder)) {
    return `${MEDIA_ROOTS.cms}/${folder}`;
  }

  // 3. UGC — organizado por entity / año / mes
  const resolvedEntity: string = entity ?? folder;
  return `${MEDIA_ROOTS.ugc}/${resolvedEntity}/${year}/${month}`;
}

/**
 * Genera un public_id único para la imagen.
 * Formato: {userId}_{timestamp36}  (sin el folder — Cloudinary lo prefija)
 */
function buildPublicId(userId?: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return userId ? `${userId}_${ts}_${rand}` : `${ts}_${rand}`;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Subir imagen a Cloudinary.
 *
 * @param buffer  - Contenido binario del archivo
 * @param folder  - Destino lógico ('ads' | 'banners' | 'app-icons' …)
 * @param entity  - Entity UGC explícita cuando folder no la refleja
 * @param userId  - ID del usuario que sube (incluido en el public_id)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'ads',
  entity?: MediaEntity,
  userId?: string,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: buildFolder(folder, entity),
        public_id: buildPublicId(userId),
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'svg'],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            version: result.version,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('Upload failed without error'));
        }
      },
    );

    uploadStream.end(buffer);
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error(`[Cloudinary] Error deleting ${publicId}:`, error);
    return false;
  }
}

export async function deleteManyFromCloudinary(publicIds: string[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = await Promise.allSettled(
    publicIds.map((id) => deleteFromCloudinary(id)),
  );

  const success = results.filter((r) => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - success;
  const errors = results
    .filter((r) => r.status === 'rejected')
    .map((r: any) => r.reason?.message || 'Unknown error');

  return { success, failed, errors };
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export async function checkImageExists(publicId: string): Promise<boolean> {
  try {
    await cloudinary.api.resource(publicId);
    return true;
  } catch {
    return false;
  }
}

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
      bandwidth_mb: usage.bandwidth.usage / (1024 * 1024),
    };
  } catch (error) {
    console.error('[Cloudinary] Error getting usage:', error);
    throw error;
  }
}
