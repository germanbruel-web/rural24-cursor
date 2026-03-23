/**
 * POST /api/admin/sync/mark
 * Registra migraciones en _rural24_migrations SIN ejecutar el SQL.
 * Útil cuando la DB ya tiene el schema aplicado pero no está registrado en el tracking.
 * Body: { target: 'dev' | 'prod', migrations?: string[] } — vacío = todas las pendientes.
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readdirSync } from 'fs';
import path from 'path';
import pkg from 'pg';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const { Client } = pkg;

const REPO_ROOT      = path.resolve(process.cwd(), '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const body = await request.json().catch(() => ({}));
    const target: 'dev' | 'prod' = body.target === 'prod' ? 'prod' : 'dev';

    const dbUrl = target === 'dev'
      ? process.env.SYNC_DEV_DB_URL
      : process.env.SYNC_PROD_DB_URL;

    if (!dbUrl) {
      const varName = target === 'dev' ? 'SYNC_DEV_DB_URL' : 'SYNC_PROD_DB_URL';
      return NextResponse.json({ success: false, error: `${varName} no configurado` }, { status: 503 });
    }

    const requested: string[] = Array.isArray(body.migrations) ? body.migrations : [];

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    try {
      await client.connect();

      await client.query(`
        CREATE TABLE IF NOT EXISTS public._rural24_migrations (
          filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now(), applied_by TEXT DEFAULT 'sync-panel'
        )
      `);

      const { rows } = await client.query('SELECT filename FROM public._rural24_migrations');
      const appliedSet = new Set(rows.map((r: { filename: string }) => r.filename));

      const allFiles = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
      const toMark = requested.length > 0
        ? requested.filter(f => allFiles.includes(f) && !appliedSet.has(f))
        : allFiles.filter(f => !appliedSet.has(f));

      if (toMark.length === 0) {
        return NextResponse.json({ success: true, marked: [], message: 'Sin migraciones pendientes.' });
      }

      await client.query('BEGIN');
      for (const filename of toMark) {
        await client.query(
          'INSERT INTO public._rural24_migrations (filename, applied_by) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [filename, `sync-panel-mark-${target}`]
        );
      }
      await client.query('COMMIT');

      logger.log(`[sync/mark] [${target}] Marcadas ${toMark.length} migraciones`);
      return NextResponse.json({ success: true, target, marked: toMark });

    } catch (err: unknown) {
      await client.query('ROLLBACK').catch(() => {});
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error(`[sync/mark] [${target}] Error:`, err);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    } finally {
      await client.end().catch(() => {});
    }
  }, { roles: ['superadmin'] });
}
