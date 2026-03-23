/**
 * Constantes de imágenes por defecto
 * Usando Cloudinary CDN para placeholder
 */

// Fallback de último recurso (Supabase site_settings.default_ad_image es el source of truth)
export const DEFAULT_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x600/10b981/ffffff?text=Rural24';

// Fallback si Cloudinary falla
export const LOCAL_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800x600/10b981/ffffff?text=Rural24';
