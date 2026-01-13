// src/services/bannersService.ts
import { supabase } from './supabaseClient';
import type { Banner, CreateBannerInput, UpdateBannerInput, BannerType } from '../../types';

/**
 * Verificar si el usuario es SuperAdmin
 */
async function isSuperAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return false;
    }

    console.log('👤 Usuario autenticado:', user.id, user.email);

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Error obteniendo rol del usuario:', error);
      return false;
    }

    console.log('🔐 Rol del usuario:', data?.role);
    return data?.role === 'superadmin';
  } catch (error) {
    console.error('❌ Error en isSuperAdmin:', error);
    return false;
  }
}

// ==================== ADMIN CRUD ====================

/**
 * Crear banner (Solo SuperAdmin)
 */
export async function createBanner(input: CreateBannerInput): Promise<{ banner: Banner | null; error: any }> {
  try {
    console.log('🔐 Verificando permisos SuperAdmin...');
    const isAdmin = await isSuperAdmin();
    console.log('✅ Permisos verificados:', isAdmin);
    
    if (!isAdmin) {
      console.error('❌ Acceso denegado - No es SuperAdmin');
      return { banner: null, error: { message: 'Acceso denegado. Solo SuperAdmin', code: 'FORBIDDEN' } };
    }

    console.log('📤 Enviando INSERT a Supabase:', input);
    
    const { data, error } = await supabase
      .from('banners')
      .insert({
        ...input,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase retornó error:', error);
      return { banner: null, error };
    }
    
    console.log('✅ Banner creado exitosamente:', data);
    return { banner: data as Banner, error: null };
  } catch (error) {
    console.error('💥 Excepción capturada en createBanner:', error);
    return { banner: null, error };
  }
}

/**
 * Obtener todos los banners (solo superadmin)
 */
export async function getBanners(): Promise<Banner[]> {
  try {
    if (!await isSuperAdmin()) {
      return [];
    }

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('type')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching banners:', error);
      return [];
    }

    return data as Banner[];
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
}

/**
 * Obtener banners por tipo (solo superadmin)
 */
export async function getBannersByType(type: BannerType): Promise<Banner[]> {
  try {
    if (!await isSuperAdmin()) {
      return [];
    }

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching banners by type:', error);
      return [];
    }

    return data as Banner[];
  } catch (error) {
    console.error('Error fetching banners by type:', error);
    return [];
  }
}

// ==================== PUBLIC QUERIES ====================

/**
 * Obtener banners VIP (Homepage - Hero Principal)
 * Sin categoría: Solo destacados (is_featured)
 * Con categoría: Todos los banners de esa categoría
 * Auto-filtra: expirados y no iniciados
 */
export async function getHomepageBanners(category?: string): Promise<Banner[]> {
  try {
    const now = new Date().toISOString();
    
    // Construir query base - NO usar múltiples .or() (Supabase solo permite uno)
    // En lugar de filtrar expires_at y starts_at con .or(), lo hacemos post-fetch
    let query = supabase
      .from('banners')
      .select('*')
      .eq('type', 'homepage_vip')
      .eq('is_active', true);

    // SIN CATEGORÍA (al cargar página): Solo destacados
    if (!category) {
      query = query.eq('is_featured', true);
    } 
    // CON CATEGORÍA (hover en botón): Todos los de esa categoría
    else {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching homepage banners:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Filtrar expirados y no iniciados en el cliente
    const nowDate = new Date(now);
    const filtered = (data as Banner[]).filter(banner => {
      // Filtrar expirados
      if (banner.expires_at && new Date(banner.expires_at) < nowDate) return false;
      // Filtrar no iniciados
      if (banner.starts_at && new Date(banner.starts_at) > nowDate) return false;
      return true;
    });

    // Ordenar: destacados primero, luego por fecha
    const sorted = filtered.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return sorted.slice(0, 6);
  } catch (error) {
    console.error('Error fetching homepage banners:', error);
    return [];
  }
}

/**
 * Obtener banner random intercalado (Resultados - Posición 3)
 */
export async function getResultsIntercalatedBanner(category?: string): Promise<Banner | null> {
  try {
    let query = supabase
      .from('banners')
      .select('*')
      .eq('type', 'results_intercalated')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.or(`category.eq.${category},category.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching intercalated banner:', error);
      return null;
    }

    // Seleccionar uno random
    if (!data || data.length === 0) return null;
    const randomBanner = data[Math.floor(Math.random() * data.length)];
    return randomBanner as Banner;
  } catch (error) {
    console.error('Error fetching intercalated banner:', error);
    return null;
  }
}

/**
 * Obtener banners laterales (Resultados - Posición 4)
 */
export async function getResultsLateralBanners(category?: string): Promise<Banner[]> {
  try {
    let query = supabase
      .from('banners')
      .select('*')
      .eq('type', 'results_lateral')
      .eq('is_active', true)
      .order('position')
      .order('display_order')
      .limit(4);

    if (category) {
      query = query.or(`category.eq.${category},category.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching lateral banners:', error);
      return [];
    }
    return data as Banner[];
  } catch (error) {
    console.error('Error fetching lateral banners:', error);
    return [];
  }
}

/**
 * Obtener banner por ID
 */
export async function getBannerById(id: string): Promise<{ banner: Banner | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { banner: null, error };
    return { banner: data as Banner, error: null };
  } catch (error) {
    console.error('Error fetching banner:', error);
    return { banner: null, error };
  }
}

