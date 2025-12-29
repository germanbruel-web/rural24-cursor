// ============================================================================
// TYPES V2: Arquitectura de Formularios Dinámicos
// ============================================================================

// ============================================================================
// CATEGORÍAS & TAXONOMÍA
// ============================================================================

export interface Category {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CategoryType {
  id: string;
  category_id: string;
  subcategory_id?: string;
  name: string;
  display_name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// DATOS PRECARGADOS
// ============================================================================

export interface BrandV2 {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  category_id?: string;
  logo_url?: string;
  website_url?: string;
  country?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ModelV2 {
  id: string;
  brand_id: string;
  name: string;
  display_name: string;
  slug: string;
  category_type_id?: string;
  year_from?: number;
  year_to?: number;
  specifications?: {
    hp?: number;
    cylinders?: number;
    displacement?: string;
    [key: string]: any;
  };
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  // Relaciones
  brand?: BrandV2;
}

export interface FeatureV2 {
  id: string;
  name: string;
  display_name: string;
  category_id?: string;
  feature_type: 'checkbox' | 'select' | 'range' | 'text';
  options?: Array<{
    value: string;
    label: string;
  }>;
  icon?: string;
  help_text?: string;
  placeholder?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// FORMULARIOS DINÁMICOS
// ============================================================================

export interface FormSection {
  id: string;
  label: string;
  order: number;
  icon?: string;
}

export interface FormTemplateV2 {
  id: string;
  name: string;
  display_name: string;
  category_id: string;
  subcategory_id?: string;
  category_type_id?: string;
  sections: FormSection[];
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface FormFieldV2 {
  id: string;
  form_template_id: string;
  field_name: string;
  field_label: string;
  section_id?: string;
  field_type: 'text' | 'number' | 'select' | 'autocomplete' | 'textarea' | 'checkbox' | 'features' | 'tags' | 'range';
  field_width: 'full' | 'half' | 'third';
  data_source?: 'brands' | 'models' | 'features' | 'custom';
  data_source_config?: {
    category?: string;
    depends_on?: string;
    filter?: Record<string, any>;
    [key: string]: any;
  };
  is_required: boolean;
  validation_rules?: {
    min?: number;
    max?: number;
    pattern?: string;
    [key: string]: any;
  };
  placeholder?: string;
  help_text?: string;
  icon?: string;
  display_order: number;
  metadata?: Record<string, any>;
  created_at: string;
  // Opciones estáticas
  options?: Array<{
    value: string;
    label: string;
  }>;
}

export interface FormFieldOptionV2 {
  id: string;
  field_id: string;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active: boolean;
  metadata?: Record<string, any>;
}

export interface CompleteFormV2 {
  form_id: string;
  form_name: string;
  form_display_name: string;
  sections: FormSection[];
  fields: FormFieldV2[];
}

// ============================================================================
// AVISOS V2
// ============================================================================

export interface AdV2 {
  id: string;
  user_id?: string;
  category_id: string;
  subcategory_id?: string;
  category_type_id?: string;
  title: string;
  description: string;
  price?: number;
  currency: 'ARS' | 'USD';
  province?: string;
  city?: string;
  location_detail?: string;
  brand_id?: string;
  model_id?: string;
  year?: number;
  metadata: Record<string, any>;
  images: string[];
  status: 'draft' | 'pending' | 'active' | 'sold' | 'expired' | 'deleted';
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
  // Relaciones
  category?: Category;
  subcategory?: Subcategory;
  category_type?: CategoryType;
  brand?: BrandV2;
  model?: ModelV2;
  features?: FeatureValueV2[];
}

export interface FeatureValueV2 {
  ad_id: string;
  feature_id: string;
  value: string;
  // Relación
  feature?: FeatureV2;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateBrandDTO {
  name: string;
  display_name: string;
  slug: string;
  category_id?: string;
  logo_url?: string;
  website_url?: string;
  country?: string;
  metadata?: Record<string, any>;
}

export interface UpdateBrandDTO {
  display_name?: string;
  slug?: string;
  logo_url?: string;
  website_url?: string;
  country?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateModelDTO {
  brand_id: string;
  name: string;
  display_name: string;
  slug: string;
  category_type_id?: string;
  year_from?: number;
  year_to?: number;
  specifications?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateModelDTO {
  display_name?: string;
  slug?: string;
  category_type_id?: string;
  year_from?: number;
  year_to?: number;
  specifications?: Record<string, any>;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateAdV2DTO {
  category_id: string;
  subcategory_id?: string;
  category_type_id?: string;
  title: string;
  description: string;
  price?: number;
  currency?: 'ARS' | 'USD';
  province?: string;
  city?: string;
  location_detail?: string;
  brand_id?: string;
  model_id?: string;
  year?: number;
  metadata?: Record<string, any>;
  images?: string[];
  features?: Array<{
    feature_id: string;
    value: string;
  }>;
}

// ============================================================================
// FILTROS & BÚSQUEDA
// ============================================================================

export interface BrandFilters {
  category_id?: string;
  search?: string;
  is_active?: boolean;
  country?: string;
}

export interface ModelFilters {
  brand_id?: string;
  category_type_id?: string;
  search?: string;
  is_active?: boolean;
  year_from?: number;
  year_to?: number;
}

export interface AdV2Filters {
  category_id?: string;
  subcategory_id?: string;
  category_type_id?: string;
  brand_id?: string;
  model_id?: string;
  province?: string;
  city?: string;
  price_min?: number;
  price_max?: number;
  year_min?: number;
  year_max?: number;
  status?: AdV2['status'];
  search?: string;
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
