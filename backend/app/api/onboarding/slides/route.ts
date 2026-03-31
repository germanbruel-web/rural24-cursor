/**
 * GET /api/onboarding/slides
 * Devuelve los slides activos para el carrusel de onboarding, ordenados por sort_order.
 * Endpoint público — sin autenticación.
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function GET(request: Request) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const device = searchParams.get('device'); // 'desktop' | 'mobile' | null

  let query = supabase
    .from('onboarding_slides')
    .select('id, sort_order, title, description, image_url, target_device, bg_color, image_fit')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Si viene device, filtrar: target_device = device OR target_device = 'both'
  if (device === 'desktop' || device === 'mobile') {
    query = query.in('target_device', [device, 'both']);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slides: data ?? [] });
}
