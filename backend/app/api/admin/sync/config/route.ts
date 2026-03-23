/**
 * POST /api/admin/sync/config
 * Clona las tablas de configuración de DEV a PROD.
 * Tablas: global_settings, global_config, subcategories, option_lists, option_list_items
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import pkg from 'pg';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const { Client } = pkg;

// Tablas a clonar y su orden (respeta FKs)
const CLONE_TABLES = [
  'global_settings',
  'global_config',
  'option_lists',
  'option_list_items',
];

// Subcategorías requieren ordenamiento topológico (self-ref FK parent_id)
const SELF_REF_TABLE = 'subcategories';

interface Row { [key: string]: unknown }

function getDbClient(url: string) {
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

/** Ordena filas con parent_id self-referencial (padre antes que hijo) */
function topologicalSort(rows: Row[]): Row[] {
  const ordered: Row[] = [];
  const remaining = [...rows];
  const insertedIds = new Set<unknown>();
  let prevSize = -1;

  while (remaining.length > 0 && remaining.length !== prevSize) {
    prevSize = remaining.length;
    for (let i = remaining.length - 1; i >= 0; i--) {
      const row = remaining[i];
      if (!row['parent_id'] || insertedIds.has(row['parent_id'])) {
        ordered.push(row);
        insertedIds.add(row['id']);
        remaining.splice(i, 1);
      }
    }
  }
  // Filas huérfanas (por si acaso)
  ordered.push(...remaining);
  return ordered;
}

async function cloneTable(
  devClient: InstanceType<typeof Client>,
  prodClient: InstanceType<typeof Client>,
  tableName: string
): Promise<{ table: string; rows: number }> {
  const { rows } = await devClient.query<Row>(`SELECT * FROM public."${tableName}"`);
  if (rows.length === 0) {
    await prodClient.query(`TRUNCATE TABLE public."${tableName}" CASCADE`);
    return { table: tableName, rows: 0 };
  }

  const rowsToInsert = tableName === SELF_REF_TABLE ? topologicalSort(rows) : rows;
  const columns = Object.keys(rowsToInsert[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  await prodClient.query('BEGIN');
  try {
    await prodClient.query(`TRUNCATE TABLE public."${tableName}" CASCADE`);
    for (const row of rowsToInsert) {
      const values = columns.map((_, i) => `$${i + 1}`).join(', ');
      await prodClient.query(
        `INSERT INTO public."${tableName}" (${colList}) VALUES (${values})`,
        columns.map(c => row[c])
      );
    }
    await prodClient.query('COMMIT');
  } catch (err) {
    await prodClient.query('ROLLBACK').catch(() => {});
    throw err;
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

    const body = await request.json().catch(() => ({}));
    // tables opcional: array de tablas a clonar. Vacío = todas.
    const requestedTables: string[] = Array.isArray(body.tables) ? body.tables : [];
    const tablesToClone = requestedTables.length > 0
      ? [...CLONE_TABLES, SELF_REF_TABLE].filter(t => requestedTables.includes(t))
      : [...CLONE_TABLES, SELF_REF_TABLE];

    const devClient  = getDbClient(devUrl);
    const prodClient = getDbClient(prodUrl);

    try {
      await Promise.all([devClient.connect(), prodClient.connect()]);

      const results: { table: string; rows: number; ok: boolean; error?: string }[] = [];

      for (const table of tablesToClone) {
        try {
          const result = await cloneTable(devClient, prodClient, table);
          results.push({ ...result, ok: true });
          logger.log(`[sync/config] Clonada: ${table} (${result.rows} filas)`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({ table, rows: 0, ok: false, error: msg });
          logger.error(`[sync/config] Error en ${table}:`, msg);
          break;
        }
      }

      const allOk = results.every(r => r.ok);
      return NextResponse.json({ success: allOk, results });

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
