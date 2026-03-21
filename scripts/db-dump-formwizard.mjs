/**
 * db-dump-formwizard.mjs
 * Exporta los datos del Form Wizard de DEV a SQL.
 * Captura tablas de configuración que NO entran en el schema dump.
 *
 * Uso:
 *   node scripts/db-dump-formwizard.mjs
 *
 * Output:
 *   database/snapshots/formwizard-YYYYMMDD-HHMMSS.sql
 *   database/snapshots/formwizard-latest.sql
 *
 * Tablas incluidas (solo datos, no DDL):
 *   form_templates_v2, form_fields_v2,
 *   option_lists, option_list_items,
 *   wizard_configs
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const snapshotsDir = path.join(root, 'database', 'snapshots');

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const vars = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      vars[key] = val;
    }
    return vars;
  } catch {
    return {};
  }
}

const envVars = loadEnvFile(path.join(root, '.env.db.local'));
const rawUrl = envVars.DEV_DB_URL;

if (!rawUrl) {
  console.error('❌ Falta DEV_DB_URL en .env.db.local');
  process.exit(1);
}

const dbUrl = rawUrl.replace(/:6543\//, ':5432/');

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const filename = `formwizard-${timestamp}.sql`;
const outputPath = path.join(snapshotsDir, filename);
const latestPath = path.join(snapshotsDir, 'formwizard-latest.sql');

mkdirSync(snapshotsDir, { recursive: true });

const TABLES = [
  'option_lists',
  'option_list_items',
  'form_templates_v2',
  'form_fields_v2',
  'wizard_configs',
];

console.log('\n🟡 DEV → Exportando datos Form Wizard...');
console.log(`   Tablas: ${TABLES.join(', ')}`);
console.log(`   Output: database/snapshots/${filename}\n`);

// pg_dump data-only con TRUNCATE antes de INSERT (idempotente)
const tableArgs = TABLES.map(t => `-t public.${t}`).join(' ');
const cmd = `pg_dump --data-only --column-inserts --on-conflict-do-nothing ${tableArgs} -d "${dbUrl}"`;

try {
  const output = execSync(cmd, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });

  const header = `-- ============================================================
-- Form Wizard Data Dump — Rural24
-- Generado: ${new Date().toISOString()}
-- Fuente: DEV (Staging)
-- Tablas: ${TABLES.join(', ')}
-- Uso: psql $LOCAL_DB_URL -f database/snapshots/formwizard-latest.sql
--      node scripts/db-apply-formwizard.mjs prod
-- ============================================================

SET session_replication_role = 'replica'; -- deshabilita FK checks durante import

`;

  const footer = `
SET session_replication_role = 'origin'; -- restaura FK checks
`;

  const full = header + output + footer;
  writeFileSync(outputPath, full, 'utf8');
  copyFileSync(outputPath, latestPath);

  const rows = (output.match(/^INSERT/gm) || []).length;
  console.log(`✅ Form Wizard exportado: ${rows.toLocaleString()} rows`);
  console.log(`   📄 database/snapshots/${filename}`);
  console.log(`   📄 database/snapshots/formwizard-latest.sql (actualizado)\n`);
  TABLES.forEach(t => {
    const count = (output.match(new RegExp(`INSERT INTO public\\.${t}`, 'g')) || []).length;
    if (count > 0) console.log(`   ${t}: ${count} rows`);
  });
  console.log('\nPróximo paso: node scripts/db-apply-formwizard.mjs prod\n');

} catch (err) {
  if (err.message.includes('pg_dump: command not found') || err.message.includes('not recognized')) {
    console.error('❌ pg_dump no encontrado. Instalá PostgreSQL client tools.');
  } else {
    console.error('❌ Error:', err.message);
  }
  process.exit(1);
}
