// ====================================================================
// ATTRIBUTE GROUPS SERVICE - CRUD para grupos de atributos
// ====================================================================

import { supabase } from '../supabaseClient';

export interface AttributeGroup {
  id: string;
  subcategory_id: string;
  name: string;           // slug interno (ej: "informacion_general")
  display_name: string;   // nombre visible (ej: "Información General")
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateGroupInput = Omit<AttributeGroup, 'id' | 'created_at' | 'updated_at'>;
export type UpdateGroupInput = Partial<Omit<CreateGroupInput, 'subcategory_id'>>;

// ====================================================================
// UTILIDADES
// ====================================================================

/**
 * Normaliza un nombre a slug
 * "Información General" -> "informacion_general"
 */
export function normalizeToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s]/g, '')     // Solo alfanuméricos y espacios
    .replace(/\s+/g, '_')             // Espacios a guiones bajos
    .replace(/_+/g, '_')              // Múltiples guiones a uno
    .replace(/^_|_$/g, '');           // Trim guiones
}

// ====================================================================
// READ - Obtener grupos
// ====================================================================

export async function getGroups(subcategoryId: string): Promise<AttributeGroup[]> {
  const { data, error } = await supabase
    .from('attribute_groups')
    .select('*')
    .eq('subcategory_id', subcategoryId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error obteniendo grupos:', error);
    throw error;
  }

  return data || [];
}

export async function getGroupById(id: string): Promise<AttributeGroup | null> {
  const { data, error } = await supabase
    .from('attribute_groups')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('❌ Error obteniendo grupo:', error);
    throw error;
  }

  return data;
}

// ====================================================================
// CREATE - Crear grupo
// ====================================================================

export async function createGroup(input: CreateGroupInput): Promise<AttributeGroup> {
  // Validaciones
  if (!input.subcategory_id) {
    throw new Error('subcategory_id es requerido');
  }
  if (!input.display_name || input.display_name.trim() === '') {
    throw new Error('display_name es requerido');
  }

  // Generar slug si no viene
  const name = input.name || normalizeToSlug(input.display_name);

  // Obtener el siguiente sort_order
  const { data: existingGroups } = await supabase
    .from('attribute_groups')
    .select('sort_order')
    .eq('subcategory_id', input.subcategory_id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existingGroups && existingGroups.length > 0 
    ? existingGroups[0].sort_order + 1 
    : 0;

  const { data, error } = await supabase
    .from('attribute_groups')
    .insert({
      subcategory_id: input.subcategory_id,
      name,
      display_name: input.display_name.trim(),
      sort_order: input.sort_order ?? nextOrder,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Ya existe un grupo con el nombre "${input.display_name}" en esta subcategoría`);
    }
    console.error('❌ Error creando grupo:', error);
    throw error;
  }

  return data;
}

// ====================================================================
// UPDATE - Actualizar grupo
// ====================================================================

export async function updateGroup(id: string, input: UpdateGroupInput): Promise<AttributeGroup> {
  const updateData: Record<string, any> = {};

  if (input.display_name !== undefined) {
    updateData.display_name = input.display_name.trim();
    updateData.name = normalizeToSlug(input.display_name);
  }
  if (input.sort_order !== undefined) {
    updateData.sort_order = input.sort_order;
  }
  if (input.is_active !== undefined) {
    updateData.is_active = input.is_active;
  }

  const { data, error } = await supabase
    .from('attribute_groups')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ya existe un grupo con ese nombre en esta subcategoría');
    }
    console.error('❌ Error actualizando grupo:', error);
    throw error;
  }

  return data;
}

// ====================================================================
// DELETE - Eliminar grupo
// ====================================================================

export async function deleteGroup(id: string): Promise<void> {
  // Primero, actualizar atributos que usan este grupo para que queden sin grupo
  await supabase
    .from('dynamic_attributes')
    .update({ group_id: null })
    .eq('group_id', id);

  const { error } = await supabase
    .from('attribute_groups')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error eliminando grupo:', error);
    throw error;
  }
}

// ====================================================================
// REORDER - Reordenar grupos
// ====================================================================

export async function reorderGroups(
  subcategoryId: string, 
  orderedIds: string[]
): Promise<void> {
  // Actualizar cada grupo con su nuevo orden
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('attribute_groups')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
      .eq('subcategory_id', subcategoryId);

    if (error) {
      console.error('❌ Error reordenando grupo:', error);
      throw error;
    }
  }
}

// ====================================================================
// BULK CREATE - Crear grupos base para una subcategoría
// ====================================================================

export const DEFAULT_GROUPS = [
  { display_name: 'Información General', sort_order: 0 },
  { display_name: 'Especificaciones Técnicas', sort_order: 1 },
  { display_name: 'Características', sort_order: 2 },
];

export async function createDefaultGroups(subcategoryId: string): Promise<AttributeGroup[]> {
  const groups: AttributeGroup[] = [];

  for (const defaultGroup of DEFAULT_GROUPS) {
    try {
      const group = await createGroup({
        subcategory_id: subcategoryId,
        name: normalizeToSlug(defaultGroup.display_name),
        display_name: defaultGroup.display_name,
        sort_order: defaultGroup.sort_order,
        is_active: true,
      });
      groups.push(group);
    } catch (error) {
      // Ignorar si ya existe
      console.warn(`Grupo "${defaultGroup.display_name}" ya existe o error:`, error);
    }
  }

  return groups;
}
