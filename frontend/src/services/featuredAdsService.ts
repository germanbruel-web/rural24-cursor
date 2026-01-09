/**
 * Servicio de Avisos Destacados
 * Gestiona avisos marcados para homepage por superadmin
 */

import { supabase } from './supabaseClient';
import type { Ad } from '../../types';

export interface FeaturedAdsByCategory {
  category_id: string;
  category_name: string;
  category_slug: string;
  banners: Array<{
    id: string;
    image_url: string;
    link_url?: string;
    title: string;
  }>;
  subcategories: Array<{ 
    id: string; 
    name: string; 
    slug: string; 
    ads_count: number;
    icon?: string;
  }>;
  ads: Ad[];
  total_featured: number;
}

/**
 * Obtiene avisos destacados agrupados por categoría principal
 * @param limit Número máximo de avisos por categoría (default: 8)
 */
export async function getFeaturedAdsByCategories(
  limit: number = 8
): Promise<FeaturedAdsByCategory[]> {
  try {
    console.log('🔍 getFeaturedAdsByCategories - START');
    
    // 1. Obtener todas las categorías activas
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, display_name, icon')
      .eq('is_active', true)
      .order('sort_order');

    console.log('📦 Categories fetched:', { count: categories?.length, error: catError });

    if (catError) throw catError;
    if (!categories) return [];

    // 2. Por cada categoría, obtener avisos destacados, subcategorías y banner
    const results = await Promise.all(
      categories.map(async (cat) => {
        // 2a. Avisos destacados con orden manual
        const { data: ads, error: adsError } = await supabase
          .from('ads')
          .select('*')
          .eq('featured', true)
          .eq('category_id', cat.id)
          .eq('status', 'active')
          .order('featured_order', { ascending: true })
          .limit(limit);

        console.log(`📋 Ads for ${cat.name}:`, { count: ads?.length, error: adsError });

        if (adsError) {
          console.error(`❌ Error fetching ads for ${cat.name}:`, adsError);
        }

        // 2b. Obtener subcategorías con contadores de avisos activos
        const { data: subcategories, error: subError } = await supabase
          .from('subcategories')
          .select('id, name, display_name, icon, sort_order')
          .eq('category_id', cat.id)
          .eq('is_active', true)
          .order('sort_order');

        if (subError) {
          console.error(`❌ Error fetching subcategories for ${cat.name}:`, subError);
        }

        // 2b-bis. Contar avisos activos por subcategoría
        const subcategoriesWithCounts = await Promise.all(
          (subcategories || []).map(async (sub) => {
            const { count, error: countError } = await supabase
              .from('ads')
              .select('*', { count: 'exact', head: true })
              .eq('subcategory_id', sub.id)
              .eq('status', 'active');

            if (countError) {
              console.error(`❌ Error counting ads for subcategory ${sub.name}:`, countError);
            }

            return {
              id: sub.id,
              name: sub.display_name || sub.name,
              slug: sub.name,
              ads_count: count || 0,
              icon: sub.icon
            };
          })
        );

        // 2c. Obtener TODOS los banners activos de esta categoría (type: category_header)
        const { data: banners, error: bannerError } = await supabase
          .from('banners')
          .select('id, image_url, link_url, title')
          .eq('type', 'category_header')
          .eq('category', cat.name)
          .eq('is_active', true)
          .order('is_priority', { ascending: false })
          .order('priority_weight', { ascending: false })
          .order('display_order');

        if (bannerError) {
          console.error(`❌ Error fetching banners for ${cat.name}:`, bannerError);
        }

        return {
          category_id: cat.id,
          category_name: cat.display_name || cat.name,
          category_slug: cat.name,
          banners: banners || [],
          subcategories: subcategoriesWithCounts,
          ads: ads || [],
          total_featured: ads?.length || 0
        };
      })
    );

    const filtered = results.filter(r => r.ads.length > 0);
    console.log('✅ Final results:', { totalCategories: results.length, withAds: filtered.length });

    // 3. Filtrar categorías sin avisos destacados
    return filtered;
    
  } catch (error) {
    console.error('❌ Error in getFeaturedAdsByCategories:', error);
    return [];
  }
}

/**
 * Marca/desmarca un aviso como destacado (solo superadmin)
 */
export async function toggleFeaturedAd(
  adId: string,
  featured: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ads')
      .update({ 
        featured: featured
        // featured_order y featured_at se gestionan automáticamente por trigger
      })
      .eq('id', adId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling featured ad:', error);
    return { 
      success: false, 
      error: error.message || 'Error al actualizar aviso' 
    };
  }
}

/**
 * Reordena avisos destacados de una categoría (drag & drop)
 */
export async function reorderFeaturedAds(
  categoryId: string,
  orderedAdIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = orderedAdIds.map((adId, index) => ({
      id: adId,
      featured_order: index + 1
    }));

    const { error } = await supabase
      .from('ads')
      .upsert(
        updates.map(u => ({ 
          id: u.id, 
          featured_order: u.featured_order 
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error reordering featured ads:', error);
    return { 
      success: false, 
      error: error.message || 'Error al reordenar avisos' 
    };
  }
}

/**
 * Obtiene todos los avisos destacados (para panel admin)
 */
export async function getAllFeaturedAds(): Promise<Ad[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select(`
        *,
        category:category_id (name),
        seller:user_id (full_name, email)
      `)
      .eq('featured', true)
      .order('category_id')
      .order('featured_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all featured ads:', error);
    return [];
  }
}
