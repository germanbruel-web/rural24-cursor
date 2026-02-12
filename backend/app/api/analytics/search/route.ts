/**
 * POST /api/analytics/search
 * Endpoint para recibir eventos de búsqueda
 * 
 * Body:
 * {
 *   events: SearchEvent[],
 *   timestamp: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

interface SearchEvent {
  query: string;
  timestamp: number;
  resultCount?: number;
  userId?: string;
  sessionId: string;
  filters?: Record<string, any>;
  source: 'header' | 'hero' | 'page';
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase no configurado' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const { events } = body;

    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Events array requerido' },
        { status: 400 }
      );
    }

    // Guardar eventos en tabla search_analytics
    // Nota: Crear esta tabla en Supabase si no existe
    const analyticsRecords = events.map((event: SearchEvent) => ({
      query: event.query,
      timestamp: new Date(event.timestamp).toISOString(),
      result_count: event.resultCount,
      session_id: event.sessionId,
      filters: event.filters,
      source: event.source,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('search_analytics')
      .insert(analyticsRecords);

    if (error) {
      console.error('Error guardando analytics:', error);
      // No retornar error para no afectar UX
    }

    return NextResponse.json(
      { success: true, processed: events.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/analytics/search:', error);
    // Retornar 200 anyway - analytics no debe interrumpir UX
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

/**
 * GET /api/analytics/search?period=7d
 * Obtener estadísticas de búsquedas
 */
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
    const period = searchParams.get('period') || '7d';

    // Calcular fecha desde
    const daysMap: Record<string, number> = { '1d': 1, '7d': 7, '30d': 30 };
    const days = daysMap[period] || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Queries populares
    const { data: popularData, error: popularError } = await supabase
      .from('search_analytics')
      .select('query')
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (popularError) {
      console.error('Error obteniendo analytics:', popularError);
    }

    // Contar ocurrencias
    const queryCounts = new Map<string, number>();
    (popularData || []).forEach((record: any) => {
      const count = queryCounts.get(record.query) || 0;
      queryCounts.set(record.query, count + 1);
    });

    const popular = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json(
      {
        period,
        popular,
        total: popularData?.length || 0,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutos
        },
      }
    );
  } catch (error) {
    console.error('Error en GET /api/analytics/search:', error);
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
