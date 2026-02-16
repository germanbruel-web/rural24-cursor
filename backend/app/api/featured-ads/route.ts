/**
 * API Route - /api/featured-ads
 * GET: Consulta pública de featured_ads (tabla unificada).
 * POST/DELETE: DEPRECATED → usar /api/admin/featured-ads/*
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabase = getSupabaseClient();

/**
 * GET /api/featured-ads
 * ⚠️ DEPRECATED — Redirigido a tabla unificada featured_ads
 * Mantiene compatibilidad para cualquier consumer externo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let query = supabase
      .from('featured_ads')
      .select(`
        id, ad_id, category_id, user_id, scheduled_start, expires_at, status, admin_notes, created_at, placement,
        ads:ad_id (id, title, slug, images, category_id, subcategory_id, price, currency),
        categories:category_id (id, name, slug)
      `)
      .in('status', ['active', 'pending'])
      .order('expires_at', { ascending: true, nullsFirst: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: featured, error } = await query;
    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data: featured || [], 
      count: (featured || []).length,
      _deprecated: 'Use /api/admin/featured-ads/* for management'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/featured-ads
 * ⚠️ DEPRECATED — Usar POST /api/admin/featured-ads/manual
 */
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    error: 'Endpoint deprecado. Usar POST /api/admin/featured-ads/manual',
    _deprecated: true
  }, { status: 410 }); // 410 Gone
}

/**
 * DELETE /api/featured-ads
 * ⚠️ DEPRECATED — Usar DELETE /api/admin/featured-ads/[id]
 */
export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    success: false, 
    error: 'Endpoint deprecado. Usar DELETE /api/admin/featured-ads/[id]',
    _deprecated: true
  }, { status: 410 }); // 410 Gone
}
