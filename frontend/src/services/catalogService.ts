import { supabase } from './supabaseClient';
import type {
  Category,
  Subcategory,
  Brand,
  Model,
  CategoryWithSubcategories,
  SubcategoryWithBrands,
  BrandWithModels
} from '../types/catalog';

// =====================================================
// CATEGORÍAS
// =====================================================

/**
 * Obtener todas las categorías activas
 */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

/**
 * Obtener categoría con sus subcategorías
 */
export async function getCategoryWithSubcategories(
  categoryId: string
): Promise<CategoryWithSubcategories | null> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories (*)
    `)
    .eq('id', categoryId)
    .eq('is_active', true)
    .eq('subcategories.is_active', true)
    .order('subcategories.sort_order')
    .single();

  if (error) throw error;
  return data as CategoryWithSubcategories | null;
}

// =====================================================
// SUBCATEGORÍAS
// =====================================================

/**
 * Obtener subcategorías de una categoría
 */
export async function getSubcategories(categoryId: string): Promise<Subcategory[]> {
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

/**
 * Obtener subcategoría con sus marcas disponibles
 */
export async function getSubcategoryWithBrands(
  subcategoryId: string
): Promise<SubcategoryWithBrands | null> {
  // Primero obtener la subcategoría
  const { data: subcategory, error: subError } = await supabase
    .from('subcategories')
    .select('*')
    .eq('id', subcategoryId)
    .eq('is_active', true)
    .single();

  if (subError) throw subError;
  if (!subcategory) return null;

  // Si no tiene marcas, devolver sin brands
  if (!subcategory.has_brands) {
    return { ...subcategory, brands: [] };
  }

  // Obtener marcas vinculadas a esta subcategoría
  const { data: relations, error: relError } = await supabase
    .from('subcategory_brands')
    .select(`
      sort_order,
      brands (*)
    `)
    .eq('subcategory_id', subcategoryId)
    .order('sort_order');

  if (relError) throw relError;

  const brands = (relations || [])
    .map(r => r.brands)
    .filter(Boolean) as unknown as Brand[];

  return { ...subcategory, brands };
}

// =====================================================
// MARCAS
// =====================================================

/**
 * Obtener todas las marcas activas
 */
export async function getBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return data || [];
}

/**
 * Obtener marcas de una subcategoría específica
 */
export async function getBrandsBySubcategory(subcategoryId: string): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('subcategory_brands')
    .select(`
      sort_order,
      brands (*)
    `)
    .eq('subcategory_id', subcategoryId)
    .order('sort_order');

  if (error) throw error;

  return (data || [])
    .map(r => r.brands)
    .filter(Boolean) as unknown as Brand[];
}

/**
 * Obtener marca con sus modelos
 */
export async function getBrandWithModels(brandId: string): Promise<BrandWithModels | null> {
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .eq('is_active', true)
    .single();

  if (brandError) throw brandError;
  if (!brand) return null;

  // Obtener modelos de esta marca
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('display_name');

  if (modelsError) throw modelsError;

  return { ...brand, models: models || [] };
}

// =====================================================
// MODELOS
// =====================================================

/**
 * Obtener modelos de una marca
 */
export async function getModelsByBrand(brandId: string): Promise<Model[]> {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return data || [];
}

/**
 * Obtener modelo por ID con información completa
 */
export async function getModelById(modelId: string): Promise<Model | null> {
  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      brands (*)
    `)
    .eq('id', modelId)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data as Model | null;
}

/**
 * Buscar modelos por texto (nombre, marca, especificaciones)
 */
