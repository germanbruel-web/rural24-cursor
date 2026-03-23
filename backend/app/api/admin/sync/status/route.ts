/**
 * GET /api/admin/sync/status
 *
 * Compara el estado de DEV vs PROD y devuelve qué está pendiente de sincronizar:
 *   - commits: commits en main que no están en prod (via git log)
 *   - migrations: archivos SQL en supabase/migrations/ no registrados en _rural24_migrations de PROD
 *   - config: si global_settings / global_config están desincronizadas (hash MD5)
 *
 * Solo accesible por superadmin. Sin side effects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';
import pkg from 'pg';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const { Client } = pkg;

const REPO_ROOT = path.resolve(process.cwd(), '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');
const CONFIG_TABLES = ['global_settings', 'global_config'];

function getDbClient(url: string) {
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

/** Commits en main que no están en prod */
function getCommitDiff(): { count: number; list: { sha: string; message: string }[] } {
  try {
    const output = execSync('git log prod..main --oneline', {
      cwd: REPO_ROOT,
      timeout: 5000,
    }).toString().trim();

    if (!output) return { count: 0, list: [] };

    const list = output.split('\n').filter(Boolean).map(line => ({
      sha: line.slice(0, 7),
      message: line.slice(8),
    }));

    return { count: list.length, list };
  } catch {
    // git no disponible en el servidor (Render) — solo funciona en local
    return { count: -1, list: [] };
  }
}

/** Migraciones pendientes en PROD */
async function getMigrationStatus(prodClient: InstanceType<typeof Client>) {
  // Crear tabla si no existe aún
  await prodClient.query(`
    CREATE TABLE IF NOT EXISTS public._rural24_migrations (
      filename   TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      applied_by TEXT        DEFAULT 'migration-script'
    )
  `);

  const { rows } = await prodClient.query<{ filename: string }>(
    'SELECT filename FROM public._rural24_migrations ORDER BY filename'
  );
  const appliedSet = new Set(rows.map(r => r.filename));

  const allFiles = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const pending = allFiles.filter(f => !appliedSet.has(f));
  const applied = allFiles.filter(f => appliedSet.has(f));

  return { pending, applied, total: allFiles.length };
}

/** Hash de una tabla para comparar entre envs */
async function getTableHash(client: InstanceType<typeof Client>, table: string): Promise<string | null> {
  try {
    const { rows } = await client.query<{ hash: string }>(`
      SELECT md5(string_agg(row_text, '|' ORDER BY row_text)) AS hash
      FROM (SELECT row_to_json(t)::text AS row_text FROM public."${table}" t) sub
    `);
    return rows[0]?.hash ?? null;
  } catch {
    return null;
  }
}

/** Comparación de tablas config entre DEV y PROD */
async function getConfigStatus(devClient: InstanceType<typeof Client>, prodClient: InstanceType<typeof Client>) {
  const results = await Promise.all(
    CONFIG_TABLES.map(async (table) => {
      const [devHash, prodHash] = await Promise.all([
        getTableHash(devClient, table),
        getTableHash(prodClient, table),
      ]);
      return {
        name: table,
        inSync: devHash !== null && prodHash !== null && devHash === prodHash,
        devRows: devHash,
        prodRows: prodHash,
      };
    })
  );

  return {
    synced: results.every(t => t.inSync),
    tables: results.map(({ name, inSync }) => ({ name, inSync })),
  };
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const devUrl  = process.env.SYNC_DEV_DB_URL;
    const prodUrl = process.env.SYNC_PROD_DB_URL;

    if (!devUrl || !prodUrl) {
      return NextResponse.json(
        { success: false, error: 'SYNC_DEV_DB_URL / SYNC_PROD_DB_URL no configurados en el backend' },
        { status: 503 }
      );
    }

    const devClient  = getDbClient(devUrl);
    const prodClient = getDbClient(prodUrl);

    try {
      await Promise.all([devClient.connect(), prodClient.connect()]);

      const [commits, migrations, config] = await Promise.all([
        Promise.resolve(getCommitDiff()),
        getMigrationStatus(prodClient),
        getConfigStatus(devClient, prodClient),
      ]);

      const hasPending =
        (commits.count > 0) ||
        migrations.pending.length > 0 ||
        !config.synced;

      return NextResponse.json({
        success: true,
        hasPending,
        commits,
        migrations,
        config,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('[sync/status] Error:', err);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    } finally {
      await Promise.all([
        devClient.end().catch(() => {}),
        prodClient.end().catch(() => {}),
      ]);
    }
  }, { roles: ['superadmin'] });
}
