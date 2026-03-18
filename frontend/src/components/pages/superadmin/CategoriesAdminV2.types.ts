export type ViewMode = 'categories' | 'subcategories' | 'category_types' | 'brands' | 'models';

export interface NavigationState {
  mode: ViewMode;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  categoryTypeId?: string;
  categoryTypeName?: string;
  brandId?: string;
  brandName?: string;
}

export interface CategoryTypeFormData {
  display_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface ModelFormData {
  name: string;
  display_name: string;
  is_active: boolean;
}

export interface BrandFormData {
  name: string;
  display_name: string;
  is_active: boolean;
}

export interface SubcategoryFormData {
  name: string;
  display_name: string;
  is_active: boolean;
  has_brands: boolean;
  has_models: boolean;
  sort_order: number;
}

export interface CategoryFormData {
  name: string;
  display_name: string;
  is_active: boolean;
  sort_order: number;
  icon: string;
}
