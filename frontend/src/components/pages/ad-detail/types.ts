import type { NormalizedImage } from '../../../utils/imageHelpers';

export interface Seller {
  full_name?: string;
  email_verified?: boolean;
  role?: string;
  created_at?: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  location: string;
  province?: string;
  price?: number;
  currency?: string;
  price_unit?: string;
  phone: string;
  user_id: string;
  category_id: string;
  subcategory_id?: string;
  operation_type_id?: string;
  attributes?: Record<string, any>;
  created_at: string;
  categories?: { name: string; display_name: string } | null;
  subcategories?: { name: string; display_name: string } | null;
  operation_types?: { display_name: string } | null;
  images?: NormalizedImage[];
  seller?: Seller | null;
}

export type OptionLabels = Record<string, Record<string, string>>;