/**
 * Actualizar banner (Solo SuperAdmin)
 */
export async function updateBanner(
  id: string, 
  updates: UpdateBannerInput
): Promise<{ banner: Banner | null; error: any }> {
  try {
    if (!await isSuperAdmin()) {
      return { banner: null, error: { message: 'Acceso denegado. Solo SuperAdmin' } };
    }

    const { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { banner: null, error };
    return { banner: data as Banner, error: null };
  } catch (error) {
    console.error('Error updating banner:', error);
    return { banner: null, error };
  }
}

/**
 * Eliminar banner (Solo SuperAdmin)
 */
export async function deleteBanner(id: string): Promise<{ error: any }> {
  try {
    if (!await isSuperAdmin()) {
      return { error: { message: 'Acceso denegado. Solo SuperAdmin' } };
    }

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) return { error };
    return { error: null };
  } catch (error) {
    console.error('Error deleting banner:', error);
    return { error };
  }
}

/**
 * Activar/Desactivar banner (Solo SuperAdmin)
 */
export async function toggleBannerStatus(id: string, isActive: boolean): Promise<{ error: any }> {
  try {
    if (!await isSuperAdmin()) {
      return { error: { message: 'Acceso denegado. Solo SuperAdmin' } };
    }

    const { error } = await supabase
      .from('banners')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) return { error };
    return { error: null };
  } catch (error) {
    console.error('Error toggling banner status:', error);
    return { error };
  }
}

/**
 * Actualizar orden de visualización
 */
export async function updateBannerOrder(id: string, displayOrder: number): Promise<{ error: any }> {
  try {
    if (!await isSuperAdmin()) {
      return { error: { message: 'Acceso denegado. Solo SuperAdmin' } };
    }

    const { error } = await supabase
      .from('banners')
      .update({ display_order: displayOrder })
      .eq('id', id);

    if (error) return { error };
    return { error: null };
  } catch (error) {
    console.error('Error updating banner order:', error);
    return { error };
  }
}

// ==================== LEGACY FUNCTIONS (NO USAR - Columnas eliminadas) ====================

/**
 * @deprecated Columnas is_priority y priority_weight eliminadas en migración 2026-01-10
 * Activar/Desactivar prioridad de banner (Solo SuperAdmin)
 * Cuando se activa como prioritario, opcionalmente desactiva otros de la misma posición
 */
export async function toggleBannerPriority(
  id: string, 
  isPriority: boolean, 
  priorityWeight: number = 100,
  deselectOthers: boolean = false
): Promise<{ error: any }> {
  console.warn('⚠️ toggleBannerPriority está deprecada. Usar is_featured en su lugar.');
  return { error: { message: 'Función deprecada. Columnas eliminadas.' } };
  
  /* CÓDIGO ORIGINAL COMENTADO - NO FUNCIONA
  try {
    if (!await isSuperAdmin()) {
      return { error: { message: 'Acceso denegado. Solo SuperAdmin' } };
    }

    // Si se activa prioridad y se desean desactivar otros
    if (isPriority && deselectOthers) {
      // Primero obtener el banner para saber su posición
      const { data: banner, error: fetchError } = await supabase
        .from('banners')
        .select('position')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching banner position:', fetchError);
        return { error: fetchError };
      }

      // Desactivar prioridad de otros banners de la misma posición
      if (banner?.position) {
        await supabase
          .from('banners')
          .update({ is_priority: false, priority_weight: 0 })
          .eq('position', banner.position)
          .neq('id', id);
      }
    }

    // Actualizar el banner actual
    const { error } = await supabase
      .from('banners')
      .update({ 
        is_priority: isPriority,
        priority_weight: isPriority ? priorityWeight : 0
      })
      .eq('id', id);

    if (error) return { error };
    return { error: null };
  } catch (error) {
    console.error('Error toggling banner priority:', error);
    return { error };
  }
  */
}

/**
 * Obtener estadísticas de banners prioritarios
 */
export async function getBannerPriorityStats(): Promise<{
  totalBanners: number;
  activeBanners: number;
  priorityBanners: number;
  priorityActiveByPosition: Record<string, number>;
}> {
  try {
    if (!await isSuperAdmin()) {
      return {
        totalBanners: 0,
        activeBanners: 0,
        priorityBanners: 0,
        priorityActiveByPosition: {}
      };
    }

    const { data, error } = await supabase
      .from('banners')
      .select('is_active, is_priority, position');

    if (error) {
      console.error('Error fetching banner stats:', error);
      return {
        totalBanners: 0,
        activeBanners: 0,
        priorityBanners: 0,
        priorityActiveByPosition: {}
      };
    }

    const stats = {
      totalBanners: data.length,
      activeBanners: data.filter(b => b.is_active).length,
      priorityBanners: data.filter(b => b.is_priority).length,
      priorityActiveByPosition: {} as Record<string, number>
    };

    // Contar prioritarios activos por posición
    data
      .filter(b => b.is_active && b.is_priority && b.position)
      .forEach(b => {
        const pos = b.position as string;
        stats.priorityActiveByPosition[pos] = (stats.priorityActiveByPosition[pos] || 0) + 1;
      });

    return stats;
  } catch (error) {
    console.error('Error fetching banner stats:', error);
    return {
      totalBanners: 0,
      activeBanners: 0,
      priorityBanners: 0,
      priorityActiveByPosition: {}
    };
  }
}

