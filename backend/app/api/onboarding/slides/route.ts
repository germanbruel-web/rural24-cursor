/**
 * GET /api/onboarding/slides
 * Devuelve los slides activos para el carrusel de onboarding, ordenados por sort_order.
 * Endpoint público — sin autenticación.
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function GET() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('onboarding_slides')
    .select('id, sort_order, title, description, image_url')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slides: data ?? [] });
}
