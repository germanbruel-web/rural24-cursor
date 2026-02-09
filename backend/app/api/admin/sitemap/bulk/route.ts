/**
 * API: Operaciones masivas de Sitemap
 * Rural24 - SEO Control Panel
 * 
 * POST /api/admin/sitemap/bulk - Agregar/quitar múltiples avisos
 * 
 * Body:
 * {
 *   action: 'add' | 'remove',
 *   adIds: string[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabase = getSupabaseClient();

export async function POST(request: NextRequest) {
  return withAuth(request, async (user: AuthUser) => {
  
  const body = await request.json();
  const { action, adIds } = body;
  
  if (!action || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'action debe ser "add" o "remove"' }, { status: 400 });
  }
  
  if (!adIds || !Array.isArray(adIds) || adIds.length === 0) {
    return NextResponse.json({ error: 'adIds debe ser un array no vacío' }, { status: 400 });
  }
  
  if (adIds.length > 100) {
    return NextResponse.json({ error: 'Máximo 100 avisos por operación' }, { status: 400 });
  }
  
  const updateData = action === 'add' 
    ? {
        in_sitemap: true,
        sitemap_added_at: new Date().toISOString(),
        sitemap_added_by: user.id
      }
    : {
        in_sitemap: false,
        sitemap_added_at: null,
        sitemap_added_by: null
      };
  
  const { data, error } = await supabase
    .from('ads')
    .update(updateData)
    .in('id', adIds)
    .select('id, title, in_sitemap');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    action,
    affected: data?.length || 0,
    ads: data
  });
  }, { roles: ['superadmin'] });
}
