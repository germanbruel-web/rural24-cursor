/**
 * API Route - /api/config/locations
 * Provincias y localidades para el Step 3 del wizard (Ubicación)
 *
 * GET /api/config/locations?type=provinces
 * GET /api/config/locations?type=localities&province_id=<uuid>
 *
 * Runtime: Edge ✅
 * Cache: 24h (datos cuasi-estáticos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

export const runtime = 'edge';

const QuerySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('provinces') }),
  z.object({ type: z.literal('localities'), province_id: z.string().uuid() }),
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = { type: searchParams.get('type'), province_id: searchParams.get('province_id') ?? undefined };

    const parsed = QuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos. Usá type=provinces o type=localities&province_id=<uuid>' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (parsed.data.type === 'provinces') {
      const { data, error } = await supabase
        .from('provinces')
        .select('id, name, slug, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        return NextResponse.json({ error: 'Error fetching provinces' }, { status: 500 });
      }

      return NextResponse.json(
        { provinces: data ?? [], timestamp: new Date().toISOString() },
        { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' } }
      );
    }

    // type === 'localities'
    const { data, error } = await supabase
      .from('localities')
      .select('id, name, slug, sort_order, province_id')
      .eq('province_id', parsed.data.province_id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Error fetching localities' }, { status: 500 });
    }

    return NextResponse.json(
      { localities: data ?? [], timestamp: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' } }
    );

  } catch (error) {
    console.error('[GET /api/config/locations] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
