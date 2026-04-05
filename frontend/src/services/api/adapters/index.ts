/**
 * API DATA ADAPTERS
 * Transformadores entre respuestas backend y tipos esperados por frontend
 * 
 * Patrón: Adapter Pattern
 * Propósito: Desacoplar contratos API de tipos internos del frontend
 */

import type {
  Brand as BackendBrand,
  Model as BackendModel,
  Category as BackendCategory,
  Subcategory as BackendSubcategory,
  DynamicAttribute as BackendDynamicAttribute,
} from '../../../types/api-contracts';
import type { Product } from '../../../../types';
import { normalizeImages, getFirstImage } from '../../../utils/imageHelpers';

import type {
  Brand as FrontendBrand,
  Model as FrontendModel,
  Category as FrontendCategory,
  Subcategory as FrontendSubcategory,
} from '../../../types/catalog';
import type { DynamicAttribute as FrontendDynamicAttribute } from '../../../types/api-contracts';

// =====================================================
// BRAND ADAPTER
// =====================================================

export function adaptBrand(backend: BackendBrand): FrontendBrand {
  return {
    id: backend.id,
    name: backend.name,
    display_name: backend.name, // Backend no tiene display_name separado
    slug: backend.slug,
    logo_url: backend.logo_url || undefined,
    website: undefined, // No viene del backend aún
    country: backend.country,
    is_active: backend.is_active,
    ml_aliases: [], // No viene del backend aún
    sort_order: backend.sort_order,
    created_at: new Date().toISOString(), // Fallback
    updated_at: new Date().toISOString(),
  };
}

export function adaptBrands(brands: BackendBrand[]): FrontendBrand[] {
  return brands.map(adaptBrand);
}

// =====================================================
// MODEL ADAPTER
// =====================================================

