// src/services/bannersService.ts
import { supabase } from './supabaseClient';
import type { Banner, CreateBannerInput, UpdateBannerInput, BannerType, BannerPosition } from '../../types';

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
    if (!await isSuperAdmin()) {
      return { banner: null, error: { message: 'Acceso denegado. Solo SuperAdmin' } };
    }

    const { data, error } = await supabase
      .from('banners')
      .insert({
        ...input,
        is_active: input.is_active ?? true,
        display_order: input.display_order ?? 0,
      })
      .select()
      .single();

    if (error) return { banner: null, error };
    return { banner: data as Banner, error: null };
  } catch (error) {
    console.error('Error creating banner:', error);
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
      .order('display_order');

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
      .order('display_order');

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
 * Obtener banners del buscador dinámico (Homepage - Posición 1)
 * Máximo 6 categorías - 1200x200
 */
export async function getHomepageSearchBanners(category?: string, deviceTarget: 'desktop' | 'mobile' = 'desktop'): Promise<Banner[]> {
  try {
    let query = supabase
      .from('banners')
      .select('*')
      .eq('type', 'homepage_search')
      .eq('is_active', true)
      .in('device_target', [deviceTarget, 'both'])
      .order('display_order')
      .limit(6);

    if (category) {
      query = query.or(`category.eq.${category},category.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('⚠️ Error fetching homepage search banners (non-blocking):', error);
      return [];
    }

    return data as Banner[];
  } catch (error) {
    console.warn('⚠️ Error fetching homepage search banners (non-blocking):', error);
    return [];
  }
}

/**
 * Obtener banners del carrusel de categorías (Homepage - Posición 2)
 * Máximo 6 categorías - 648x100
 */
export async function getHomepageCarouselBanners(category?: string, deviceTarget: 'desktop' | 'mobile' = 'desktop'): Promise<Banner[]> {
  try {
    let query = supabase
      .from('banners')
      .select('*')
      .eq('type', 'homepage_carousel')
      .eq('is_active', true)
      .in('device_target', [deviceTarget, 'both'])
      .order('display_order')
      .limit(6);

    if (category) {
      query = query.or(`category.eq.${category},category.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching homepage carousel banners:', error);
      return [];
    }

    return data as Banner[];
  } catch (error) {
    console.error('Error fetching homepage carousel banners:', error);
    return [];
  }
}

/**
 * Obtener banner random intercalado (Resultados - Posición 3)
 * Se muestra cada 5 resultados - 648x100
 */
export async function getRandomIntercalatedBanner(category?: string, deviceTarget: 'desktop' | 'mobile' = 'desktop'): Promise<Banner | null> {
  try {
    // Usar función SQL para obtener random
    const { data, error } = await supabase
      .rpc('get_random_intercalated_banner', {
        p_category: category || null,
      });

    if (error) {
      console.error('Error fetching random intercalated banner:', error);
      return null;
    }

    const banner = (data?.[0] as Banner) || null;
    // Filtrar por dispositivo
    if (banner && (banner.device_target === deviceTarget || banner.device_target === 'both')) {
      return banner;
    }

    return null;
  } catch (error) {
    console.error('Error fetching random intercalated banner:', error);
    return null;
  }
}

/**
 * Obtener banners laterales rotativos (Resultados - Posición 4)
 * Ordenados por posición A-B-C-D
 */
export async function getLateralBanners(category?: string, deviceTarget: 'desktop' | 'mobile' = 'desktop'): Promise<Banner[]> {
  try {
    // Usar función SQL para obtener ordenados por posición
    const { data, error } = await supabase
      .rpc('get_lateral_banners', {
        p_category: category || null,
      });

    if (error) {
      console.error('Error fetching lateral banners:', error);
      return [];
    }

    // Filtrar por dispositivo
    const filtered = (data as Banner[]).filter(
      banner => banner.device_target === deviceTarget || banner.device_target === 'both'
    );

    return filtered;
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
