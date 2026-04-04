/**
 * Servicio de Batch Queries para Categorías
 * Trae toda la jerarquía en UNA SOLA consulta
 * Reducción: 4 requests → 1 request
 */

import { supabase } from './supabaseClient';
import { categoryCache, cacheKeys } from '../utils/categoryCache';

// =====================================================
// TIPOS
// =====================================================

export interface CategoryBundle {
  category: {
    id: string;
    name: string;
    display_name: string;
    slug: string;
  };
  subcategories: SubcategoryWithBrands[];
}

interface SubcategoryWithBrands {
  id: string;
  name: string;
  display_name: string;
  brands: BrandWithModels[];
}

interface BrandWithModels {
  id: string;
  name: string;
  display_name: string;
  models: Model[];
}

interface Model {
  id: string;
  name: string;
  display_name: string;
  specs?: any;
}

// =====================================================
// BATCH QUERY: Toda la jerarquía de una categoría
// =====================================================

export async function getCategoryBundle(categoryId: string): Promise<CategoryBundle | null> {
  // Intentar obtener del caché
  const cacheKey = cacheKeys.categoryBundle(categoryId);
  const cached = categoryCache.get<CategoryBundle>(cacheKey);
  
  if (cached) {
    if (import.meta.env.DEV) console.log(`✅ Bundle de ${categoryId} desde caché`);
    return cached;
  }

  if (import.meta.env.DEV) console.log(`🔍 Cargando bundle completo para ${categoryId}...`);

  try {
    // UNA SOLA QUERY que trae todo
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        display_name,
        slug,
        subcategories (
          id,
          name,
          display_name,
          slug,
          subcategory_brands (
            brand_id,
            brands (
              id,
              name,
              display_name,
              logo_url,
              models (
                id,
                name,
                display_name,
                specs
              )
            )
          )
        )
      `)
      .eq('id', categoryId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Transformar en estructura fácil de usar
    const bundle: CategoryBundle = {
      category: {
        id: data.id,
        name: data.name,
        display_name: data.display_name,
        slug: data.slug,
      },
      subcategories: (data.subcategories || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        display_name: sub.display_name,
        brands: (sub.subcategory_brands || [])
          .map((sb: any) => sb.brands)
          .filter(Boolean)
          .map((brand: any) => ({
            id: brand.id,
            name: brand.name,
            display_name: brand.display_name,
            models: (brand.models || []).map((model: any) => ({
              id: model.id,
              name: model.name,
              display_name: model.display_name,
              specs: model.specs,
            })),
          })),
      })),
    };

    // Guardar en caché por 30 minutos
    categoryCache.set(cacheKey, bundle, 1000 * 60 * 30);

    if (import.meta.env.DEV) console.log(`✅ Bundle cargado: ${bundle.subcategories.length} subcategorías`);
    return bundle;

  } catch (error) {
    console.error('❌ Error cargando bundle:', error);
    throw error;
  }
}

// =====================================================
// BATCH QUERY: Todas las categorías con sus subcategorías
// =====================================================

export async function getAllCategoriesBundle(): Promise<CategoryBundle[]> {
  const cacheKey = 'bundles:all';
  const cached = categoryCache.get<CategoryBundle[]>(cacheKey);
  
  if (cached) {
    if (import.meta.env.DEV) console.log('✅ Todos los bundles desde caché');
    return cached;
  }

  if (import.meta.env.DEV) console.log('🔍 Cargando todos los bundles...');

  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        display_name,
        slug,
        sort_order,
        subcategories (
          id,
          name,
          display_name,
          slug,
          sort_order,
          subcategory_brands (
            brand_id,
            brands (
              id,
              name,
              display_name,
              logo_url,
              models (
                id,
                name,
                display_name,
                specs
              )
            )
          )
        )
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    const bundles: CategoryBundle[] = (data || []).map((cat: any) => ({
      category: {
        id: cat.id,
        name: cat.name,
        display_name: cat.display_name,
        slug: cat.slug,
      },
      subcategories: (cat.subcategories || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        display_name: sub.display_name,
        brands: (sub.subcategory_brands || [])
          .map((sb: any) => sb.brands)
          .filter(Boolean)
          .map((brand: any) => ({
            id: brand.id,
            name: brand.name,
            display_name: brand.display_name,
            models: (brand.models || []).map((model: any) => ({
              id: model.id,
              name: model.name,
              display_name: model.display_name,
              specs: model.specs,
            })),
          })),
      })),
    }));

    // Guardar en caché por 30 minutos
    categoryCache.set(cacheKey, bundles, 1000 * 60 * 30);

    if (import.meta.env.DEV) console.log(`✅ ${bundles.length} bundles cargados`);
    return bundles;

  } catch (error) {
    console.error('❌ Error cargando bundles:', error);
    throw error;
  }
}

// =====================================================
// HELPERS para extraer datos del bundle
// =====================================================

export function extractSubcategoriesFromBundle(bundle: CategoryBundle) {
  return bundle.subcategories.map(sub => ({
    id: sub.id,
    name: sub.name,
    display_name: sub.display_name,
  }));
}

export function extractBrandsFromBundle(bundle: CategoryBundle, subcategoryId: string) {
  const subcategory = bundle.subcategories.find(sub => sub.id === subcategoryId);
  if (!subcategory) return [];
  
  return subcategory.brands.map(brand => ({
    id: brand.id,
    name: brand.name,
    display_name: brand.display_name,
  }));
}

export function extractModelsFromBundle(bundle: CategoryBundle, brandId: string) {
  for (const subcategory of bundle.subcategories) {
    const brand = subcategory.brands.find(b => b.id === brandId);
    if (brand) {
      return brand.models;
    }
  }
  return [];
}

// =====================================================
// BATCH QUERY: Solo subcategorías con marcas (sin modelos)
// Para casos donde no se necesitan todos los detalles
// =====================================================

export async function getCategoryWithBrands(categoryId: string) {
  const cacheKey = `category-brands:${categoryId}`;
  const cached = categoryCache.get(cacheKey);
  
  if (cached) return cached;

  const { data, error } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      display_name,
      subcategories (
        id,
        name,
        display_name,
        subcategory_brands (
          brands (
            id,
            name,
            display_name
          )
        )
      )
    `)
    .eq('id', categoryId)
    .eq('is_active', true)
    .single();

  if (error) throw error;

  categoryCache.set(cacheKey, data, 1000 * 60 * 20);
  return data;
}