export function adaptModel(backend: BackendModel): FrontendModel {
  return {
    id: backend.id,
    brand_id: backend.brand_id,
    name: backend.name,
    display_name: backend.name, // Backend no tiene display_name separado
    slug: backend.slug,
    year_from: backend.year_from,
    year_to: backend.year_to || undefined,
    is_current_production: backend.is_current_production,
    specifications: backend.specifications,
    features: backend.features || [],
    typical_uses: [], // No viene del backend aún
    short_description: backend.short_description,
    full_description: undefined, // No viene del backend aún
    main_image_url: backend.main_image_url || undefined,
    gallery_images: [], // No viene del backend aún
    technical_drawing_url: undefined,
    brochure_url: undefined,
    manual_url: undefined,
    spec_sheet_url: undefined,
    price_range: undefined,
    related_models: [],
    ai_generated: false,
    ai_confidence: undefined,
    ai_source: undefined,
    verified: false,
    verified_by: undefined,
    verified_at: undefined,
    ml_aliases: [],
    sort_order: 0,
    is_active: backend.is_active,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function adaptModels(models: BackendModel[]): FrontendModel[] {
  return models.map(adaptModel);
}

// =====================================================
// CATEGORY ADAPTER
// =====================================================

export function adaptSubcategory(backend: BackendSubcategory): FrontendSubcategory {
  return {
    id: backend.id,
    category_id: backend.category_id,
    name: backend.name,
    display_name: backend.display_name,
    slug: backend.slug,
    icon: undefined,
    description: undefined,
    sort_order: backend.sort_order,
    is_active: backend.is_active,
    has_brands: backend.form_config?.requires_brand ?? true,
    has_models: backend.form_config?.requires_model ?? true,
    has_year: backend.form_config?.requires_year ?? true,
    has_condition: backend.form_config?.requires_condition ?? true,
    ml_keywords: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function adaptCategory(backend: BackendCategory): FrontendCategory {
  return {
    id: backend.id,
    name: backend.name,
    display_name: backend.display_name,
    slug: backend.slug,
    icon: backend.icon || undefined,
    description: undefined,
    sort_order: backend.sort_order,
    is_active: backend.is_active,
    ml_keywords: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function adaptCategoryWithSubcategories(
  backend: BackendCategory
): FrontendCategory & { subcategories: FrontendSubcategory[] } {
  return {
    ...adaptCategory(backend),
    subcategories: backend.subcategories.map(adaptSubcategory),
  };
}

// =====================================================
// DYNAMIC ATTRIBUTE ADAPTER
// =====================================================

export function adaptDynamicAttribute(
  backend: BackendDynamicAttribute
): FrontendDynamicAttribute {
  return {
    id: backend.id,
    slug: backend.field_name,
    name: backend.field_label,
    description: backend.help_text || undefined,
    inputType: backend.field_type,
    dataType: mapFieldTypeToDataType(backend.field_type),
    isRequired: backend.is_required,
    displayOrder: backend.sort_order,
    fieldGroup: backend.field_group,
    uiConfig: {
      placeholder: backend.placeholder,
      prefix: backend.prefix,
      suffix: backend.suffix,
    },
    validations: {
      min_value: backend.min_value,
      max_value: backend.max_value,
      regex: backend.validation_regex,
    },
    isFilterable: true, // Default
    isFeatured: false, // Default
    options: backend.field_options.map((value) => ({ value, label: value })),
  } as unknown as FrontendDynamicAttribute;
}

function mapFieldTypeToDataType(
  fieldType: string
): 'string' | 'number' | 'boolean' | 'array' | 'object' {
  switch (fieldType) {
    case 'number':
      return 'number';
    case 'multiselect':
      return 'array';
    case 'select':
    case 'text':
    case 'textarea':
    default:
      return 'string';
  }
}

// =====================================================
// AD ADAPTER (para Product UI) — CANÓNICO
// =====================================================

/**
 * Resuelve un join de Supabase que puede llegar como objeto, array o null.
 * Supabase JS v2 retorna FK joins como arrays en runtime aunque el esquema
 * diga que es uno solo. Usar siempre este helper para leer joins.
 */
export function resolveJoin<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

/**
 * Tipo para filas crudas de Supabase con joins opcionales.
 * Cubre los 3 orígenes de datos: DynamicHomeSections, useAdData, UserFeaturedAdsBar.
 */
export interface RawAdRow {
  id: string;
  title: string;
  slug?: string | null;
  short_id?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  price_unit?: string | null;
  location?: string | null;
  province?: string | null;
  city?: string | null;
  images?: any;
  category_id?: string | null;
  subcategory_id?: string | null;
  ad_type?: string | null;
  attributes?: Record<string, any> | null;
  user_id?: string | null;
  created_at?: string;
  featured_expires_at?: string;
  subcategory_l2?: string;
  // Supabase joins: pueden llegar como objeto o array
  categories?: { slug?: string; name?: string; icon?: string | null } | { slug?: string; name?: string; icon?: string | null }[] | null;
  subcategories?: { display_name?: string } | { display_name?: string }[] | null;
  users?: { avatar_url?: string | null } | { avatar_url?: string | null }[] | null;
}

/**
 * Transforma cualquier fila cruda de Supabase en el tipo Product del frontend.
 * Función canónica: único punto de transformación de datos de aviso.
 *
 * @param ad    Fila cruda de Supabase (con o sin joins)
 * @param overrides  Campos que sobreescriben el resultado (ej: isSponsored: true)
 */
export function adaptAdToProduct(ad: RawAdRow, overrides?: Partial<Product>): Product {
  const cats  = resolveJoin(ad.categories);
  const subs  = resolveJoin(ad.subcategories);
  const users = resolveJoin(ad.users);

  const imageUrl = getFirstImage(ad.images);
  const normalizedImages = normalizeImages(ad.images);
  const location = [ad.city, ad.province].filter(Boolean).join(', ') || ad.location || '';

  const base: Product = {
    id: ad.id,
    title: ad.title,
    slug: ad.slug ?? undefined,
    short_id: ad.short_id ?? undefined,
    description: ad.description ?? '',
    price: ad.price ?? undefined,
    currency: ad.currency || 'ARS',
    price_unit: ad.price_unit ?? undefined,
    location,
    province: ad.province ?? undefined,
    imageUrl,
    images: normalizedImages as Product['images'],
    sourceUrl: '',
    category: cats?.name || cats?.slug || '',
    category_id: ad.category_id ?? undefined,
    category_slug: cats?.slug ?? undefined,
    category_icon: cats?.icon ?? undefined,
    subcategory: subs?.display_name,
    subcategory_l2: ad.subcategory_l2 ?? subs?.display_name,
    isSponsored: false,
    ad_type: (ad.ad_type as Product['ad_type']) ?? undefined,
    attributes: ad.attributes ?? undefined,
    user_id: ad.user_id ?? undefined,
    user_avatar_url: users?.avatar_url ?? undefined,
    created_at: ad.created_at,
    createdAt: ad.created_at,
    featured_expires_at: ad.featured_expires_at,
  };

  return overrides ? { ...base, ...overrides } : base;
}

// =====================================================
// EXPORT ALL
// =====================================================

export const adapters = {
  brand: adaptBrand,
  brands: adaptBrands,
  model: adaptModel,
  models: adaptModels,
  category: adaptCategory,
  categoryWithSubcategories: adaptCategoryWithSubcategories,
  subcategory: adaptSubcategory,
  dynamicAttribute: adaptDynamicAttribute,
  adToProduct: adaptAdToProduct,
};
