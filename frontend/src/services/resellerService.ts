// ============================================================================
// RESELLER SERVICE — Puntos de Venta
// ============================================================================
// CRUD para gestionar los puntos de venta de un Revendedor
// ============================================================================

import { supabase } from './supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface PointOfSale {
  id: string;
  revendedor_id: string;
  managed_user_id: string | null;
  name: string;
  logo_url: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  category_ids: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  ads_count?: number;
  managed_user?: {
    email: string;
    full_name: string;
  };
}

export interface CreatePointOfSaleData {
  name: string;
  logo_url?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  category_ids?: string[];
  notes?: string | null;
}

export interface UpdatePointOfSaleData extends Partial<CreatePointOfSaleData> {
  is_active?: boolean;
}

// ============================================================================
// CRUD
// ============================================================================

/**
 * Obtener todos los puntos de venta del revendedor actual
 */
export async function getMyPointsOfSale(): Promise<PointOfSale[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('reseller_points_of_sale')
      .select(`
        *,
        managed_user:users!reseller_points_of_sale_managed_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('revendedor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with ads count per PdV
    const enriched = await Promise.all(
      (data || []).map(async (pos) => {
        let ads_count = 0;
        if (pos.managed_user_id) {
          const { count } = await supabase
            .from('ads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', pos.managed_user_id)
            .in('status', ['active', 'paused']);
          ads_count = count || 0;
        }
        return { ...pos, ads_count } as PointOfSale;
      })
    );

    return enriched;
  } catch (error) {
    console.error('Error getting points of sale:', error);
    return [];
  }
}

/**
 * Obtener un punto de venta por ID
 */
export async function getPointOfSale(id: string): Promise<PointOfSale | null> {
  try {
    const { data, error } = await supabase
      .from('reseller_points_of_sale')
      .select(`
        *,
        managed_user:users!reseller_points_of_sale_managed_user_id_fkey (
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as PointOfSale;
  } catch (error) {
    console.error('Error getting point of sale:', error);
    return null;
  }
}

/**
 * Crear un nuevo punto de venta
 */
export async function createPointOfSale(posData: CreatePointOfSaleData): Promise<{ data: PointOfSale | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'No autenticado' };

    const { data, error } = await supabase
      .from('reseller_points_of_sale')
      .insert({
        revendedor_id: user.id,
        name: posData.name,
        logo_url: posData.logo_url || null,
        province: posData.province || null,
        city: posData.city || null,
        address: posData.address || null,
        contact_name: posData.contact_name || null,
        contact_phone: posData.contact_phone || null,
        contact_email: posData.contact_email || null,
        category_ids: posData.category_ids || [],
        notes: posData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as PointOfSale, error: null };
  } catch (error: any) {
    console.error('Error creating point of sale:', error);
    return { data: null, error: error.message || 'Error al crear punto de venta' };
  }
}

/**
 * Actualizar un punto de venta
 */
export async function updatePointOfSale(id: string, updates: UpdatePointOfSaleData): Promise<{ data: PointOfSale | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('reseller_points_of_sale')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as PointOfSale, error: null };
  } catch (error: any) {
    console.error('Error updating point of sale:', error);
    return { data: null, error: error.message || 'Error al actualizar punto de venta' };
  }
}

/**
 * Eliminar un punto de venta
 */
export async function deletePointOfSale(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('reseller_points_of_sale')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting point of sale:', error);
    return { error: error.message || 'Error al eliminar punto de venta' };
  }
}

/**
 * Toggle activo/inactivo
 */
export async function togglePointOfSale(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const { error } = await updatePointOfSale(id, { is_active: isActive });
  return { error };
}

/**
 * Obtener estadísticas del revendedor
 */
export async function getResellerStats(): Promise<{
  totalPoints: number;
  activePoints: number;
  totalAds: number;
  activeAds: number;
  featuredAds: number;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalPoints: 0, activePoints: 0, totalAds: 0, activeAds: 0, featuredAds: 0 };

    // Get points of sale
    const { data: points } = await supabase
      .from('reseller_points_of_sale')
      .select('id, is_active, managed_user_id')
      .eq('revendedor_id', user.id);

    const allPoints = points || [];
    const activePointIds = allPoints.filter(p => p.is_active);

    // Get all managed user IDs (including revendedor's own)
    const managedUserIds = [
      user.id,
      ...allPoints.map(p => p.managed_user_id).filter(Boolean),
    ];

    // Count ads
    const { count: totalAds } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .in('user_id', managedUserIds);

    const { count: activeAds } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .in('user_id', managedUserIds)
      .eq('status', 'active');

    // Count featured
    const { count: featuredAds } = await supabase
      .from('featured_ads')
      .select('*', { count: 'exact', head: true })
      .in('user_id', managedUserIds)
      .eq('status', 'active');

    return {
      totalPoints: allPoints.length,
      activePoints: activePointIds.length,
      totalAds: totalAds || 0,
      activeAds: activeAds || 0,
      featuredAds: featuredAds || 0,
    };
  } catch (error) {
    console.error('Error getting reseller stats:', error);
    return { totalPoints: 0, activePoints: 0, totalAds: 0, activeAds: 0, featuredAds: 0 };
  }
}
