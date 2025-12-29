// ====================================================================
// TEMPLATES SERVICE - CRUD para templates de atributos
// Sistema de clonación rápida de conjuntos de atributos
// ====================================================================

import { supabase } from '../supabaseClient';

export interface AttributeTemplateField {
  id: string;
  template_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface AttributeTemplate {
  id: string;
  name: string;
  description?: string | null;
  category_id: string;
  subcategory_id?: string | null;
  created_by?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  fields?: AttributeTemplateField[];
  field_count?: number;
  category_name?: string;
  subcategory_name?: string;
}

export type CreateTemplateInput = {
  name: string;
  description?: string;
  category_id: string;
  subcategory_id?: string | null;
};

// ====================================================================
// READ - Listar templates
// ====================================================================

/**
 * Obtener todos los templates disponibles con metadata
 */
export async function getTemplates(filters?: {
  categoryId?: string;
  isActive?: boolean;
  searchQuery?: string;
}) {
  let query = supabase
    .from('attribute_templates')
    .select(`
      *,
      categories(display_name),
      subcategories(display_name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.searchQuery) {
    query = query.ilike('name', `%${filters.searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Obtener count de fields para cada template
  const templatesWithCount = await Promise.all(
    (data || []).map(async (template) => {
      const { count } = await supabase
        .from('attribute_template_fields')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', template.id);

      return {
        ...template,
        field_count: count || 0,
        category_name: template.categories?.display_name || '',
        subcategory_name: template.subcategories?.display_name || '',
      };
    })
  );

  return templatesWithCount as AttributeTemplate[];
}

/**
 * Obtener un template específico con sus fields
 */
export async function getTemplateById(templateId: string) {
  const { data: template, error: templateError } = await supabase
    .from('attribute_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;

  const { data: fields, error: fieldsError } = await supabase
    .from('attribute_template_fields')
    .select('*')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true });

  if (fieldsError) throw fieldsError;

  return {
    ...template,
    fields,
  } as AttributeTemplate;
}

// ====================================================================
// CREATE - Crear template desde subcategoría existente
// ====================================================================

/**
 * Crear un template copiando atributos de una subcategoría
 */
export async function createTemplateFromSubcategory(input: {
  name: string;
  description?: string;
  categoryId: string;
  subcategoryId: string;
}) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data, error } = await supabase.rpc('create_template_from_subcategory', {
    p_name: input.name,
    p_description: input.description || null,
    p_category_id: input.categoryId,
    p_subcategory_id: input.subcategoryId,
    p_created_by: userId || null,
  });

  if (error) throw error;
  return data; // Returns template_id
}

/**
 * Crear template manualmente (sin copiar de subcategoría)
 */
export async function createTemplate(input: CreateTemplateInput) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { data, error } = await supabase
    .from('attribute_templates')
    .insert({
      name: input.name,
      description: input.description || null,
      category_id: input.category_id,
      subcategory_id: input.subcategory_id || null,
      created_by: userId || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AttributeTemplate;
}

// ====================================================================
// UPDATE - Actualizar template
// ====================================================================

export async function updateTemplate(
  templateId: string,
  updates: Partial<CreateTemplateInput> & { is_active?: boolean }
) {
  const { data, error } = await supabase
    .from('attribute_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw error;
  return data as AttributeTemplate;
}

// ====================================================================
// DELETE - Eliminar template
// ====================================================================

export async function deleteTemplate(templateId: string) {
  const { error } = await supabase
    .from('attribute_templates')
    .delete()
    .eq('id', templateId);

  if (error) throw error;
}

// ====================================================================
// APPLY - Aplicar template a subcategoría
// ====================================================================

/**
 * Aplicar un template a una subcategoría destino
 * Copia TODOS los campos del template a dynamic_attributes
 */
export async function applyTemplateToSubcategory(
  templateId: string,
  targetCategoryId: string,
  targetSubcategoryId: string
) {
  const { data, error } = await supabase.rpc('apply_template_to_subcategory', {
    p_template_id: templateId,
    p_target_category_id: targetCategoryId,
    p_target_subcategory_id: targetSubcategoryId,
  });

  if (error) throw error;
  return data; // Returns count of inserted attributes
}

// ====================================================================
// TEMPLATE FIELDS - Gestión de campos del template
// ====================================================================

export async function addFieldToTemplate(
  templateId: string,
  field: Omit<AttributeTemplateField, 'id' | 'template_id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('attribute_template_fields')
    .insert({
      template_id: templateId,
      ...field,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AttributeTemplateField;
}

export async function updateTemplateField(
  fieldId: string,
  updates: Partial<Omit<AttributeTemplateField, 'id' | 'template_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('attribute_template_fields')
    .update(updates)
    .eq('id', fieldId)
    .select()
    .single();

  if (error) throw error;
  return data as AttributeTemplateField;
}

export async function deleteTemplateField(fieldId: string) {
  const { error } = await supabase
    .from('attribute_template_fields')
    .delete()
    .eq('id', fieldId);

  if (error) throw error;
}
