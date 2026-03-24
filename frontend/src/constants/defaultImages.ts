/**
 * Constantes de imágenes por defecto.
 * Data URI inline — no depende de servicios externos.
 */

// SVG placeholder inline: fondo gris + texto "Sin imagen"
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#9ca3af">Sin imagen</text></svg>`;

export const DEFAULT_PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PLACEHOLDER_SVG)}`;

export const LOCAL_PLACEHOLDER_IMAGE = DEFAULT_PLACEHOLDER_IMAGE;
