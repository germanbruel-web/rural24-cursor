/**
 * Ads API Service
 * Servicios para anuncios clasificados
 */

import { fetchApi, ApiResponse, PaginatedResponse } from './client';

export interface AdImage {
  url: string;
  path: string;
}

export interface Ad {
  id: string;
  user_id: string;
  category_id: string;
  subcategory_id: string;
  brand_id: string | null;
  model_id: string | null;
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
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expires_at: string | null;
}

export interface CreateAdPayload {
  user_id: string;
  category_id: string;
  subcategory_id: string;
  brand_id?: string;
  model_id?: string;
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
  search?: string;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'price' | 'views' | 'featured_order';
  order_dir?: 'asc' | 'desc';
}

export const adsApi = {
  /**
   * Crear nuevo anuncio
   */
  async create(payload: CreateAdPayload): Promise<Ad> {
    const response = await fetchApi<ApiResponse<Ad>>('/api/ads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data!;
  },

  /**
   * Listar anuncios con filtros
   */
  async getAll(filters: AdFilters = {}): Promise<{
    ads: Ad[];
    pagination: PaginatedResponse<Ad>['pagination'];
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await fetchApi<PaginatedResponse<Ad>>(
      `/api/ads?${params.toString()}`
    );

    return {
      ads: response.data,
      pagination: response.pagination,
    };
  },

  /**
   * Obtener anuncio por ID
   */
  async getById(id: string): Promise<Ad> {
    const response = await fetchApi<ApiResponse<Ad>>(`/api/ads/${id}`);
    return response.data!;
  },

  /**
   * Actualizar anuncio
   */
  async update(id: string, payload: Partial<CreateAdPayload>): Promise<Ad> {
    const response = await fetchApi<ApiResponse<Ad>>(`/api/ads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data!;
  },

  /**
   * Eliminar anuncio
   */
  async delete(id: string): Promise<void> {
    await fetchApi<ApiResponse<void>>(`/api/ads/${id}`, {
      method: 'DELETE',
    });
  },
};
