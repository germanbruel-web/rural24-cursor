// ====================================================================
// ATTRIBUTES SERVICE - CRUD para atributos dinámicos
// ====================================================================

import { supabase } from '../supabaseClient';

export interface DynamicAttributeDB {
  id: string;
  category_id: string;
  subcategory_id: string;
  type_id?: string | null;
  field_name: string;
  field_label: string;
  field_type: string;
  field_group: string;
  field_options?: string[] | null;
  is_required: boolean;
  min_value?: number | null;
  max_value?: number | null;
  placeholder?: string | null;
  help_text?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateAttributeInput = Omit<DynamicAttributeDB, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAttributeInput = Partial<CreateAttributeInput>;

// ====================================================================
// READ - Obtener atributos
// ====================================================================

export async function getAttributes(filters?: {
  categoryId?: string;
  subcategoryId?: string;
  typeId?: string;
  isActive?: boolean;
}) {
  let query = supabase
    .from('dynamic_attributes')
    .select('*')
    .order('sort_order', { ascending: true });

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.subcategoryId) {
    query = query.eq('subcategory_id', filters.subcategoryId);
  }
  if (filters?.typeId) {
    query = query.eq('type_id', filters.typeId);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error obteniendo atributos:', error);
    throw error;
  }

  return data || [];
}

export async function getAttributeById(id: string) {
  const { data, error } = await supabase
    .from('dynamic_attributes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Error obteniendo atributo:', error);
    throw error;
  }

  return data;
}

// ====================================================================
// CREATE - Crear atributo
// ====================================================================

export async function createAttribute(input: CreateAttributeInput) {
  // Validaciones básicas
  if (!input.field_name || !input.field_label) {
    throw new Error('field_name y field_label son requeridos');
  }

  if (!input.category_id || !input.subcategory_id) {
    throw new Error('category_id y subcategory_id son requeridos');
  }

  // Verificar que field_name no exista para esa subcategoría
  const { data: existing } = await supabase
    .from('dynamic_attributes')
    .select('id')
    .eq('subcategory_id', input.subcategory_id)
    .eq('field_name', input.field_name)
    .single();

  if (existing) {
    throw new Error(`Ya existe un atributo con field_name "${input.field_name}" en esta subcategoría`);
  }

  const { data, error } = await supabase
    .from('dynamic_attributes')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando atributo:', error);
    throw error;
  }

  console.log('✅ Atributo creado:', data.field_label);
  return data;
}

// ====================================================================
// UPDATE - Actualizar atributo
// ====================================================================

export async function updateAttribute(id: string, input: UpdateAttributeInput) {
  const { data, error } = await supabase
    .from('dynamic_attributes')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')  // ✅ Especificar explícitamente todos los campos
    .single();

  if (error) {
    console.error('❌ Error actualizando atributo:', error);
    console.error('   - Status:', error.code);
    console.error('   - Message:', error.message);
    console.error('   - Details:', error.details);
    console.error('   - Hint:', error.hint);
    throw error;
  }

  console.log('✅ Atributo actualizado:', data.field_label);
  return data;
}

// ====================================================================
// DELETE - Eliminar atributo
// ====================================================================

export async function deleteAttribute(id: string) {
  const { error } = await supabase
    .from('dynamic_attributes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error eliminando atributo:', error);
    throw error;
  }

  console.log('✅ Atributo eliminado');
}

// ====================================================================
// REORDER - Reordenar atributos
// ====================================================================

export async function reorderAttributes(attributeIds: string[]) {
  const updates = attributeIds.map((id, index) => ({
    id,
    sort_order: index + 1,
  }));

  // Actualizar en batch
  for (const update of updates) {
    await supabase
      .from('dynamic_attributes')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id);
  }

  console.log('✅ Atributos reordenados');
}

// ====================================================================
// HELPERS - Obtener opciones de configuración
// ====================================================================

export const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Selección (dropdown)' },
  { value: 'multiselect', label: 'Selección múltiple' },
  { value: 'boolean', label: 'Sí/No (toggle)' },
  { value: 'date', label: 'Fecha' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'range', label: 'Rango numérico' },
] as const;

export const FIELD_GROUPS = [
  { value: 'Información General', label: '📋 Información General' },
  { value: 'Especificaciones Técnicas', label: '⚙️ Especificaciones Técnicas' },
  { value: 'Características', label: '🔧 Características' },
  { value: 'Ubicación', label: '📍 Ubicación' },
  { value: 'Observaciones', label: '📝 Observaciones' },
  { value: 'Otro', label: '📦 Otro' },
] as const;
