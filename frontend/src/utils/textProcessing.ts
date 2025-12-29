// ====================================================================
// UTILIDADES DE PROCESAMIENTO DE TEXTO
// ====================================================================

/**
 * Separa valores múltiples que están concatenados en un string
 * Maneja formatos como:
 * - "Tractor de 4 ruedas con motor diesel"
 * - "Aire acondicionado, Calefacción, Radio"
 * - "120 HP / 540 RPM"
 */

interface SeparatedValue {
  label: string;
  value: string;
}

/**
 * Patrones comunes para detectar múltiples valores en un string
 */
const SEPARATION_PATTERNS = [
  // Conectores temporales o causales
  /\b(con|para|de|en|sobre|sin)\b/gi,
  // Separadores de lista
  /[,;]/g,
  // Separadores de valores numéricos
  /\s*\/\s*/g,
  // Separadores con guión
  /\s*-\s*/g,
];

/**
 * Divide un string en partes significativas basándose en patrones comunes
 * @param text - El texto a separar
 * @returns Array de objetos con label y value
 */
export function separateValues(text: string): SeparatedValue[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Limpiar el texto
  const cleaned = text.trim();

  // Si es muy corto, retornar como un solo valor
  if (cleaned.length < 10) {
    return [{ label: '', value: cleaned }];
  }

  const results: SeparatedValue[] = [];

  // Intentar separar por comas o punto y coma primero (más común)
  if (cleaned.includes(',') || cleaned.includes(';')) {
    const parts = cleaned.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    
    if (parts.length > 1) {
      return parts.map((part) => ({ label: '', value: part }));
    }
  }

  // Intentar separar por slash (valores numéricos)
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').map((p) => p.trim()).filter(Boolean);
    
    if (parts.length === 2) {
      return parts.map((part) => ({ label: '', value: part }));
    }
  }

  // Buscar patrones de "X con Y" o "X de Y"
  const connectorMatch = cleaned.match(/^([^,]+?)\s+(con|de|para|en)\s+(.+)$/i);
  if (connectorMatch) {
    return [
      { label: '', value: connectorMatch[1].trim() },
      { label: connectorMatch[2], value: connectorMatch[3].trim() },
    ];
  }

  // Si no se pudo separar, retornar como un solo valor
  return [{ label: '', value: cleaned }];
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param text - El texto a capitalizar
 * @returns Texto capitalizado
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Trunca un texto a una longitud máxima
 * @param text - El texto a truncar
 * @param maxLength - Longitud máxima
 * @param ellipsis - Texto a agregar al final (por defecto '...')
 * @returns Texto truncado
 */
export function truncate(
  text: string,
  maxLength: number,
  ellipsis: string = '...'
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - ellipsis.length).trim() + ellipsis;
}

/**
 * Limpia caracteres especiales de un string
 * @param text - El texto a limpiar
 * @returns Texto limpio
 */
export function cleanString(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/[^\w\s.,;:áéíóúñÁÉÍÓÚÑ()-]/g, '') // Eliminar caracteres raros
    .trim();
}

/**
 * Formatea un label de atributo para display
 * Convierte "nombre_atributo" a "Nombre Atributo"
 * @param key - La clave del atributo
 * @returns Label formateado
 */
export function formatAttributeLabel(key: string): string {
  if (!key || typeof key !== 'string') {
    return '';
  }

  return key
    .replace(/_/g, ' ') // Reemplazar guiones bajos por espacios
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Verifica si un string contiene solo números
 * @param text - El texto a verificar
 * @returns true si solo contiene números
 */
export function isNumericString(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  return /^\d+(\.\d+)?$/.test(text.trim());
}

/**
 * Extrae números de un string
 * @param text - El texto del cual extraer números
 * @returns Array de números encontrados
 */
export function extractNumbers(text: string): number[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const matches = text.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(parseFloat) : [];
}
