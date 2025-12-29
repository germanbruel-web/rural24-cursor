/**
 * CARD LABEL HELPERS
 * Utilidades para generar etiquetas dinámicas en las cards de avisos
 * Formato: Subcategoría · Atributo1 · Atributo2
 */

import type { Product } from '../../types';

/**
 * Extrae la etiqueta para mostrar en la card
 * Lógica:
 * 1. Subcategoría (siempre primero si existe)
 * 2. Atributos dinámicos (ordenados por sort_order, hasta 2)
 * 3. Fallback a brand/model si no hay atributos dinámicos
 * 
 * @param product - Producto con datos
 * @param maxParts - Máximo de partes a mostrar (default: 3)
 * @returns String formateado "Subcategoría · Marca · Modelo"
 */
export function getCardLabel(
  product: Product,
  maxParts: number = 3
): string {
  const parts: string[] = [];

  // 1. Subcategoría (siempre primero)
  if (product.subcategory) {
    parts.push(product.subcategory);
  }

  // 2. Atributos dinámicos (si existen)
  if (product.attributes && typeof product.attributes === 'object') {
    const attributeEntries = Object.entries(product.attributes)
      .filter(([_, value]) => {
        // Saltear valores vacíos, null, undefined, o strings vacíos
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (typeof value === 'boolean' && !value) return false;
        return true;
      })
      .slice(0, maxParts - parts.length); // Limitar a espacios disponibles

    attributeEntries.forEach(([key, value]) => {
      if (parts.length >= maxParts) return;
      
      const formatted = formatAttributeValue(value, key);
      if (formatted) {
        parts.push(formatted);
      }
    });
  }

  // 3. Fallback a campos fijos (brand, model) si no hay atributos dinámicos
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
