/**
 * FEATURE FLAGS CONFIGURATION
 * Control de features para migración gradual
 * 
 * Variables de entorno:
 * - VITE_USE_API_BACKEND: 'true' para usar backend Fastify, 'false' para Supabase directo
 * - VITE_FALLBACK_TO_SUPABASE: 'true' para fallback automático en caso de error
 */

export interface FeatureFlags {
  /**
   * Usar backend Fastify en lugar de Supabase directo
   * @default false (migración gradual)
   */
  USE_API_BACKEND: boolean;

  /**
   * Fallback automático a Supabase si el backend falla
   * @default true (seguridad durante migración)
   */
  FALLBACK_TO_SUPABASE: boolean;

  /**
   * Logs detallados de llamadas API (debug)
   * @default false
   */
  DEBUG_API_CALLS: boolean;

  /**
   * Mostrar banner de migración en UI
   * @default false
   */
  SHOW_MIGRATION_BANNER: boolean;
}

/**
 * Configuración de feature flags
 */
export const FEATURES: FeatureFlags = {
  USE_API_BACKEND: import.meta.env.VITE_USE_API_BACKEND === 'true',
  FALLBACK_TO_SUPABASE: import.meta.env.VITE_FALLBACK_TO_SUPABASE !== 'false', // Default true
  DEBUG_API_CALLS: import.meta.env.VITE_DEBUG_API_CALLS === 'true',
  SHOW_MIGRATION_BANNER: import.meta.env.VITE_SHOW_MIGRATION_BANNER === 'true',
};

/**
 * Logging helper para debug
 */
export function debugLog(context: string, message: string, data?: any) {
  if (FEATURES.DEBUG_API_CALLS) {
    console.log(`[${context}] ${message}`, data || '');
  }
}

/**
 * Verificar si un feature está activo
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return FEATURES[feature] === true;
}

/**
 * Estado de migración para UI
 */
export interface MigrationStatus {
  isUsingBackend: boolean;
  hasFallback: boolean;
  environment: 'development' | 'production';
}

export function getMigrationStatus(): MigrationStatus {
  return {
    isUsingBackend: FEATURES.USE_API_BACKEND,
    hasFallback: FEATURES.FALLBACK_TO_SUPABASE,
    environment: import.meta.env.MODE as 'development' | 'production',
  };
}
