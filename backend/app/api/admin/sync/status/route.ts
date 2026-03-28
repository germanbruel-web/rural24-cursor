/**
 * GET /api/admin/sync/status
 *
 * Devuelve el estado de sincronización en 2 etapas:
 *   - local:  LOCAL → DEV  (commits sin pushear, migraciones pendientes en DEV)
 *   - prod:   DEV   → PROD (commits main→prod, migraciones, config)
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

const REPO_ROOT      = path.resolve(process.cwd(), '..');
const MIGRATIONS_DIR = path.join(REPO_ROOT, 'supabase', 'migrations');
const CONFIG_TABLES  = ['categories', 'global_settings', 'global_config', 'home_sections', 'cms_hero_images', 'hero_images', 'banners_clean', 'form_templates_v2', 'form_fields_v2', 'wizard_configs', 'option_lists', 'option_list_items'];

interface CommitInfo { sha: string; message: string }

function getDbClient(url: string) {
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

/** Archivos modificados sin commitear en el working directory */
function getDirtyFiles(): { count: number; files: string[] } {
  try {
    const output = execSync('git status --porcelain', {
      cwd: REPO_ROOT,
      timeout: 5000,
    }).toString().trim();
    if (!output) return { count: 0, files: [] };
    const files = output.split('\n').filter(Boolean).map(l => l.slice(3));
    return { count: files.length, files };
  } catch {
    return { count: -1, files: [] };
  }
}

/** Commits locales no pusheados a origin/main */
function getUnpushedCommits(): { count: number; list: CommitInfo[] } {
  try {
    const output = execSync('git log origin/main..HEAD --oneline', {
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
    return { count: -1, list: [] };
  }
}

/** Commits en main que no están en prod */
function getCommitDiff(): { count: number; list: CommitInfo[] } {
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
    return { count: -1, list: [] };
  }
}

/** Migraciones pendientes en una DB */
async function getMigrationStatus(client: InstanceType<typeof Client>) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._rural24_migrations (
      filename   TEXT        PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      applied_by TEXT        DEFAULT 'migration-script'
    )
  `);
  const { rows } = await client.query(
    'SELECT filename FROM public._rural24_migrations ORDER BY filename'
  );
  const appliedSet = new Set(rows.map((r: { filename: string }) => r.filename));
  const allFiles = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
  return {
    pending: allFiles.filter(f => !appliedSet.has(f)),
    applied: allFiles.filter(f => appliedSet.has(f)),
    total:   allFiles.length,
  };
}

/** Hash MD5 de una tabla excluyendo columnas de auditoría.
 *  normalizeDevRef: reemplaza ref DEV por PROD antes de hashear (para comparar DEV vs PROD
 *  cuando el clone sustituye storage URLs en los JSONB values). */
const AUDIT_COLS = ['created_at', 'updated_at', 'modified_at', 'created_by', 'updated_by', 'modified_by'];
const DEV_SUPABASE_REF  = 'lmkuecdvxtenrikjomol';
const PROD_SUPABASE_REF = 'ufrzkjuylhvdkrvbjdyh';

async function getTableHash(
  client: InstanceType<typeof Client>,
  table: string,
  normalizeDevRef = false
): Promise<string | null> {
  try {
    const { rows: colRows } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
         AND column_name != ALL($2::text[])
       ORDER BY ordinal_position`,
      [table, AUDIT_COLS]
    );
    if (colRows.length === 0) return null;
    const cols = colRows.map(r => `"${r.column_name}"`).join(', ');

    const rowTextExpr = normalizeDevRef
      ? `replace(row_to_json(t)::text, '${DEV_SUPABASE_REF}', '${PROD_SUPABASE_REF}')`
      : `row_to_json(t)::text`;

    const { rows } = await client.query<{ hash: string }>(
      `SELECT md5(string_agg(row_text, '|' ORDER BY row_text)) AS hash
       FROM (SELECT ${rowTextExpr} AS row_text FROM (SELECT ${cols} FROM public."${table}") t) sub`
    );
    return rows[0]?.hash ?? null;
  } catch {
    return null;
  }
}

async function getConfigStatus(devClient: InstanceType<typeof Client>, prodClient: InstanceType<typeof Client>) {
  const results = await Promise.all(
    CONFIG_TABLES.map(async (table) => {
      const [devHash, prodHash] = await Promise.all([
        getTableHash(devClient, table, true),  // normaliza refs DEV→PROD antes de hashear
        getTableHash(prodClient, table, false),
      ]);
      return {
        name:   table,
        // null === null (ambas vacías) = en sync; distinto = desincronizado
        inSync: devHash === prodHash,
      };
    })
  );
  return {
    synced: results.every(t => t.inSync),
    tables: results,
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

      const [unpushed, dirty, commitsDiff, migrationsDev, migrationsProd, config] = await Promise.all([
        Promise.resolve(getUnpushedCommits()),
        Promise.resolve(getDirtyFiles()),
        Promise.resolve(getCommitDiff()),
        getMigrationStatus(devClient),
        getMigrationStatus(prodClient),
        getConfigStatus(devClient, prodClient),
      ]);

      const localHasPending =
        dirty.count > 0 ||
        unpushed.count > 0 ||
        migrationsDev.pending.length > 0;

      const prodHasPending =
        (commitsDiff.count > 0) ||
        migrationsProd.pending.length > 0 ||
        !config.synced;

      const hasPending = localHasPending || prodHasPending;

      return NextResponse.json({
        success: true,
        hasPending,
        // Etapa 1: LOCAL → DEV
        local: {
          hasPending: localHasPending,
          dirtyFiles: dirty,
          unpushedCommits: unpushed,
          migrations: migrationsDev,
        },
        // Etapa 2: DEV → PROD
        prod: {
          hasPending: prodHasPending,
          commits: commitsDiff,
          migrations: migrationsProd,
          config,
        },
        // Legado — alias para compatibilidad con badge en DashboardLayout
        commits:    commitsDiff,
        migrations: migrationsProd,
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
