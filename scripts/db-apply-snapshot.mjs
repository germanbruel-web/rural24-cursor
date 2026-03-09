/**
 * db-apply-snapshot.mjs
 * Aplica el snapshot de DEV (dev-latest.sql) a PROD.
 * Ejecuta el SQL statement por statement para manejar errores individualmente.
 *
 * Uso:
 *   node scripts/db-apply-snapshot.mjs prod     → aplica a PROD
 *   node scripts/db-apply-snapshot.mjs dev      → aplica a DEV (testing)
 *   node scripts/db-apply-snapshot.mjs prod --dry-run  → solo muestra qué haría
 *
 * Requiere: .env.db.local con DEV_DB_URL y PROD_DB_URL
 *           Haber corrido db-dump-dev.mjs primero
 *
 * ⚠️  IMPORTANTE: Este script usa IF NOT EXISTS / OR REPLACE donde aplica.
 *     pg_dump genera CREATE TABLE sin IF NOT EXISTS — el script los convierte.
 *     Las tablas existentes NO se dropean: solo se agregan columnas/funciones nuevas.
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const latestSnapshot = path.join(root, 'database', 'snapshots', 'dev-latest.sql');

// ── Args ───────────────────────────────────────────────────────────────────
const env = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!env || !['dev', 'prod'].includes(env)) {
  console.error('❌ Uso: node scripts/db-apply-snapshot.mjs [dev|prod] [--dry-run]');
  process.exit(1);
}

if (!existsSync(latestSnapshot)) {
  console.error('❌ No existe database/snapshots/dev-latest.sql');
  console.error('   Corré primero: node scripts/db-dump-dev.mjs');
  process.exit(1);
}

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
const rawUrl = env === 'prod' ? envVars.PROD_DB_URL : envVars.DEV_DB_URL;

if (!rawUrl) {
  console.error(`❌ Falta ${env === 'prod' ? 'PROD' : 'DEV'}_DB_URL en .env.db.local`);
  process.exit(1);
}
const dbUrl = rawUrl.replace(/:6543\//, ':5432/');

// ── Leer y procesar el snapshot ────────────────────────────────────────────
let sql = readFileSync(latestSnapshot, 'utf8');

// Hacer el SQL idempotente: convertir CREATE TABLE → CREATE TABLE IF NOT EXISTS
// pg_dump no genera IF NOT EXISTS por defecto
sql = sql.replace(/\bCREATE TABLE\b(?!\s+IF\s+NOT\s+EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS');
sql = sql.replace(/\bCREATE INDEX\b(?!\s+IF\s+NOT\s+EXISTS)(?!\s+CONCURRENTLY\s+IF)/gi, 'CREATE INDEX IF NOT EXISTS');
sql = sql.replace(/\bCREATE UNIQUE INDEX\b(?!\s+IF\s+NOT\s+EXISTS)/gi, 'CREATE UNIQUE INDEX IF NOT EXISTS');
sql = sql.replace(/\bCREATE SEQUENCE\b(?!\s+IF\s+NOT\s+EXISTS)/gi, 'CREATE SEQUENCE IF NOT EXISTS');
sql = sql.replace(/\bCREATE TYPE\b(?!\s+IF\s+NOT\s+EXISTS)/gi, 'CREATE TYPE IF NOT EXISTS');

// Dividir en statements individuales (separados por ;)
// Ignorar líneas de comentario y statements vacíos
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && s.length > 10);

const label = env === 'prod' ? '🔴 PROD' : '🟡 DEV';

console.log(`\n${label} — Aplicando snapshot DEV → ${env.toUpperCase()}`);
console.log(`   Archivo: database/snapshots/dev-latest.sql`);
console.log(`   Statements: ${statements.length}`);
if (dryRun) console.log(`   Modo: DRY RUN (no ejecuta nada)\n`);
else console.log();

if (env === 'prod' && !dryRun) {
  console.log('⚠️  Aplicando en PRODUCCIÓN. Tenés 5 segundos para cancelar (Ctrl+C)...\n');
  await new Promise(r => setTimeout(r, 5000));
}

if (dryRun) {
  console.log('--- STATEMENTS A EJECUTAR ---\n');
  statements.slice(0, 20).forEach((s, i) => {
    console.log(`[${i+1}] ${s.substring(0, 120).replace(/\n/g, ' ')}...`);
  });
  if (statements.length > 20) console.log(`\n... y ${statements.length - 20} más`);
  console.log('\n✅ Dry run completo. Usá sin --dry-run para aplicar.\n');
  process.exit(0);
}

// ── Ejecutar ───────────────────────────────────────────────────────────────
const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`✅ Conectado a ${env.toUpperCase()}\n`);

  let ok = 0, skipped = 0, errors = 0;

  for (const stmt of statements) {
    // Omitir statements que son solo comentarios
    if (stmt.replace(/--.*$/gm, '').trim().length === 0) continue;

    try {
      await client.query(stmt + ';');
      ok++;
    } catch (err) {
      // Errores esperados (cosas que ya existen) → skip silencioso
      const ignorable = [
        'already exists',
        'duplicate key',
        'multiple primary keys',
      ];
      if (ignorable.some(msg => err.message.toLowerCase().includes(msg.toLowerCase()))) {
        skipped++;
      } else {
        errors++;
        console.warn(`\n⚠️  [${errors}] ${err.message.split('\n')[0]}`);
        console.warn(`   SQL: ${stmt.substring(0, 100).replace(/\n/g, ' ')}...`);
      }
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Aplicados:  ${ok}`);
  console.log(`   ⏭  Ya existían: ${skipped}`);
  if (errors > 0) console.log(`   ⚠️  Warnings:   ${errors} (revisar arriba)`);
  console.log(`\n✅ ${label} — Snapshot aplicado.\n`);

} finally {
  await client.end().catch(() => {});
}
