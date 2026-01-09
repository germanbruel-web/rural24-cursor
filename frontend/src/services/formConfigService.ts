/**
 * Dynamic Form Configuration Service
 * Obtiene configuración de formularios desde el backend (única fuente de verdad)
 */

import type { FieldConfig } from '../config/adFieldsConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DynamicFormField {
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
  subcategory_id: string;
  subcategory_name: string;
  dynamic_attributes: DynamicFormField[];
  timestamp: string;
}

/**
 * Obtener configuración de formulario para una subcategoría
 */
export async function getFormConfig(subcategoryId: string): Promise<FormConfigResponse> {
  const response = await fetch(`${API_URL}/api/config/form/${subcategoryId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching form config: ${response.statusText}`);
  }

  return response.json();
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
    console.log(`✅ Using cached form config for ${subcategoryId}`);
    return cached.data;
  }

  console.log(`🔄 Fetching fresh form config for ${subcategoryId}`);
  const data = await getFormConfig(subcategoryId);
  formConfigCache.set(subcategoryId, { data, timestamp: now });

  return data;
}

/**
 * Obtener campos de formulario como FieldConfig[] (compatibilidad con código existente)
 */
export async function getFieldsForSubcategory(subcategoryId: string): Promise<FieldConfig[]> {
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
  console.log('🗑️ Form config cache cleared');
}
