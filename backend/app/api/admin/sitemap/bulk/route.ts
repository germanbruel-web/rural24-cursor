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
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false };
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false };
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  return { 
    isAdmin: userData?.role === 'superadmin',
    userId: user.id 
  };
}

export async function POST(request: NextRequest) {
  const { isAdmin, userId } = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
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
        sitemap_added_by: userId
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
}
