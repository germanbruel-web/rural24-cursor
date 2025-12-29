// src/services/formBuilderService.ts

import { supabase } from './supabaseClient';

/**
 * Tipos para el sistema de Form Builder
 */

export interface FormField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'textarea' | 'select' | 'select_dynamic' | 'select_location' | 'tel' | 'email' | 'date' | 'file' | 'file_multiple';
  placeholder?: string;
  helpText?: string;
  sectionName?: string;
  isRequired: boolean;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: {
    items?: Array<{ value: string; label: string }>;
    [key: string]: any;
  };
  dependsOn?: string;
  showWhen?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'isNotEmpty' | 'isEmpty';
    value?: any;
  };
  displayOrder: number;
  fieldWidth: 'full' | 'half' | 'third' | 'quarter';
}

export interface FormTemplate {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  operationTypeId?: string;
  operationTypeName?: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  fields?: FormField[];
  fieldCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmissionData {
  [fieldName: string]: any;
}

/**
 * Servicio para gestionar Form Builder
 */
export const formBuilderService = {
  /**
   * Obtiene el formulario apropiado para una categoría/subcategoría
   */
  async getFormTemplate(
    categoryId: string,
    subcategoryId?: string,
    operationTypeId?: string
  ): Promise<FormTemplate | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_form_template', {
          p_category_id: categoryId,
          p_subcategory_id: subcategoryId || null,
          p_operation_type_id: operationTypeId || null,
        });

      if (error) {
        console.error('Error fetching form template:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No form template found for', { categoryId, subcategoryId, operationTypeId });
        return null;
      }

      const template = data[0];
      return {
        id: template.template_id,
        name: template.template_name,
        displayName: template.template_display_name,
        fields: template.fields || [],
        isActive: true,
        isDefault: false,
        priority: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in getFormTemplate:', error);
      return null;
    }
  },

  /**
   * Lista todos los formularios (para admin)
   */
  async listFormTemplates(activeOnly: boolean = false): Promise<FormTemplate[]> {
    try {
      let query = supabase
        .from('form_templates_with_fields')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(t => formBuilderService.mapFormTemplateFromDB(t));
    } catch (error) {
      console.error('Error listing form templates:', error);
      throw error;
    }
  },

  /**
   * Obtiene un formulario por ID (para edición)
   */
  async getFormTemplateById(id: string): Promise<FormTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('form_templates_with_fields')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return formBuilderService.mapFormTemplateFromDB(data);
    } catch (error) {
      console.error('Error getting form template:', error);
      return null;
    }
  },

  /**
   * Crea un nuevo formulario
   */
  async createFormTemplate(template: Partial<FormTemplate>): Promise<FormTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .insert({
          name: template.name,
          display_name: template.displayName,
          description: template.description,
          category_id: template.categoryId,
          subcategory_id: template.subcategoryId,
          operation_type_id: template.operationTypeId,
          is_active: template.isActive ?? true,
          is_default: template.isDefault ?? false,
          priority: template.priority ?? 10,
        })
        .select()
        .single();

      if (error) throw error;

      return formBuilderService.mapFormTemplateFromDB(data);
    } catch (error) {
      console.error('Error creating form template:', error);
      throw error;
    }
  },

  /**
   * Actualiza un formulario existente
   */
  async updateFormTemplate(id: string, updates: Partial<FormTemplate>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('form_templates')
        .update({
          display_name: updates.displayName,
          description: updates.description,
          category_id: updates.categoryId,
          subcategory_id: updates.subcategoryId,
          operation_type_id: updates.operationTypeId,
          is_active: updates.isActive,
          is_default: updates.isDefault,
          priority: updates.priority,
        })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating form template:', error);
      return false;
    }
  },

  /**
   * Elimina un formulario
   */
  async deleteFormTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting form template:', error);
      return false;
    }
  },

  /**
   * Agrega un campo a un formulario
   */
  async addField(templateId: string, field: Partial<FormField>): Promise<FormField | null> {
    try {
      const { data, error } = await supabase
        .from('form_fields')
        .insert({
          form_template_id: templateId,
          field_name: field.fieldName,
          field_label: field.fieldLabel,
          field_type: field.fieldType,
          placeholder: field.placeholder,
          help_text: field.helpText,
          section_name: field.sectionName,
          is_required: field.isRequired ?? false,
          min_value: field.minValue,
          max_value: field.maxValue,
          min_length: field.minLength,
          max_length: field.maxLength,
          pattern: field.pattern,
          options: field.options,
          depends_on: field.dependsOn,
          show_when: field.showWhen,
          display_order: field.displayOrder ?? 0,
          field_width: field.fieldWidth ?? 'full',
        })
        .select()
        .single();

      if (error) throw error;

      return formBuilderService.mapFormFieldFromDB(data);
    } catch (error) {
      console.error('Error adding field:', error);
      throw error;
    }
  },

  /**
   * Actualiza un campo
   */
  async updateField(fieldId: string, updates: Partial<FormField>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('form_fields')
        .update({
          field_label: updates.fieldLabel,
          field_type: updates.fieldType,
          placeholder: updates.placeholder,
          help_text: updates.helpText,
          section_name: updates.sectionName,
          is_required: updates.isRequired,
          min_value: updates.minValue,
          max_value: updates.maxValue,
          min_length: updates.minLength,
          max_length: updates.maxLength,
          pattern: updates.pattern,
          options: updates.options,
          depends_on: updates.dependsOn,
          show_when: updates.showWhen,
          display_order: updates.displayOrder,
          field_width: updates.fieldWidth,
          is_active: updates.isActive,
        })
        .eq('id', fieldId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating field:', error);
      return false;
    }
  },

  /**
   * Elimina un campo
   */
  async deleteField(fieldId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('form_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting field:', error);
      return false;
    }
  },

  /**
   * Reordena campos
   */
  async reorderFields(fieldIds: string[]): Promise<boolean> {
    try {
      const updates = fieldIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('form_fields')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      return true;
    } catch (error) {
      console.error('Error reordering fields:', error);
      return false;
    }
  },

  /**
   * Valida los datos de un formulario según su template
   */
  validateFormData(template: FormTemplate, data: FormSubmissionData): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!template.fields) {
      return { valid: true, errors };
    }

    for (const field of template.fields) {
      const value = data[field.fieldName];

      // Validar campos requeridos
      if (field.isRequired && (value === undefined || value === null || value === '')) {
        errors[field.fieldName] = `${field.fieldLabel} es requerido`;
        continue;
      }

      // Skip si el campo está vacío y no es requerido
      if (!value) continue;

      // Validar tipo number
      if (field.fieldType === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors[field.fieldName] = `${field.fieldLabel} debe ser un número`;
        } else {
          if (field.minValue !== undefined && numValue < field.minValue) {
            errors[field.fieldName] = `${field.fieldLabel} debe ser mayor o igual a ${field.minValue}`;
          }
          if (field.maxValue !== undefined && numValue > field.maxValue) {
            errors[field.fieldName] = `${field.fieldLabel} debe ser menor o igual a ${field.maxValue}`;
          }
        }
      }

      // Validar longitud de texto
      if (field.fieldType === 'text' || field.fieldType === 'textarea') {
        const strValue = String(value);
        if (field.minLength && strValue.length < field.minLength) {
          errors[field.fieldName] = `${field.fieldLabel} debe tener al menos ${field.minLength} caracteres`;
        }
        if (field.maxLength && strValue.length > field.maxLength) {
          errors[field.fieldName] = `${field.fieldLabel} no puede tener más de ${field.maxLength} caracteres`;
        }
      }

      // Validar patrón regex
      if (field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(String(value))) {
          errors[field.fieldName] = `${field.fieldLabel} no tiene un formato válido`;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },

  /**
   * Mapea datos de BD a FormTemplate
   */
  mapFormTemplateFromDB(data: any): FormTemplate {
    const fields = data.fields ? data.fields.map((f: any) => formBuilderService.mapFormFieldFromDB(f)) : [];
    
    return {
      id: data.id,
      name: data.name,
      displayName: data.display_name,
      description: data.description,
      categoryId: data.category_id,
      categoryName: data.category_name,
      subcategoryId: data.subcategory_id,
      subcategoryName: data.subcategory_name,
      operationTypeId: data.operation_type_id,
      operationTypeName: data.operation_type_name,
      isActive: data.is_active,
      isDefault: data.is_default,
      priority: data.priority,
      fields: fields,
      fieldCount: data.field_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Mapea datos de BD a FormField
   */
  mapFormFieldFromDB(data: any): FormField {
    return {
      id: data.id,
      fieldName: data.field_name || data.fieldName,
      fieldLabel: data.field_label || data.fieldLabel,
      fieldType: data.field_type || data.fieldType,
      placeholder: data.placeholder,
      helpText: data.help_text || data.helpText,
      sectionName: data.section_name || data.sectionName,
      isRequired: data.is_required ?? data.isRequired ?? false,
      minValue: data.min_value ?? data.minValue,
      maxValue: data.max_value ?? data.maxValue,
      minLength: data.min_length ?? data.minLength,
      maxLength: data.max_length ?? data.maxLength,
      pattern: data.pattern,
      options: data.options,
      dependsOn: data.depends_on || data.dependsOn,
      showWhen: data.show_when || data.showWhen,
      displayOrder: data.display_order ?? data.displayOrder ?? 0,
      fieldWidth: data.field_width || data.fieldWidth || 'full',
    };
  },
};

export default formBuilderService;
