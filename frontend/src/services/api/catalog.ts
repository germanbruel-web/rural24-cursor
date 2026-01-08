/**
 * Catalog API Service
 * Servicios para marcas, modelos y configuración de formularios
 */

import { fetchApi, ApiResponse } from './client';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface Model {
  id: string;
  brand_id: string;
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

export interface DynamicAttribute {
  id: string;
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

export interface FormConfigResponse {
  attributes: Record<string, DynamicAttribute[]>;
  brands: Brand[];
  total_fields: number;
  required_fields: number;
  timestamp: string;
}

export const catalogApi = {
  /**
   * Obtener marcas por subcategoría
   */
  async getBrandsBySubcategory(subcategoryId: string): Promise<Brand[]> {
    const response = await fetchApi<ApiResponse<{ brands: Brand[]; count: number }>>(
      `/api/config/brands?subcategoryId=${subcategoryId}`
    );
    return response.data!.brands;
  },

  /**
   * Obtener modelos por marca
   */
  async getModelsByBrand(brandId: string): Promise<Model[]> {
    const response = await fetchApi<ApiResponse<{ models: Model[]; count: number }>>(
      `/api/config/models?brandId=${brandId}`
    );
    return response.data!.models;
  },

  /**
   * Obtener configuración completa del formulario
   */
  async getFormConfig(subcategoryId: string): Promise<FormConfigResponse> {
    const response = await fetchApi<ApiResponse<FormConfigResponse>>(
      `/api/config/form/${subcategoryId}`
    );
    return response.data!;
  },
};
