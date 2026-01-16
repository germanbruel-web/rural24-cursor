// ====================================================================
// CONTENT TEMPLATES SERVICE - CRUD para plantillas de títulos/descripciones
// ====================================================================

import { supabase } from '../supabaseClient';

// ====================================================================
// TYPES
// ====================================================================

export interface ContentTemplate {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  type_id: string | null;
  template_type: 'title' | 'description';
  name: string;
  template_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  category?: { id: string; name: string } | null;
  subcategory?: { id: string; name: string } | null;
  type?: { id: string; name: string } | null;
}

export type CreateTemplateInput = Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at' | 'category' | 'subcategory' | 'type'>;
export type UpdateTemplateInput = Partial<CreateTemplateInput>;

// Variables disponibles para interpolación
export const TEMPLATE_VARIABLES = [
  // Básicas de categorización
  { key: '{categoria}', label: 'Categoría', description: 'Nombre de la categoría', group: 'categorización' },
  { key: '{subcategoria}', label: 'Subcategoría', description: 'Nombre de la subcategoría', group: 'categorización' },
  { key: '{tipo}', label: 'Tipo', description: 'Tipo de producto (nivel 1)', group: 'categorización' },
  
  // Producto
  { key: '{marca}', label: 'Marca', description: 'Marca del producto', group: 'producto' },
  { key: '{modelo}', label: 'Modelo', description: 'Modelo del producto', group: 'producto' },
  { key: '{año}', label: 'Año', description: 'Año del producto', group: 'producto' },
  { key: '{condicion}', label: 'Condición', description: 'Nuevo/Usado', group: 'producto' },
  
  // Ubicación
  { key: '{provincia}', label: 'Provincia', description: 'Provincia de ubicación', group: 'ubicación' },
  { key: '{localidad}', label: 'Localidad', description: 'Localidad de ubicación', group: 'ubicación' },
  
  // Precio
  { key: '{precio}', label: 'Precio', description: 'Precio formateado con moneda', group: 'precio' },
];

// Variables de atributos dinámicos comunes
export const DYNAMIC_ATTRIBUTE_VARIABLES = [
  { key: '{atributo:potencia}', label: 'Potencia (HP)', description: 'Potencia en HP/CV', group: 'técnico' },
  { key: '{atributo:horas_uso}', label: 'Horas de uso', description: 'Horas de trabajo', group: 'técnico' },
  { key: '{atributo:capacidad}', label: 'Capacidad', description: 'Capacidad de carga/almacenamiento', group: 'técnico' },
  { key: '{atributo:ancho_labor}', label: 'Ancho de labor', description: 'Ancho de trabajo en metros', group: 'técnico' },
  { key: '{atributo:rodado}', label: 'Rodado', description: 'Tipo de rodado/neumáticos', group: 'técnico' },
  { key: '{atributo:traccion}', label: 'Tracción', description: 'Tipo de tracción (4x4, 4x2)', group: 'técnico' },
];

// ====================================================================
// READ - Obtener plantillas
// ====================================================================

export async function getTemplates(filters?: {
  categoryId?: string;
  subcategoryId?: string;
  typeId?: string;
  templateType?: 'title' | 'description';
  isActive?: boolean;
}) {
  let query = supabase
    .from('ad_content_templates')
    .select(`
      *,
      category:categories(id, name),
      subcategory:subcategories(id, name),
      type:category_types(id, name)
    `)
    .order('template_type', { ascending: true })
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
  if (filters?.templateType) {
    query = query.eq('template_type', filters.templateType);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error obteniendo plantillas:', error);
    throw error;
  }

  return (data || []) as ContentTemplate[];
}

