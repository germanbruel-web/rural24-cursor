import { supabase } from './supabaseClient';
import { categoryCache, cacheKeys } from '../utils/categoryCache';
import { logger } from '../utils/logger';

// =====================================================
// CATALOG MASTER - NUEVO SISTEMA CON CACHÉ
// =====================================================

// ICONOS DE CATEGORÍAS (desde category_icons)
export interface CategoryIcon {
  id: string;
  name: string;
  url_light: string;
  url_dark: string | null;
}

export const getCategoryIcons = async (): Promise<CategoryIcon[]> => {
  const cacheKey = 'category_icons';
  const cached = categoryCache.get(cacheKey);
  
  if (cached) {
    logger.debug('[categoriesService] Iconos desde caché');
    return cached as any;
  }

  logger.debug('[categoriesService] Cargando iconos...');
  const { data, error } = await supabase
    .from('category_icons')
    .select('id, name, url_light, url_dark')
    .order('name');
  
  if (error) {
    logger.error('[categoriesService] Error cargando iconos:', error);
    return []; // No lanzar error, usar fallback
  }
  
  // Guardar en caché por 1 hora
  categoryCache.set(cacheKey, data, 1000 * 60 * 60);
  logger.debug('[categoriesService] Iconos cargados:', data?.length || 0);
  return data || [];
};

// CATEGORÍAS
export const getCategories = async () => {
  const cacheKey = cacheKeys.categories();
  const cached = categoryCache.get(cacheKey);
  
  if (cached) {
    logger.debug('[categoriesService] Categorías desde caché');
    return cached;
  }

  logger.debug('[categoriesService] Cargando categorías...');
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    logger.error('[categoriesService] Error cargando categorías:', error);
    throw error;
  }
  
  // Guardar en caché por 30 minutos
  categoryCache.set(cacheKey, data, 1000 * 60 * 30);
  logger.debug('[categoriesService] Categorías cargadas:', data?.length || 0);
  return data || [];
};

// SUBCATEGORÍAS
export const getSubcategories = async (categoryId: string) => {
  const cacheKey = cacheKeys.subcategories(categoryId);
  const cached = categoryCache.get(cacheKey);
  
  if (cached) {
    logger.debug('[categoriesService] Subcategorías desde caché');
    return cached;
  }

  logger.debug('[categoriesService] Cargando subcategorías para:', categoryId);
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) {
    logger.error('[categoriesService] Error cargando subcategorías:', error);
    throw error;
  }
  
  // Guardar en caché por 20 minutos
  categoryCache.set(cacheKey, data, 1000 * 60 * 20);
  logger.debug('[categoriesService] Subcategorías cargadas:', data?.length || 0);
  return data || [];
};

// =====================================================
// TIPOS DE CATEGORÍA (sub-subcategorías — 3er nivel)
// =====================================================

export const getCategoryTypes = async (subcategoryId: string) => {
  const { data, error } = await supabase
    .from('category_types')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .order('sort_order');

  if (error) {
    logger.error('[categoriesService] Error cargando tipos:', error);
    throw error;
  }
  return data || [];
};

