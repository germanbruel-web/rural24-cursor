// ============================================================================
// FORMS SERVICE V2
// ============================================================================
// Servicio para gestionar formularios dinámicos
// ============================================================================

import { supabase } from '../supabaseClient';
import type {
  FormTemplateV2,
  FormFieldV2,
  CompleteFormV2,
  FormSection,
  FeatureV2,
  ApiResponse,
} from '../../types/v2';

// ============================================================================
// HELPER: RETRY CON BACKOFF EXPONENCIAL
// ============================================================================

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Si es error de red y no es el último intento, reintentar
      const isNetworkError = 
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('Network') ||
        error?.message?.includes('INTERNET_DISCONNECTED');
      
      if (isNetworkError && attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt); // Backoff exponencial
        console.log(`🔄 Reintentando en ${delay}ms (intento ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

// ============================================================================
// OBTENER FORMULARIOS
// ============================================================================

/**
 * Obtiene el formulario apropiado según el contexto (categoría/subcategoría/tipo)
 * Usa la función SQL get_form_for_context que ya está en la DB
 * 
 * Incluye retry automático con backoff exponencial para errores de red
 */
export async function getFormForContext(
  categoryId?: string,
  subcategoryId?: string,
  categoryTypeId?: string
): Promise<CompleteFormV2 | null> {
  try {
    // Intentar con retry automático
    const result = await retryWithBackoff(async () => {
      const { data, error } = await supabase.rpc('get_form_for_context', {
        p_category_id: categoryId || null,
        p_subcategory_id: subcategoryId || null,
        p_category_type_id: categoryTypeId || null,
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No form found for context:', {
          categoryId,
          subcategoryId,
          categoryTypeId,
        });
        return null;
      }

      return data[0];
    }, 2, 1500); // 2 reintentos, delay inicial 1.5s

    if (!result) {
      return null;
    }

    return {
      form_id: result.form_id,
      form_name: result.form_name,
      form_display_name: result.form_display_name,
      sections: result.sections,
      fields: result.fields,
    };
  } catch (error: any) {
    // Mensaje de error amigable según el tipo
    const isNetworkError = 
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('Network') ||
      error?.message?.includes('INTERNET_DISCONNECTED');
    
    if (isNetworkError) {
      console.error('🚫 Sin conexión a internet. Por favor, verifica tu red.');
    } else {
      console.error('❌ Error al cargar formulario:', error);
    }
    
    return null;
  }
}

/**
 * Obtiene un formulario por su nombre
 */
export async function getFormByName(
  formName: string
): Promise<CompleteFormV2 | null> {
  try {
    // Obtener template
    const { data: template, error: templateError } = await supabase
      .from('form_templates_v2')
      .select('*')
      .eq('name', formName)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('❌ Form template not found:', formName);
      return null;
    }

    // Obtener campos con opciones
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields_v2')
      .select(
        `
        *,
        options:form_field_options_v2(
          option_value,
          option_label,
          display_order
        )
      `
      )
      .eq('form_template_id', template.id)
      .order('display_order', { ascending: true });

    if (fieldsError) {
      console.error('❌ Error fetching form fields:', fieldsError);
      return null;
    }

    // Transformar opciones al formato esperado
    const fieldsWithOptions = fields.map((field) => ({
      ...field,
      options: field.options
        ?.filter((opt: any) => opt.is_active !== false)
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((opt: any) => ({
          value: opt.option_value,
          label: opt.option_label,
        })),
    }));

    return {
      form_id: template.id,
      form_name: template.name,
      form_display_name: template.display_name,
      sections: template.sections,
      fields: fieldsWithOptions,
    };
  } catch (error) {
    console.error('❌ Error in getFormByName:', error);
    return null;
  }
}

/**
 * Obtiene todos los templates de formularios
 */
export async function getAllFormTemplates(): Promise<FormTemplateV2[]> {
  try {
    const { data, error } = await supabase
      .from('form_templates_v2')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('❌ Error fetching form templates:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getAllFormTemplates:', error);
    return [];
  }
}

// ============================================================================
// FEATURES
// ============================================================================

/**
 * Obtiene features por categoría
 */
export async function getFeaturesByCategory(
  categoryId: string
): Promise<FeatureV2[]> {
  try {
    const { data, error } = await supabase
      .from('features_v2')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching features:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getFeaturesByCategory:', error);
    return [];
  }
}

/**
 * Obtiene una feature por nombre
 */
export async function getFeatureByName(
  categoryId: string,
  featureName: string
): Promise<FeatureV2 | null> {
  try {
    const { data, error } = await supabase
      .from('features_v2')
      .select('*')
      .eq('category_id', categoryId)
      .eq('name', featureName)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Error fetching feature:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getFeatureByName:', error);
    return null;
  }
}

// ============================================================================
// VALIDACIÓN DE FORMULARIOS
// ============================================================================

/**
 * Valida los datos de un formulario contra su definición
 */
export function validateFormData(
  formData: Record<string, any>,
  fields: FormFieldV2[]
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const value = formData[field.field_name];

    // Validar campos requeridos
    if (field.is_required && !value) {
      errors[field.field_name] = `${field.field_label} es requerido`;
      return;
    }

    // Validar reglas específicas
    if (value && field.validation_rules) {
      const rules = field.validation_rules;

      // Min/Max para números
      if (field.field_type === 'number') {
        const numValue = Number(value);

        if (rules.min !== undefined && numValue < rules.min) {
          errors[field.field_name] = `${field.field_label} debe ser mayor o igual a ${rules.min}`;
        }

        if (rules.max !== undefined && numValue > rules.max) {
          errors[field.field_name] = `${field.field_label} debe ser menor o igual a ${rules.max}`;
        }
      }

      // Pattern para texto
      if (field.field_type === 'text' && rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(String(value))) {
          errors[field.field_name] = `${field.field_label} tiene un formato inválido`;
        }
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Prepara los datos del formulario para enviar a la DB
 * Separa campos estándar de metadata
 */
export function prepareFormDataForSubmit(
  formData: Record<string, any>,
  fields: FormFieldV2[]
): {
  standardFields: Record<string, any>;
  metadata: Record<string, any>;
} {
  const standardFields: Record<string, any> = {};
  const metadata: Record<string, any> = {};

  // Campos estándar de ads_v2
  const standardFieldNames = [
    'title',
    'description',
    'price',
    'currency',
    'province',
    'city',
    'location_detail',
    'brand',
    'brand_id',
    'model',
    'model_id',
    'year',
    'images',
  ];

  fields.forEach((field) => {
    const value = formData[field.field_name];

    if (value !== undefined && value !== null && value !== '') {
      if (standardFieldNames.includes(field.field_name)) {
        standardFields[field.field_name] = value;
      } else {
        // El resto va a metadata
        metadata[field.field_name] = value;
      }
    }
  });

  return {
    standardFields,
    metadata,
  };
}

// ============================================================================
// HELPERS PARA UI
// ============================================================================

/**
 * Agrupa campos por sección
 */
export function groupFieldsBySection(
  fields: FormFieldV2[],
  sections: FormSection[]
): Map<string, FormFieldV2[]> {
  const grouped = new Map<string, FormFieldV2[]>();

  // Inicializar con secciones definidas
  sections.forEach((section) => {
    grouped.set(section.id, []);
  });

  // Agrupar campos
  fields.forEach((field) => {
    const sectionId = field.section_id || 'default';

    if (!grouped.has(sectionId)) {
      grouped.set(sectionId, []);
    }

    grouped.get(sectionId)!.push(field);
  });

  return grouped;
}

/**
 * Obtiene el ancho CSS para un campo según field_width
 */
export function getFieldWidthClass(width: string): string {
  switch (width) {
    case 'full':
      return 'w-full';
    case 'half':
      return 'w-full md:w-1/2';
    case 'third':
      return 'w-full md:w-1/3';
    default:
      return 'w-full';
  }
}

/**
 * Determina si un campo depende de otro (para autocomplete encadenados)
 */
export function getFieldDependencies(
  field: FormFieldV2
): string | undefined {
  if (
    field.data_source === 'models' &&
    field.data_source_config?.depends_on
  ) {
    return field.data_source_config.depends_on;
  }
  return undefined;
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

/**
 * Obtiene estadísticas de uso de formularios
 */
export async function getFormStats() {
  try {
    const { data: templates, error: templatesError } = await supabase
      .from('form_templates_v2')
      .select('id, name, is_active');

    if (templatesError) {
      console.error('❌ Error fetching form stats:', templatesError);
      return null;
    }

    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields_v2')
      .select('form_template_id');

    if (fieldsError) {
      console.error('❌ Error fetching fields stats:', fieldsError);
      return null;
    }

    const total = templates?.length || 0;
    const active = templates?.filter((t) => t.is_active).length || 0;

    const fieldsPerForm = fields?.reduce(
      (acc: Record<string, number>, field) => {
        acc[field.form_template_id] = (acc[field.form_template_id] || 0) + 1;
        return acc;
      },
      {}
    );

    return {
      total,
      active,
      inactive: total - active,
      fieldsPerForm,
      totalFields: fields?.length || 0,
    };
  } catch (error) {
    console.error('❌ Error in getFormStats:', error);
    return null;
  }
}

// ============================================================================
// CATEGORÍAS & TAXONOMÍA
// ============================================================================

/**
 * Obtiene todas las categorías activas
 */
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('❌ Error fetching categories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getCategories:', error);
    return [];
  }
}

/**
 * Obtiene subcategorías de una categoría (o todas si no se especifica categoryId)
 */
export async function getSubcategories(categoryId?: string) {
  try {
    let query = supabase
      .from('subcategories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching subcategories:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getSubcategories:', error);
    return [];
  }
}

/**
 * Obtiene tipos de una subcategoría (o todos si no se especifica subcategoryId)
 */
export async function getCategoryTypes(subcategoryId?: string) {
  try {
    let query = supabase
      .from('category_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching category types:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getCategoryTypes:', error);
    return [];
  }
}

/**
 * Obtiene la jerarquía completa: categoría → subcategorías → tipos
 */
export async function getTaxonomyTree() {
  try {
    const categories = await getCategories();

    const tree = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await getSubcategories(category.id);

        const subcategoriesWithTypes = await Promise.all(
          subcategories.map(async (subcategory) => {
            const types = await getCategoryTypes(subcategory.id);
            return {
              ...subcategory,
              types,
            };
          })
        );

        return {
          ...category,
          subcategories: subcategoriesWithTypes,
        };
      })
    );

    return tree;
  } catch (error) {
    console.error('❌ Error in getTaxonomyTree:', error);
    return [];
  }
}

// ============================================================================
// CRUD DE CATEGORÍAS
// ============================================================================

/**
 * Crea una nueva categoría
 */
export async function createCategory(data: {
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
}) {
  try {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name: slug,
        display_name: data.display_name,
        description: data.description || null,
        icon: data.icon || null,
        is_active: true,
        sort_order: 999,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating category:', error);
      throw error;
    }

    return newCategory;
  } catch (error) {
    console.error('❌ Error in createCategory:', error);
    throw error;
  }
}

/**
 * Actualiza una categoría
 */
export async function updateCategory(id: string, data: {
  name?: string;
  display_name?: string;
  description?: string;
  icon?: string;
}) {
  try {
    const updateData: any = {};
    
    if (data.name) {
      updateData.name = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (data.display_name) {
      updateData.display_name = data.display_name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon || null;
    }

    const { data: updated, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating category:', error);
      throw error;
    }

    return updated;
  } catch (error) {
    console.error('❌ Error in updateCategory:', error);
    throw error;
  }
}

/**
 * Elimina una categoría (CASCADE eliminará subcategorías y tipos relacionados)
 */
export async function deleteCategory(id: string) {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting category:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('❌ Error in deleteCategory:', error);
    throw error;
  }
}

// ============================================================================
// CRUD DE SUBCATEGORÍAS
// ============================================================================

/**
 * Crea una nueva subcategoría
 */
export async function createSubcategory(data: {
  category_id: string;
  name: string;
  display_name: string;
  description?: string;
}) {
  try {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data: newSubcategory, error } = await supabase
      .from('subcategories')
      .insert({
        category_id: data.category_id,
        name: slug,
        display_name: data.display_name,
        description: data.description || null,
        is_active: true,
        sort_order: 999,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating subcategory:', error);
      throw error;
    }

    return newSubcategory;
  } catch (error) {
    console.error('❌ Error in createSubcategory:', error);
    throw error;
  }
}

/**
 * Actualiza una subcategoría
 */
export async function updateSubcategory(id: string, data: {
  name?: string;
  display_name?: string;
  description?: string;
}) {
  try {
    const updateData: any = {};
    
    if (data.name) {
      updateData.name = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (data.display_name) {
      updateData.display_name = data.display_name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }

    const { data: updated, error } = await supabase
      .from('subcategories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating subcategory:', error);
      throw error;
    }

    return updated;
  } catch (error) {
    console.error('❌ Error in updateSubcategory:', error);
    throw error;
  }
}

/**
 * Elimina una subcategoría (CASCADE eliminará tipos relacionados)
 */
export async function deleteSubcategory(id: string) {
  try {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting subcategory:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('❌ Error in deleteSubcategory:', error);
    throw error;
  }
}

// ============================================================================
// CRUD DE TIPOS
// ============================================================================

/**
 * Crea un nuevo tipo
 */
export async function createCategoryType(data: {
  category_id: string;
  subcategory_id: string;
  name: string;
  display_name: string;
  description?: string;
}) {
  try {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { data: newType, error } = await supabase
      .from('category_types')
      .insert({
        category_id: data.category_id,
        subcategory_id: data.subcategory_id,
        name: slug,
        display_name: data.display_name,
        description: data.description || null,
        is_active: true,
        sort_order: 999,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating category type:', error);
      throw error;
    }

    return newType;
  } catch (error) {
    console.error('❌ Error in createCategoryType:', error);
    throw error;
  }
}

/**
 * Actualiza un tipo
 */
export async function updateCategoryType(id: string, data: {
  name?: string;
  display_name?: string;
  description?: string;
}) {
  try {
    const updateData: any = {};
    
    if (data.name) {
      updateData.name = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (data.display_name) {
      updateData.display_name = data.display_name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description || null;
    }

    const { data: updated, error } = await supabase
      .from('category_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating category type:', error);
      throw error;
    }

    return updated;
  } catch (error) {
    console.error('❌ Error in updateCategoryType:', error);
    throw error;
  }
}

/**
 * Elimina un tipo
 */
export async function deleteCategoryType(id: string) {
  try {
    const { error } = await supabase
      .from('category_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting category type:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('❌ Error in deleteCategoryType:', error);
    throw error;
  }
}
