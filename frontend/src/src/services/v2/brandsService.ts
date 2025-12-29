// ============================================================================
// BRANDS SERVICE V2
// ============================================================================
// Servicio para gestionar marcas con datos precargados
// ============================================================================

import { supabase } from '../supabaseClient';
import type {
  BrandV2,
  CreateBrandDTO,
  UpdateBrandDTO,
  BrandFilters,
  ApiResponse,
} from '../../types/v2';

// ============================================================================
// LISTAR MARCAS
// ============================================================================

/**
 * Obtiene todas las marcas con filtros opcionales
 */
export async function getBrands(filters?: BrandFilters): Promise<BrandV2[]> {
  try {
    let query = supabase
      .from('brands_v2')
      .select('*')
      .order('name', { ascending: true });

    // Aplicar filtros
    if (filters?.category_id) {
      query = query.or(`category_id.eq.${filters.category_id},category_id.is.null`);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.country) {
      query = query.eq('country', filters.country);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching brands:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getBrands:', error);
    throw error;
  }
}

/**
 * Obtiene marcas por categoría ID o nombre
 */
export async function getBrandsByCategory(categoryIdOrName: string): Promise<BrandV2[]> {
  try {
    // Si es un UUID (tiene guiones), buscamos directamente por ID
    if (categoryIdOrName.includes('-')) {
      return getBrands({ category_id: categoryIdOrName, is_active: true });
    }
    
    // Si no, es un nombre de categoría
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryIdOrName)
      .single();

    if (catError) {
      console.error('❌ Category not found:', catError);
      throw catError;
    }

    // Luego obtenemos las marcas
    return getBrands({ category_id: category.id, is_active: true });
  } catch (error) {
    console.error('❌ Error in getBrandsByCategory:', error);
    throw error;
  }
}

/**
 * Obtiene una marca por ID
 */
export async function getBrandById(id: string): Promise<BrandV2 | null> {
  try {
    const { data, error } = await supabase
      .from('brands_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching brand:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getBrandById:', error);
    return null;
  }
}

/**
 * Busca marcas por nombre (para autocomplete)
 */
export async function searchBrands(
  searchTerm: string,
  categoryId?: string,
  limit: number = 10
): Promise<BrandV2[]> {
  try {
    let query = supabase
      .from('brands_v2')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (categoryId) {
      query = query.or(`category_id.eq.${categoryId},category_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error searching brands:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in searchBrands:', error);
    return [];
  }
}

// ============================================================================
// CREAR MARCA
// ============================================================================

/**
 * Crea una nueva marca
 */
export async function createBrand(
  brandData: CreateBrandDTO
): Promise<ApiResponse<BrandV2>> {
  try {
    // Validar datos requeridos
    if (!brandData.name || !brandData.display_name || !brandData.slug) {
      return {
        success: false,
        error: 'Nombre, display_name y slug son requeridos',
      };
    }

    // Insertar marca
    const { data, error } = await supabase
      .from('brands_v2')
      .insert([
        {
          ...brandData,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating brand:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Brand created:', data.name);
    return {
      success: true,
      data,
      message: 'Marca creada exitosamente',
    };
  } catch (error: any) {
    console.error('❌ Error in createBrand:', error);
    return {
      success: false,
      error: error.message || 'Error al crear marca',
    };
  }
}

// ============================================================================
// ACTUALIZAR MARCA
// ============================================================================

/**
 * Actualiza una marca existente
 */
export async function updateBrand(
  id: string,
  updates: UpdateBrandDTO
): Promise<ApiResponse<BrandV2>> {
  try {
    const { data, error } = await supabase
      .from('brands_v2')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating brand:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Brand updated:', data.name);
    return {
      success: true,
      data,
      message: 'Marca actualizada exitosamente',
    };
  } catch (error: any) {
    console.error('❌ Error in updateBrand:', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar marca',
    };
  }
}

// ============================================================================
// ELIMINAR MARCA
// ============================================================================

/**
 * Elimina una marca (soft delete: is_active = false)
 */
export async function deleteBrand(id: string): Promise<ApiResponse<void>> {
  try {
    // Primero verificar si tiene modelos asociados
    const { data: models, error: modelsError } = await supabase
      .from('models_v2')
      .select('id')
      .eq('brand_id', id)
      .limit(1);

    if (modelsError) {
      console.error('❌ Error checking models:', modelsError);
      return {
        success: false,
        error: modelsError.message,
      };
    }

    if (models && models.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar una marca que tiene modelos asociados',
      };
    }

    // Soft delete
    const { error } = await supabase
      .from('brands_v2')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting brand:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Brand deleted (soft):', id);
    return {
      success: true,
      message: 'Marca eliminada exitosamente',
    };
  } catch (error: any) {
    console.error('❌ Error in deleteBrand:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar marca',
    };
  }
}

/**
 * Elimina una marca permanentemente (HARD DELETE)
 * ⚠️ CUIDADO: Esto eliminará también todos los modelos asociados
 */
export async function hardDeleteBrand(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase.from('brands_v2').delete().eq('id', id);

    if (error) {
      console.error('❌ Error hard deleting brand:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Brand permanently deleted:', id);
    return {
      success: true,
      message: 'Marca eliminada permanentemente',
    };
  } catch (error: any) {
    console.error('❌ Error in hardDeleteBrand:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar marca',
    };
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera un slug a partir del nombre
 */
export function generateBrandSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales con -
    .replace(/^-+|-+$/g, ''); // Remover - al inicio y final
}

/**
 * Verifica si un slug ya existe
 */
export async function brandSlugExists(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  try {
    let query = supabase.from('brands_v2').select('id').eq('slug', slug);

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
    console.error('❌ Error in brandSlugExists:', error);
    return false;
  }
}

/**
 * Obtiene estadísticas de marcas
 */
export async function getBrandStats() {
  try {
    const { data: brands, error: brandsError } = await supabase
      .from('brands_v2')
      .select('id, is_active, category_id');

    if (brandsError) {
      console.error('❌ Error fetching brand stats:', brandsError);
      return null;
    }

    const total = brands?.length || 0;
    const active = brands?.filter((b) => b.is_active).length || 0;
    const byCategory = brands?.reduce((acc: Record<string, number>, brand) => {
      const catId = brand.category_id || 'global';
      acc[catId] = (acc[catId] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      active,
      inactive: total - active,
      byCategory,
    };
  } catch (error) {
    console.error('❌ Error in getBrandStats:', error);
    return null;
  }
}
