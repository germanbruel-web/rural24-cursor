// Domain types for Catalog (Brands & Models)

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Model {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  year_from: number | null;
  year_to: number | null;
  is_current_production: boolean;
  specifications: Record<string, any>;
  features: string[];
  short_description: string | null;
  main_image_url: string | null;
  is_active: boolean;
}

export interface DynamicAttribute {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'date';
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
