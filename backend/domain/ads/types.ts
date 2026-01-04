/**
 * Domain Types - Ads
 * Tipos e interfaces para el dominio de avisos clasificados
 */

export interface Ad {
  id: string;
  user_id: string;
  category_id: string;
  subcategory_id: string;
  brand_id: string | null;
  model_id: string | null;
  category_type_id: string | null;
  
  // Contenido
  title: string;
  description: string;
  slug: string;
  short_id: string;
  
  // Precio y ubicación
  price: number;
  currency: 'ARS' | 'USD';
  province: string;
  city: string | null;
  location: string | null;
  
  // Atributos dinámicos (JSONB)
  attributes: Record<string, any>;
  dynamic_fields: Record<string, any>;
  
  // Estado
  status: 'draft' | 'active' | 'inactive' | 'expired' | 'deleted';
  approval_status: 'pending' | 'approved' | 'rejected';
  
  // Premium/Featured
  is_premium: boolean;
  featured: boolean;
  featured_at: string | null;
  featured_order: number | null;
  
  // Imágenes (array JSONB)
  images: AdImage[];
  
  // Contacto
  contact_phone: string | null;
  contact_email: string | null;
  
  // Metadata
  views: number;
  search_vector: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expires_at: string | null;
  
  // Legacy fields (migración futura)
  year: number | null;
  condition: string | null;
}

export interface AdImage {
  url: string;
  path: string;
}

export interface AdCreate {
  user_id: string;
  category_id: string;
  subcategory_id: string;
  brand_id?: string | null;
  model_id?: string | null;
  
  // Contenido
  title: string;
  description: string;
  
  // Precio y ubicación
  price: number;
  currency: 'ARS' | 'USD';
  province: string;
  city?: string | null;
  location?: string | null;
  
  // Atributos dinámicos (validados contra dynamic_attributes)
  attributes: Record<string, any>;
  
  // Imágenes (URLs de Cloudflare R2)
  images?: AdImage[];
  
  // Contacto
  contact_phone?: string | null;
  contact_email?: string | null;
  
  // Estado inicial
  status?: 'draft' | 'active';
  approval_status?: 'pending' | 'approved';
}

export interface AdUpdate {
  title?: string;
  description?: string;
  price?: number;
  currency?: 'ARS' | 'USD';
  province?: string;
  city?: string | null;
  location?: string | null;
  attributes?: Record<string, any>;
  images?: AdImage[];
  contact_phone?: string | null;
  contact_email?: string | null;
  status?: 'draft' | 'active' | 'inactive';
}

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
  status?: string;
  approval_status?: string;
  featured?: boolean;
  search?: string; // Para búsqueda full-text
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'price' | 'views' | 'featured_order';
  order_dir?: 'asc' | 'desc';
}

export interface AdListResponse {
  ads: Ad[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
