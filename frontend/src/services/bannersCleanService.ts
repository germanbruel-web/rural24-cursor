import { supabase } from '@/src/services/supabaseClient';
import type { BannerClean, CreateBannerCleanInput, UpdateBannerCleanInput } from '@/types';

// ====================================
// OBTENER BANNERS HERO VIP
// ====================================

export async function getHeroVIPBanners(category?: string): Promise<BannerClean[]> {
  try {
    const now = new Date().toISOString();

    // Query base
    let query = supabase
      .from('banners_clean')
      .select('*')
      .eq('placement', 'hero_vip')
      .eq('is_active', true);

    // Si hay categoría específica, filtrar por esa categoría O 'all'
    // Si no hay categoría, mostrar todos los banners hero_vip
    if (category && category !== 'all') {
      query = query.or(`category.eq.all,category.eq.${category}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filtrar por fechas en JS (más confiable que encadenar .or en Supabase)
    const filtered = (data || []).filter(banner => {
      const startsOk = !banner.starts_at || new Date(banner.starts_at) <= new Date(now);
      const expiresOk = !banner.expires_at || new Date(banner.expires_at) >= new Date(now);
      return startsOk && expiresOk;
    });

    return filtered;
  } catch (error) {
    console.error('[getHeroVIPBanners] Error:', error);
    throw error;
  }
}

// ====================================
// OBTENER BANNERS CARRUSEL CATEGORÍAS
// ====================================

export async function getCategoryCarouselBanners(category: string): Promise<BannerClean[]> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('banners_clean')
      .select('*')
      .eq('placement', 'category_carousel')
      .eq('is_active', true)
      .or(`category.eq.all,category.eq.${category}`)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getCategoryCarouselBanners] Error:', error);
    throw error;
  }
}

// ====================================
// OBTENER TODOS LOS BANNERS (ADMIN)
// ====================================

export async function getAllBannersClean(): Promise<BannerClean[]> {
  try {
    const { data, error } = await supabase
      .from('banners_clean')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[getAllBannersClean] Error:', error);
    throw error;
  }
}

// ====================================
// CREAR BANNER
// ====================================

export async function createBannerClean(input: CreateBannerCleanInput): Promise<BannerClean> {
  try {
    // Validar que las imágenes requeridas estén presentes
    if (input.placement === 'hero_vip') {
      if (!input.desktop_image_url || !input.mobile_image_url) {
        throw new Error('Hero VIP requiere desktop_image_url y mobile_image_url');
      }
    } else if (input.placement === 'category_carousel') {
      if (!input.carousel_image_url) {
        throw new Error('Category Carousel requiere carousel_image_url');
      }
    }

    // Validar client_name (requerido en DB)
    if (!input.client_name?.trim()) {
      throw new Error('client_name es requerido');
    }

    // Construir objeto limpio sin undefined
    const insertData: Record<string, unknown> = {
      placement: input.placement,
      category: input.category,
      client_name: input.client_name.trim(),
      is_active: input.is_active ?? true
    };

    // Solo agregar campos opcionales si tienen valor
    if (input.link_url) insertData.link_url = input.link_url;
    if (input.desktop_image_url) insertData.desktop_image_url = input.desktop_image_url;
    if (input.mobile_image_url) insertData.mobile_image_url = input.mobile_image_url;
    if (input.carousel_image_url) insertData.carousel_image_url = input.carousel_image_url;
    if (input.starts_at) insertData.starts_at = input.starts_at;
    if (input.expires_at) insertData.expires_at = input.expires_at;

    console.log('[createBannerClean] Insertando:', insertData);

    const { data, error } = await supabase
      .from('banners_clean')
      .insert([insertData])
      .select('*')
      .single();

    if (error) {
      console.error('[createBannerClean] Supabase error:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('[createBannerClean] Error:', error);
    throw error;
  }
}

// ====================================
// ACTUALIZAR BANNER
// ====================================

export async function updateBannerClean(
  id: string,
  input: UpdateBannerCleanInput
): Promise<BannerClean> {
  try {
    const { data, error } = await supabase
      .from('banners_clean')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[updateBannerClean] Error:', error);
    throw error;
  }
}

// ====================================
// ELIMINAR BANNER
// ====================================

export async function deleteBannerClean(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('banners_clean')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('[deleteBannerClean] Error:', error);
    throw error;
  }
}

// ====================================
// TOGGLE ACTIVAR/PAUSAR
// ====================================

export async function toggleBannerCleanActive(id: string, isActive: boolean): Promise<BannerClean> {
  try {
    const { data, error } = await supabase
      .from('banners_clean')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[toggleBannerCleanActive] Error:', error);
    throw error;
  }
}

// ====================================
// REGISTRAR IMPRESIÓN
// ====================================

export async function incrementBannerImpression(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_banner_impression', { banner_id: id });
  } catch (error) {
    console.error('[incrementBannerImpression] Error:', error);
  }
}

// ====================================
// REGISTRAR CLIC
// ====================================

export async function incrementBannerClick(id: string): Promise<void> {
  try {
    await supabase.rpc('increment_banner_click', { banner_id: id });
  } catch (error) {
    console.error('[incrementBannerClick] Error:', error);
  }
}
