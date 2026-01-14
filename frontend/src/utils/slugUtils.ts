/**
 * Utilidades para generar y parsear slugs de avisos
 * URL amigable: /ad/tractor-john-deere-5070-abc123
 * donde "abc123" es el short_id o los últimos 6 chars del UUID
 */

/**
 * Genera un slug limpio desde un texto
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Descomponer caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .slice(0, 60); // Máximo 60 caracteres
}

/**
 * Genera slug de aviso con ID corto al final
 * Ejemplo: "tractor-john-deere-5070-abc123"
 * @param title - Título del aviso
 * @param id - UUID del aviso
 * @param shortId - short_id opcional (preferido si existe)
 */
export function generateAdSlug(title: string, id: string, shortId?: string): string {
  const titleSlug = generateSlug(title);
  // Prioridad: short_id > últimos 6 chars del UUID
  const suffix = shortId || id.slice(-6);
  return `${titleSlug}-${suffix}`;
}

/**
 * Extrae el ID original desde un slug
 * No necesita el UUID completo, el backend puede buscar por coincidencia
 */
export function extractIdFromSlug(slug: string): string {
  // Extraer los últimos 6 caracteres después del último guion
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];
  return shortId;
}

/**
 * Genera URL de detalle de aviso con slug
 * @param title - Título del aviso
 * @param id - UUID del aviso
 * @param shortId - short_id opcional (preferido si existe)
 */
export function getAdDetailUrl(title: string, id: string, shortId?: string): string {
  const slug = generateAdSlug(title, id, shortId);
  return `#/ad/${slug}`;
}

/**
 * Extrae ID desde la URL actual
 * Soporta ambos formatos:
 * - Nuevo: #/ad/tractor-john-deere-abc123
 * - Legacy: #/ad/733ec98d-d227-4960-899a-7fbd925a921e
 */
export function extractIdFromUrl(urlOrSlug: string): string {
  // Si es un UUID completo (legacy), retornarlo
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(urlOrSlug)) {
    return urlOrSlug;
  }
  
  // Si es un slug, extraer el shortId final
  return extractIdFromSlug(urlOrSlug);
}
