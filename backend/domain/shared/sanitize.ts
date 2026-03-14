/**
 * Sanitizador HTML liviano para campos de texto enriquecido.
 * No requiere dependencias externas — usa regex para el servidor.
 *
 * Permite: b, i, u, strong, em, ul, ol, li, p, br, h2, h3
 * Elimina: script, style, iframe, object, embed, form, y on* event handlers
 */

const BLOCKED_TAGS = /(<\s*\/?\s*(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*>)/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_HREF = /href\s*=\s*["']\s*javascript:[^"']*["']/gi;

/**
 * Sanitiza HTML de rich text. Uso: campo `description` en POST /api/ads.
 */
export function sanitizeRichText(html: string): string {
  return html
    .replace(BLOCKED_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_HREF, '')
    .trim();
}
