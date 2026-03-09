/**
 * db-run-migrations.mjs
 * Aplica archivos de migración específicos contra DEV o PROD.
 * No depende del tracking de supabase CLI — ejecuta el SQL directamente.
 *
 * Uso:
 *   node scripts/db-run-migrations.mjs prod 20260309
 *       → aplica todas las migraciones del día 20260309 contra PROD
 *
 *   node scripts/db-run-migrations.mjs dev 20260309
 *       → aplica todas las migraciones del día 20260309 contra DEV
 *
 *   node scripts/db-run-migrations.mjs prod 20260309000004 20260309000005
 *       → aplica archivos específicos contra PROD
 *
 * Requiere: .env.db.local con DEV_DB_URL y PROD_DB_URL
 */

import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');

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

// ── Args ───────────────────────────────────────────────────────────────────
const [, , env, ...filters] = process.argv;

if (!env || !['dev', 'prod'].includes(env)) {
  console.error('❌ Uso: node scripts/db-run-migrations.mjs [dev|prod] [fecha_o_prefijo...]');
  console.error('   Ejemplos:');
  console.error('     node scripts/db-run-migrations.mjs prod 20260309');
  console.error('     node scripts/db-run-migrations.mjs prod 20260309000004 20260309000005');
  process.exit(1);
}

if (filters.length === 0) {
  console.error('❌ Falta el filtro de fecha o prefijo.');
  console.error('   Ejemplo: node scripts/db-run-migrations.mjs prod 20260309');
  process.exit(1);
}

// ── Resolver URL ───────────────────────────────────────────────────────────
const envVars = loadEnvFile(path.join(root, '.env.db.local'));
const rawUrl = env === 'prod' ? envVars.PROD_DB_URL : envVars.DEV_DB_URL;

if (!rawUrl) {
  console.error(`❌ Falta ${env === 'prod' ? 'PROD' : 'DEV'}_DB_URL en .env.db.local`);
  process.exit(1);
}
// Forzar direct connection (port 5432)
const dbUrl = rawUrl.replace(/:6543\//, ':5432/');

// ── Resolver archivos a aplicar ────────────────────────────────────────────
const allFiles = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

const toApply = allFiles.filter(filename =>
  filters.some(f => filename.startsWith(f))
);

if (toApply.length === 0) {
  console.error(`❌ No se encontraron migraciones que coincidan con: ${filters.join(', ')}`);
  console.error('   Archivos disponibles:');
  allFiles.forEach(f => console.error(`     ${f}`));
  process.exit(1);
}

// ── Confirmación ───────────────────────────────────────────────────────────
const label = env === 'prod' ? '🔴 PROD' : '🟡 DEV';
console.log(`\n${label} — Migraciones a aplicar:\n`);
toApply.forEach(f => console.log(`   📄 ${f}`));
console.log();

// Pausa de seguridad para PROD
if (env === 'prod') {
  console.log('⚠️  Aplicando en PRODUCCIÓN. Tenés 3 segundos para cancelar (Ctrl+C)...\n');
  await new Promise(r => setTimeout(r, 3000));
}

// ── Ejecutar ───────────────────────────────────────────────────────────────
const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log(`✅ Conectado a ${env.toUpperCase()}\n`);

  for (const filename of toApply) {
    const filePath = path.join(migrationsDir, filename);
    const sql = readFileSync(filePath, 'utf8');

    process.stdout.write(`   ▶ ${filename} ... `);
    try {
      await client.query(sql);
      console.log('✅');
    } catch (err) {
      console.log('❌');
      console.error(`\n   Error en ${filename}:`);
      console.error(`   ${err.message}\n`);
      // Continuar con las siguientes o abortar?
      // Abortamos para no dejar la DB en estado inconsistente
      process.exit(1);
    }
  }

  console.log(`\n✅ ${label} — ${toApply.length} migración(es) aplicada(s) correctamente.\n`);
} finally {
  await client.end().catch(() => {});
}
