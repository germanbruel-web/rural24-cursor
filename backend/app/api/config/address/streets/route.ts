/**
 * API Route - /api/config/address/streets
 * Autocomplete de calles via georef-ar (API Gobierno Argentino)
 *
 * GET /api/config/address/streets?q=<nombre>&province=<provincia>&locality=<localidad>
 *
 * Runtime: Edge ✅
 * Cache: 1h (calles cambian muy raramente)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const QuerySchema = z.object({
  q:        z.string().min(2).max(100),
  province: z.string().min(1).max(100),
  locality: z.string().min(1).max(100),
});

const GEOREF_BASE = 'https://apis.datos.gob.ar/georef/api';

interface GeorefCalle {
  id:        string;
  nombre:    string;
  categoria: string;
  altura?:   { inicio?: { derecha?: number }; fin?: { derecha?: number } };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const parsed = QuerySchema.safeParse({
    q:        searchParams.get('q'),
    province: searchParams.get('province'),
    locality: searchParams.get('locality'),
  });

  if (!parsed.success) {
    return NextResponse.json({ streets: [] });
  }

  const { q, province, locality } = parsed.data;

  const url = new URL(`${GEOREF_BASE}/calles`);
  url.searchParams.set('nombre',    q);
  url.searchParams.set('provincia', province);
  url.searchParams.set('localidad', locality);
  url.searchParams.set('max',       '10');
  url.searchParams.set('campos',    'id,nombre,categoria,altura');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      // @ts-ignore — Next.js edge cache hint
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ streets: [] });
    }

    const data = await res.json() as { calles?: GeorefCalle[] };

    const streets = (data.calles ?? []).map((c) => ({
      nombre:        c.nombre,
      categoria:     c.categoria,
      altura_minima: c.altura?.inicio?.derecha ?? null,
      altura_maxima: c.altura?.fin?.derecha    ?? null,
    }));

    return NextResponse.json({ streets }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch {
    return NextResponse.json({ streets: [] });
  }
}
