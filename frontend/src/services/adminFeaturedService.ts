/**
 * adminFeaturedService.ts
 * Servicio para gestión administrativa de featured ads (SuperAdmin only)
 * 
 * Funcionalidades:
 * - Listar todos los featured ads con filtros
 * - Cancelar y reembolsar
 * - Ver estadísticas globales
 * - Auditoría de cambios
 * - Grid de ocupación
 */

import { supabase } from './supabaseClient';
import type { FeaturedPlacement, FeaturedStatus } from './userFeaturedService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================================================
// TIPOS
// ============================================================================

export interface AdminFeaturedAd {
  id: string;
  ad_id: string;
  user_id: string;
  placement: FeaturedPlacement;
  category_id: string;
  scheduled_start: string;
  actual_start: string | null;
  expires_at: string | null;
  duration_days: number;
  status: FeaturedStatus;
  priority: number | null;
  credit_consumed: boolean;
  is_manual: boolean; // ✨ NUEVO: indica si fue activado manualmente por superadmin
  manual_activated_by: string | null; // ✨ NUEVO: ID del superadmin que activó
  manual_activator_email: string | null; // ✨ NUEVO: email del admin (JOIN)
  manual_activator_name: string | null; // ✨ NUEVO: nombre del admin (JOIN)
  requires_payment: boolean; // ✨ NUEVO: si requiere pago
  admin_notes: string | null; // ✨ NUEVO: notas administrativas
  refunded: boolean;
  cancelled_by: string | null;
  cancelled_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
  // JOINs
  ad_title: string;
  ad_slug: string;
  ad_images: any[];
  ad_price: number;
  ad_currency: string;
  ad_status: string;
  user_email: string;
  user_full_name: string;
  user_role: string;
  category_name: string;
  category_slug: string;
  // Metadata
  total_count?: number;
}

export interface AdminFeaturedFilters {
  status?: FeaturedStatus[];
  placement?: FeaturedPlacement;
  category_id?: string;
  user_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface AdminFeaturedStats {
  total_active: number;
  total_pending: number;
  total_expired: number;
  total_cancelled: number;
  total_credits_consumed: number;
  total_credits_refunded: number;
  net_revenue: number;
  by_placement: Record<FeaturedPlacement, { count: number; revenue: number }>;
  top_categories: Array<{
    category_name: string;
    category_slug: string;
    count: number;
  }>;
  avg_occupancy_percent: number;
  date_range: {
    start: string;
    end: string;
  };
}

export interface FeaturedAuditEntry {
  id: string;
  action: string;
  performed_by: string | null;
  performer_email: string | null;
  performer_name: string | null;
  reason: string | null;
  metadata: any;
  created_at: string;
}

export interface OccupancyGridDay {
  category_id: string;
  category_name: string;
  category_slug: string;
  date: string;
  count_active: number;
  max_slots: number;
}

// ============================================================================
// VALIDACIÓN DE PERMISOS
// ============================================================================

/**
 * Verifica si el usuario actual es SuperAdmin
 */
async function isSuperAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return data?.role === 'superadmin';
  } catch (error) {
    console.error('❌ Error verificando permisos SuperAdmin:', error);
    return false;
  }
}

// ============================================================================
// LISTAR FEATURED ADS CON FILTROS
// ============================================================================

/**
 * Obtiene lista paginada de featured ads con filtros (SuperAdmin only)
 */
