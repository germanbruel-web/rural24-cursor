/**
 * CARD LABEL HELPERS
 * Utilidades para generar etiquetas dinámicas en las cards de avisos
 * Formato: Subcategoría · Atributo1 · Atributo2
 * 
 * ARQUITECTURA:
 * - Cada subcategoría puede definir qué atributos mostrar como "tags" en las cards
 * - Nivel 1: Atributo principal (ej: tipobovino = "Toro")
 * - Nivel 2: Atributo secundario (ej: razabovinos = "Aberdeen Angus")
 * - Fallback: brand/model para categorías sin config específica
 */

import type { Product } from '../../types';

/**
 * CONFIGURACIÓN DE ATRIBUTOS PRIORITARIOS POR SUBCATEGORÍA
 * 
 * Formato: subcategory_name (lowercase) → [atributo_nivel_1, atributo_nivel_2]
 * Los nombres de atributos deben coincidir con las keys en product.attributes
 * 
 * Para agregar nuevas subcategorías:
 * 1. Buscar el nombre de la subcategoría en minúsculas
 * 2. Identificar las keys de atributos en la BD (ej: tipobovino, raza)
 * 3. Agregar la entrada aquí
 * 
 * El segundo elemento es un array de fallbacks para raza
 */
const SUBCATEGORY_PRIORITY_ATTRIBUTES: Record<string, [string, string[]]> = {
  // === GANADERÍA ===
  // Formato: [tipoX, [raza, razaX, legacy...]]
  'bovinos': ['tipobovino', ['raza', 'razabovinos', 'breed']],
  'ovinos': ['tipoovino', ['raza', 'razaovinos', 'razabovinos', 'breed']],
  'equinos': ['tipoequino', ['raza', 'razaequinos', 'breed']],
  'porcinos': ['tipoporcino', ['raza', 'razaporcinos', 'breed']],
  'caprinos': ['tipocaprino', ['raza', 'razacaprinos', 'breed']],
  'aves': ['tipoave', ['raza', 'razaaves', 'breed']],
  
  // === MAQUINARIAS (fallback a brand/model por defecto) ===
  // Si se necesita config específica, agregar aquí:
  // 'tractores': ['marca', ['modelo']],
  
  // === INSUMOS ===
  // 'semillas': ['cultivo', ['variedad']],
  // 'fertilizantes': ['tipo', ['marca']],
};

/**
 * Extrae la etiqueta para mostrar en la card
 * Lógica:
 * 1. Subcategoría (siempre primero si existe)
 * 2. Atributos PRIORITARIOS según config de la subcategoría
 * 3. Fallback a brand/model si no hay config específica
 * 
 * @param product - Producto con datos
 * @param maxParts - Máximo de partes a mostrar (default: 3)
 * @returns String formateado "Bovinos · Toro · Aberdeen Angus"
 */
export function getCardLabel(
  product: Product,
  maxParts: number = 3
): string {
  const parts: string[] = [];
  const attrs = product.attributes || {};
  
  // Normalizar nombre de subcategoría para buscar config
  const subcategoryKey = (product.subcategory || '').toLowerCase().trim();

  // 1. Subcategoría (siempre primero)
  if (product.subcategory) {
    parts.push(product.subcategory);
  }

  // 2. Buscar atributos prioritarios según config de subcategoría
  const priorityConfig = SUBCATEGORY_PRIORITY_ATTRIBUTES[subcategoryKey];
  
  if (priorityConfig && parts.length < maxParts) {
    const [attr1Key, attr2Fallbacks] = priorityConfig;
    
    // Atributo Nivel 1 (principal)
    if (attr1Key && attrs[attr1Key] && parts.length < maxParts) {
      const formatted = formatAttributeValue(attrs[attr1Key], attr1Key);
      if (formatted) {
        parts.push(formatted);
      }
    }
    
    // Atributo Nivel 2 con fallbacks (buscar en orden hasta encontrar uno)
    if (attr2Fallbacks && Array.isArray(attr2Fallbacks) && parts.length < maxParts) {
      for (const key of attr2Fallbacks) {
        if (attrs[key]) {
          const formatted = formatAttributeValue(attrs[key], key);
          if (formatted) {
            parts.push(formatted);
            break; // Usar el primero encontrado
          }
        }
      }
    }
  }

  // 3. Fallback a brand/model si no hay config específica o no se encontraron atributos
  if (parts.length === 1 && product.subcategory) {
    // Solo tenemos subcategoría, intentar brand/model
    if (product.brand && parts.length < maxParts) {
      parts.push(product.brand);
    }
    if (product.model && parts.length < maxParts) {
      parts.push(product.model);
    }
  }

  // Si no hay subcategoría pero hay brand, usar brand como primero
  if (parts.length === 0 && product.brand) {
    parts.push(product.brand);
    if (product.model && parts.length < maxParts) {
      parts.push(product.model);
    }
  }

  return parts.join(' · '); // Separador punto medio (U+00B7)
}

/**
 * Formatea el valor de un atributo según su tipo
 * @param value - Valor del atributo
 * @param fieldName - Nombre del campo (para contexto)
 * @returns String formateado
 */
function formatAttributeValue(value: any, fieldName: string): string {
  // Boolean
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  // Number
  if (typeof value === 'number') {
    // Si es un año, no formatear con separadores
    if (fieldName.toLowerCase().includes('año') || fieldName.toLowerCase().includes('year')) {
      return String(value);
    }
    // Números con separadores de miles
    return value.toLocaleString('es-AR');
  }

  // Array (tomar primer elemento)
  if (Array.isArray(value) && value.length > 0) {
    return formatAttributeValue(value[0], fieldName);
  }

  // Object (intentar extraer valor significativo)
  if (typeof value === 'object' && value !== null) {
    if ('value' in value) return formatAttributeValue(value.value, fieldName);
    if ('label' in value) return formatAttributeValue(value.label, fieldName);
    if ('name' in value) return formatAttributeValue(value.name, fieldName);
    return '[Objeto]';
  }

  // String (truncar si es muy largo)
  const str = String(value);
  const maxLength = 25;
  if (str.length > maxLength) {
    return str.substring(0, maxLength - 3) + '...';
  }

  return str;
}

/**
 * Verifica si un producto tiene datos suficientes para mostrar etiqueta
 * @param product - Producto a verificar
 * @returns true si tiene al menos subcategoría o un atributo
 */
export function hasCardLabel(product: Product): boolean {
  if (product.subcategory) return true;
  if (product.brand) return true;
  if (product.attributes && Object.keys(product.attributes).length > 0) return true;
  return false;
}
