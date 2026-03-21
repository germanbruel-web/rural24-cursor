/**
 * db-apply-formwizard.mjs
 * Aplica el data dump del Form Wizard (formwizard-latest.sql) a DEV, PROD o local.
 *
 * Uso:
 *   node scripts/db-apply-formwizard.mjs dev
 *   node scripts/db-apply-formwizard.mjs prod
 *   node scripts/db-apply-formwizard.mjs local   (requiere LOCAL_DB_URL en .env.db.local)
 *   node scripts/db-apply-formwizard.mjs prod --dry-run
 *
 * Estrategia: INSERT ... ON CONFLICT DO NOTHING
 *   → seguro de correr múltiples veces
 *   → no borra datos existentes en PROD
 *   → solo agrega lo que falta
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const latestSnapshot = path.join(root, 'database', 'snapshots', 'formwizard-latest.sql');

const env = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!env || !['dev', 'prod', 'local'].includes(env)) {
  console.error('❌ Uso: node scripts/db-apply-formwizard.mjs [dev|prod|local] [--dry-run]');
  process.exit(1);
}

if (!existsSync(latestSnapshot)) {
  console.error('❌ No existe database/snapshots/formwizard-latest.sql');
  console.error('   Corré primero: node scripts/db-dump-formwizard.mjs');
  process.exit(1);
}

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
const urlKey = env === 'prod' ? 'PROD_DB_URL' : env === 'local' ? 'LOCAL_DB_URL' : 'DEV_DB_URL';
const rawUrl = envVars[urlKey];

if (!rawUrl) {
  console.error(`❌ Falta ${urlKey} en .env.db.local`);
  process.exit(1);
}
const dbUrl = rawUrl.replace(/:6543\//, ':5432/');

// Leer el SQL y extraer solo los INSERT statements
const sql = readFileSync(latestSnapshot, 'utf8');
const insertLines = sql
  .split('\n')
  .filter(line => line.trim().startsWith('INSERT '));

const label = env === 'prod' ? '🔴 PROD' : env === 'local' ? '🔵 LOCAL' : '🟡 DEV';

console.log(`\n${label} — Aplicando Form Wizard data → ${env.toUpperCase()}`);
console.log(`   Statements: ${insertLines.length} INSERTs`);
if (dryRun) {
  console.log('\n--- DRY RUN (primeros 20) ---');
  insertLines.slice(0, 20).forEach((l, i) => console.log(`[${i+1}] ${l.substring(0, 120)}...`));
  if (insertLines.length > 20) console.log(`... y ${insertLines.length - 20} más`);
  console.log('\n✅ Dry run completo.\n');
  process.exit(0);
}

if (env === 'prod') {
  console.log('\n⚠️  Aplicando en PRODUCCIÓN. Tenés 5 segundos para cancelar (Ctrl+C)...\n');
  await new Promise(r => setTimeout(r, 5000));
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`\n✅ Conectado a ${env.toUpperCase()}\n`);

  // Deshabilitar FK checks
  await client.query("SET session_replication_role = 'replica'");

  let ok = 0, skipped = 0, errors = 0;

  for (const line of insertLines) {
    try {
      await client.query(line);
      ok++;
    } catch (err) {
      if (err.message.toLowerCase().includes('duplicate key') ||
          err.message.toLowerCase().includes('already exists')) {
        skipped++;
      } else {
        errors++;
        console.warn(`⚠️  ${err.message.split('\n')[0]}`);
        console.warn(`   ${line.substring(0, 100)}...`);
      }
    }
  }

  await client.query("SET session_replication_role = 'origin'");

  console.log(`\n📊 Resultado:`);
  console.log(`   ✅ Insertados:   ${ok}`);
  console.log(`   ⏭  Ya existían: ${skipped}`);
  if (errors > 0) console.log(`   ⚠️  Errores:    ${errors}`);
  console.log(`\n✅ ${label} — Form Wizard data aplicado.\n`);

} finally {
  await client.end().catch(() => {});
}
