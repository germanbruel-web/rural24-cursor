/**
 * API: Gestión de Sitemap (Admin)
 * Rural24 - SEO Control Panel
 * 
 * GET    /api/admin/sitemap       - Lista avisos con estado sitemap
 * POST   /api/admin/sitemap       - Agregar aviso al sitemap
 * DELETE /api/admin/sitemap       - Quitar aviso del sitemap
 * 
 * Solo accesible por superadmin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const supabase = getSupabaseClient();

// ============================================================
// GET - Lista de avisos con estado sitemap
// ============================================================
export async function GET(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
  
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all'; // all, in_sitemap, not_in_sitemap
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('ads')
    .select(`
      id,
      title,
      slug,
      short_id,
      status,
      is_premium,
      featured,
      in_sitemap,
      sitemap_added_at,
      created_at,
      category:categories(name, slug),
      subcategory:subcategories(name, slug),
      user:users(email, company_name, subscription_plan_id)
    `, { count: 'exact' })
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .order('created_at', { ascending: false });
  
  // Filtros
  if (filter === 'in_sitemap') {
    query = query.eq('in_sitemap', true);
  } else if (filter === 'not_in_sitemap') {
    query = query.or('in_sitemap.eq.false,in_sitemap.is.null');
  }
  
  // Búsqueda
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  
  // Paginación
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Estadísticas
  const { data: stats } = await supabase
    .from('ads')
    .select('in_sitemap, is_premium, featured')
    .eq('status', 'active')
    .eq('approval_status', 'approved');
  
  const summary = {
    total: stats?.length || 0,
    inSitemap: stats?.filter(a => a.in_sitemap).length || 0,
    premium: stats?.filter(a => a.is_premium).length || 0,
    featured: stats?.filter(a => a.featured).length || 0,
  };
  
  return NextResponse.json({
    ads: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    },
    summary
  });
  }, { roles: ['superadmin'] });
}

// ============================================================
// POST - Agregar aviso al sitemap
// ============================================================
export async function POST(request: NextRequest) {
  return withAuth(request, async (user: AuthUser) => {
  const body = await request.json();
  const { adId } = body;
  
  if (!adId) {
    return NextResponse.json({ error: 'adId requerido' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('ads')
    .update({
      in_sitemap: true,
      sitemap_added_at: new Date().toISOString(),
      sitemap_added_by: user.id
    })
    .eq('id', adId)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Aviso agregado al sitemap',
    ad: data 
  });
  }, { roles: ['superadmin'] });
}

// ============================================================
// DELETE - Quitar aviso del sitemap
// ============================================================
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
  
  const { searchParams } = new URL(request.url);
  const adId = searchParams.get('adId');
  
  if (!adId) {
    return NextResponse.json({ error: 'adId requerido' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('ads')
    .update({
      in_sitemap: false,
      sitemap_added_at: null,
      sitemap_added_by: null
    })
    .eq('id', adId)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Aviso removido del sitemap',
    ad: data 
  });
  }, { roles: ['superadmin'] });
}
