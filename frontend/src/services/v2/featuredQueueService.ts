/**
 * Featured Queue Service
 * Gestión de cola de avisos destacados con programación de fechas
 */

import { supabase } from '../supabaseClient';
import { getSettingNumber } from './globalSettingsService';

// ============================================================================
// TIPOS
// ============================================================================

export interface FeaturedQueueEntry {
  id: string;
  ad_id: string;
  category_id: string;
  user_id: string;
  requested_at: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: 'queued' | 'scheduled' | 'active' | 'completed' | 'cancelled' | 'expired';
  payment_id: string | null;
  notified_start: boolean;
  notified_end_soon: boolean;
  notified_end: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  ad_title?: string;
  ad_slug?: string;
  category_name?: string;
  user_email?: string;
  user_name?: string;
}

export interface CategorySlotsSummary {
  category_id: string;
  category_name: string;
  active_count: number;
  scheduled_count: number;
  queued_count: number;
  max_slots: number;
  available_slots: number;
  next_available_date: string | null;
}

export interface AvailableSlot {
  date: string;
  available_count: number;
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Solicitar destacar un aviso (usuario)
 * Crea una entrada en cola pendiente de asignación
 */
export async function requestFeatured(adId: string): Promise<FeaturedQueueEntry | null> {
  // Obtener datos del aviso
  const { data: ad, error: adError } = await supabase
    .from('ads')
    .select('id, category_id, user_id')
    .eq('id', adId)
    .single();

  if (adError || !ad) {
    console.error('Error getting ad:', adError);
    return null;
  }

  // Crear entrada en cola
  const { data, error } = await supabase
    .from('featured_ads_queue')
    .insert({
      ad_id: adId,
      category_id: ad.category_id,
      user_id: ad.user_id,
      status: 'queued'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating queue entry:', error);
    return null;
  }

  return data;
}

/**
 * Obtener resumen de slots por categoría (SuperAdmin)
 */
export async function getCategoriesSlotsSummary(): Promise<CategorySlotsSummary[]> {
  const maxSlots = await getSettingNumber('featured_max_per_category', 10);

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, display_name')
    .eq('is_active', true)
    .order('sort_order');

  if (catError || !categories) {
    console.error('Error getting categories:', catError);
    return [];
  }

  const results: CategorySlotsSummary[] = [];

  for (const cat of categories) {
    // Contar por status
    const { data: queue } = await supabase
      .from('featured_ads_queue')
      .select('status, scheduled_end')
      .eq('category_id', cat.id)
      .in('status', ['active', 'scheduled', 'queued']);

    const active = queue?.filter(q => q.status === 'active').length || 0;
    const scheduled = queue?.filter(q => q.status === 'scheduled').length || 0;
    const queued = queue?.filter(q => q.status === 'queued').length || 0;

    // Calcular próxima fecha disponible
    let nextAvailable: string | null = null;
    if (active >= maxSlots) {
      // Buscar la fecha de fin más cercana de un slot activo
      const activeSlots = queue?.filter(q => q.status === 'active' && q.scheduled_end) || [];
      const sortedEnds = activeSlots
        .map(s => s.scheduled_end!)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      if (sortedEnds.length > 0) {
        const nextDate = new Date(sortedEnds[0]);
        nextDate.setDate(nextDate.getDate() + 1);
        nextAvailable = nextDate.toISOString().split('T')[0];
      }
    }

    results.push({
      category_id: cat.id,
      category_name: cat.display_name,
      active_count: active,
      scheduled_count: scheduled,
      queued_count: queued,
      max_slots: maxSlots,
      available_slots: Math.max(0, maxSlots - active),
      next_available_date: active >= maxSlots ? nextAvailable : null
    });
  }

  return results;
}

/**
 * Obtener cola completa de una categoría (SuperAdmin)
 */
export async function getQueueByCategory(
  categoryId: string, 
  status?: string[]
): Promise<FeaturedQueueEntry[]> {
  let query = supabase
    .from('featured_ads_queue')
    .select(`
      *,
      ads!inner (title, slug),
      categories!inner (display_name),
      users!inner (email, full_name)
    `)
    .eq('category_id', categoryId)
    .order('requested_at', { ascending: true });

  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting queue:', error);
    return [];
  }

  return (data || []).map(entry => ({
    ...entry,
    ad_title: (entry.ads as any)?.title,
    ad_slug: (entry.ads as any)?.slug,
    category_name: (entry.categories as any)?.display_name,
    user_email: (entry.users as any)?.email,
    user_name: (entry.users as any)?.full_name
  }));
}

/**
 * Obtener slots disponibles para un rango de fechas (SuperAdmin)
 */
export async function getAvailableSlots(
  categoryId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailableSlot[]> {
  const maxSlots = await getSettingNumber('featured_max_per_category', 10);
  
  // Obtener todos los slots activos/scheduled que se solapan con el rango
  const { data: queue } = await supabase
    .from('featured_ads_queue')
    .select('scheduled_start, scheduled_end')
    .eq('category_id', categoryId)
    .in('status', ['active', 'scheduled'])
    .or(`scheduled_start.lte.${endDate.toISOString()},scheduled_end.gte.${startDate.toISOString()}`);

  const slots: AvailableSlot[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Contar cuántos slots ocupados hay en esta fecha
    const occupied = (queue || []).filter(q => {
      if (!q.scheduled_start || !q.scheduled_end) return false;
      const start = new Date(q.scheduled_start);
      const end = new Date(q.scheduled_end);
      return currentDate >= start && currentDate <= end;
    }).length;

    slots.push({
      date: dateStr,
      available_count: Math.max(0, maxSlots - occupied)
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

/**
 * Programar un slot (SuperAdmin)
 */
export async function scheduleSlot(
  queueId: string,
  startDate: string,
  endDate: string,
  adminNotes?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('featured_ads_queue')
    .update({
      scheduled_start: startDate,
      scheduled_end: endDate,
      status: 'scheduled',
      admin_notes: adminNotes
    })
    .eq('id', queueId);

  if (error) {
    console.error('Error scheduling slot:', error);
    return false;
  }

  return true;
}

/**
 * Activar un slot inmediatamente (SuperAdmin)
 */
export async function activateSlot(queueId: string): Promise<boolean> {
  const { error } = await supabase
    .from('featured_ads_queue')
    .update({ status: 'active' })
    .eq('id', queueId);

  if (error) {
    console.error('Error activating slot:', error);
    return false;
  }

  return true;
}

/**
 * Cancelar un slot (SuperAdmin o Usuario dueño si está en cola)
 */
export async function cancelSlot(queueId: string, reason?: string): Promise<boolean> {
  const { error } = await supabase
    .from('featured_ads_queue')
    .update({ 
      status: 'cancelled',
      admin_notes: reason
    })
    .eq('id', queueId);

  if (error) {
    console.error('Error cancelling slot:', error);
    return false;
  }

  return true;
}

/**
 * Obtener solicitudes del usuario actual
 */
export async function getMyQueuedAds(): Promise<FeaturedQueueEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('featured_ads_queue')
    .select(`
      *,
      ads!inner (title, slug),
      categories!inner (display_name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting my queued ads:', error);
    return [];
  }

  return (data || []).map(entry => ({
    ...entry,
    ad_title: (entry.ads as any)?.title,
    ad_slug: (entry.ads as any)?.slug,
    category_name: (entry.categories as any)?.display_name
  }));
}

/**
 * Obtener próxima fecha disponible para una categoría
 */
export async function getNextAvailableDate(categoryId: string): Promise<string | null> {
  const slots = await getAvailableSlots(
    categoryId,
    new Date(),
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 días
  );

  const available = slots.find(s => s.available_count > 0);
  return available?.date || null;
}

/**
 * Ejecutar mantenimiento diario (llamar desde cron o admin)
 */
export async function runDailyMaintenance(): Promise<{ activated: number; completed: number }> {
  const { data, error } = await supabase.rpc('featured_ads_daily_maintenance');
  
  if (error) {
    console.error('Error running maintenance:', error);
    return { activated: 0, completed: 0 };
  }

  return data?.[0] || { activated: 0, completed: 0 };
}
