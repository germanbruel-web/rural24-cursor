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
  banner_url?: string;
  subcategories: Array<{ id: string; name: string; slug: string }>;
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

    // 2. Por cada categoría, obtener avisos destacados
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

        return {
          category_id: cat.id,
          category_name: cat.display_name || cat.name,
          category_slug: cat.name,
          banner_url: undefined,
          subcategories: [],
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
