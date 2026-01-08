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
  Ad as BackendAd,
} from '../../../types/api-contracts';

import type {
  Brand as FrontendBrand,
  Model as FrontendModel,
  Category as FrontendCategory,
  Subcategory as FrontendSubcategory,
  DynamicAttribute as FrontendDynamicAttribute,
} from '../../../types/catalog';

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
  };
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
// AD ADAPTER (para Product UI)
// =====================================================

export function adaptAdToProduct(ad: BackendAd): any {
  // Extraer primera imagen
  const imageUrl = ad.images?.[0]?.url || 'https://via.placeholder.com/400x300';
  const imageUrls = ad.images?.map((img) => img.url) || [];

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    currency: ad.currency,
    location: ad.location || ad.province || 'Sin ubicación',
    province: ad.province,
    imageUrl,
    imageUrls,
    sourceUrl: `/ad/${ad.id}`,
    category: ad.category_id, // TODO: Resolver nombre si viene populated
    subcategory: ad.subcategory_id,
    isSponsored: false,
    isPremium: ad.is_premium || false,
    featured: ad.featured,
    tags: [],
    createdAt: ad.created_at,
    updatedAt: ad.updated_at,
    attributes: ad.attributes || {},
    brand: ad.brand_id,
    model: ad.model_id,
    user_id: ad.user_id,
    seller: undefined, // No viene del backend actual
  };
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
