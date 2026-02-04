/**
 * Plan Limits Service
 * Fuente única de verdad para límites y permisos según plan de suscripción
 * 
 * Este servicio reemplaza los valores hardcodeados en adsService.ts
 * y centraliza toda la lógica de verificación de límites.
 */

import { supabase } from '../supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface PlanLimits {
  planName: string;
  planDisplayName: string;
  maxAds: number | null; // null = ilimitado
  maxContactsPerMonth: number | null; // null = ilimitado
  maxFeaturedAds: number;
  hasPublicProfile: boolean;
  hasCatalog: boolean;
  hasAnalytics: boolean;
}

export interface UserLimitsStatus {
  // Plan info
  plan: PlanLimits;
  
  // Avisos
  ads: {
    current: number;
    limit: number | null;
    canPublish: boolean;
    remaining: number | null;
  };
  
  // Contactos
  contacts: {
    usedThisMonth: number;
    limit: number | null;
    canContact: boolean;
    remaining: number | null;
    resetsAt: Date | null;
  };
  
  // Destacados
  featured: {
    current: number;
    limit: number;
    canFeature: boolean;
    remaining: number;
  };
}

export interface CheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number | null;
  remaining?: number | null;
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let limitsCache: { data: UserLimitsStatus | null; timestamp: number; userId: string | null } = {
  data: null,
  timestamp: 0,
  userId: null
};

function clearCache() {
  limitsCache = { data: null, timestamp: 0, userId: null };
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtener límites del plan de un usuario
 */
export async function getUserPlanLimits(userId?: string): Promise<PlanLimits> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  
  if (!uid) {
    // Usuario no autenticado - devolver límites de FREE
    return getFreePlanLimits();
  }

  const { data, error } = await supabase
    .from('users')
    .select(`
      subscription_plan_id,
      role,
      subscription_plans:subscription_plan_id (
        name,
        display_name,
        max_ads,
        max_contacts_per_month,
        max_featured_ads,
        has_public_profile,
        has_catalog,
        has_analytics
      )
    `)
    .eq('id', uid)
    .single();

  if (error || !data) {
    console.error('Error getting user plan:', error);
    return getFreePlanLimits();
  }

  // SuperAdmin tiene todo ilimitado
  if (data.role === 'superadmin') {
    return {
      planName: 'superadmin',
      planDisplayName: 'SuperAdmin',
      maxAds: null,
      maxContactsPerMonth: null,
      maxFeaturedAds: 999,
      hasPublicProfile: true,
      hasCatalog: true,
      hasAnalytics: true
    };
  }

  const plan = data.subscription_plans as any;
  if (!plan) {
    return getFreePlanLimits();
  }

  return {
    planName: plan.name,
    planDisplayName: plan.display_name,
    maxAds: plan.max_ads,
    maxContactsPerMonth: plan.max_contacts_per_month,
    maxFeaturedAds: plan.max_featured_ads || 0,
    hasPublicProfile: plan.has_public_profile || false,
    hasCatalog: plan.has_catalog || false,
    hasAnalytics: plan.has_analytics !== false // true por defecto
  };
}

/**
 * Plan FREE por defecto
 */
function getFreePlanLimits(): PlanLimits {
  return {
    planName: 'free',
    planDisplayName: 'Gratis',
    maxAds: 1,
    maxContactsPerMonth: 3,
    maxFeaturedAds: 0,
    hasPublicProfile: false,
    hasCatalog: false,
    hasAnalytics: true
  };
}

/**
 * Obtener estado completo de límites del usuario
 * Incluye uso actual vs límites del plan
 */
export async function getUserLimitsStatus(userId?: string): Promise<UserLimitsStatus> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  
  // Check cache
  if (
    limitsCache.data && 
    limitsCache.userId === uid && 
    Date.now() - limitsCache.timestamp < CACHE_TTL
  ) {
    return limitsCache.data;
  }

  if (!uid) {
    throw new Error('No authenticated user');
  }

  // Obtener plan y datos del usuario en paralelo
  const [plan, userData, adsCount, featuredCount] = await Promise.all([
    getUserPlanLimits(uid),
    supabase
      .from('users')
      .select('contacts_used_this_month, contacts_reset_at')
      .eq('id', uid)
      .single(),
    supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('status', 'active'),
    supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('featured', true)
  ]);

  const currentAds = adsCount.count || 0;
  const currentFeatured = featuredCount.count || 0;
  const contactsUsed = userData.data?.contacts_used_this_month || 0;
  const contactsResetAt = userData.data?.contacts_reset_at 
    ? new Date(userData.data.contacts_reset_at) 
    : null;

  const status: UserLimitsStatus = {
    plan,
    ads: {
      current: currentAds,
      limit: plan.maxAds,
      canPublish: plan.maxAds === null || currentAds < plan.maxAds,
      remaining: plan.maxAds === null ? null : Math.max(0, plan.maxAds - currentAds)
    },
    contacts: {
      usedThisMonth: contactsUsed,
      limit: plan.maxContactsPerMonth,
      canContact: plan.maxContactsPerMonth === null || contactsUsed < plan.maxContactsPerMonth,
      remaining: plan.maxContactsPerMonth === null ? null : Math.max(0, plan.maxContactsPerMonth - contactsUsed),
      resetsAt: getNextResetDate(contactsResetAt)
    },
    featured: {
      current: currentFeatured,
      limit: plan.maxFeaturedAds,
      canFeature: currentFeatured < plan.maxFeaturedAds,
      remaining: Math.max(0, plan.maxFeaturedAds - currentFeatured)
    }
  };

  // Update cache
  limitsCache = { data: status, timestamp: Date.now(), userId: uid };

  return status;
}

