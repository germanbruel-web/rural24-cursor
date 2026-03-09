/**
 * db-dump-dev.mjs
 * Exporta el schema completo de DEV (Staging) a un archivo SQL local.
 * DEV es la fuente de verdad → este dump se usa para sincronizar PROD.
 *
 * Uso:
 *   node scripts/db-dump-dev.mjs
 *
 * Output:
 *   database/snapshots/dev-YYYYMMDD-HHMMSS.sql
 *   database/snapshots/dev-latest.sql  (symlink/copia al más reciente)
 *
 * Requiere: pg_dump instalado (viene con PostgreSQL client tools)
 *           .env.db.local con DEV_DB_URL
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const snapshotsDir = path.join(root, 'database', 'snapshots');

// ── Leer .env.db.local ─────────────────────────────────────────────────────
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

// Forzar direct connection port 5432
const dbUrl = rawUrl.replace(/:6543\//, ':5432/');

// ── Nombre del archivo de salida ───────────────────────────────────────────
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const filename = `dev-${timestamp}.sql`;
const outputPath = path.join(snapshotsDir, filename);
const latestPath = path.join(snapshotsDir, 'dev-latest.sql');

// Crear directorio si no existe
mkdirSync(snapshotsDir, { recursive: true });

console.log('\n🟡 DEV → Exportando schema completo...');
console.log(`   Output: database/snapshots/${filename}\n`);

// ── pg_dump ────────────────────────────────────────────────────────────────
// --schema-only     : solo DDL (tablas, funciones, políticas, índices)
// --schema=public   : solo el schema public (excluye auth, storage, etc.)
// --no-owner        : no incluye SET ROLE / ALTER OWNER (evita errores en PROD)
// --no-acl          : no incluye GRANTs de pg_dump (los GRANTs los manejan las migraciones)
// --no-comments     : más limpio
const cmd = `pg_dump --schema-only --schema=public --no-owner --no-acl --no-comments -d "${dbUrl}"`;

try {
  const output = execSync(cmd, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024, // 50MB
  });

  // Header con metadata
  const header = `-- ============================================================
-- DEV Schema Dump — Rural24
-- Generado: ${new Date().toISOString()}
-- Fuente: DEV (Staging)
-- Uso: aplicar a PROD con node scripts/db-apply-snapshot.mjs prod
-- ============================================================\n\n`;

  writeFileSync(outputPath, header + output, 'utf8');
  copyFileSync(outputPath, latestPath); // sobreescribe dev-latest.sql

  const lines = output.split('\n').length;
  console.log(`✅ Schema exportado: ${lines.toLocaleString()} líneas`);
  console.log(`   📄 database/snapshots/${filename}`);
  console.log(`   📄 database/snapshots/dev-latest.sql (actualizado)\n`);
  console.log('Próximo paso: node scripts/db-apply-snapshot.mjs prod\n');

} catch (err) {
  if (err.message.includes('pg_dump: command not found') || err.message.includes('not recognized')) {
    console.error('❌ pg_dump no encontrado.');
    console.error('   Instalá PostgreSQL client tools:');
    console.error('   https://www.postgresql.org/download/windows/');
    console.error('   O agregá C:\\Program Files\\PostgreSQL\\XX\\bin al PATH.');
  } else {
    console.error('❌ Error al ejecutar pg_dump:');
    console.error('  ', err.message);
  }
  process.exit(1);
}
