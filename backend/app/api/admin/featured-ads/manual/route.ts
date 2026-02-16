/**
 * API Route - POST /api/admin/featured-ads/manual
 * Activa un aviso como destacado manualmente (SuperAdmin only)
 * SIN consumir créditos del usuario
 * 
 * Body: {
 *   ad_id: string;
 *   placement: 'homepage' | 'results' | 'detail';
 *   scheduled_start: string; // ISO date
 *   duration_days: number;
 *   reason?: string;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabase = getSupabaseClient();

// Defaults — se sobreescriben con global_settings si están configurados
const DEFAULT_MAX_SLOTS: Record<string, number> = {
  homepage: 10,
  results: 4,
  detail: 6
};

/**
 * Carga slots máximos desde global_settings, con fallback a defaults
 */
async function getMaxSlots(): Promise<Record<string, number>> {
  try {
    const { data } = await supabase
      .from('global_settings')
      .select('key, value')
      .in('key', ['featured_slots_homepage', 'featured_slots_results', 'featured_slots_detail']);

    const slots = { ...DEFAULT_MAX_SLOTS };
    (data || []).forEach((item: { key: string; value: string }) => {
      const placement = item.key.replace('featured_slots_', '');
      const parsed = parseInt(item.value);
      if (!isNaN(parsed) && parsed > 0) slots[placement] = parsed;
    });
    return slots;
  } catch {
    return DEFAULT_MAX_SLOTS;
  }
}

/**
 * POST /api/admin/featured-ads/manual
 * Activar featured manual (sin crédito)
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (admin: AuthUser) => {
  try {
    // 2. Parsear body
    const body = await request.json();
    const { ad_id, placement, scheduled_start, duration_days, reason } = body;

    // 3. Validar campos requeridos
    if (!ad_id || !placement || !scheduled_start || !duration_days) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campos requeridos: ad_id, placement, scheduled_start, duration_days' 
        },
        { status: 400 }
      );
    }

    // 4. Validar placement
    if (!['homepage', 'results', 'detail'].includes(placement)) {
      return NextResponse.json(
        { success: false, error: 'Placement inválido. Use: homepage, results o detail' },
        { status: 400 }
      );
    }

    // 5. Obtener datos del aviso
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, title, slug, category_id, user_id, status')
      .eq('id', ad_id)
      .single();

    if (adError || !ad) {
      return NextResponse.json(
        { success: false, error: 'Aviso no encontrado' },
        { status: 404 }
      );
    }

    // 6. Validar que el aviso esté activo
    if (ad.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'El aviso debe estar activo para destacarlo' },
        { status: 400 }
      );
    }

    // 7. Verificar que no esté ya destacado en este placement
    const { data: existing } = await supabase
      .from('featured_ads')
      .select('id, status')
      .eq('ad_id', ad_id)
      .eq('placement', placement)
      .in('status', ['pending', 'active'])
      .single();

    if (existing) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Este aviso ya está destacado en ${placement} (${existing.status})` 
        },
        { status: 400 }
      );
    }

    // 8. Verificar slots disponibles en la categoría
    const maxSlotsConfig = await getMaxSlots();
    const { count } = await supabase
      .from('featured_ads')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', ad.category_id)
      .eq('placement', placement)
      .in('status', ['pending', 'active']);

    const maxSlots = maxSlotsConfig[placement] || 10;
    if ((count || 0) >= maxSlots) {
      return NextResponse.json(
        { 
          success: false, 
          error: `No hay cupo disponible en ${placement} para esta categoría (${count}/${maxSlots})` 
        },
        { status: 400 }
      );
    }

    // 9. Calcular fechas
    const startDate = new Date(scheduled_start);
    const now = new Date();
    const isImmediate = startDate <= now;
    
    const expiresAt = new Date(startDate);
    expiresAt.setDate(expiresAt.getDate() + duration_days);

    // 10. Insertar featured ad
    const { data: featured, error: insertError } = await supabase
      .from('featured_ads')
      .insert({
        ad_id,
        user_id: ad.user_id,
        placement,
        category_id: ad.category_id,
        scheduled_start: startDate.toISOString().split('T')[0],
        actual_start: isImmediate ? now.toISOString() : null,
        expires_at: expiresAt.toISOString(),
        duration_days,
        status: isImmediate ? 'active' : 'pending',
        priority: 0,
        credit_consumed: false,
        credits_spent: 0,
        is_manual: true,
        manual_activated_by: admin.id,
        requires_payment: false,
        admin_notes: reason || 'Activación manual por SuperAdmin'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 11. Registrar en auditoría
    await supabase
      .from('featured_ads_audit')
      .insert({
        featured_ad_id: featured.id,
        ad_id,
        user_id: ad.user_id,
        action: 'manual_activation',
        performed_by: admin.id,
        performer_email: admin.email,
        reason: reason || 'Activación manual por SuperAdmin',
        metadata: {
          placement,
          duration_days,
          scheduled_start: startDate.toISOString(),
          expires_at: expiresAt.toISOString(),
          immediate: isImmediate,
          slots_used: (count || 0) + 1,
          slots_max: maxSlots
        }
      });

    // 12. Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        ...featured,
        ad_title: ad.title,
        ad_slug: ad.slug,
        slots_remaining: maxSlots - ((count || 0) + 1)
      },
      message: `Featured activado ${isImmediate ? 'inmediatamente' : 'programado'} sin consumir créditos`
    });

  } catch (err: any) {
    console.error('❌ Error en POST /api/admin/featured-ads/manual:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, { roles: ['superadmin'] });
}
