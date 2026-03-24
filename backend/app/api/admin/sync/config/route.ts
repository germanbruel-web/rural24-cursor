/**
 * POST /api/admin/sync/config
 * Clona las tablas de configuración de DEV → PROD.
 * Replica la lógica de scripts/db-clone-config.mjs — commit por tabla para evitar timeout.
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';

// Necesario en Next.js para rutas que pueden tardar más de 10s
export const maxDuration = 300;
import pkg from 'pg';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const { Client } = pkg;

// Mismo orden que db-clone-config.mjs (respeta FKs entre tablas)
const TABLES = [
  'categories', 'subcategories',
  'site_settings', 'global_settings', 'global_config',
  'cms_hero_images', 'hero_images',
  'home_sections',
  'banners', 'banners_clean',
  'option_lists', 'option_list_items',
  'form_templates_v2', 'form_fields_v2',
  'wizard_configs',
];

const NULLIFY_COLS = ['updated_by', 'created_by', 'modified_by'];
const DEV_REF  = 'lmkuecdvxtenrikjomol';
const PROD_REF = 'ufrzkjuylhvdkrvbjdyh';

interface Row { [key: string]: unknown }

function replaceStorageRefs(val: unknown): unknown {
  if (typeof val === 'string') return val.split(DEV_REF).join(PROD_REF);
  if (val !== null && typeof val === 'object') {
    return JSON.parse(JSON.stringify(val).split(DEV_REF).join(PROD_REF));
  }
  return val;
}

function topoSort(rows: Row[]): Row[] {
  const ordered: Row[] = [];
  const remaining = [...rows];
  const inserted = new Set<unknown>();
  let prevSize = -1;
  while (remaining.length > 0 && remaining.length !== prevSize) {
    prevSize = remaining.length;
    for (let i = remaining.length - 1; i >= 0; i--) {
      const row = remaining[i];
      if (!row['parent_id'] || inserted.has(row['parent_id'])) {
        ordered.push(row);
        inserted.add(row['id']);
        remaining.splice(i, 1);
      }
    }
  }
  if (remaining.length > 0) ordered.push(...remaining);
  return ordered;
}

async function cloneTable(
  devClient: InstanceType<typeof Client>,
  prodClient: InstanceType<typeof Client>,
  tableName: string
): Promise<{ table: string; rows: number }> {
  const result = await devClient.query(`SELECT * FROM public."${tableName}"`);
  const rows = result.rows as Row[];

  await prodClient.query(`TRUNCATE TABLE public."${tableName}" RESTART IDENTITY CASCADE`);

  if (rows.length === 0) return { table: tableName, rows: 0 };

  // Detectar columnas JSON/JSONB por OID
  const jsonCols = new Set<string>(
    result.fields
      .filter((f: { dataTypeID: number }) => f.dataTypeID === 3802 || f.dataTypeID === 114)
      .map((f: { name: string }) => f.name)
  );

  const rowsToInsert = tableName === 'subcategories' ? topoSort(rows) : rows;
  const columns = Object.keys(rowsToInsert[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  const BATCH = 100;
  for (let i = 0; i < rowsToInsert.length; i += BATCH) {
    const chunk = rowsToInsert.slice(i, i + BATCH);
    const allValues: unknown[] = [];
    const rowPlaceholders = chunk.map((row, ri) => {
      const vals = columns.map(col => {
        if (NULLIFY_COLS.includes(col)) return null;
        const val = replaceStorageRefs(row[col]);
        if (jsonCols.has(col) && val !== null) {
          return typeof val === 'string' ? val : JSON.stringify(val);
        }
        return val;
      });
      allValues.push(...vals);
      const base = ri * columns.length;
      return `(${columns.map((_, ci) => `$${base + ci + 1}`).join(', ')})`;
    });
    await prodClient.query(
      `INSERT INTO public."${tableName}" (${colList}) VALUES ${rowPlaceholders.join(', ')}`,
      allValues
    );
  }

  return { table: tableName, rows: rowsToInsert.length };
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const devUrl  = process.env.SYNC_DEV_DB_URL;
    const prodUrl = process.env.SYNC_PROD_DB_URL;

    if (!devUrl || !prodUrl) {
      return NextResponse.json(
        { success: false, error: 'SYNC_DEV_DB_URL / SYNC_PROD_DB_URL no configurados' },
        { status: 503 }
      );
    }

    const devClient  = new Client({ connectionString: devUrl,  ssl: { rejectUnauthorized: false } });
    const prodClient = new Client({ connectionString: prodUrl, ssl: { rejectUnauthorized: false } });

    try {
      await Promise.all([devClient.connect(), prodClient.connect()]);

      // SET statement_timeout para evitar queries colgadas
      await Promise.all([
        devClient.query("SET statement_timeout = '60s'"),
        prodClient.query("SET statement_timeout = '60s'"),
      ]);

      // Commit por tabla (no una sola transacción gigante que timeout)
      const results: { table: string; rows: number }[] = [];
      for (const table of TABLES) {
        await prodClient.query('BEGIN');
        try {
          const r = await cloneTable(devClient, prodClient, table);
          await prodClient.query('COMMIT');
          results.push(r);
          logger.log(`[sync/config] ${table}: ${r.rows} filas`);
        } catch (err) {
          await prodClient.query('ROLLBACK').catch(() => {});
          throw err;
        }
      }

      return NextResponse.json({ success: true, results });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('[sync/config] Error:', err);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    } finally {
      await Promise.all([
        devClient.end().catch(() => {}),
        prodClient.end().catch(() => {}),
      ]);
    }
  }, { roles: ['superadmin'] });
}
