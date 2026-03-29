/**
 * Hook para gestión centralizada de imágenes de productos
 * Maneja múltiples formatos y fallbacks
 */

import { useMemo } from 'react';
import type { Product } from '../../types';
import { LOCAL_PLACEHOLDER_IMAGE } from '../constants/defaultImages';
import { getCategoryPlaceholder } from '../services/categoryPlaceholderCache';

interface ImageData {
  url: string;
  hasError: boolean;
}

const isValidUrl = (s: string) => s.startsWith('http://') || s.startsWith('https://');

export const useProductImage = (product: Product): string => {
  return useMemo(() => {
    // 1. imageUrl directo (ya procesado)
    if (product.imageUrl && product.imageUrl !== LOCAL_PLACEHOLDER_IMAGE && isValidUrl(product.imageUrl)) {
      return product.imageUrl;
    }

    // 2. imageUrls array
    if (product.imageUrls?.length > 0) {
      const first = product.imageUrls[0];
      if (typeof first === 'string' && isValidUrl(first)) return first;
      if (typeof first === 'object' && first && 'url' in first && isValidUrl((first as any).url)) return (first as any).url;
    }
    
    // 3. image_urls array
    if (product.image_urls?.length > 0) {
      const first = product.image_urls[0];
      if (typeof first === 'string' && isValidUrl(first)) return first;
      if (typeof first === 'object' && first && 'url' in first && isValidUrl((first as any).url)) return (first as any).url;
    }

    // 4. images array (MEJORADO: prioriza isPrimary y sortOrder)
    if ((product as any).images?.length > 0) {
      const images = (product as any).images;

      // 4a. Si hay objetos con metadatos (formato completo)
      if (typeof images[0] === 'object' && images[0] !== null) {
        // Buscar imagen con isPrimary = true
        const primaryImage = images.find((img: any) => img.isPrimary === true && isValidUrl(img.url ?? ''));
        if (primaryImage?.url) return primaryImage.url;
        
        // Si no hay isPrimary, ordenar por sortOrder y tomar el primero
        const sortedImages = [...images].sort((a: any, b: any) => {
          const orderA = a.sortOrder ?? 999;
          const orderB = b.sortOrder ?? 999;
          return orderA - orderB;
        });
        
        const firstSorted = sortedImages.find((img: any) => isValidUrl(img.url ?? ''));
        if (firstSorted?.url) return firstSorted.url;
      }

      // 4b. Formato simple (string[])
      const first = images.find((img: any) => typeof img === 'string' && isValidUrl(img));
      if (first) return first;
    }
    
    // 5. Fallback a placeholder por categoría (o genérico si no está en cache)
    return getCategoryPlaceholder((product as any).category_id);
  }, [product]);
};

/**
 * CONFIG-DRIVEN CARD LABELS — por category_slug
 *
 * Formato: category_slug → lista ordenada de grupos de keys de atributos.
 * Cada grupo es un array de fallbacks: se usa el primero encontrado en attrs.
 * La subcategoría L2 se antepone siempre de forma automática.
 *
 * Fórmulas acordadas (producto):
 *   maquinaria-agricola  → Subcategoria · Marca · Modelo · Año
 *   hacienda             → Subcategoria · Raza · Edad
 *   insumos              → Subcategoria · Marca
 *   inmobiliaria-rural   → Subcategoria · Tipo de operación
 *   servicios            → Subcategoria · Tipo de búsqueda
 *   equipamiento         → Subcategoria · Marca
 *   repuestos            → Subcategoria
 *   empleos              → Subcategoria · Tipo de búsqueda
 */
const CATEGORY_CARD_LABEL: Record<string, Array<string[]>> = {
  'maquinaria-agricola': [
    ['marca', 'marcas', 'brand'],
    ['modelo', 'model'],
    ['ano', 'año', 'year'],
  ],
  'hacienda': [
    ['raza', 'especie_y_raza', 'razabovinos', 'razaovinos', 'razaequinos', 'razaporcinos', 'razacaprinos', 'razaaves', 'breed'],
    // edad NO va en el label — se muestra como badge sobre la imagen (igual que Nuevo/Usado)
  ],
  'insumos': [
    ['marca', 'brand'],
  ],
  'inmobiliaria-rural': [
    // tipo_de_operacion va como badge sobre la imagen, no en el label
  ],
  'servicios': [
    ['tipo_de_busqueda'],
  ],
  'equipamiento': [
    ['marca', 'brand'],
  ],
  'repuestos': [],
  'empleos': [
    ['necesidad', 'tipo_de_busqueda'],
  ],
};

/**
 * Genera el label del card según la categoría del aviso.
 * Siempre arranca con la subcategoría L2, luego los atributos configurados.
 * Resultado: "Tractores · John Deere · 8320 · 2019"
 */
/**
 * Humaniza un valor de atributo que puede ser un slug o valor raw.
 * - Slugs con guiones/underscores → Title Case: "gasoil-grado-2" → "Gasoil Grado 2"
 * - Palabras en minúscula (tipo ofrezco, busco) → capitaliza primera letra
 * - Valores ya formateados (marcas, modelos) → sin cambio
 */
const humanizeAttrValue = (val: string): string => {
  if (val.includes('-') || val.includes('_')) {
    return val.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  if (val === val.toLowerCase() && /^[a-z]/.test(val)) {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }
  return val;
};

export const getProductLabel = (product: Product): string => {
  const parts: string[] = [];
  const attrs = {
    ...(product.attributes || {}),
    ...((product as any).dynamic_fields || {})
  };

  const catSlug = (product.category_slug || '').toLowerCase();

  // Subcategoría: regla por categoría.
  // hacienda → L3 leaf (ej: "Novillitos") — el tipo exacto de animal es la info relevante
  // resto    → L2 padre (ej: "Tractores") — la categoría de máquina es la info relevante
  const subcatLabel = catSlug === 'hacienda'
    ? (product.subcategory || product.subcategory_l2)
    : (product.subcategory_l2 || product.subcategory);
  if (subcatLabel) parts.push(String(subcatLabel));
  const fieldGroups = CATEGORY_CARD_LABEL[catSlug];

  if (fieldGroups !== undefined) {
    // Categoría configurada: recorrer grupos en orden
    for (const keys of fieldGroups) {
      for (const key of keys) {
        const val = attrs[key];
        if (val) { parts.push(humanizeAttrValue(String(val))); break; }
      }
    }
  } else {
    // Categoría sin config conocida: fallback genérico marca · modelo · año
    const marca = attrs.marca || attrs.marcas || attrs.brand || product.brand;
    if (marca) parts.push(String(marca));
    const modelo = attrs.modelo || attrs.model;
    if (modelo) parts.push(String(modelo));
    const ano = attrs.ano || attrs.año || attrs.year;
    if (ano && marca) parts.push(String(ano));
  }

  return parts.join(' · ') || product.category || '';
};
