/**
 * db-purge-demo.mjs
 * Purga datos de demo de DEV, PROD o ambas bases de datos.
 * Preserva catálogo (categorías, marcas, atributos) y configuración (site/global_settings).
 * Por defecto NO borra usuarios — usá --users para incluirlos.
 *
 * Uso:
 *   node scripts/db-purge-demo.mjs dev              # DEV únicamente
 *   node scripts/db-purge-demo.mjs prod             # PROD únicamente
 *   node scripts/db-purge-demo.mjs all              # DEV + PROD
 *   node scripts/db-purge-demo.mjs all --users      # Incluye usuarios, créditos y billeteras
 *   node scripts/db-purge-demo.mjs all --dry-run    # Solo muestra qué borra, no ejecuta
 *
 * Requiere: .env.db.local con DEV_DB_URL y PROD_DB_URL
 */

import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ============================================================
// Tablas de demo: avisos + transacciones relacionadas
// Orden: hijos antes que padres (respeta FKs)
// ============================================================
const ADS_TABLES = [
  // Backups de migraciones (basura segura)
  'backup_credit_transactions_featured_20260226',
  'backup_featured_ads_20260226',
  // Analytics / logs
  'search_analytics',
  'jobs_log',
  'profile_views',
  // Imágenes generales
  'images',
  // Featured ads (hijos primero)
  'featured_ads_audit',
  'featured_ads_queue',
  'featured_ads',
  // Avisos y dependientes directos
  'ads_moderation_log',
  'ad_images',
  // Pagos / contactos
  'payments',
  'contact_notifications',
  'contact_messages',
  // Tabla principal
  'ads',
];

// Tablas adicionales si se usa --users
const USERS_TABLES = [
  'user_promo_claims',
  'coupon_redemptions',
  'coupon_invitations',
  'wallet_transactions',
  'user_wallets',
  'user_credits',
  'user_featured_credits',
  'credit_transactions',
  'profile_contacts',
  'company_profiles',
  'reseller_points_of_sale',
  'users',
];

// ============================================================
// Helpers
// ============================================================

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

function confirm(question) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function getTableCount(client, tableName) {
  try {
    const res = await client.query(
      `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [tableName]
    );
    if (res.rows[0].count === '0') return null; // tabla no existe
    const count = await client.query(`SELECT COUNT(*) FROM public."${tableName}"`);
    return parseInt(count.rows[0].count, 10);
  } catch {
    return null;
  }
}

async function purgeInDb(client, tables, label, dryRun) {
  console.log(`\n${label}`);

  // Contar filas antes de borrar
  const preview = [];
  for (const t of tables) {
    const count = await getTableCount(client, t);
    if (count === null) continue; // tabla no existe
    preview.push({ table: t, count });
  }

  if (preview.length === 0) {
    console.log('   (sin tablas con datos)');
    return;
  }

  const totalRows = preview.reduce((s, r) => s + r.count, 0);
  console.log(`   Tablas a purgar (${preview.length}):`);
  for (const { table, count } of preview) {
    console.log(`     ${count > 0 ? '🔴' : '⚪'} ${table}: ${count} filas`);
  }
  console.log(`   Total: ${totalRows} filas`);

  if (dryRun) {
    console.log('   [dry-run] No se ejecutó ningún cambio.');
    return;
  }

  // Ejecutar TRUNCATE en una sola transacción
  const existingTables = preview.map(r => r.table);
  const tableList = existingTables.map(t => `public."${t}"`).join(', ');

  await client.query('BEGIN');
  try {
    await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
    await client.query('COMMIT');
    console.log(`   ✅ ${totalRows} filas eliminadas.`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ============================================================
// Main
// ============================================================

const args = process.argv.slice(2);
const target = args.find(a => ['dev', 'prod', 'all'].includes(a));
const includeUsers = args.includes('--users');
const dryRun = args.includes('--dry-run');

if (!target) {
  console.error('❌ Uso: node scripts/db-purge-demo.mjs [dev|prod|all] [--users] [--dry-run]');
  process.exit(1);
}

const envVars = loadEnvFile(path.join(root, '.env.db.local'));
const DEV_DB_URL = envVars.DEV_DB_URL;
const PROD_DB_URL = envVars.PROD_DB_URL;

if ((target === 'dev' || target === 'all') && !DEV_DB_URL) {
  console.error('❌ Falta DEV_DB_URL en .env.db.local');
  process.exit(1);
}
if ((target === 'prod' || target === 'all') && !PROD_DB_URL) {
  console.error('❌ Falta PROD_DB_URL en .env.db.local');
  process.exit(1);
}

const tables = [...ADS_TABLES, ...(includeUsers ? USERS_TABLES : [])];
const scopeLabel = includeUsers ? 'avisos + usuarios + créditos' : 'avisos';

console.log('\n⚠️  PURGA DE DATOS DE DEMO');
console.log(`   Scope: ${scopeLabel}`);
console.log(`   Target: ${target.toUpperCase()}`);
console.log(`   Se preserva: catálogo, categorías, configuración${includeUsers ? '' : ', usuarios'}`);
if (dryRun) console.log('   Modo: DRY-RUN (no se borra nada)');

if (!dryRun) {
  const answer = await confirm('\n¿Confirmás la purga? Escribí "si" para continuar: ');
  if (answer !== 'si') {
    console.log('Cancelado.');
    process.exit(0);
  }
}

const targets = [];
if (target === 'dev' || target === 'all') targets.push({ url: DEV_DB_URL, label: '🟡 DEV' });
if (target === 'prod' || target === 'all') targets.push({ url: PROD_DB_URL, label: '🔴 PROD' });

for (const { url, label } of targets) {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await purgeInDb(client, tables, label, dryRun);
  } catch (err) {
    console.error(`\n❌ Error en ${label}:`, err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

console.log(dryRun ? '\n✅ Dry-run completado.\n' : '\n✅ Purga completada.\n');