export const createCategoryType = async (categoryType: {
  category_id: string;
  subcategory_id: string;
  name: string;
  display_name: string;
  description?: string;
  slug?: string;
  sort_order?: number;
  is_active?: boolean;
}) => {
  const { data, error } = await supabase
    .from('category_types')
    .insert(categoryType)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCategoryType = async (id: string, updates: Partial<{
  display_name: string;
  name: string;
  description: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}>) => {
  const { data, error } = await supabase
    .from('category_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCategoryType = async (id: string) => {
  const { error } = await supabase
    .from('category_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// MARCAS POR SUBCATEGORÍA
export const getBrandsBySubcategory = async (subcategoryId: string) => {
  const cacheKey = cacheKeys.brands(subcategoryId);
  const cached = categoryCache.get(cacheKey);
  
  if (cached) {
    logger.debug('[categoriesService] Marcas desde caché');
    return cached;
  }

  logger.debug('[categoriesService] Cargando marcas para subcategoría:', subcategoryId);
  
  try {
    // Intentar con subcategory_brands (tabla M2M)
    const { data: relations, error: relError } = await supabase
      .from('subcategory_brands')
      .select(`
        brand_id,
        brands (
          id,
          name,
          display_name,
          is_active
        )
      `)
      .eq('subcategory_id', subcategoryId);
    
    if (!relError && relations) {
      // Extraer brands de las relaciones
      const brands = relations.map((rel: any) => rel.brands).filter(Boolean);
      
      // Guardar en caché por 20 minutos
      categoryCache.set(cacheKey, brands, 1000 * 60 * 20);
      logger.debug('[categoriesService] Marcas M2M cargadas:', brands.length);
      return brands;
    }
    
    logger.warn('[categoriesService] subcategory_brands no disponible, fallback todas las marcas');
    
    // Fallback: cargar todas las marcas activas
    const { data: allBrands, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (brandError) {
      logger.error('[categoriesService] Error cargando marcas:', brandError);
      throw brandError;
    }
    
    const brands = allBrands || [];
    // Guardar en caché por 20 minutos
    categoryCache.set(cacheKey, brands, 1000 * 60 * 20);
    logger.debug('[categoriesService] Marcas cargadas (todas):', brands.length);
    return brands;
    
  } catch (error) {
    logger.error('[categoriesService] Error en getBrandsBySubcategory:', error);
    // Retornar array vacío en caso de error
    return [];
  }
};

// MODELOS POR MARCA
export const getModels = async (brandId: string) => {
  // Intentar obtener del caché
  const cacheKey = cacheKeys.models(brandId);
  const cached = categoryCache.get(cacheKey);
  
  if (cached) {
    logger.debug('[categoriesService] Modelos desde caché');
    return cached;
  }

  logger.debug('[categoriesService] Cargando modelos para marca:', brandId);
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('display_name');
  
  if (error) {
    logger.error('[categoriesService] Error cargando modelos:', error);
    throw error;
  }
  
  // Guardar en caché por 20 minutos
  categoryCache.set(cacheKey, data, 1000 * 60 * 20);
  logger.debug('[categoriesService] Modelos cargados:', data?.length || 0);
  return data || [];
};

// =====================================================
// FUNCIONES LEGACY (Sistema Viejo - Mantener por compatibilidad)
// =====================================================

export const getOperationTypes = async () => {
  const { data, error } = await supabase
    .from('operation_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) throw error;
  return data;
};

export const createOperationType = async (operationType: any) => {
  const { data, error } = await supabase
    .from('operation_types')
    .insert(operationType)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateOperationType = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('operation_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteOperationType = async (id: string) => {
  const { error } = await supabase
    .from('operation_types')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// =====================================================
// CATEGORÍAS PRINCIPALES - FUNCIÓN LEGACY ELIMINADA
// Usar la función getCategories() del sistema nuevo (línea ~10)
// =====================================================

export const createCategory = async (category: any) => {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// =====================================================
// SUBCATEGORÍAS
// =====================================================

// SUBCATEGORÍAS - FUNCIÓN LEGACY ELIMINADA
// Usar la función getSubcategories(categoryId) del sistema nuevo (línea ~25)

export const createSubcategory = async (subcategory: any) => {
  const { data, error } = await supabase
    .from('subcategories')
    .insert(subcategory)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSubcategory = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('subcategories')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data?.[0];
};

export const deleteSubcategory = async (id: string) => {
  const { error } = await supabase
    .from('subcategories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// =====================================================
// CATEGORÍAS PRINCIPALES DE SERVICIOS
// =====================================================

export const getServiceMainCategories = async (categoryId?: string) => {
  let query = supabase
    .from('service_main_categories')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('is_active', true)
    .order('sort_order');
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createServiceMainCategory = async (category: any) => {
  const { data, error } = await supabase
    .from('service_main_categories')
    .insert(category)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateServiceMainCategory = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('service_main_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteServiceMainCategory = async (id: string) => {
  const { error } = await supabase
    .from('service_main_categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// =====================================================
// SUBCATEGORÍAS DE SERVICIOS
// =====================================================

export const getServiceSubcategories = async (serviceMainCategoryId?: string) => {
  let query = supabase
    .from('service_subcategories')
    .select(`
      *,
      service_main_category:service_main_categories(*)
    `)
    .eq('is_active', true)
    .order('sort_order');
  
  if (serviceMainCategoryId) {
    query = query.eq('service_main_category_id', serviceMainCategoryId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createServiceSubcategory = async (subcategory: any) => {
  const { data, error } = await supabase
    .from('service_subcategories')
    .insert(subcategory)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateServiceSubcategory = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('service_subcategories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteServiceSubcategory = async (id: string) => {
  const { error } = await supabase
    .from('service_subcategories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// =====================================================
// MARCAS
// =====================================================

export const getBrands = async () => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) throw error;
  return data;
};

// getBrandsBySubcategory está definida arriba con caché (línea 68)

export const createBrand = async (brand: any) => {
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateBrand = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteBrand = async (id: string) => {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Asignar marca a subcategoría
export const assignBrandToSubcategory = async (subcategoryId: string, brandId: string, sortOrder: number = 0) => {
  const { data, error } = await supabase
    .from('subcategory_brands')
    .insert({ subcategory_id: subcategoryId, brand_id: brandId, sort_order: sortOrder })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Desasignar marca de subcategoría
export const removeBrandFromSubcategory = async (subcategoryId: string, brandId: string) => {
  const { error } = await supabase
    .from('subcategory_brands')
    .delete()
    .eq('subcategory_id', subcategoryId)
    .eq('brand_id', brandId);
  
  if (error) throw error;
};

// =====================================================
// MODELOS
// =====================================================

// getModels está definida arriba con caché (línea 109)

export const createModel = async (model: any) => {
  const { data, error } = await supabase
    .from('models')
    .insert(model)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateModel = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('models')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteModel = async (id: string) => {
  const { error } = await supabase
    .from('models')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

// Obtener toda la jerarquía de categorías
export const getCategoryHierarchy = async () => {
  const { data, error } = await supabase
    .from('operation_types')
    .select(`
      *,
      categories:categories(
        *,
        subcategories:subcategories(*),
        service_main_categories:service_main_categories(
          *,
          service_subcategories:service_subcategories(*)
        )
      )
    `)
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) throw error;
  return data;
};

// Helper functions for form integration
export const getCategoriesForForm = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, display_name')
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) throw error;
  
  // Eliminar duplicados por display_name
  const uniqueCategories = Array.from(
    new Map(data.map(cat => [cat.display_name, cat])).values()
  );
  
  return uniqueCategories.map(cat => cat.display_name);
};

export const getSubcategoriesForForm = async (categoryName: string) => {
  // First get the category by display_name
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id')
    .eq('display_name', categoryName)
    .eq('is_active', true)
    .single();
  
  if (catError || !categories) return [];
  
  // Then get subcategories
  const { data, error } = await supabase
    .from('subcategories')
    .select('id, name, display_name')
    .eq('category_id', categories.id)
    .eq('is_active', true)
    .order('sort_order');
  
  if (error) return [];
  
  // Eliminar duplicados por display_name
  const uniqueSubs = Array.from(
    new Map(data.map(sub => [sub.display_name, sub])).values()
  );
  
  return uniqueSubs.map(sub => sub.display_name);
};

export const getBrandsForForm = async (subcategoryName?: string) => {
  if (!subcategoryName) {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, display_name')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) return [];
    
    // Eliminar duplicados por display_name
    const uniqueBrands = Array.from(
      new Map(data.map(brand => [brand.display_name, brand])).values()
    );
    
    return uniqueBrands.map(brand => brand.display_name);
  }
  
  // Get brands for specific subcategory
  const { data: subcategories, error: subError } = await supabase
    .from('subcategories')
    .select('id')
    .eq('display_name', subcategoryName)
    .eq('is_active', true)
    .single();
  
  if (subError || !subcategories) return [];
  
  const brands = await getBrandsBySubcategory(subcategories.id) as any[];
  return brands.map(brand => brand.display_name);
};

export const getModelsForForm = async (brandName: string) => {
  // Get brand by display_name
  const { data: brands, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('display_name', brandName)
    .eq('is_active', true)
    .single();
  
  if (brandError || !brands) return [];
  
  const models = await getModels(brands.id) as any[];
  return models.map(model => model.display_name);
};
