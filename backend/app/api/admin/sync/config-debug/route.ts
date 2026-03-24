/**
 * GET /api/admin/sync/config-debug
 * Devuelve las filas de global_settings de DEV y PROD para comparar manualmente.
 * Solo superadmin. Solo para debugging.
 */
import { NextRequest, NextResponse } from 'next/server';
import pkg from 'pg';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

const { Client } = pkg;
const AUDIT_COLS = ['created_at', 'updated_at', 'updated_by'];
const DEV_REF  = 'lmkuecdvxtenrikjomol';
const PROD_REF = 'ufrzkjuylhvdkrvbjdyh';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const devUrl  = process.env.SYNC_DEV_DB_URL;
    const prodUrl = process.env.SYNC_PROD_DB_URL;
    if (!devUrl || !prodUrl) return NextResponse.json({ error: 'URLs no configuradas' }, { status: 503 });

    const devClient  = new Client({ connectionString: devUrl,  ssl: { rejectUnauthorized: false } });
    const prodClient = new Client({ connectionString: prodUrl, ssl: { rejectUnauthorized: false } });

    try {
      await Promise.all([devClient.connect(), prodClient.connect()]);

      const [devRows, prodRows] = await Promise.all([
        devClient.query('SELECT * FROM public.global_settings ORDER BY key'),
        prodClient.query('SELECT * FROM public.global_settings ORDER BY key'),
      ]);

      // Filas sin columnas de auditoría, con refs normalizadas
      const clean = (rows: Record<string, unknown>[]) => rows.map(r => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          if (AUDIT_COLS.includes(k)) continue;
          if (typeof v === 'string') out[k] = v.replaceAll(DEV_REF, PROD_REF);
          else if (v !== null && typeof v === 'object') out[k] = JSON.parse(JSON.stringify(v).replaceAll(DEV_REF, PROD_REF));
          else out[k] = v;
        }
        return out;
      });

      const dev  = clean(devRows.rows  as Record<string, unknown>[]);
      const prod = clean(prodRows.rows as Record<string, unknown>[]);

      // Diff por key
      const allKeys = new Set([...dev.map(r => r.key), ...prod.map(r => r.key)]);
      const diff = Array.from(allKeys).map(key => {
        const d = dev.find(r  => r.key === key);
        const p = prod.find(r => r.key === key);
        const devStr  = JSON.stringify(d);
        const prodStr = JSON.stringify(p);
        return { key, match: devStr === prodStr, dev: d, prod: p };
      });

      return NextResponse.json({ diff, devCount: dev.length, prodCount: prod.length });
    } finally {
      await Promise.all([devClient.end().catch(() => {}), prodClient.end().catch(() => {})]);
    }
  }, { roles: ['superadmin'] });
}
