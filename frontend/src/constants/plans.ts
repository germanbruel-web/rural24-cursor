/**
 * Constantes de planes y helpers de features premium.
 * Fuente única para evitar duplicación entre componentes del dashboard.
 */

export const PREMIUM_PLANS = ['premium', 'profesional', 'avanzado', 'business', 'enterprise'] as const;

/**
 * Determina si un perfil tiene acceso a features premium.
 * Empresa y SuperAdmin siempre tienen acceso independientemente del plan.
 */
export function hasPremiumFeatures(opts: {
  user_type?: string;
  role?: string;
  plan_name?: string;
}): boolean {
  if (opts.user_type === 'empresa') return true;
  if (opts.role === 'superadmin') return true;
  const planName = opts.plan_name?.toLowerCase() || '';
  return PREMIUM_PLANS.some(p => planName.includes(p));
}
