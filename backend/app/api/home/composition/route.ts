/**
 * GET /api/home/composition
 * Devuelve las secciones activas de la homepage ordenadas por sort_order.
 * Caché: s-maxage=60 (CDN) + stale-while-revalidate=300
 * Público — no requiere auth (la homepage carga sin sesión).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .rpc('get_home_composition');

    if (error) throw error;

    return NextResponse.json(
      { sections: data ?? [] },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('[home/composition] Error:', error.message);
    return NextResponse.json(
      { sections: [], error: 'Failed to load home composition' },
      { status: 500 }
    );
  }
}
