import { z } from 'zod';
import { validateNoContactInfo } from '@/domain/shared/content-validator';

// Custom refinement para validar contenido sin contactos
const noContactInfoRefinement = (field: string) => 
  z.string().refine(
    (val) => validateNoContactInfo(val, field).isValid,
    (val) => {
      const result = validateNoContactInfo(val, field);
      return { message: result.reason || 'Contenido no permitido' };
    }
  );

// Schema for FormConfig
export const FormConfigSchema = z.object({
  requires_brand: z.boolean(),
  requires_model: z.boolean(),
  requires_year: z.boolean(),
  requires_condition: z.boolean(),
});

// Schema for Subcategory
export const SubcategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  display_name: z.string(),
  slug: z.string(),
  category_id: z.string().uuid(),
  sort_order: z.number(),
  is_active: z.boolean(),
  form_config: FormConfigSchema,
});

// Schema for Category
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  display_name: z.string(),
  slug: z.string(),
  icon: z.string().nullable(),
  sort_order: z.number(),
  is_active: z.boolean(),
  subcategories: z.array(SubcategorySchema),
});

// Schema for Categories Response
export const CategoriesResponseSchema = z.object({
  categories: z.array(CategorySchema),
  timestamp: z.string(),
});

export type FormConfigDTO = z.infer<typeof FormConfigSchema>;
export type SubcategoryDTO = z.infer<typeof SubcategorySchema>;
export type CategoryDTO = z.infer<typeof CategorySchema>;
export type CategoriesResponseDTO = z.infer<typeof CategoriesResponseSchema>;

// ========================================
// ADS SCHEMAS
// ========================================

// Schema for AdImage
export const AdImageSchema = z.object({
  url: z.string().url(),
  path: z.string(),
});

// Schema for creating an ad
export const AdCreateSchema = z.object({
  user_id: z.string().uuid(),
  category_id: z.string().uuid(),
  subcategory_id: z.string().uuid(),
  brand_id: z.string().uuid().optional().nullable(),
  model_id: z.string().uuid().optional().nullable(),
  
  // Contenido sin validación anti-fraude (desactivada)
  title: z.string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(200),
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres'),
  
  // Precio y ubicación
  price: z.number().nonnegative('El precio no puede ser negativo').optional().nullable(),
  currency: z.enum(['ARS', 'USD']),
  province: z.string().min(1),
  city: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  
  // Atributos dinámicos (validados en el service)
  attributes: z.record(z.any()),
  
  // Imágenes
  images: z.array(AdImageSchema).min(1, 'Debe incluir al menos una imagen').optional(),
  
  // Contacto
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email('Email inválido').optional().nullable(),
  
  // Estado inicial
  status: z.enum(['draft', 'active']).optional(),
  approval_status: z.enum(['pending', 'approved']).optional(),
});

// Schema for updating an ad
export const AdUpdateSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  description: z.string().min(50).optional(),
  price: z.number().positive().optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  province: z.string().min(1).optional(),
  city: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  attributes: z.record(z.any()).optional(),
  images: z.array(AdImageSchema).optional(),
  contact_phone: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
});

// Schema for ad filters (query params)
export const AdFiltersSchema = z.object({
  category_id: z.string().uuid().optional(),
  subcategory_id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional(),
  model_id: z.string().uuid().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  min_price: z.string().transform(Number).optional(),
  max_price: z.string().transform(Number).optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  status: z.string().optional(),
  approval_status: z.string().optional(),
  featured: z.string().transform((val) => val === 'true').optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  order_by: z.enum(['created_at', 'price', 'views', 'featured_order']).optional(),
  order_dir: z.enum(['asc', 'desc']).optional(),
});

export type AdImageDTO = z.infer<typeof AdImageSchema>;
export type AdCreateDTO = z.infer<typeof AdCreateSchema>;
export type AdUpdateDTO = z.infer<typeof AdUpdateSchema>;
export type AdFiltersDTO = z.infer<typeof AdFiltersSchema>;

// ========================================
// CATALOG SCHEMAS (Brands & Models)
// ========================================

export const BrandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logo_url: z.string().url().nullable(),
  country: z.string().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number(),
});

export const ModelSchema = z.object({
  id: z.string().uuid(),
  brand_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  year_from: z.number().nullable(),
  year_to: z.number().nullable(),
  is_current_production: z.boolean(),
  specifications: z.record(z.any()),
  features: z.array(z.string()),
  short_description: z.string().nullable(),
  main_image_url: z.string().url().nullable(),
  is_active: z.boolean(),
});

export const BrandsResponseSchema = z.object({
  brands: z.array(BrandSchema),
  timestamp: z.string(),
});

export const ModelsResponseSchema = z.object({
  models: z.array(ModelSchema),
  timestamp: z.string(),
});

export type BrandDTO = z.infer<typeof BrandSchema>;
export type ModelDTO = z.infer<typeof ModelSchema>;
export type BrandsResponseDTO = z.infer<typeof BrandsResponseSchema>;
export type ModelsResponseDTO = z.infer<typeof ModelsResponseSchema>;

// ========================================
// FORM CONFIG SCHEMAS
// ========================================

export const DynamicAttributeSchema = z.object({
  id: z.string().uuid(),
  field_name: z.string(),
  field_label: z.string(),
  field_type: z.enum(['text', 'number', 'select', 'multiselect', 'textarea', 'checkbox', 'date']),
  field_group: z.string(),
  field_options: z.array(z.string()),
  is_required: z.boolean(),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  validation_regex: z.string().nullable(),
  placeholder: z.string().nullable(),
  help_text: z.string().nullable(),
  prefix: z.string().nullable(),
  suffix: z.string().nullable(),
  sort_order: z.number(),
});

export const FormConfigResponseSchema = z.object({
  subcategory_id: z.string().uuid(),
  subcategory_name: z.string(),
  requires_brand: z.boolean(),
  requires_model: z.boolean(),
  requires_year: z.boolean(),
  requires_condition: z.boolean(),
  dynamic_attributes: z.array(DynamicAttributeSchema),
  timestamp: z.string(),
});

export type DynamicAttributeDTO = z.infer<typeof DynamicAttributeSchema>;
export type FormConfigResponseDTO = z.infer<typeof FormConfigResponseSchema>;
