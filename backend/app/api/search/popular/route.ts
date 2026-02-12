/**
 * GET /api/search/popular
 * Retorna las búsquedas más populares con URLs pre-construidas
 * Para SEO y sugerencias
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase no configurado' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Obtener queries populares desde analytics
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 días

    const { data: analyticsData } = await supabase
      .from('search_analytics')
      .select('query')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    // Contar ocurrencias
    const queryCounts = new Map<string, number>();
    (analyticsData || []).forEach((record: any) => {
      const count = queryCounts.get(record.query) || 0;
      queryCounts.set(record.query, count + 1);
    });

    // Ordenar por popularidad
    const popularQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({
        query,
        count,
        url: `/#/search?q=${encodeURIComponent(query)}`,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    // Si no hay datos de analytics, usar subcategorías populares como fallback
    if (popularQueries.length === 0) {
      const { data: subcategories } = await supabase
        .from('subcategories')
        .select(`
          id,
          name,
          display_name,
          slug,
          categories!inner (
            slug
          )
        `)
        .eq('is_active', true)
        .limit(limit);

      const fallbackQueries = (subcategories || []).map((sub: any) => ({
        query: sub.display_name || sub.name,
        count: 0,
        url: `/#/search?cat=${sub.categories.slug}&sub=${sub.slug}`,
        category: sub.categories.slug,
      }));

      return NextResponse.json(
        {
          queries: fallbackQueries,
          source: 'fallback',
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=3600', // 1 hora
          },
        }
      );
    }

    return NextResponse.json(
      {
        queries: popularQueries,
        source: 'analytics',
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutos
        },
      }
    );
  } catch (error) {
    console.error('Error en /api/search/popular:', error);
    return NextResponse.json(
      { error: 'Error interno', queries: [] },
      { status: 500 }
    );
  }
}
