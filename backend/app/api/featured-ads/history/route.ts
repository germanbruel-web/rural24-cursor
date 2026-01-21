/**
 * API Route - /api/featured-ads/history
 * Historial de destacados (activos, inactivos, expirados, restaurados)
 * Solo SuperAdmin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/featured-ads/history
 * Lista el historial completo de destacados
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('featured_ads_queue')
      .select(`
        id, ad_id, category_id, user_id, requested_at, scheduled_start, scheduled_end, status, admin_notes, created_at, updated_at,
        ads:ad_id (id, title, slug, images, category_id, subcategory_id, price, currency)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Transformar a formato esperado por frontend
    const transformed = (data || []).map(f => ({
      ...f,
      activated_at: f.scheduled_start,
      deactivated_at: f.status !== 'active' ? f.updated_at : null,
      expires_at: f.scheduled_end,
      reason: f.admin_notes
    }));

    return NextResponse.json({ success: true, data: transformed, count: transformed.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
