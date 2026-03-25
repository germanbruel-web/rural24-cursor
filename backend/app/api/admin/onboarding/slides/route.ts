/**
 * /api/admin/onboarding/slides
 * GET  — listar todos los slides (activos e inactivos)
 * POST — crear nuevo slide
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('onboarding_slides')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slides: data ?? [] });
  }, { roles: ['superadmin'] });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const body = await request.json();
    const { title, description, image_url, sort_order, is_active } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('onboarding_slides')
      .insert({ title: title.trim(), description: description || null, image_url: image_url || null, sort_order: sort_order ?? 0, is_active: is_active ?? true })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slide: data }, { status: 201 });
  }, { roles: ['superadmin'] });
}
