// ============================================================
// OPTION LISTS SERVICE — Sprint 4A
// ============================================================
// Gestión de catálogos de opciones reutilizables.
// Una "option_list" es un set centralizado de valores (ej: Razas
// Bovinas, Combustibles) que puede ser referenciado por múltiples
// campos de formularios en lugar de duplicar las opciones.
// ============================================================

import { supabase } from '../supabaseClient';

// ─── INTERFACES ───────────────────────────────────────────────

export interface OptionList {
  id: string;
  name: string;           // slug: "razas-bovinas"
  display_name: string;   // "Razas Bovinas"
  scope: 'global' | 'category';
  category_id?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed (no en DB)
  item_count?: number;
  used_in_fields?: number;
  category_name?: string | null;
}

export interface OptionListItem {
  id: string;
  list_id: string;
  value: string;
  label: string;
  sort_order: number;
  metadata?: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
}

export type CreateOptionListInput = {
  name?: string;          // si no viene, se deriva del display_name
  display_name: string;
  scope: 'global' | 'category';
  category_id?: string | null;
  description?: string | null;
};

export type UpdateOptionListInput = Partial<Omit<CreateOptionListInput, 'name'>> & {
  is_active?: boolean;
};

// ─── HELPERS ──────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── READ ─────────────────────────────────────────────────────

export async function getOptionLists(filters?: {
  scope?: 'global' | 'category';
  categoryId?: string;
  search?: string;
  isActive?: boolean;
}): Promise<OptionList[]> {
  let query = supabase
    .from('option_lists')
    .select('*, categories(display_name)')
    .order('display_name', { ascending: true });

  if (filters?.scope) query = query.eq('scope', filters.scope);
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);
  if (filters?.search) query = query.ilike('display_name', `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;

  // Enriquecer con counts en paralelo
  const enriched = await Promise.all(
    (data || []).map(async (list) => {
      const [itemsRes, fieldsRes] = await Promise.all([
        supabase
          .from('option_list_items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id)
          .eq('is_active', true),
        supabase
          .from('form_fields_v2')
          .select('*', { count: 'exact', head: true })
          .eq('option_list_id', list.id),
      ]);

      return {
        ...list,
        item_count: itemsRes.count ?? 0,
        used_in_fields: fieldsRes.count ?? 0,
        category_name: (list as any).categories?.display_name ?? null,
      } as OptionList;
    })
  );

  return enriched;
}

export async function getOptionListById(id: string): Promise<OptionList | null> {
  const { data, error } = await supabase
    .from('option_lists')
    .select('*, categories(display_name)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    ...data,
    category_name: (data as any).categories?.display_name ?? null,
  } as OptionList;
}

export async function getOptionListItems(listId: string): Promise<OptionListItem[]> {
  const { data, error } = await supabase
    .from('option_list_items')
    .select('*')
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })
    .order('label', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Obtener items de una lista para usarlos en un select de formulario
export async function getOptionListItemsForSelect(
  listId: string
): Promise<Array<{ value: string; label: string }>> {
  const items = await getOptionListItems(listId);
  return items
    .filter((i) => i.is_active)
    .map((i) => ({ value: i.value, label: i.label }));
}

// Obtener items de una lista por NAME (slug) — para campos condicionales
export async function getOptionListItemsByName(
  listName: string
): Promise<Array<{ value: string; label: string }>> {
  const { data: list } = await supabase
    .from('option_lists')
    .select('id')
    .eq('name', listName)
    .single();

  if (!list?.id) return [];
  return getOptionListItemsForSelect(list.id);
}

// ─── CREATE ───────────────────────────────────────────────────

export async function createOptionList(input: CreateOptionListInput): Promise<OptionList> {
  const slug = input.name ? toSlug(input.name) : toSlug(input.display_name);

  const { data, error } = await supabase
    .from('option_lists')
    .insert({
      name: slug,
      display_name: input.display_name.trim(),
      scope: input.scope,
      category_id: input.category_id || null,
      description: input.description?.trim() || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Ya existe una lista con el nombre "${slug}". Elegí un nombre diferente.`);
    }
    throw error;
  }

  return data as OptionList;
}

// ─── UPDATE ───────────────────────────────────────────────────

