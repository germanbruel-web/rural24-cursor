/**
 * Categories API Service
 * Servicios para categorías y subcategorías
 */

import { fetchApi, ApiResponse } from './client';

export interface FormConfig {
  requires_brand: boolean;
  requires_model: boolean;
  requires_year: boolean;
  requires_condition: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  category_id: string;
  sort_order: number;
  is_active: boolean;
  form_config: FormConfig;
}

export interface Category {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  subcategories: Subcategory[];
}

export interface CategoriesResponse {
  categories: Category[];
  timestamp: string;
}

export const categoriesApi = {
  /**
   * Obtener todas las categorías con subcategorías anidadas
   */
  async getAll(): Promise<CategoriesResponse> {
    const response = await fetchApi<ApiResponse<CategoriesResponse>>(
      '/api/config/categories'
    );
    return response.data!;
  },

  /**
   * Obtener una categoría por slug
   */
  async getBySlug(slug: string): Promise<Category | undefined> {
    const { categories } = await this.getAll();
    return categories.find((cat) => cat.slug === slug);
  },

  /**
   * Obtener una subcategoría por slug
   */
  async getSubcategoryBySlug(
    categorySlug: string,
    subcategorySlug: string
  ): Promise<Subcategory | undefined> {
    const category = await this.getBySlug(categorySlug);
    return category?.subcategories.find((sub) => sub.slug === subcategorySlug);
  },
};