export async function getAdminFeaturedAds(
  filters: AdminFeaturedFilters = {},
  limit: number = 50,
  offset: number = 0
): Promise<{
  data: AdminFeaturedAd[];
  total: number;
  error: Error | null;
}> {
  try {
    // Verificar permisos
    if (!(await isSuperAdmin())) {
      return {
        data: [],
        total: 0,
        error: new Error('Acceso denegado. Solo SuperAdmin'),
      };
    }

    // Preparar parámetros (null values para compatibilidad con PostgREST)
    const params: any = {
      p_limit: limit,
      p_offset: offset,
    };
    
    // Solo agregar parámetros no-null
    if (filters.status && filters.status.length > 0) params.p_status = filters.status;
    if (filters.placement) params.p_placement = filters.placement;
    if (filters.category_id) params.p_category_id = filters.category_id;
    if (filters.user_id) params.p_user_id = filters.user_id;
    if (filters.search) params.p_search = filters.search;
    if (filters.date_from) params.p_date_from = filters.date_from;
    if (filters.date_to) params.p_date_to = filters.date_to;

    const { data, error } = await supabase.rpc('admin_get_featured_ads', params);

    if (error) {
      console.error('❌ Error obteniendo featured ads admin:', error);
      return { data: [], total: 0, error };
    }

    const total = data && data.length > 0 ? data[0].total_count || 0 : 0;

    return {
      data: data || [],
      total,
      error: null,
    };
  } catch (error) {
    console.error('❌ Error en getAdminFeaturedAds:', error);
    return {
      data: [],
      total: 0,
      error: error as Error,
    };
  }
}

// ============================================================================
// CANCELAR FEATURED AD
// ============================================================================

/**
 * Cancela un featured ad y opcionalmente reembolsa créditos (SuperAdmin only)
 */
