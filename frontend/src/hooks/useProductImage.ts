/**
 * Hook para gestión centralizada de imágenes de productos
 * Maneja múltiples formatos y fallbacks
 */

import { useMemo } from 'react';
import type { Product } from '../../types';
import { DEFAULT_PLACEHOLDER_IMAGE, LOCAL_PLACEHOLDER_IMAGE } from '../constants/defaultImages';

interface ImageData {
  url: string;
  hasError: boolean;
}

export const useProductImage = (product: Product): string => {
  return useMemo(() => {
    // 1. imageUrl directo (ya procesado)
    if (product.imageUrl && product.imageUrl !== LOCAL_PLACEHOLDER_IMAGE && product.imageUrl !== DEFAULT_PLACEHOLDER_IMAGE) {
      return product.imageUrl;
    }
    
    // 2. imageUrls array
    if (product.imageUrls?.length > 0) {
      const first = product.imageUrls[0];
      if (typeof first === 'string' && first) return first;
      if (typeof first === 'object' && first && 'url' in first) return (first as any).url;
    }
    
    // 3. image_urls array
    if (product.image_urls?.length > 0) {
      const first = product.image_urls[0];
      if (typeof first === 'string' && first) return first;
      if (typeof first === 'object' && first && 'url' in first) return (first as any).url;
    }
    
    // 4. images array (MEJORADO: prioriza isPrimary y sortOrder)
    if ((product as any).images?.length > 0) {
      const images = (product as any).images;
      
      // 4a. Si hay objetos con metadatos (formato completo)
      if (typeof images[0] === 'object' && images[0] !== null) {
        // Buscar imagen con isPrimary = true
        const primaryImage = images.find((img: any) => img.isPrimary === true);
        if (primaryImage?.url) return primaryImage.url;
        
        // Si no hay isPrimary, ordenar por sortOrder y tomar el primero
        const sortedImages = [...images].sort((a: any, b: any) => {
          const orderA = a.sortOrder ?? 999;
          const orderB = b.sortOrder ?? 999;
          return orderA - orderB;
        });
        
        const firstSorted = sortedImages[0];
        if (firstSorted?.url) return firstSorted.url;
      }
      
      // 4b. Formato simple (string[])
      const first = images[0];
      if (typeof first === 'string' && first) return first;
    }
    
    // 5. Fallback a Cloudinary
    return DEFAULT_PLACEHOLDER_IMAGE;
  }, [product]);
};

/**
 * CONFIGURACIÓN DE ATRIBUTOS PRIORITARIOS POR SUBCATEGORÍA
 * 
 * Formato: subcategory_name (lowercase) → [atributo_nivel_1, atributo_nivel_2[]]
 * El nivel 2 ahora es un array de fallbacks para buscar en orden
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
};

/**
 * Obtiene el label del producto con taxonomía de 2 niveles
 * 
 * ARQUITECTURA:
 * 1. Subcategoría (siempre primero) - ej: "Bovinos"
 * 2. Atributo Nivel 1 según config - ej: "Toro" (tipobovino)
 * 3. Atributo Nivel 2 según config - ej: "Aberdeen Angus" (raza con fallbacks)
 * 4. Fallback: marca/brand si no hay config específica
 * 
 * Resultado: "Bovinos · Toro · Aberdeen Angus"
 */
export const getProductLabel = (product: Product): string => {
  const parts: string[] = [];
  const attrs = {
    ...(product.attributes || {}),
    ...((product as any).dynamic_fields || {})
  };
  
  // Normalizar nombre de subcategoría para buscar config
  const subcategoryKey = (product.subcategory || '').toLowerCase().trim();
  
  // 1. Subcategoría (siempre primero)
  if (product.subcategory) {
    parts.push(String(product.subcategory));
  }
  
  // 2. Buscar atributos prioritarios según config de subcategoría
  const priorityConfig = SUBCATEGORY_PRIORITY_ATTRIBUTES[subcategoryKey];
  
  if (priorityConfig) {
    const [attr1Key, attr2Fallbacks] = priorityConfig;
    
    // Atributo Nivel 1 (ej: tipobovino = "Toro")
    if (attr1Key && attrs[attr1Key]) {
      parts.push(String(attrs[attr1Key]));
    }
    
    // Atributo Nivel 2 con fallbacks (buscar en orden hasta encontrar uno)
    if (attr2Fallbacks && Array.isArray(attr2Fallbacks)) {
      for (const key of attr2Fallbacks) {
        if (attrs[key]) {
          parts.push(String(attrs[key]));
          break; // Usar el primero encontrado
        }
      }
    }
  } else {
    // Fallback para categorías sin config: usar marca
    if (product.category?.toLowerCase().includes('ganader')) {
      // Ganadería sin config específica: buscar raza legacy
      const raza = attrs.raza || attrs.breed || attrs.razabovinos;
      if (raza) parts.push(String(raza));
    } else {
      // Maquinarias y otros: Marca
      const marca = attrs.marca || product.brand;
      if (marca) parts.push(String(marca));
    }
  }
  
  return parts.join(' · ') || product.category || '';
};
