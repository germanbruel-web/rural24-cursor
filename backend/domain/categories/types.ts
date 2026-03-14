// Domain types for Categories

export interface FormConfig {
  requires_brand: boolean;
  requires_model: boolean;
  requires_year: boolean;
  requires_condition: boolean;
}

/**
 * Subcategoría leaf de nivel 3 (parent_id IS NOT NULL).
 * Es el nodo final que habilita el botón SIGUIENTE en el wizard.
 */
export interface SubcategoryLeaf {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  category_id: string;
  parent_id: string;
  sort_order: number;
  is_active: boolean;
  form_config: FormConfig;
}

/**
 * Subcategoría de nivel 2 (parent_id IS NULL).
 * Si has_children=true muestra flecha → para navegar a nivel 3.
 * Si has_children=false y is_leaf=true es un leaf directo (árbol de 2 niveles).
 */
export interface Subcategory {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  category_id: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_leaf: boolean;       // true si no tiene hijos — habilita SIGUIENTE
  has_children: boolean;  // true si tiene sub-subcategorías
  form_config: FormConfig;
  children: SubcategoryLeaf[];
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

export interface CategoryType {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  subcategory_id: string;
  sort_order: number;
}
