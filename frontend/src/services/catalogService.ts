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

// ====================================================================
// NUEVO: Sistema dinámico de atributos (Fase 1)
// ====================================================================

export interface AttributeOption {
  value: string;
  label: string;
}

export interface DynamicAttribute {
  id: string;
  slug: string;
  name: string;
  description?: string;
  inputType: string;
  dataType: string;
  isRequired: boolean;
  displayOrder: number;
  fieldGroup: string;
  uiConfig: Record<string, any>;
  validations: Record<string, any>;
  isFilterable: boolean;
  isFeatured: boolean;
  options: AttributeOption[];
}

export interface DynamicSubcategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  attributes: DynamicAttribute[];
}

export interface DynamicCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  subcategories: DynamicSubcategory[];
}

export interface DynamicCatalog {
  version: string;
  generatedAt: string;
  categories: DynamicCategory[];
}

/**
 * NUEVO: Obtener catálogo dinámico completo
 */
export async function getDynamicCatalog(): Promise<DynamicCatalog> {
  try {
    // Query 1: Categories with subcategories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select(`
        id,
        slug,
        name,
        description,
        icon,
        display_order,
        subcategories (
          id,
          slug,
          name,
          description,
          icon,
          display_order
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (catError) throw catError;

    // Query 2: Attributes with assignments
    const { data: attributesData, error: attrError } = await supabase
      .from('subcategory_attributes')
      .select(`
        subcategory_id,
        is_required,
        display_order,
        field_group,
        attributes (
          id,
          slug,
          name,
          description,
          input_type,
          data_type,
          ui_config,
          validations,
          is_filterable,
          is_featured
        )
      `)
      .order('display_order', { ascending: true });

    if (attrError) throw attrError;

    // Query 3: Attribute options
    const { data: optionsData, error: optError } = await supabase
      .from('attribute_options')
      .select('attribute_id, value, label, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (optError) throw optError;

    // Group options by attribute_id
    const optionsByAttribute: Record<string, AttributeOption[]> = {};
    optionsData?.forEach((opt) => {
      if (!optionsByAttribute[opt.attribute_id]) {
        optionsByAttribute[opt.attribute_id] = [];
      }
      optionsByAttribute[opt.attribute_id].push({
        value: opt.value,
        label: opt.label,
      });
    });

    // Group attributes by subcategory_id
    const attributesBySubcategory: Record<string, DynamicAttribute[]> = {};
    attributesData?.forEach((item) => {
      if (!attributesBySubcategory[item.subcategory_id]) {
        attributesBySubcategory[item.subcategory_id] = [];
      }

      const attr = item.attributes;
      attributesBySubcategory[item.subcategory_id].push({
        id: attr.id,
        slug: attr.slug,
        name: attr.name,
        description: attr.description,
        inputType: attr.input_type,
        dataType: attr.data_type,
        isRequired: item.is_required,
        displayOrder: item.display_order,
        fieldGroup: item.field_group,
        uiConfig: attr.ui_config || {},
        validations: attr.validations || {},
        isFilterable: attr.is_filterable,
        isFeatured: attr.is_featured,
        options: optionsByAttribute[attr.id] || [],
      });
    });

    // Build catalog
    const catalog: DynamicCatalog = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      categories: (categories || []).map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        subcategories: (cat.subcategories || [])
          .sort((a, b) => a.display_order - b.display_order)
          .map((sub) => ({
            id: sub.id,
            slug: sub.slug,
            name: sub.name,
            description: sub.description,
            icon: sub.icon,
            attributes: (attributesBySubcategory[sub.id] || []).sort(
              (a, b) => a.displayOrder - b.displayOrder
            ),
          })),
      })),
    };

    return catalog;
  } catch (error) {
    console.error('Error fetching dynamic catalog:', error);
    throw error;
  }
}

/**
 * NUEVO: Obtener atributos de una subcategoría específica
 */
export async function getSubcategoryAttributes(
  categorySlug: string,
  subcategorySlug: string
): Promise<DynamicAttribute[]> {
  const catalog = await getDynamicCatalog();
  
  const category = catalog.categories.find((c) => c.slug === categorySlug);
  if (!category) throw new Error(`Category ${categorySlug} not found`);

  const subcategory = category.subcategories.find((s) => s.slug === subcategorySlug);
  if (!subcategory) throw new Error(`Subcategory ${subcategorySlug} not found`);

  return subcategory.attributes;
}

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
    .filter(Boolean) as Brand[];

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
    .filter(Boolean) as Brand[];
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