// Obtener plantillas por jerarquía (herencia)
// Busca: Global → Categoría → Subcategoría → Tipo
export async function getTemplatesForContext(params: {
  categoryId?: string;
  subcategoryId?: string;
  typeId?: string;
  templateType?: 'title' | 'description';
}) {
  const { categoryId, subcategoryId, typeId, templateType } = params;
  
  let query = supabase
    .from('ad_content_templates')
    .select(`
      *,
      category:categories(id, name),
      subcategory:subcategories(id, name),
      type:category_types(id, name)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (templateType) {
    query = query.eq('template_type', templateType);
  }

  // Construir filtro OR para jerarquía
  // Global (all nulls) OR category match OR subcategory match OR type match
  const conditions: string[] = [];
  
  // Global
  conditions.push('and(category_id.is.null,subcategory_id.is.null,type_id.is.null)');
  
  // Nivel categoría
  if (categoryId) {
    conditions.push(`and(category_id.eq.${categoryId},subcategory_id.is.null,type_id.is.null)`);
  }
  
  // Nivel subcategoría
  if (categoryId && subcategoryId) {
    conditions.push(`and(category_id.eq.${categoryId},subcategory_id.eq.${subcategoryId},type_id.is.null)`);
  }
  
  // Nivel tipo
  if (categoryId && subcategoryId && typeId) {
    conditions.push(`and(category_id.eq.${categoryId},subcategory_id.eq.${subcategoryId},type_id.eq.${typeId})`);
  }

  query = query.or(conditions.join(','));

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error obteniendo plantillas para contexto:', error);
    throw error;
  }

  return (data || []) as ContentTemplate[];
}

// ====================================================================
// CREATE - Crear plantilla
// ====================================================================

export async function createTemplate(input: CreateTemplateInput) {
  const { data, error } = await supabase
    .from('ad_content_templates')
    .insert([input])
    .select()
    .single();

  if (error) {
    console.error('❌ Error creando plantilla:', error);
    throw error;
  }

  return data as ContentTemplate;
}

// ====================================================================
// UPDATE - Actualizar plantilla
// ====================================================================

export async function updateTemplate(id: string, updates: UpdateTemplateInput) {
  const { data, error } = await supabase
    .from('ad_content_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Error actualizando plantilla:', error);
    throw error;
  }

  return data as ContentTemplate;
}

// ====================================================================
// DELETE - Eliminar plantilla
// ====================================================================

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('ad_content_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ Error eliminando plantilla:', error);
    throw error;
  }

  return true;
}

// ====================================================================
// REORDER - Reordenar plantillas
// ====================================================================

export async function reorderTemplates(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) => ({
    id,
    sort_order: index + 1,
    updated_at: new Date().toISOString(),
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('ad_content_templates')
      .update({ sort_order: update.sort_order, updated_at: update.updated_at })
      .eq('id', update.id);

    if (error) {
      console.error('❌ Error reordenando plantilla:', error);
      throw error;
    }
  }

  return true;
}

// ====================================================================
// INTERPOLATE - Reemplazar variables en template
// ====================================================================

export function interpolateTemplate(
  templateText: string,
  context: {
    categoria?: string;
    subcategoria?: string;
    tipo?: string;
    marca?: string;
    modelo?: string;
    año?: string;
    condicion?: string;
    provincia?: string;
    localidad?: string;
    precio?: string;
    atributos?: Record<string, string>; // Para {atributo:FIELD_NAME}
  }
): string {
  let result = templateText;

  // Variables básicas
  result = result.replace(/{categoria}/gi, context.categoria || '');
  result = result.replace(/{subcategoria}/gi, context.subcategoria || '');
  result = result.replace(/{tipo}/gi, context.tipo || '');
  result = result.replace(/{marca}/gi, context.marca || '');
  result = result.replace(/{modelo}/gi, context.modelo || '');
  result = result.replace(/{año}/gi, context.año || '');
  result = result.replace(/{condicion}/gi, context.condicion || '');
  result = result.replace(/{provincia}/gi, context.provincia || '');
  result = result.replace(/{localidad}/gi, context.localidad || '');
  result = result.replace(/{precio}/gi, context.precio || '');

  // Variables de atributos dinámicos: {atributo:FIELD_NAME}
  if (context.atributos) {
    const attrRegex = /{atributo:(\w+)}/gi;
    result = result.replace(attrRegex, (match, fieldName) => {
      return context.atributos?.[fieldName] || '';
    });
  }

  // Limpiar espacios múltiples y líneas vacías extras
  result = result.replace(/\s+/g, ' ').trim();
  
  // Para descripciones, preservar saltos de línea pero limpiar
  if (templateText.includes('\n')) {
    result = templateText;
    // Re-aplicar reemplazos preservando estructura
    result = result.replace(/{categoria}/gi, context.categoria || '');
    result = result.replace(/{subcategoria}/gi, context.subcategoria || '');
    result = result.replace(/{tipo}/gi, context.tipo || '');
    result = result.replace(/{marca}/gi, context.marca || '');
    result = result.replace(/{modelo}/gi, context.modelo || '');
    result = result.replace(/{año}/gi, context.año || '');
    result = result.replace(/{condicion}/gi, context.condicion || '');
    result = result.replace(/{provincia}/gi, context.provincia || '');
    result = result.replace(/{localidad}/gi, context.localidad || '');
    result = result.replace(/{precio}/gi, context.precio || '');
    
    if (context.atributos) {
      const attrRegex = /{atributo:(\w+)}/gi;
      result = result.replace(attrRegex, (match, fieldName) => {
        return context.atributos?.[fieldName] || '';
      });
    }
  }

  return result;
}
