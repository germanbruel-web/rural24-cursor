/**
 * API: Exportar Sitemap como CSV
 * Rural24 - SEO Control Panel
 * 
 * GET /api/admin/sitemap/export - Descargar CSV con avisos en sitemap
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return false;
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  return userData?.role === 'superadmin';
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv'; // csv o json
  
  // Obtener todos los avisos activos con info de sitemap
  const { data, error } = await supabase
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
      price,
      province,
      categories(name),
      subcategories(name),
      users(email, company_name)
    `)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .order('in_sitemap', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (format === 'json') {
    return NextResponse.json({ ads: data });
  }
  
  // Generar CSV
  const headers = [
    'ID',
    'Título',
    'URL',
    'Categoría',
    'Subcategoría',
    'Precio',
    'Provincia',
    'Premium',
    'Destacado',
    'En Sitemap',
    'Agregado Sitemap',
    'Creado',
    'Usuario',
    'Empresa'
  ];
  
  const rows = data?.map(ad => [
    ad.id,
    `"${(ad.title || '').replace(/"/g, '""')}"`,
    `https://rural24.com/aviso/${ad.slug || ad.short_id}`,
    (ad.categories as any)?.name || '',
    (ad.subcategories as any)?.name || '',
    ad.price || '',
    ad.province || '',
    ad.is_premium ? 'SÍ' : 'NO',
    ad.featured ? 'SÍ' : 'NO',
    ad.in_sitemap ? 'SÍ' : 'NO',
    ad.sitemap_added_at ? new Date(ad.sitemap_added_at).toLocaleDateString('es-AR') : '',
    new Date(ad.created_at).toLocaleDateString('es-AR'),
    (ad.users as any)?.email || '',
    `"${((ad.users as any)?.company_name || '').replace(/"/g, '""')}"`
  ]) || [];
  
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sitemap-rural24-${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}