export async function updateOptionList(
  id: string,
  input: UpdateOptionListInput
): Promise<OptionList> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (input.display_name !== undefined) updateData.display_name = input.display_name.trim();
  if (input.scope !== undefined) updateData.scope = input.scope;
  if (input.category_id !== undefined) updateData.category_id = input.category_id || null;
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from('option_lists')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as OptionList;
}

// ─── DELETE ───────────────────────────────────────────────────

export async function deleteOptionList(id: string): Promise<void> {
  // Guard: no eliminar si está en uso
  const { count } = await supabase
    .from('form_fields_v2')
    .select('*', { count: 'exact', head: true })
    .eq('option_list_id', id);

  if (count && count > 0) {
    throw new Error(
      `No se puede eliminar: esta lista está siendo usada en ${count} campo${count > 1 ? 's' : ''} de formularios activos. Remové la referencia primero.`
    );
  }

  const { error } = await supabase
    .from('option_lists')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── ITEMS: CREATE / UPDATE ───────────────────────────────────

export async function addOptionListItem(
  listId: string,
  item: { value: string; label: string; sort_order?: number; metadata?: any }
): Promise<OptionListItem> {
  const { data, error } = await supabase
    .from('option_list_items')
    .insert({
      list_id: listId,
      value: item.value.trim(),
      label: item.label.trim(),
      sort_order: item.sort_order ?? 0,
      metadata: item.metadata ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Ya existe un ítem con el valor "${item.value}" en esta lista.`);
    }
    throw error;
  }

  return data as OptionListItem;
}

export async function updateOptionListItem(
  itemId: string,
  updates: Partial<Pick<OptionListItem, 'label' | 'sort_order' | 'is_active' | 'metadata'>>
): Promise<OptionListItem> {
  const { data, error } = await supabase
    .from('option_list_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as OptionListItem;
}

export async function deleteOptionListItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('option_list_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

// ─── BULK IMPORT ──────────────────────────────────────────────

/**
 * Parsea texto plano (una opción por línea) a items.
 * Formato soportado:
 *   - "Aberdeen Angus"      → value: "aberdeen-angus", label: "Aberdeen Angus"
 *   - "aberdeen-angus|Aberdeen Angus" → value explícito con pipe
 */
export function parseBulkText(
  text: string
): Array<{ value: string; label: string }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return {
          value: toSlug(parts[0].trim()),
          label: parts[1].trim(),
        };
      }
      return {
        value: toSlug(line),
        label: line,
      };
    })
    .filter((item) => item.value.length > 0 && item.label.length > 0);
}

/**
 * Inserta/actualiza un conjunto de ítems en una lista.
 * Usa upsert con conflicto en (list_id, value).
 * Asigna sort_order secuencial desde el offset indicado.
 */
export async function bulkUpsertItems(
  listId: string,
  items: Array<{ value: string; label: string }>,
  startSortOrder = 0
): Promise<{ inserted: number; updated: number }> {
  if (items.length === 0) return { inserted: 0, updated: 0 };

  // Obtener existentes para calcular inserted vs updated
  const { data: existing } = await supabase
    .from('option_list_items')
    .select('value')
    .eq('list_id', listId);

  const existingValues = new Set((existing || []).map((e) => e.value));

  const payload = items.map((item, idx) => ({
    list_id: listId,
    value: item.value,
    label: item.label,
    sort_order: startSortOrder + idx,
    is_active: true,
  }));

  const { error } = await supabase
    .from('option_list_items')
    .upsert(payload, { onConflict: 'list_id,value' });

  if (error) throw error;

  const inserted = items.filter((i) => !existingValues.has(i.value)).length;
  const updated = items.length - inserted;

  return { inserted, updated };
}

/**
 * Reemplaza TODOS los ítems de una lista con los provistos.
 * Borra los que no están en la nueva lista.
 */
export async function replaceAllItems(
  listId: string,
  items: Array<{ value: string; label: string }>
): Promise<void> {
  // Delete all existing
  const { error: delError } = await supabase
    .from('option_list_items')
    .delete()
    .eq('list_id', listId);

  if (delError) throw delError;

  if (items.length === 0) return;

  const payload = items.map((item, idx) => ({
    list_id: listId,
    value: item.value,
    label: item.label,
    sort_order: idx,
    is_active: true,
  }));

  const { error } = await supabase
    .from('option_list_items')
    .insert(payload);

  if (error) throw error;
}
