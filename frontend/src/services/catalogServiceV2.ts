/**
 * CATALOG SERVICE V2 - Backend API Integration
 * Nueva capa de servicios que usa backend Fastify con fallback a Supabase
 * 
 * Arquitectura:
 * 1. Intenta usar backend Fastify (si VITE_USE_API_BACKEND=true)
 * 2. Fallback a Supabase directo si falla (si VITE_FALLBACK_TO_SUPABASE=true)
 * 3. Adapta respuestas al formato esperado por el frontend
 */

import { FEATURES, debugLog } from '../config/features';
import { catalogApi } from './api/catalog';
import { categoriesApi } from './api/categories';
import { adapters } from './api/adapters';

import type {
  CategoryWithSubcategories,
  Brand,
  Model,
} from '../types/catalog';

// =====================================================
// CATEGORIES
// =====================================================

/**
 * Obtener catálogo completo de categorías con subcategorías
 */
export async function getCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
  debugLog('CatalogServiceV2', 'getCategoriesWithSubcategories()');

  if (FEATURES.USE_API_BACKEND) {
    try {
      const response = await categoriesApi.getAll();
      return response.categories.map(adapters.categoryWithSubcategories);
    } catch (error) {
      console.error('[CatalogServiceV2] Backend failed:', error);
      
      if (FEATURES.FALLBACK_TO_SUPABASE) {
        console.warn('[CatalogServiceV2] Falling back to Supabase direct access');
        // TODO: Implementar fallback a Supabase
        throw new Error('Fallback to Supabase not implemented yet');
      }
      
      throw error;
    }
  }

  // Modo legacy: Supabase directo
  debugLog('CatalogServiceV2', 'Using legacy Supabase direct access');
  // TODO: Adaptar getDynamicCatalog para devolver CategoryWithSubcategories[]
  throw new Error('Legacy mode not adapted yet');
}

// =====================================================
// BRANDS
// =====================================================

/**
 * Obtener marcas por subcategoría
 */
export async function getBrandsBySubcategory(subcategoryId: string): Promise<Brand[]> {
  debugLog('CatalogServiceV2', `getBrandsBySubcategory(${subcategoryId})`);

  if (FEATURES.USE_API_BACKEND) {
    try {
      const backendBrands = await catalogApi.getBrandsBySubcategory(subcategoryId);
      return adapters.brands(backendBrands);
    } catch (error) {
      console.error('[CatalogServiceV2] Backend getBrands failed:', error);
      
      if (FEATURES.FALLBACK_TO_SUPABASE) {
        console.warn('[CatalogServiceV2] Falling back to Supabase for brands');
        // TODO: Implementar fallback
        throw new Error('Fallback to Supabase not implemented yet');
      }
      
      throw error;
    }
  }

  // Modo legacy
  debugLog('CatalogServiceV2', 'Using legacy Supabase for brands');
  throw new Error('Legacy mode not adapted yet');
}

/**
 * Obtener todas las marcas
 */
export async function getAllBrands(): Promise<Brand[]> {
  debugLog('CatalogServiceV2', 'getAllBrands()');

  if (FEATURES.USE_API_BACKEND) {
    try {
      // Sin filtro de subcategoría
      const backendBrands = await catalogApi.getBrandsBySubcategory('');
      return adapters.brands(backendBrands);
    } catch (error) {
      console.error('[CatalogServiceV2] Backend getAllBrands failed:', error);
      
      if (FEATURES.FALLBACK_TO_SUPABASE) {
        console.warn('[CatalogServiceV2] Falling back to Supabase for all brands');
        throw new Error('Fallback to Supabase not implemented yet');
      }
      
      throw error;
    }
  }

  throw new Error('Legacy mode not adapted yet');
}

// =====================================================
// MODELS
// =====================================================

/**
 * Obtener modelos por marca
 */
export async function getModelsByBrand(brandId: string): Promise<Model[]> {
  debugLog('CatalogServiceV2', `getModelsByBrand(${brandId})`);

  if (FEATURES.USE_API_BACKEND) {
    try {
      const backendModels = await catalogApi.getModelsByBrand(brandId);
      return adapters.models(backendModels);
    } catch (error) {
      console.error('[CatalogServiceV2] Backend getModels failed:', error);
      
      if (FEATURES.FALLBACK_TO_SUPABASE) {
        console.warn('[CatalogServiceV2] Falling back to Supabase for models');
        throw new Error('Fallback to Supabase not implemented yet');
      }
      
      throw error;
    }
  }

  throw new Error('Legacy mode not adapted yet');
}

// =====================================================
// FORM CONFIG
// =====================================================

/**
 * Obtener configuración de formulario dinámico
 */
export async function getFormConfig(subcategoryId: string): Promise<any> {
  debugLog('CatalogServiceV2', `getFormConfig(${subcategoryId})`);

  if (FEATURES.USE_API_BACKEND) {
    try {
      const response = await catalogApi.getFormConfig(subcategoryId);
      
      // Adaptar atributos dinámicos
      const adaptedAttributes: Record<string, any> = {};
      for (const [group, attrs] of Object.entries(response.attributes)) {
        adaptedAttributes[group] = attrs.map(adapters.dynamicAttribute);
      }
      
      return {
        attributes: adaptedAttributes,
        brands: adapters.brands(response.brands),
        total_fields: response.total_fields,
        required_fields: response.required_fields,
      };
    } catch (error) {
      console.error('[CatalogServiceV2] Backend getFormConfig failed:', error);
      
      if (FEATURES.FALLBACK_TO_SUPABASE) {
        console.warn('[CatalogServiceV2] Falling back to Supabase for form config');
        throw new Error('Fallback to Supabase not implemented yet');
      }
      
      throw error;
    }
  }

  throw new Error('Legacy mode not adapted yet');
}


// =====================================================
// EXPORTS
// =====================================================

export const catalogServiceV2 = {
  getCategoriesWithSubcategories,
  getBrandsBySubcategory,
  getAllBrands,
  getModelsByBrand,
  getFormConfig,
};