export async function searchModels(query: string): Promise<Model[]> {
  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      brands (display_name)
    `)
    .eq('is_active', true)
    .or(`display_name.ilike.%${query}%,name.ilike.%${query}%`)
    .order('display_name')
    .limit(20);

  if (error) throw error;
  return data || [];
}

// =====================================================
// FLUJO COMPLETO PARA FORMULARIOS
// =====================================================

/**
 * Obtener el árbol completo: Categorías → Subcategorías → Marcas
 * Útil para poblar selectores en cascada
 */
export async function getCatalogTree(): Promise<CategoryWithSubcategories[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories (*)
    `)
    .eq('is_active', true)
    .eq('subcategories.is_active', true)
    .order('sort_order')
    .order('subcategories.sort_order');

  if (error) throw error;
  return data as CategoryWithSubcategories[] || [];
}

/**
 * Validar si una combinación categoría-subcategoría-marca es válida
 */
export async function validateCatalogSelection(
  categoryId: string,
  subcategoryId: string,
  brandId?: string
): Promise<boolean> {
  // Validar que la subcategoría pertenece a la categoría
  const { data: subcategory, error: subError } = await supabase
    .from('subcategories')
    .select('id')
    .eq('id', subcategoryId)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .single();

  if (subError || !subcategory) return false;

  // Si hay marca, validar que está vinculada a la subcategoría
  if (brandId) {
    const { data: relation, error: relError } = await supabase
      .from('subcategory_brands')
      .select('id')
      .eq('subcategory_id', subcategoryId)
      .eq('brand_id', brandId)
      .single();

    if (relError || !relation) return false;
  }

  return true;
}

// =====================================================
// MAQUINARIAS - Tablas independientes por categoría
// =====================================================

export async function getMaquinariasSubcategories() {
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'maquinarias')
    .single();

  if (categoryError || !categoryData) return [];

  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryData.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMaquinariasBrands() {
  const { data, error } = await supabase
    .from('maquinarias_marcas')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return data || [];
}

export async function getMaquinariasBrandsBySubcategory(subcategoryId: string) {
  const { data, error } = await supabase
    .from('maquinarias_modelos')
    .select(`
      marca_id,
      maquinarias_marcas!inner (
        id,
        name,
        display_name,
        is_active
      )
    `)
    .eq('subcategoria_id', subcategoryId)
    .eq('is_active', true)
    .eq('maquinarias_marcas.is_active', true);

  if (error) throw error;

  type ItemWithBrand = { maquinarias_marcas: { id: string; display_name: string } | null };
  const uniqueBrands = new Map();
  data?.forEach(item => {
    const brand = (item as unknown as ItemWithBrand).maquinarias_marcas;
    if (brand && !uniqueBrands.has(brand.id)) {
      uniqueBrands.set(brand.id, brand);
    }
  });

  return Array.from(uniqueBrands.values()).sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  );
}

export async function getMaquinariasModels(brandId: string, subcategoryId?: string) {
  let query = supabase
    .from('maquinarias_modelos')
    .select('*')
    .eq('marca_id', brandId)
    .eq('is_active', true);

  if (subcategoryId) {
    query = query.eq('subcategoria_id', subcategoryId);
  }

  const { data, error } = await query.order('display_name');
  if (error) throw error;
  return data || [];
}

// =====================================================
// GANADERÍA - Usa sistema unificado
// =====================================================

export async function getGanaderiaSubcategories() {
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'ganaderia')
    .single();

  if (categoryError || !categoryData) return [];

  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryData.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getGanaderiaRazas(subcategoryId: string) {
  const { data, error } = await supabase
    .from('category_types')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

// =====================================================
// INSUMOS - Usa sistema unificado
// =====================================================

export async function getInsumosSubcategories() {
  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'insumos')
    .single();

  if (categoryError || !categoryData) return [];

  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .eq('category_id', categoryData.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getInsumosBrands() {
  const { data, error } = await supabase
    .from('insumos_marcas')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return data || [];
}

// =====================================================
// LEGACY HELPERS
// =====================================================

export async function getAllModels() {
  const { data, error } = await supabase
    .from('models')
    .select('*')
    .eq('is_active', true)
    .order('display_name');

  if (error) throw error;
  return data || [];
}
