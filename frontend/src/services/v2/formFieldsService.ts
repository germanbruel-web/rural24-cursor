// ============================================================
// FORM FIELDS SERVICE — Sprint 4B
// ============================================================
// CRUD para form_fields_v2 y form_field_options_v2
// Sin SQL nuevo — tablas ya existen en DB
// ============================================================

import { supabase } from '../supabaseClient';
import type { FormFieldV2, FormFieldOptionV2 } from '../../types/v2';

// ─── FIELDS ──────────────────────────────────────────────────

export async function getFormFields(templateId: string): Promise<(FormFieldV2 & { option_list_id?: string | null })[]> {
  const { data, error } = await supabase
    .from('form_fields_v2')
    .select('*')
    .eq('form_template_id', templateId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createFormField(
  templateId: string,
  field: {
    field_label: string;
    field_type: FormFieldV2['field_type'];
    field_width?: FormFieldV2['field_width'];
    is_required?: boolean;
    placeholder?: string;
    help_text?: string;
    option_list_id?: string | null;
  },
  displayOrder: number
): Promise<FormFieldV2 & { option_list_id?: string | null }> {
  const nameSlug = field.field_label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim() || `campo_${Date.now()}`;

  const { data, error } = await supabase
    .from('form_fields_v2')
    .insert({
      form_template_id: templateId,
      field_name: nameSlug,
      field_label: field.field_label.trim(),
      field_type: field.field_type,
      field_width: field.field_width ?? 'full',
      is_required: field.is_required ?? false,
      placeholder: field.placeholder?.trim() || null,
      help_text: field.help_text?.trim() || null,
      display_order: displayOrder,
      option_list_id: field.option_list_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFormField(
  fieldId: string,
  updates: Partial<{
    field_label: string;
    field_type: FormFieldV2['field_type'];
    field_width: FormFieldV2['field_width'];
    is_required: boolean;
    placeholder: string | null;
    help_text: string | null;
    option_list_id: string | null;
    data_source_config: FormFieldV2['data_source_config'] | null;
  }>
): Promise<void> {
  const { error } = await supabase
    .from('form_fields_v2')
    .update(updates)
    .eq('id', fieldId);

  if (error) throw error;
}

/** Elimina una plantilla completa (template + todos sus campos + opciones de campos) */
export async function deleteFormTemplate(templateId: string): Promise<void> {
  // 1. Obtener IDs de campos del template
  const { data: fields } = await supabase
    .from('form_fields_v2')
    .select('id')
    .eq('form_template_id', templateId);

  const fieldIds = (fields ?? []).map((f) => f.id);

  // 2. Eliminar opciones estáticas de esos campos
  if (fieldIds.length > 0) {
    await supabase.from('form_field_options_v2').delete().in('field_id', fieldIds);
  }

  // 3. Eliminar campos
  await supabase.from('form_fields_v2').delete().eq('form_template_id', templateId);

  // 4. Eliminar el template
  const { error } = await supabase.from('form_templates_v2').delete().eq('id', templateId);
  if (error) throw error;
}

export async function deleteFormField(fieldId: string): Promise<void> {
  // Eliminar opciones estáticas primero
  await supabase.from('form_field_options_v2').delete().eq('field_id', fieldId);
  const { error } = await supabase.from('form_fields_v2').delete().eq('id', fieldId);
  if (error) throw error;
}

/** Mueve un campo hacia arriba intercambiando display_order con el anterior */
export async function moveFieldUp(
  fieldId: string,
  fields: { id: string; display_order: number }[]
): Promise<void> {
  const idx = fields.findIndex((f) => f.id === fieldId);
  if (idx <= 0) return;

  const current = fields[idx];
  const prev = fields[idx - 1];

  await Promise.all([
    supabase.from('form_fields_v2').update({ display_order: prev.display_order }).eq('id', current.id),
    supabase.from('form_fields_v2').update({ display_order: current.display_order }).eq('id', prev.id),
  ]);
}

/** Mueve un campo hacia abajo intercambiando display_order con el siguiente */
export async function moveFieldDown(
  fieldId: string,
  fields: { id: string; display_order: number }[]
): Promise<void> {
  const idx = fields.findIndex((f) => f.id === fieldId);
  if (idx < 0 || idx >= fields.length - 1) return;

  const current = fields[idx];
  const next = fields[idx + 1];

  await Promise.all([
    supabase.from('form_fields_v2').update({ display_order: next.display_order }).eq('id', current.id),
    supabase.from('form_fields_v2').update({ display_order: current.display_order }).eq('id', next.id),
  ]);
}

// ─── STATIC OPTIONS (form_field_options_v2) ──────────────────

export async function getFieldOptions(fieldId: string): Promise<FormFieldOptionV2[]> {
  const { data, error } = await supabase
    .from('form_field_options_v2')
    .select('*')
    .eq('field_id', fieldId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addFieldOption(
  fieldId: string,
  value: string,
  label: string,
  order: number
): Promise<FormFieldOptionV2> {
  const { data, error } = await supabase
    .from('form_field_options_v2')
    .insert({
      field_id: fieldId,
      option_value: value.trim().toLowerCase().replace(/\s+/g, '-'),
      option_label: label.trim(),
      display_order: order,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFieldOption(
  optionId: string,
  updates: { option_label?: string; option_value?: string }
): Promise<void> {
  const { error } = await supabase
    .from('form_field_options_v2')
    .update(updates)
    .eq('id', optionId);

  if (error) throw error;
}

export async function deleteFieldOption(optionId: string): Promise<void> {
  const { error } = await supabase
    .from('form_field_options_v2')
    .delete()
    .eq('id', optionId);

  if (error) throw error;
}
