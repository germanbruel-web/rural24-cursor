/**
 * Media Config — Rural24
 * Fuente de verdad para estructura de carpetas en Cloudinary.
 * Separación DEV / PROD basada en NODE_ENV.
 */

export const MEDIA_ENV = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

/** Carpetas raíz por contexto */
export const MEDIA_ROOTS = {
  /** UGC (User Generated Content): avisos, perfiles, maquinaria */
  ugc: `rural24/${MEDIA_ENV}/ugc`,
  /** CMS (contenido de admin): banners, hero, secciones */
  cms: `rural24/${MEDIA_ENV}/cms`,
  /** Assets estáticos de la app — compartidos entre entornos */
  app: 'rural24/app',
} as const;

/**
 * Entities válidas para UGC.
 * Definen el sub-folder dentro de ugc/{entity}/{YYYY}/{MM}
 */
export type MediaEntity = 'ads' | 'users' | 'machinery' | 'properties';

export const MEDIA_ENTITIES: MediaEntity[] = ['ads', 'users', 'machinery', 'properties'];

/** Carpetas CMS que se separan por entorno */
export const CMS_FOLDERS = ['banners', 'cms', 'system', 'categories', 'logos', 'hero', 'sections'] as const;

/** Carpetas de assets de app (sin prefijo de entorno) */
export const APP_FOLDERS = ['app-icons', 'app-logos', 'app-placeholders', 'app-brands'] as const;
