/**
 * Constantes de planes y helpers de features premium.
 * Fuente única para evitar duplicación entre componentes del dashboard.
 */

import type { PlanFeatures } from '../hooks/usePlanFeatures';

export const PREMIUM_PLANS = ['premium', 'profesional', 'avanzado', 'business', 'enterprise'] as const;

/**
 * Determina si un perfil tiene acceso a features premium.
 * Empresa y SuperAdmin siempre tienen acceso independientemente del plan.
 * @deprecated Usar canDoAction() con PlanFeatures cuando sea posible.
 */
export function hasPremiumFeatures(opts: {
  user_type?: string;
  role?: string;
  plan_name?: string;
}): boolean {
  if (opts.role === 'superadmin') return true;
  if (opts.role === 'premium') return true;     // role es la fuente de verdad
  if (opts.user_type === 'empresa') return true;
  const planName = opts.plan_name?.toLowerCase() || '';
  return PREMIUM_PLANS.some(p => planName.includes(p));
}

/**
 * Verifica si el plan actual permite una acción específica.
 * Alternativa type-safe a hasPremiumFeatures que lee directamente de subscription_plans.
 *
 * Uso: const ok = canDoAction('show_whatsapp', plan);
 */
export function canDoAction(
  action:
    | 'show_whatsapp'
    | 'virtual_office'
    | 'analytics'
    | 'priority_support'
    | 'company_profile'
    | 'catalog'
    | 'extra_ads',
  plan: PlanFeatures | null
): boolean {
  if (!plan) return false;
  switch (action) {
    case 'show_whatsapp':     return plan.canShowWhatsapp;
    case 'virtual_office':    return plan.hasVirtualOffice;
    case 'analytics':         return plan.hasAnalytics;
    case 'priority_support':  return plan.hasPrioritySupport;
    case 'company_profile':   return plan.canHaveCompanyProfile;
    case 'catalog':           return plan.hasCatalog;
    case 'extra_ads':         return plan.priceMonthly > 0; // solo planes de pago
    default:                  return false;
  }
}
