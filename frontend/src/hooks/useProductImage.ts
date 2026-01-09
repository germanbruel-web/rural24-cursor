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
 * Obtiene el label del producto con taxonomía de 3 niveles
 * Taxonomía por categoría:
 * - Maquinarias: Tipo de Categoría · Marca · Modelo
 * - Ganadería: Tipo de Ganadería · Raza · Edad
 * - Otros: Subcategoría · Marca · Modelo
 */
export const getProductLabel = (product: Product): string => {
  const parts: string[] = [];
  const attrs = product.attributes || {};
  
  // MAQUINARIAS: Tipo · Marca · Modelo
  if (product.category?.toLowerCase().includes('maquinaria')) {
    // 1. Tipo de Categoría (subcategory o tipotractor)
    const tipoCat = attrs.tipotractor || attrs.tipo_maquinaria || product.subcategory;
    if (tipoCat) parts.push(String(tipoCat));
    
    // 2. Marca
    const marca = attrs.marca || product.brand;
    if (marca) parts.push(String(marca));
    
    // 3. Modelo
    const modelo = attrs.modelo || product.model;
    if (modelo) parts.push(String(modelo));
  }
  // GANADERÍA: Tipo · Raza · Edad
  else if (product.category?.toLowerCase().includes('ganader')) {
    // 1. Tipo de Ganadería (subcategory o tipo_ganado)
    const tipoGanado = attrs.tipo_ganado || product.subcategory;
    if (tipoGanado) parts.push(String(tipoGanado));
    
    // 2. Raza
    const raza = attrs.raza || attrs.breed;
    if (raza) parts.push(String(raza));
    
    // 3. Edad
    const edad = attrs.edad || attrs.age;
    if (edad) parts.push(String(edad));
  }
  // OTROS (fallback genérico): Subcategoría · Marca · Modelo
  else {
    if (product.subcategory) parts.push(product.subcategory);
    if (product.brand) parts.push(product.brand);
    if (product.model) parts.push(product.model);
  }
  
  return parts.join(' · ') || product.category || '';
};
