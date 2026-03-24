/**
 * RuralImage — Componente atómico de imagen optimizada vía Cloudinary.
 *
 * Acepta un objeto MediaInfo (JSONB de la DB) o un string URL legacy.
 * Aplica lazy-loading nativo y genera miniaturas on-the-fly via Cloudinary
 * sin re-procesar ni re-subir la imagen original.
 *
 * Uso:
 *   <RuralImage src={ad.images[0]} alt="Descripción" />
 *   <RuralImage src={ad.images[0]} variant="thumbnail" alt="Vista admin" />
 *   <RuralImage src="https://res.cloudinary.com/..." alt="Legacy" />
 */

import React from 'react';
import type { MediaInfo } from '@/services/api/uploads';

// ─── Constantes ────────────────────────────────────────────────────────────────

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '';

const PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ESin imagen%3C/text%3E%3C/svg%3E';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construye una URL de transformación de Cloudinary.
 *
 * Usa la forma /v{version}/{public_id} para cache-busting determinista.
 * Si no hay CLOUD_NAME configurado, retorna la URL original.
 */
function buildCloudinaryUrl(info: MediaInfo, transform: string): string {
  if (!CLOUD_NAME) return info.url;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/v${info.version}/${info.public_id}`;
}

/** Resuelve el src a una URL usable, manejando MediaInfo y strings legacy */
function resolveUrl(src: MediaInfo | string | null | undefined, transform?: string): string {
  if (!src) return PLACEHOLDER;

  if (typeof src === 'string') return src || PLACEHOLDER;

  if (transform && CLOUD_NAME) {
    return buildCloudinaryUrl(src, transform);
  }
  return src.url || PLACEHOLDER;
}

// ─── Variantes ────────────────────────────────────────────────────────────────

const VARIANTS = {
  /** Imagen completa — sin transformación extra */
  full: undefined as string | undefined,
  /** Miniatura cuadrada 200×200 para tablas de admin */
  thumbnail: 'c_fill,w_200,h_200,f_auto,q_auto',
  /** Card de producto — 400×300, crop centrado */
  card: 'c_fill,w_400,h_300,f_auto,q_auto',
  /** Hero / detalle — ancho máximo 1200, formato auto */
  hero: 'w_1200,f_auto,q_auto',
} as const;

type Variant = keyof typeof VARIANTS;

// ─── Props ────────────────────────────────────────────────────────────────────

interface RuralImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** MediaInfo JSONB de la DB, o string URL legacy */
  src: MediaInfo | string | null | undefined;
  alt: string;
  /**
   * Variante de transformación Cloudinary.
   * - full: original sin crop
   * - thumbnail: 200×200 cuadrado (admin tables)
   * - card: 400×300 centrado (product cards)
   * - hero: 1200px ancho máximo (detalle de aviso)
   * @default 'full'
   */
  variant?: Variant;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function RuralImage({
  src,
  alt,
  variant = 'full',
  className,
  onError,
  ...rest
}: RuralImageProps) {
  const transform = VARIANTS[variant];
  const resolvedSrc = resolveUrl(src, transform);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
    onError?.(e);
  };

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
