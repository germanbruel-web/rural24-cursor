/**
 * API Route - /api/config/categories/search
 * Búsqueda de subcategorías con breadcrumb completo (Step 1 del wizard)
 *
 * GET /api/config/categories/search?q=acopados
 *
 * Devuelve SOLO leaf nodes que coincidan con la query.
 * Respuesta: [{ path: "Maquinaria Agrícola > Acoplados > Balancín", leaf_id, category_id, ... }]
 *
 * Runtime: Edge ✅
 * Cache: 5 min (datos de configuración con búsqueda dinámica)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { z } from 'zod';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';

    const parsed = z.string().min(2, 'La búsqueda debe tener al menos 2 caracteres').safeParse(q);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message, results: [] },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Llamar al RPC creado en migration 20260314000002
    const { data, error } = await supabase.rpc('search_subcategory_paths', {
      search_query: parsed.data,
    });

    if (error) {
      console.error('[GET /api/config/categories/search] RPC error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const results = (data ?? []).map((row: {
      leaf_id: string;
      category_id: string;
      parent_sub_id: string | null;
      cat_name: string;
      cat_icon: string | null;
      sub_name: string | null;
      leaf_name: string;
      path: string;
      leaf_slug: string;
    }) => ({
      leaf_id: row.leaf_id,
      category_id: row.category_id,
      parent_sub_id: row.parent_sub_id,
      path: row.path,
      leaf_name: row.leaf_name,
      cat_name: row.cat_name,
      cat_icon: row.cat_icon,
    }));

    return NextResponse.json(
      { results, total: results.length, query: parsed.data },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      }
    );

  } catch (error) {
    console.error('[GET /api/config/categories/search] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