export async function cancelFeaturedAd(
  featuredId: string,
  reason: string,
  refund: boolean = true
): Promise<{
  success: boolean;
  refunded: boolean;
  credits_refunded: number;
  error: string | null;
}> {
  try {
    // Verificar permisos
    if (!(await isSuperAdmin())) {
      return {
        success: false,
        refunded: false,
        credits_refunded: 0,
        error: 'Acceso denegado. Solo SuperAdmin',
      };
    }

    // Obtener user ID del admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        refunded: false,
        credits_refunded: 0,
        error: 'No autenticado',
      };
    }

    const { data, error } = await supabase.rpc('admin_cancel_featured_ad', {
      p_featured_ad_id: featuredId,
      p_admin_id: user.id,
      p_reason: reason,
      p_refund: refund,
    });

    if (error) {
      console.error('❌ Error cancelando featured ad:', error);
      return {
        success: false,
        refunded: false,
        credits_refunded: 0,
        error: error.message,
      };
    }

    return {
      success: data.success,
      refunded: data.refunded || false,
      credits_refunded: data.credits_refunded || 0,
      error: data.error || null,
    };
  } catch (error) {
    console.error('❌ Error en cancelFeaturedAd:', error);
    return {
      success: false,
      refunded: false,
      credits_refunded: 0,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// ESTADÍSTICAS GLOBALES
// ============================================================================

/**
 * Obtiene estadísticas globales de featured ads (SuperAdmin only)
 */
export async function getAdminFeaturedStats(
  startDate?: string,
  endDate?: string
): Promise<{
  data: AdminFeaturedStats | null;
  error: Error | null;
}> {
  try {
    // Verificar permisos
    if (!(await isSuperAdmin())) {
      return {
        data: null,
        error: new Error('Acceso denegado. Solo SuperAdmin'),
      };
    }

    const { data, error } = await supabase.rpc('admin_featured_stats', {
      p_date_from: startDate || null,
      p_date_to: endDate || null,
    });

    if (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { data: null, error };
    }

    return {
      data: data as AdminFeaturedStats,
      error: null,
    };
  } catch (error) {
    console.error('❌ Error en getAdminFeaturedStats:', error);
    return {
      data: null,
      error: error as Error,
    };
  }
}

// ============================================================================
// AUDITORÍA
// ============================================================================

/**
 * Obtiene el historial de auditoría de un featured ad (SuperAdmin only)
 */
export async function getFeaturedAudit(
  featuredId: string
): Promise<{
  data: FeaturedAuditEntry[];
  error: Error | null;
}> {
  try {
    // Verificar permisos
    if (!(await isSuperAdmin())) {
      return {
        data: [],
        error: new Error('Acceso denegado. Solo SuperAdmin'),
      };
    }

    const { data, error } = await supabase.rpc('admin_get_featured_audit', {
      p_featured_id: featuredId,
    });

    if (error) {
      console.error('❌ Error obteniendo auditoría:', error);
      return { data: [], error };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('❌ Error en getFeaturedAudit:', error);
    return {
      data: [],
      error: error as Error,
    };
  }
}

// ============================================================================
// GRID DE OCUPACIÓN
// ============================================================================

/**
 * Obtiene grid de ocupación mensual (SuperAdmin only)
 */
export async function getOccupancyGrid(
  year: number,
  month: number,
  placement: FeaturedPlacement = 'homepage'
): Promise<{
  data: OccupancyGridDay[];
  error: Error | null;
}> {
  try {
    // Verificar permisos
    if (!(await isSuperAdmin())) {
      return {
        data: [],
        error: new Error('Acceso denegado. Solo SuperAdmin'),
      };
    }

    const { data, error } = await supabase.rpc('admin_get_occupancy_grid', {
      p_year: year,
      p_month: month,
      p_placement: placement,
    });

    if (error) {
      console.error('❌ Error obteniendo grid de ocupación:', error);
      return { data: [], error };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('❌ Error en getOccupancyGrid:', error);
    return {
      data: [],
      error: error as Error,
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula el costo en créditos por placement
 */
export function getCreditCost(placement: FeaturedPlacement): number {
  const costs: Record<FeaturedPlacement, number> = {
    homepage: 4,
    results: 1,
    detail: 1,
  };
  return costs[placement] || 1;
}

/**
 * Formatea fecha para display
 */
export function formatFeaturedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formatea rango de fechas
 */
export function formatDateRange(start: string, end: string | null): string {
  const startDate = formatFeaturedDate(start);
  if (!end) return `Desde ${startDate}`;
  const endDate = formatFeaturedDate(end);
  return `${startDate} - ${endDate}`;
}

/**
 * Badge de estado con colores
 */
export function getStatusBadge(status: FeaturedStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const badges: Record<FeaturedStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    active: { label: 'Activo', color: 'text-green-700', bgColor: 'bg-green-50' },
    expired: { label: 'Expirado', color: 'text-gray-700', bgColor: 'bg-gray-50' },
    cancelled: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-50' },
  };
  return badges[status] || badges.pending;
}

/**
 * Badge de placement con iconos
 */
export function getPlacementLabel(placement: FeaturedPlacement): string {
  const labels: Record<FeaturedPlacement, string> = {
    homepage: 'Homepage',
    results: 'Resultados',
    detail: 'Detalle',
  };
  return labels[placement] || placement;
}

// ============================================================================
// EXPORTACIÓN CSV
// ============================================================================

/**
 * Exporta featured ads a CSV
 */
export function exportToCSV(ads: AdminFeaturedAd[], filename: string = 'featured-ads.csv'): void {
  if (ads.length === 0) {
    console.warn('⚠️ No hay datos para exportar');
    return;
  }

  // Headers
  const headers = [
    'ID',
    'Aviso',
    'Usuario',
    'Email',
    'Categoría',
    'Placement',
    'Estado',
    'Fecha Programada',
    'Inicio Real',
    'Expira',
    'Días',
    'Crédito Consumido',
    'Reembolsado',
    'Cancelado Por',
    'Razón',
    'Creado',
  ];

  // Rows
  const rows = ads.map((ad) => [
    ad.id,
    ad.ad_title,
    ad.user_full_name,
    ad.user_email,
    ad.category_name,
    getPlacementLabel(ad.placement),
    getStatusBadge(ad.status).label,
    ad.scheduled_start,
    ad.actual_start || 'N/A',
    ad.expires_at || 'N/A',
    ad.duration_days,
    ad.credit_consumed ? 'Sí' : 'No',
    ad.refunded ? 'Sí' : 'No',
    ad.cancelled_by || 'N/A',
    ad.cancelled_reason || 'N/A',
    ad.created_at,
  ]);

  // Generar CSV
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// ACTIVACIÓN MANUAL (Nuevo sistema unificado)
// ============================================================================

export interface ManualActivationParams {
  ad_id: string;
  placement: FeaturedPlacement;
  scheduled_start: string; // ISO date
  duration_days: number;
  reason?: string;
}

export interface ManualActivationResult {
  success: boolean;
  data: AdminFeaturedAd | null;
  message: string;
  error?: string;
  slots_remaining?: number;
}

/**
 * ⚠️ OBSOLETO (12-Feb-2026): Activar featured ad manualmente (SuperAdmin only)
 * 
 * [DEPRECADO] Esta función ya no se usa. Ahora se usa directamente el RPC create_featured_ad
 * que detecta automáticamente si el usuario es superadmin y no consume créditos.
 * 
 * Reemplazado por: supabase.rpc('create_featured_ad', params) en CreateFeaturedModal
 * SIN consumir créditos del usuario
 */
export async function manualActivateFeatured(
  params: ManualActivationParams
): Promise<ManualActivationResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_URL}/api/admin/featured-ads/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al activar featured');
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error en manualActivateFeatured:', error);
    return {
      success: false,
      data: null,
      message: '',
      error: error.message
    };
  }
}

// ============================================================================
// EDITAR FEATURED AD
// ============================================================================

export interface EditFeaturedParams {
  id: string;
  scheduled_start?: string;
  expires_at?: string;
  duration_days?: number;
  placement?: FeaturedPlacement;
  reason?: string;
}

export interface EditFeaturedResult {
  success: boolean;
  data: AdminFeaturedAd | null;
  message: string;
  error?: string;
  changes?: string[];
}

/**
 * Editar featured ad existente (SuperAdmin only)
 */
export async function editFeatured(
  params: EditFeaturedParams
): Promise<EditFeaturedResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No autenticado');
    }

    const { id, ...body } = params;

    const response = await fetch(`${API_URL}/api/admin/featured-ads/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al editar featured');
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error en editFeatured:', error);
    return {
      success: false,
      data: null,
      message: '',
      error: error.message
    };
  }
}

// ============================================================================
// CANCELAR FEATURED AD (Actualizado con reembolso)
// ============================================================================

export interface CancelFeaturedParams {
  id: string;
  reason: string;
  refund_credits?: boolean; // Default: true si credit_consumed
}

export interface CancelFeaturedResult {
  success: boolean;
  data: AdminFeaturedAd | null;
  message: string;
  error?: string;
  refund?: {
    applied: boolean;
    amount: number;
  };
}

/**
 * Cancelar featured ad con/sin reembolso (SuperAdmin only)
 */
export async function cancelFeaturedWithRefund(
  params: CancelFeaturedParams
): Promise<CancelFeaturedResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No autenticado');
    }

    const { id, ...body } = params;

    const response = await fetch(`${API_URL}/api/admin/featured-ads/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al cancelar featured');
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error en cancelFeaturedWithRefund:', error);
    return {
      success: false,
      data: null,
      message: '',
      error: error.message
    };
  }
}

// ============================================================================
// AUDITORÍA
// ============================================================================

/**
 * Obtener historial de auditoría de un featured ad
 */
export async function getFeaturedAuditHistory(
  featuredId: string
): Promise<{
  success: boolean;
  data: FeaturedAuditEntry[];
  error: Error | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No autenticado');
    }

    const response = await fetch(`${API_URL}/api/admin/featured-ads/audit/${featuredId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al obtener auditoría');
    }

    return {
      success: true,
      data: result.data || [],
      error: null
    };
  } catch (error: any) {
    console.error('❌ Error en getFeaturedAuditHistory:', error);
    return {
      success: false,
      data: [],
      error
    };
  }
}

// ============================================================================
// EXPORTAR TODO
// ============================================================================

export const adminFeaturedService = {
  getAdminFeaturedAds,
  cancelFeaturedAd,
  getAdminFeaturedStats,
  getFeaturedAudit,
  getOccupancyGrid,
  isSuperAdmin,
  getCreditCost,
  formatFeaturedDate,
  formatDateRange,
  getStatusBadge,
  getPlacementLabel,
  exportToCSV,
  // Nuevas funciones sistema unificado
  manualActivateFeatured,
  editFeatured,
  cancelFeaturedWithRefund,
  getFeaturedAuditHistory,
};

export default adminFeaturedService;
