// ============================================================================
// MODELS SERVICE V2
// ============================================================================
// Servicio para gestionar modelos de marcas
// ============================================================================

import { supabase } from '../supabaseClient';
import type {
  ModelV2,
  BrandV2,
  CreateModelDTO,
  UpdateModelDTO,
  ModelFilters,
  ApiResponse,
} from '../../types/v2';

// ============================================================================
// LISTAR MODELOS
// ============================================================================

/**
 * Obtiene todos los modelos con filtros opcionales
 */
export async function getModels(
  filters?: ModelFilters
): Promise<ModelV2[]> {
  try {
    let query = supabase
      .from('models_v2')
      .select(`
        *,
        brand:brands_v2!models_v2_brand_id_fkey(*)
      `)
      .order('name', { ascending: true });

    // Aplicar filtros
    if (filters?.brand_id) {
      query = query.eq('brand_id', filters.brand_id);
    }

    if (filters?.category_type_id) {
      query = query.eq('category_type_id', filters.category_type_id);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.year_from) {
      query = query.gte('year_from', filters.year_from);
    }

    if (filters?.year_to) {
      query = query.lte('year_to', filters.year_to);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching models:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getModels:', error);
    throw error;
  }
}

/**
 * Obtiene modelos por marca
 */
export async function getModelsByBrand(brandId: string): Promise<ModelV2[]> {
  try {
    return getModels({ brand_id: brandId, is_active: true });
  } catch (error) {
    console.error('❌ Error in getModelsByBrand:', error);
    throw error;
  }
}

/**
 * Obtiene un modelo por ID
 */
export async function getModelById(id: string): Promise<ModelV2 | null> {
  try {
    const { data, error } = await supabase
      .from('models_v2')
      .select(`
        *,
        brand:brands_v2!models_v2_brand_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching model:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getModelById:', error);
    return null;
  }
}

/**
 * Busca modelos por nombre (para autocomplete)
 */
export async function searchModels(
  searchTerm: string,
  brandId?: string,
  limit: number = 10
): Promise<ModelV2[]> {
  try {
    let query = supabase
      .from('models_v2')
      .select(`
        *,
        brand:brands_v2!models_v2_brand_id_fkey(*)
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error searching models:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in searchModels:', error);
    return [];
  }
}

/**
 * Obtiene modelos populares (los más usados en avisos)
 */
export async function getPopularModels(
  categoryId?: string,
  limit: number = 10
): Promise<ModelV2[]> {
  try {
    // Query para obtener modelos más usados
    let query = supabase.rpc('get_popular_models_v2', {
      p_limit: limit,
      p_category_id: categoryId || null,
    });

    const { data, error } = await query;

    if (error) {
      // Si la función no existe, fallback a query simple
      console.warn('⚠️ RPC function not found, using fallback');
      return getModels({ is_active: true });
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getPopularModels:', error);
    return [];
  }
}

// ============================================================================
// CREAR MODELO
// ============================================================================

/**
 * Crea un nuevo modelo
 */
export async function createModel(
  modelData: CreateModelDTO
): Promise<ApiResponse<ModelV2>> {
  try {
    // Validar datos requeridos
    if (
      !modelData.brand_id ||
      !modelData.name ||
      !modelData.display_name ||
      !modelData.slug
    ) {
      return {
        success: false,
        error: 'brand_id, name, display_name y slug son requeridos',
      };
    }

    // Verificar que la marca existe
    const { data: brand, error: brandError } = await supabase
      .from('brands_v2')
      .select('id')
      .eq('id', modelData.brand_id)
      .single();

    if (brandError || !brand) {
      return {
        success: false,
        error: 'La marca especificada no existe',
      };
    }

    // Insertar modelo
    const { data, error } = await supabase
      .from('models_v2')
      .insert([
        {
          ...modelData,
          is_active: true,
        },
      ])
      .select(`
        *,
        brand:brands_v2!models_v2_brand_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error creating model:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Model created:', data.name);
    return {
      success: true,
      data,
      message: 'Modelo creado exitosamente',
    };
  } catch (error: any) {
    console.error('❌ Error in createModel:', error);
    return {
      success: false,
      error: error.message || 'Error al crear modelo',
    };
  }
}

// ============================================================================
// ACTUALIZAR MODELO
// ============================================================================

/**
 * Actualiza un modelo existente
 */
export async function updateModel(
  id: string,
  updates: UpdateModelDTO
): Promise<ApiResponse<ModelV2>> {
  try {
    const { data, error } = await supabase
      .from('models_v2')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        brand:brands_v2!models_v2_brand_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating model:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Model updated:', data.name);
    return {
      success: true,
      data,
      message: 'Modelo actualizado exitosamente',
    };
  } catch (error: any) {
    console.error('❌ Error in updateModel:', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar modelo',
    };
  }
}

// ============================================================================
// ELIMINAR MODELO
// ============================================================================

/**
 * Elimina un modelo (soft delete: is_active = false)
 */
export async function deleteModel(id: string): Promise<ApiResponse<void>> {
  try {
    // Verificar si está siendo usado en avisos
    const { data: ads, error: adsError } = await supabase
      .from('ads_v2')
      .select('id')
      .eq('model_id', id)
      .limit(1);

    if (adsError) {
      console.error('❌ Error checking ads:', adsError);
      return {
        success: false,
        error: adsError.message,
      };
    }

    if (ads && ads.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar un modelo que está siendo usado en avisos',
      };
    }

    // Soft delete
    const { error } = await supabase
      .from('models_v2')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting model:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Model deleted (soft):', id);
    return {
      success: true,
      message: 'Modelo eliminado exitosamente',
    };
  } catch (error: any) {
    console.error('❌ Error in deleteModel:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar modelo',
    };
  }
}

/**
 * Elimina un modelo permanentemente (HARD DELETE)
 */
export async function hardDeleteModel(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.from('models_v2').delete().eq('id', id);

    if (error) {
      console.error('❌ Error hard deleting model:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Model permanently deleted:', id);
    return {
      success: true,
      message: 'Modelo eliminado permanentemente',
    };
  } catch (error: any) {
    console.error('❌ Error in hardDeleteModel:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar modelo',
    };
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera un slug a partir del nombre del modelo
 */
export function generateModelSlug(brandName: string, modelName: string): string {
  const combined = `${brandName}-${modelName}`;
  return combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Verifica si un slug ya existe para esa marca
 */
export async function modelSlugExists(
  brandId: string,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('models_v2')
      .select('id')
      .eq('brand_id', brandId)
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error('❌ Error checking slug:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('❌ Error in modelSlugExists:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de modelos
 */
export async function getModelStats() {
  try {
    const { data: models, error: modelsError } = await supabase
      .from('models_v2')
      .select('id, is_active, brand_id');

    if (modelsError) {
      console.error('❌ Error fetching model stats:', modelsError);
      return null;
    }

    const total = models?.length || 0;
    const active = models?.filter((m) => m.is_active).length || 0;
    const byBrand = models?.reduce((acc: Record<string, number>, model) => {
      acc[model.brand_id] = (acc[model.brand_id] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      active,
      inactive: total - active,
      byBrand,
    };
  } catch (error) {
    console.error('❌ Error in getModelStats:', error);
    return null;
  }
}

/**
 * Importa modelos desde un array (bulk insert)
 */
export async function bulkImportModels(
  models: CreateModelDTO[]
): Promise<ApiResponse<ModelV2[]>> {
  try {
    if (!models || models.length === 0) {
      return {
        success: false,
        error: 'No hay modelos para importar',
      };
    }

    const { data, error } = await supabase
      .from('models_v2')
      .insert(
        models.map((m) => ({
          ...m,
          is_active: true,
        }))
      )
      .select(`
        *,
        brand:brands_v2!models_v2_brand_id_fkey(*)
      `);

    if (error) {
      console.error('❌ Error bulk importing models:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`✅ ${data.length} models imported`);
    return {
      success: true,
      data,
      message: `${data.length} modelos importados exitosamente`,
    };
  } catch (error: any) {
    console.error('❌ Error in bulkImportModels:', error);
    return {
      success: false,
      error: error.message || 'Error al importar modelos',
    };
  }
}
