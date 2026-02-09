/**
 * API Route - /api/featured-ads
 * Endpoints para gestión de la cola de avisos destacados POR CATEGORÍA
 * Máximo 10 destacados por categoría
 * Solo SuperAdmin puede modificar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabase = getSupabaseClient();

// Configuración: cantidad de destacados POR CATEGORÍA
const MAX_FEATURED_PER_CATEGORY = 10;

/**
 * GET /api/featured-ads
 * Lista los destacados activos agrupados por categoría
 * Query params:
 *   - category_id: (opcional) filtrar por categoría específica
 *   - flat: (opcional) si es true, devuelve lista plana sin agrupar
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const flat = searchParams.get('flat') === 'true';

    // Query base
    let query = supabase
      .from('featured_ads_queue')
      .select(`
        id, ad_id, category_id, user_id, requested_at, scheduled_start, scheduled_end, status, admin_notes, created_at,
        ads:ad_id (id, title, slug, images, category_id, subcategory_id, price, currency),
        categories:category_id (id, name, slug)
      `)
      .eq('status', 'active')
      .order('scheduled_end', { ascending: true, nullsFirst: false });

    // Filtrar por categoría si se especifica
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: featured, error } = await query;

    if (error) throw error;

    // Transformar a formato esperado
    const transformed = (featured || []).map(f => ({
      ...f,
      activated_at: f.scheduled_start,
      expires_at: f.scheduled_end,
      reason: f.admin_notes
    }));

    // Si se pide flat, devolver lista simple
    if (flat || categoryId) {
      return NextResponse.json({ 
        success: true, 
        data: transformed, 
        count: transformed.length,
        max_per_category: MAX_FEATURED_PER_CATEGORY
      });
    }

    // Agrupar por categoría
    const byCategory: Record<string, any> = {};
    for (const item of transformed) {
      const catId = item.category_id;
      if (!byCategory[catId]) {
        byCategory[catId] = {
          category_id: catId,
          category_name: (item.categories as any)?.name || 'Sin categoría',
          category_slug: (item.categories as any)?.slug || '',
          featured: [],
          count: 0,
          max: MAX_FEATURED_PER_CATEGORY
        };
      }
      byCategory[catId].featured.push(item);
      byCategory[catId].count++;
    }

    // Obtener todas las categorías para mostrar también las vacías
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');

    // Agregar categorías sin destacados
    for (const cat of (allCategories || [])) {
      if (!byCategory[cat.id]) {
        byCategory[cat.id] = {
          category_id: cat.id,
          category_name: cat.name,
          category_slug: cat.slug,
          featured: [],
          count: 0,
          max: MAX_FEATURED_PER_CATEGORY
        };
      }
    }

    // Convertir a array ordenado por nombre
    const categoriesArray = Object.values(byCategory).sort((a: any, b: any) => 
      a.category_name.localeCompare(b.category_name)
    );

    return NextResponse.json({ 
      success: true, 
      data: categoriesArray, 
      total_featured: transformed.length,
      max_per_category: MAX_FEATURED_PER_CATEGORY
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/featured-ads
 * Activa un aviso como destacado (solo SuperAdmin)
 * Body: { ad_id, expires_at?, reason? }
 * El category_id se obtiene automáticamente del aviso
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    try {
    const body = await request.json();
    const { ad_id, expires_at, reason } = body;

    if (!ad_id) {
      return NextResponse.json({ success: false, error: 'ad_id es requerido' }, { status: 400 });
    }

    // Obtener datos del aviso
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('category_id, user_id, title')
      .eq('id', ad_id)
      .single();

    if (adError || !ad) {
      return NextResponse.json({ success: false, error: 'Aviso no encontrado' }, { status: 404 });
    }

    const categoryId = ad.category_id;

    // Verificar cupo EN ESTA CATEGORÍA
    const { count } = await supabase
      .from('featured_ads_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('category_id', categoryId);

    if ((count || 0) >= MAX_FEATURED_PER_CATEGORY) {
      return NextResponse.json({ 
        success: false, 
        error: `No hay cupo en esta categoría (${count}/${MAX_FEATURED_PER_CATEGORY})` 
      }, { status: 400 });
    }

    // Verificar que no esté ya destacado
    const { data: existing } = await supabase
      .from('featured_ads_queue')
      .select('id')
      .eq('ad_id', ad_id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Este aviso ya está destacado' }, { status: 400 });
    }

    // Insertar en cola
    const { data, error } = await supabase
      .from('featured_ads_queue')
      .insert({
        ad_id,
        category_id: categoryId,
        user_id: ad.user_id,
        requested_at: new Date().toISOString(),
        scheduled_start: new Date().toISOString().split('T')[0],
        scheduled_end: expires_at || null,
        status: 'active',
        admin_notes: reason || 'Activación manual',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
    } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }, { roles: ['superadmin'] });
}

/**
 * DELETE /api/featured-ads?ad_id=xxx
 * Desactiva un aviso destacado (solo SuperAdmin)
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    try {
    const { searchParams } = new URL(request.url);
    const ad_id = searchParams.get('ad_id');

    if (!ad_id) {
      return NextResponse.json({ success: false, error: 'ad_id es requerido' }, { status: 400 });
    }

    // Marcar como cancelled (no borrar para historial)
    const { data, error } = await supabase
      .from('featured_ads_queue')
      .update({ 
        status: 'cancelled', 
        admin_notes: 'Desactivado manualmente',
        updated_at: new Date().toISOString()
      })
      .eq('ad_id', ad_id)
      .eq('status', 'active')
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
    } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }, { roles: ['superadmin'] });
}
