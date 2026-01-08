/**
 * Image Service - Domain Layer
 * Gestión profesional del lifecycle completo de imágenes
 */

export interface ImageMetadata {
  url: string;
  path: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  aspectRatio?: number;
}

export interface UploadOptions {
  folder: 'ads' | 'profiles' | 'banners';
  maxFiles?: number;
  validateAspectRatio?: boolean;
  allowedRatios?: { min: number; max: number }; // 16:9 = 1.77, 4:3 = 1.33
}

export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * Validar aspect ratio de imagen (horizontal)
 * Rechaza verticales (portrait)
 */
export function validateImageAspectRatio(
  width: number,
  height: number,
  options: { min: number; max: number } = { min: 1.2, max: 2.5 }
): { valid: boolean; ratio: number; reason?: string } {
  const ratio = width / height;

  // Detectar verticales (portrait)
  if (ratio < 1) {
    return {
      valid: false,
      ratio,
      reason: '📱 Foto vertical detectada. GIRA TU CELULAR HORIZONTALMENTE y vuelve a tomar la foto en modo paisaje (landscape).'
    };
  }

  // Validar rango horizontal
  if (ratio < options.min) {
    return {
      valid: false,
      ratio,
      reason: `⚠️ Foto muy cuadrada (${ratio.toFixed(2)}:1). Toma la foto en horizontal mostrando más del producto. Usa formato 16:9 o 4:3.`
    };
  }
  
  if (ratio > options.max) {
    return {
      valid: false,
      ratio,
      reason: `⚠️ Foto muy panorámica (${ratio.toFixed(2)}:1). Usa formato 16:9 o 4:3 (horizontal normal).`
    };
  }

  return { valid: true, ratio };
}

/**
 * Extraer public_id de Cloudinary URL para poder borrar
 * https://res.cloudinary.com/dosjgdcxr/image/upload/.../rural24/ads/abc123.jpg
 * → rural24/ads/abc123
 */
export function extractCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Generar thumbnail URL desde Cloudinary URL base
 */
export function getImageThumbnail(url: string, width: number = 400): string {
  // Insertar transformación antes de /upload/
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
}

/**
 * Calcular aspect ratio recomendado según categoría
 */
export function getRecommendedAspectRatio(categoryType: 'vehicle' | 'property' | 'product' | 'other'): string {
  const recommendations = {
    vehicle: '16:9 (horizontal, captura todo el vehículo)',
    property: '4:3 (horizontal, muestra más altura)',
    product: '1:1 o 4:3 (cuadrado o horizontal)',
    other: '16:9 o 4:3 (horizontal)'
  };
  return recommendations[categoryType];
}
