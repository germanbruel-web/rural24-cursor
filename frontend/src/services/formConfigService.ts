/**
 * Dynamic Form Configuration Service
 * Obtiene configuración de formularios desde el backend (única fuente de verdad)
 */

import type { FieldConfig } from '../config/adFieldsConfig';

import { API_CONFIG } from '@/config/api';

export interface DynamicFormField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'date' | 'boolean';
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
  subcategory_id: string;
  subcategory_name: string;
  dynamic_attributes: DynamicFormField[];
  timestamp: string;
}

/**
 * Obtener configuración de formulario para una subcategoría
 */
export async function getFormConfig(subcategoryId: string): Promise<FormConfigResponse> {
  const url = `${API_CONFIG.BASE_URL}/api/config/form/${subcategoryId}`;
  if (import.meta.env.DEV) {
    console.log(`🌐 Fetching form config from: ${url}`);
    console.log(`🔧 API_CONFIG.BASE_URL configured as: ${API_CONFIG.BASE_URL}`);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (import.meta.env.DEV) {
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      if (import.meta.env.DEV) console.error(`❌ Form config fetch failed (${response.status}):`, errorText);
      throw new Error(`Error fetching form config: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (import.meta.env.DEV) console.log(`✅ Form config received:`, data);
    return data;
  } catch (error) {
    if (import.meta.env.DEV) console.error(`🔥 Fetch error:`, error);
    throw error;
  }
}

/**
 * Convertir DynamicFormField del backend a FieldConfig del frontend
 * (Adapter para mantener compatibilidad con código existente)
 */
export function adaptDynamicFieldToFieldConfig(field: DynamicFormField): FieldConfig {
  return {
    name: field.field_name,
    label: field.field_label,
    type: adaptFieldType(field.field_type),
    required: field.is_required,
    placeholder: field.placeholder || undefined,
    options: field.field_options.map((opt) => ({
      value: opt,
      label: opt,
    })),
    min: field.min_value || undefined,
    max: field.max_value || undefined,
    helpText: field.help_text || undefined,
    unit: field.suffix || undefined, // Usamos suffix como unidad
  };
}

/**
 * Adaptar tipos de campo del backend a frontend
 */
function adaptFieldType(
  backendType: string
): 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'tel' | 'url' {
  switch (backendType) {
    case 'multiselect':
      return 'select'; // Frontend no tiene multiselect, usar select normal
    case 'textarea':
      return 'textarea';
    case 'number':
      return 'number';
    case 'select':
      return 'select';
    default:
      return 'text';
  }
}

/**
 * Cachear configuraciones de formularios para evitar múltiples requests
 */
const formConfigCache = new Map<string, { data: FormConfigResponse; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

export async function getFormConfigCached(subcategoryId: string): Promise<FormConfigResponse> {
  const cached = formConfigCache.get(subcategoryId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    if (import.meta.env.DEV) console.log(`✅ Using cached form config for ${subcategoryId}`);
    return cached.data;
  }

  if (import.meta.env.DEV) console.log(`🔄 Fetching fresh form config for ${subcategoryId}`);
  const data = await getFormConfig(subcategoryId);
  formConfigCache.set(subcategoryId, { data, timestamp: now });

  return data;
}

/**
 * Obtener campos de formulario en formato backend original (respeta todos los tipos)
 */
export async function getFieldsForSubcategory(subcategoryId: string): Promise<DynamicFormField[]> {
  const formConfig = await getFormConfigCached(subcategoryId);

  return formConfig.dynamic_attributes
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Obtener campos como FieldConfig[] (LEGACY - para compatibilidad con sistema hardcoded)
 */
export async function getFieldsForSubcategoryLegacy(subcategoryId: string): Promise<FieldConfig[]> {
  const formConfig = await getFormConfigCached(subcategoryId);

  return formConfig.dynamic_attributes
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(adaptDynamicFieldToFieldConfig);
}

/**
 * Invalidar cache (útil para testing o cuando se actualiza configuración)
 */
export function clearFormConfigCache(): void {
  formConfigCache.clear();
  if (import.meta.env.DEV) console.log('🗑️ Form config cache cleared');
}
