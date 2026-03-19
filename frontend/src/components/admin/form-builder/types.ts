import type { FormFieldV2 } from '../../../types/v2';

export interface CatNode {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

export interface SubNode {
  id: string;
  category_id: string;
  parent_id: string | null;
  name: string;
  display_name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface Plantilla {
  id: string;
  name: string;
  display_name: string;
  category_id: string | null;
  subcategory_id: string | null;
}

export type ModoSeleccion = 'global' | 'variante';

export type CampoExtendido = FormFieldV2 & { option_list_id?: string | null };
export type TipoCampo = FormFieldV2['field_type'];
