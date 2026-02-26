import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Client Init:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseKey,
  urlPrefix: supabaseUrl?.substring(0, 20) + '...' || 'missing',
  timestamp: new Date().toISOString()
});

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ CRITICAL: Supabase env vars not set!");
  console.error("❌ Check your .env.local file contains:");
  console.error("   VITE_SUPABASE_URL=your_url");
  console.error("   VITE_SUPABASE_KEY=your_key (preferred)");
  console.error("   or VITE_SUPABASE_ANON_KEY=your_key (legacy fallback)");
  throw new Error("Missing Supabase configuration");
}

// Create client with explicit options to avoid cache issues
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'agro-buscador-v2',
    },
  },
});

console.log('✅ Supabase client created successfully - Fresh connection');
