/**
 * GET /api/admin/sync/backup?target=dev|prod
 *
 * Descarga un backup SQL de las tablas de configuración + _rural24_migrations.
 * Devuelve el contenido SQL como archivo descargable (Content-Disposition: attachment).
 *
 * NO contiene datos de usuarios (ads, users, wallets, etc.) — solo config/schema.
 * Para backup completo de datos usar el dashboard de Supabase.
 *
 * Solo superadmin.
 */

import { NextRequest, NextResponse } from 'next/server';
import pkg from 'pg';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';
import { logger } from '@/lib/logger';

const { Client } = pkg;

const TABLES_TO_BACKUP = [
  '_rural24_migrations',
  'categories',
  'global_settings',
  'global_config',
  'home_sections',
  'cms_hero_images',
  'hero_images',
  'banners_clean',
  'form_templates_v2',
  'form_fields_v2',
  'wizard_configs',
  'option_lists',
  'option_list_items',
  'subscription_plans',
  'featured_durations',
];

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString().replace(/'/g, "''")}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function dumpTable(client: InstanceType<typeof Client>, table: string): Promise<string> {
  try {
    // Verificar que la tabla existe
    const { rows: tableExists } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      ) AS exists`,
      [table]
    );
    if (!tableExists[0]?.exists) {
      return `-- Tabla ${table}: no existe en esta DB\n`;
    }

    // Obtener columnas en orden
    const { rows: cols } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );
    if (cols.length === 0) return `-- Tabla ${table}: sin columnas\n`;

    const colNames = cols.map(c => c.column_name);
    const colList  = colNames.map(c => `"${c}"`).join(', ');

    // Obtener todas las filas
    const { rows } = await client.query(`SELECT ${colList} FROM public."${table}" ORDER BY 1`);

    if (rows.length === 0) {
      return `-- Tabla ${table}: vacía\n`;
    }

    const lines: string[] = [
      `-- ── ${table} (${rows.length} filas) ────────────────────────────────────`,
      `DELETE FROM public."${table}";`,
    ];

    for (const row of rows) {
      const values = colNames.map(col => escapeValue(row[col])).join(', ');
      lines.push(`INSERT INTO public."${table}" (${colList}) VALUES (${values});`);
    }
    lines.push('');

    return lines.join('\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return `-- ERROR al volcar ${table}: ${msg}\n`;
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target') === 'prod' ? 'prod' : 'dev';

    const dbUrl = target === 'dev'
      ? process.env.SYNC_DEV_DB_URL
      : process.env.SYNC_PROD_DB_URL;

    if (!dbUrl) {
      return NextResponse.json(
        { error: `SYNC_${target.toUpperCase()}_DB_URL no configurado` },
        { status: 503 }
      );
    }

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    try {
      await client.connect();

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const header = [
        `-- ============================================================`,
        `-- Rural24 — Backup de configuración`,
        `-- Entorno: ${target.toUpperCase()}`,
        `-- Generado: ${new Date().toISOString()}`,
        `-- Tablas: ${TABLES_TO_BACKUP.join(', ')}`,
        `-- NOTA: Solo datos de configuración. Datos de usuarios NO incluidos.`,
        `-- ============================================================`,
        '',
        'BEGIN;',
        '',
      ].join('\n');

      const parts = await Promise.all(
        TABLES_TO_BACKUP.map(t => dumpTable(client, t))
      );

      const footer = '\nCOMMIT;\n';
      const sql = header + parts.join('\n') + footer;

      logger.info(`[sync/backup] Backup ${target} generado: ${sql.length} bytes`);

      return new NextResponse(sql, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="rural24_backup_${target}_${timestamp}.sql"`,
        },
      });

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('[sync/backup] Error:', err);
      return NextResponse.json({ error: message }, { status: 500 });
    } finally {
      await client.end().catch(() => {});
    }
  }, { roles: ['superadmin'] });
}
