import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton Supabase client con service role key (solo backend)
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      // During Next.js build (page data collection), env vars may not be available.
      // Throw only at runtime, not at build time.
      if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
        throw new Error(
          'Missing Supabase credentials. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        );
      }
      // Return a dummy client that will fail gracefully at runtime if actually called
      console.warn('[supabase] Credentials not available — build-time initialization skipped');
      return createClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}
