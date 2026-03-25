/**
 * /api/admin/onboarding/slides/[id]
 * PUT    — actualizar slide
 * DELETE — eliminar slide
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/infrastructure/auth/guard';
import { getSupabaseClient } from '@/infrastructure/supabase/client';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async () => {
    const body = await request.json();
    const { title, description, image_url, sort_order, is_active } = body;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('onboarding_slides')
      .update({
        title:       title?.trim(),
        description: description ?? null,
        image_url:   image_url   ?? null,
        sort_order:  sort_order  ?? 0,
        is_active:   is_active   ?? true,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slide: data });
  }, { roles: ['superadmin'] });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('onboarding_slides')
      .delete()
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }, { roles: ['superadmin'] });
}