/**
 * Calcular próxima fecha de reset
 */
function getNextResetDate(lastReset: Date | null): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

// ============================================================================
// VERIFICACIONES ESPECÍFICAS
// ============================================================================

/**
 * Verificar si el usuario puede publicar un nuevo aviso
 */
export async function checkCanPublishAd(userId?: string): Promise<CheckResult> {
  const status = await getUserLimitsStatus(userId);
  
  return {
    allowed: status.ads.canPublish,
    reason: status.ads.canPublish 
      ? undefined 
      : `Has alcanzado el límite de ${status.ads.limit} avisos de tu plan ${status.plan.planDisplayName}`,
    current: status.ads.current,
    limit: status.ads.limit,
    remaining: status.ads.remaining
  };
}

/**
 * Verificar si el usuario puede enviar un contacto
 */
export async function checkCanContact(userId?: string): Promise<CheckResult> {
  const status = await getUserLimitsStatus(userId);
  
  return {
    allowed: status.contacts.canContact,
    reason: status.contacts.canContact 
      ? undefined 
      : `Has alcanzado el límite de ${status.contacts.limit} contactos mensuales de tu plan ${status.plan.planDisplayName}`,
    current: status.contacts.usedThisMonth,
    limit: status.contacts.limit,
    remaining: status.contacts.remaining
  };
}

/**
 * Verificar si el usuario puede destacar un aviso
 */
export async function checkCanFeatureAd(userId?: string): Promise<CheckResult> {
  const status = await getUserLimitsStatus(userId);
  
  return {
    allowed: status.featured.canFeature,
    reason: status.featured.canFeature 
      ? undefined 
      : `Has alcanzado el límite de ${status.featured.limit} avisos destacados de tu plan ${status.plan.planDisplayName}`,
    current: status.featured.current,
    limit: status.featured.limit,
    remaining: status.featured.remaining
  };
}

// ============================================================================
// INCREMENTADORES
// ============================================================================

/**
 * Incrementar contador de contactos usados
 * Llamar después de enviar un contacto exitosamente
 */
export async function incrementContactUsage(userId?: string): Promise<void> {
  const uid = userId || (await supabase.auth.getUser()).data.user?.id;
  
  if (!uid) return;

  // Verificar si necesita reset
  const { data: user } = await supabase
    .from('users')
    .select('contacts_reset_at')
    .eq('id', uid)
    .single();

  const lastReset = user?.contacts_reset_at ? new Date(user.contacts_reset_at) : null;
  const needsReset = !lastReset || lastReset < new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  if (needsReset) {
    // Reset y poner en 1
    await supabase
      .from('users')
      .update({ 
        contacts_used_this_month: 1,
        contacts_reset_at: new Date().toISOString()
      })
      .eq('id', uid);
  } else {
    // Incrementar
    await supabase.rpc('increment_contacts_used', { user_id: uid });
  }

  // Limpiar cache
  clearCache();
}

// ============================================================================
// HELPERS PARA UI
// ============================================================================

/**
 * Obtener mensaje de advertencia para mostrar en UI
 */
export function getWarningMessage(status: UserLimitsStatus): string | null {
  const warnings: string[] = [];

  // Avisos cerca del límite
  if (status.ads.limit !== null && status.ads.remaining !== null) {
    if (status.ads.remaining === 0) {
      warnings.push(`Has alcanzado el límite de avisos (${status.ads.limit})`);
    } else if (status.ads.remaining <= 2) {
      warnings.push(`Te quedan ${status.ads.remaining} avisos disponibles`);
    }
  }

  // Contactos cerca del límite
  if (status.contacts.limit !== null && status.contacts.remaining !== null) {
    if (status.contacts.remaining === 0) {
      warnings.push(`Sin contactos disponibles este mes`);
    } else if (status.contacts.remaining <= 2) {
      warnings.push(`Te quedan ${status.contacts.remaining} contactos este mes`);
    }
  }

  return warnings.length > 0 ? warnings.join('. ') : null;
}

/**
 * Obtener color de badge según porcentaje de uso
 */
export function getUsageColor(current: number, limit: number | null): 'green' | 'yellow' | 'red' {
  if (limit === null) return 'green';
  const percentage = (current / limit) * 100;
  if (percentage >= 100) return 'red';
  if (percentage >= 80) return 'yellow';
  return 'green';
}

// ============================================================================
// EXPORT PARA TESTING
// ============================================================================

export { clearCache as _clearCache };
