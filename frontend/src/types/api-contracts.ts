/**
 * API CONTRACTS - Backend Fastify
 * Contratos de datos oficiales entre Frontend ↔️ Backend
 * 
 * @version 1.0.0
 * @generated 2026-01-08
 * @backend backend-api (Fastify 5.2.0)
 */

// =====================================================
// COMMON TYPES
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// =====================================================
// CATEGORIES ENDPOINT
// =====================================================

/**
 * GET /api/config/categories
 * 
 * @description Obtiene todas las categorías con sus subcategorías anidadas
 * @cache 1 hour
 * @returns CategoriesResponse
 */
export interface CategoriesResponse {
  categories: Category[];
  timestamp: string; // ISO 8601
}

export interface Category {
  id: string; // UUID
  name: string;
  display_name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string; // UUID
  name: string;
  display_name: string;
  slug: string;
  category_id: string; // UUID
  sort_order: number;
  is_active: boolean;
  form_config?: {
    requires_brand: boolean;
    requires_model: boolean;
    requires_year: boolean;
    requires_condition: boolean;
  };
}

// =====================================================
// BRANDS ENDPOINT
// =====================================================

/**
 * GET /api/config/brands?subcategoryId={uuid}
 * 
 * @description Obtiene marcas, opcionalmente filtradas por subcategoría
 * @cache 1 hour
 * @param subcategoryId (opcional) UUID de subcategoría
 * @returns BrandsResponse
 */
export interface BrandsResponse {
  brands: Brand[];
  count: number;
}

export interface Brand {
  id: string; // UUID
  name: string;
  slug: string;
  logo_url: string | null;
  country: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

// =====================================================
// MODELS ENDPOINT
// =====================================================

/**
 * GET /api/config/models?brandId={uuid}
 * 
 * @description Obtiene modelos, opcionalmente filtrados por marca
 * @cache 1 hour
 * @param brandId (opcional) UUID de marca
 * @returns ModelsResponse
 */
export interface ModelsResponse {
  models: Model[];
  count: number;
}

export interface Model {
  id: string; // UUID
  brand_id: string; // UUID
  name: string;
  slug: string;
  year_from: number;
  year_to: number | null;
  is_current_production: boolean;
  specifications: Record<string, any>;
  features: string[];
  short_description: string;
  main_image_url: string | null;
  is_active: boolean;
}

// =====================================================
// FORM CONFIG ENDPOINT
// =====================================================

/**
 * GET /api/config/form/:subcategoryId
 * 
 * @description Obtiene configuración completa del formulario dinámico
 * @cache 1 hour
 * @param subcategoryId UUID de subcategoría (path param)
 * @returns FormConfigResponse
 */
export interface FormConfigResponse {
  attributes: Record<string, DynamicAttribute[]>;
  brands: Brand[];
  total_fields: number;
  required_fields: number;
  timestamp: string; // ISO 8601
}

export interface DynamicAttribute {
  id: string; // UUID
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea';
  field_group: string;
  field_options: string[];
  is_required: boolean;
  min_value: number | null;
  max_value: number | null;
  validation_regex: string | null;
  placeholder: string | null;
  help_text: string | null;
  prefix: string | null;
  suffix: string | null;
  sort_order: number;
}

// =====================================================
// ADS ENDPOINT
// =====================================================

/**
 * GET /api/ads?[filters]
 * 
 * @description Lista anuncios con filtros y paginación
 * @returns AdsListResponse
 */
export interface AdsListResponse {
  data: Ad[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface Ad {
  id: string; // UUID
  user_id: string; // UUID
  category_id: string; // UUID
  subcategory_id: string; // UUID
  brand_id: string | null; // UUID
  model_id: string | null; // UUID
  title: string;
  description: string;
  slug: string;
  short_id: string;
  price: number;
  currency: 'ARS' | 'USD';
  province: string;
  city: string | null;
  location: string | null;
  attributes: Record<string, any>;
  status: 'draft' | 'active' | 'inactive' | 'expired' | 'deleted';
  approval_status: 'pending' | 'approved' | 'rejected';
  is_premium: boolean;
  featured: boolean;
  images: AdImage[];
  contact_phone: string | null;
  contact_email: string | null;
  views: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  published_at: string | null; // ISO 8601
  expires_at: string | null; // ISO 8601
}

export interface AdImage {
  url: string;
  path: string;
}

/**
 * POST /api/ads
 * 
 * @description Crear nuevo anuncio
 * @returns Ad
 */
export interface CreateAdPayload {
  user_id: string; // UUID
  category_id: string; // UUID
  subcategory_id: string; // UUID
  brand_id?: string; // UUID
  model_id?: string; // UUID
  title: string;
  description: string;
  price: number;
  currency: 'ARS' | 'USD';
  province: string;
  city?: string;
  location?: string;
  attributes: Record<string, any>;
  images: AdImage[];
  contact_phone?: string;
  contact_email?: string;
  status?: 'draft' | 'active';
  approval_status?: 'pending' | 'approved';
}

// =====================================================
// UPLOADS ENDPOINT
// =====================================================

/**
 * POST /api/uploads/signed-url
 * 
 * @description Genera URL firmada de Cloudinary para upload directo
 * @returns SignedUrlResponse
 */
export interface SignedUrlRequest {
  folder?: string;
  public_id?: string;
}

export interface SignedUrlResponse {
  signature: string;
  timestamp: number;
  cloud_name: string;
  api_key: string;
  folder: string;
  upload_url: string;
}

// =====================================================
// ADMIN ENDPOINT
// =====================================================

/**
 * GET /api/admin/verify
 * 
 * @description Verifica token JWT y rol de superadmin
 * @headers Authorization: Bearer {token}
 * @returns AdminVerifyResponse
 */
export interface AdminVerifyResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  message?: string;
}

// =====================================================
// ERROR RESPONSES
// =====================================================

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  fields?: Record<string, string>;
}

// =====================================================
// QUERY FILTERS
// =====================================================

export interface AdFilters {
  category_id?: string;
  subcategory_id?: string;
  brand_id?: string;
  model_id?: string;
  province?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  currency?: 'ARS' | 'USD';
  status?: 'draft' | 'active' | 'inactive' | 'expired' | 'deleted';
  approval_status?: 'pending' | 'approved' | 'rejected';
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'price' | 'views' | 'featured_order';
  order_dir?: 'asc' | 'desc';
}
