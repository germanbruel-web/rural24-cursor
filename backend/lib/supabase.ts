/**
 * Supabase backend client (service_role)
 * =======================================
 * Singleton reutilizable en todas las API routes.
 * Compatible con Edge Runtime: la instancia se crea a nivel de módulo
 * y se reutiliza dentro del mismo worker.
 *
 * IMPORTANTE: Este cliente usa service_role key — NUNCA exponer en frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

// Instancia a nivel de módulo — reutilizada dentro del mismo Edge worker
const _client: SupabaseClient | null = url && key ? createClient(url, key) : null;

/**
 * Retorna el cliente Supabase con service_role.
 * Lanza si las env vars no están configuradas.
 */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    throw new Error(
      'Supabase no configurado: faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return _client;
}

export const isSupabaseConfigured = !!(url && key);
