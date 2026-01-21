/**
 * API Route - /api/featured-ads/restore
 * Restaurar un aviso destacado desde el historial
 * Solo SuperAdmin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuración: cantidad de destacados POR CATEGORÍA
const MAX_FEATURED_PER_CATEGORY = 10;

/**
 * POST /api/featured-ads/restore
 * Body: { queue_id } - el id del registro histórico a restaurar
 * Valida cupo POR CATEGORÍA del aviso original
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queue_id } = body;

    if (!queue_id) {
      return NextResponse.json({ success: false, error: 'queue_id es requerido' }, { status: 400 });
    }

    // Obtener registro original primero (necesitamos category_id)
    const { data: original, error: findError } = await supabase
      .from('featured_ads_queue')
      .select('*')
      .eq('id', queue_id)
      .single();

    if (findError || !original) {
      return NextResponse.json({ success: false, error: 'Registro no encontrado' }, { status: 404 });
    }

    // Verificar cupo EN LA CATEGORÍA del aviso
    const { count } = await supabase
      .from('featured_ads_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('category_id', original.category_id);

    if ((count || 0) >= MAX_FEATURED_PER_CATEGORY) {
      return NextResponse.json({ 
        success: false, 
        error: `No hay cupo en esta categoría (${count}/${MAX_FEATURED_PER_CATEGORY})` 
      }, { status: 400 });
    }

    // Verificar que no esté ya activo
    const { data: existing } = await supabase
      .from('featured_ads_queue')
      .select('id')
      .eq('ad_id', original.ad_id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Este aviso ya está destacado' }, { status: 400 });
    }

    // Insertar nuevo registro restaurado
    const { data, error } = await supabase
      .from('featured_ads_queue')
      .insert({
        ad_id: original.ad_id,
        category_id: original.category_id,
        user_id: original.user_id,
        requested_at: new Date().toISOString(),
        scheduled_start: new Date().toISOString().split('T')[0],
        scheduled_end: null,
        status: 'active',
        admin_notes: `Restaurado desde historial (origen: ${queue_id})`,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
