/**
 * POST /api/admin/sync/migrate
 * Aplica migraciones SQL pendientes en PROD y las registra en _rural24_migrations.
 * Body: { migrations: string[] } — lista de filenames. Vacío = todas las pendientes.
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import pkg from 'pg';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const { Client } = pkg;

const REPO_ROOT      = path.resolve(process.cwd(), '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const prodUrl = process.env.SYNC_PROD_DB_URL;
    if (!prodUrl) {
      return NextResponse.json({ success: false, error: 'SYNC_PROD_DB_URL no configurado' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const requested: string[] = Array.isArray(body.migrations) ? body.migrations : [];

    const client = new Client({ connectionString: prodUrl, ssl: { rejectUnauthorized: false } });

    try {
      await client.connect();

      // Obtener ya aplicadas
      await client.query(`
        CREATE TABLE IF NOT EXISTS public._rural24_migrations (
          filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now(), applied_by TEXT DEFAULT 'sync-panel'
        )
      `);
      const { rows } = await client.query<{ filename: string }>('SELECT filename FROM public._rural24_migrations');
      const appliedSet = new Set(rows.map((r: { filename: string }) => r.filename));

      // Determinar cuáles aplicar
      const allFiles = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
      const toApply = requested.length > 0
        ? requested.filter(f => allFiles.includes(f) && !appliedSet.has(f))
        : allFiles.filter(f => !appliedSet.has(f));

      if (toApply.length === 0) {
        return NextResponse.json({ success: true, applied: [], message: 'Sin migraciones pendientes.' });
      }

      const results: { filename: string; ok: boolean; error?: string }[] = [];

      for (const filename of toApply) {
        const filePath = path.join(MIGRATIONS_DIR, filename);
        const sql = readFileSync(filePath, 'utf8');

        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query(
            'INSERT INTO public._rural24_migrations (filename, applied_by) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [filename, 'sync-panel']
          );
          await client.query('COMMIT');
          results.push({ filename, ok: true });
          logger.log(`[sync/migrate] Aplicada: ${filename}`);
        } catch (err: unknown) {
          await client.query('ROLLBACK').catch(() => {});
          const msg = err instanceof Error ? err.message : String(err);
          results.push({ filename, ok: false, error: msg });
          logger.error(`[sync/migrate] Error en ${filename}:`, msg);
          break; // detener en el primer error
        }
      }

      const allOk = results.every(r => r.ok);
      return NextResponse.json({ success: allOk, applied: results });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('[sync/migrate] Error:', err);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    } finally {
      await client.end().catch(() => {});
    }
  }, { roles: ['superadmin'] });
}
