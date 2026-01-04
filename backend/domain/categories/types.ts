// Domain types for Categories
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

export interface FormConfig {
  requires_brand: boolean;
  requires_model: boolean;
  requires_year: boolean;
  requires_condition: boolean;
}

export interface CategoryType {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  subcategory_id: string;
  sort_order: number;
}
