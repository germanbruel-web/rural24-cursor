/**
 * Re-exporta funciones internas de usePlanFeatures solo para tests.
 * No importar desde código de producción.
 */
export { FREE_PLAN_FALLBACK as FREE_PLAN_FALLBACK_TEST, mapRowToPlanFeatures as mapRowToPlanFeaturesTest } from './usePlanFeatures';
