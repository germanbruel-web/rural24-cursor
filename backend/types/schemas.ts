import { z } from 'zod';

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
  
  // Contenido
  title: z.string().min(10, 'El título debe tener al menos 10 caracteres').max(200),
  description: z.string().min(50, 'La descripción debe tener al menos 50 caracteres'),
  
  // Precio y ubicación
  price: z.number().positive('El precio debe ser mayor a 0'),
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
