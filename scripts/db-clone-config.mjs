/**
 * db-clone-config.mjs
 * Clona las tablas de configuración de DEV → PROD usando pg (sin pg_dump).
 * También reemplaza las URLs de Supabase Storage DEV por las de PROD.
 *
 * Tablas clonadas: site_settings, global_settings
 *
 * Uso:
 *   node scripts/db-clone-config.mjs
 *
 * Requiere: .env.db.local con DEV_DB_URL y PROD_DB_URL
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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
const DEV_DB_URL = envVars.DEV_DB_URL;
const PROD_DB_URL = envVars.PROD_DB_URL;

if (!DEV_DB_URL || !PROD_DB_URL) {
  console.error('❌ Faltan DEV_DB_URL o PROD_DB_URL en .env.db.local');
  console.error('   Copiá .env.db.example → .env.db.local y completá las URLs.');
  process.exit(1);
}

// Extraer project refs para reemplazar URLs de Supabase Storage
const devRefMatch = DEV_DB_URL.match(/db\.([a-z]+)\.supabase\.co/);
const prodRefMatch = PROD_DB_URL.match(/db\.([a-z]+)\.supabase\.co/);
const DEV_REF = devRefMatch?.[1];
const PROD_REF = prodRefMatch?.[1];

// Tablas a clonar DEV → PROD (sin datos de usuarios: no tocar ads, users, wallets)
// Orden importa por FK:
//   1. taxonomía (categories → subcategories)
//   2. catálogos (option_lists → option_list_items)
//   3. formularios (form_templates_v2 → form_fields_v2)
//   4. config general
const TABLES = [
  // Taxonomía — base de todo (TRUNCATE CASCADE limpia las FK dependientes)
  'categories', 'subcategories',
  // Config general
  'site_settings', 'global_settings', 'global_config',
  // CMS Homepage
  'cms_hero_images', 'hero_images', 'home_sections',
  'banners', 'banners_clean',
  // Catálogos de opciones
  'option_lists', 'option_list_items',
  // Formularios dinámicos
  'form_templates_v2', 'form_fields_v2',
  // Wizard
  'wizard_configs',
];

// Columnas de auditoría que referencian auth.users → nullear al clonar
// (los IDs de usuario DEV no existen en PROD)
const NULLIFY_COLS = ['updated_by', 'created_by', 'modified_by'];

/**
 * Reemplaza las referencias de storage DEV por PROD en cualquier valor
 */
function replaceStorageRefs(val) {
  if (!DEV_REF || !PROD_REF || DEV_REF === PROD_REF) return val;

  if (typeof val === 'string') {
    return val.replaceAll(DEV_REF, PROD_REF);
  }
  if (typeof val === 'object' && val !== null) {
    // JSONB columns: pg devuelve objetos JS
    return JSON.parse(JSON.stringify(val).replaceAll(DEV_REF, PROD_REF));
  }
  return val;
}

async function cloneTable(devClient, prodClient, tableName) {
  process.stdout.write(`   📋 ${tableName}... `);

  const result = await devClient.query(`SELECT * FROM public."${tableName}"`);
  const rows = result.rows;

  if (rows.length === 0) {
    console.log('sin datos en DEV, saltando.');
    return 0;
  }

  // Detectar columnas JSON (OID 114) y JSONB (OID 3802)
  // pg devuelve jsonb como objetos JS y json como strings
  // → ambos necesitan pasar como string JSON a los placeholders de INSERT
  const jsonCols = new Set(
    result.fields
      .filter(f => f.dataTypeID === 3802 || f.dataTypeID === 114)
      .map(f => f.name)
  );

  // TRUNCATE + reset sequence en PROD
  await prodClient.query(`TRUNCATE TABLE public."${tableName}" RESTART IDENTITY CASCADE`);

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  // Para tablas con FK self-referencial (parent_id), insertar en múltiples pasadas
  // nivel por nivel hasta que no queden filas sin insertar
  const isSelfRef = tableName === 'subcategories';
  const rowsToInsert = isSelfRef
    ? (() => {
        const ordered = [];
        const remaining = [...rows];
        const inserted = new Set();
        let prevSize = -1;
        while (remaining.length > 0 && remaining.length !== prevSize) {
          prevSize = remaining.length;
          for (let i = remaining.length - 1; i >= 0; i--) {
            const row = remaining[i];
            if (!row.parent_id || inserted.has(row.parent_id)) {
              ordered.push(row);
              inserted.add(row.id);
              remaining.splice(i, 1);
            }
          }
        }
        if (remaining.length > 0) ordered.push(...remaining); // fallback
        return ordered;
      })()
    : rows;

  for (const row of rowsToInsert) {
    const processedValues = columns.map(col => {
      if (NULLIFY_COLS.includes(col)) return null;
      const val = replaceStorageRefs(row[col]);
      // JSON/JSONB: pg devuelve jsonb como objeto JS y json como string
      // Ambos necesitan ser string JSON para el INSERT parametrizado
      if (jsonCols.has(col) && val !== null) {
        return typeof val === 'string' ? val : JSON.stringify(val);
      }
      return val;
    });
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    await prodClient.query(
      `INSERT INTO public."${tableName}" (${colList}) VALUES (${placeholders})`,
      processedValues
    );
  }

  console.log(`${rows.length} filas ✅`);
  return rows.length;
}

async function main() {
  console.log('\n🔄 Clonando configuración DEV → PROD...');
  console.log(`   Tablas: ${TABLES.join(', ')}`);
  if (DEV_REF && PROD_REF) {
    console.log(`   Storage URLs: ${DEV_REF}.supabase.co → ${PROD_REF}.supabase.co`);
  }
  console.log();

  const devClient = new Client({
    connectionString: DEV_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  const prodClient = new Client({
    connectionString: PROD_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await devClient.connect();
    await prodClient.connect();

    // Transacción en PROD: todo o nada
    await prodClient.query('BEGIN');
    // Diferir FK constraints para manejar self-referencias (ej: subcategories.parent_id)
    await prodClient.query('SET CONSTRAINTS ALL DEFERRED');

    for (const table of TABLES) {
      await cloneTable(devClient, prodClient, table);
    }

    await prodClient.query('COMMIT');

    console.log('\n✅ Listo. Configuración DEV → PROD sincronizada.');
    if (DEV_REF && PROD_REF) {
      console.log(`   URLs de storage reemplazadas: ${DEV_REF} → ${PROD_REF}\n`);
    }
  } catch (err) {
    await prodClient.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Error:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
      console.error('   Verificá que las URLs en .env.db.local sean correctas.');
    }
    process.exit(1);
  } finally {
    await devClient.end().catch(() => {});
    await prodClient.end().catch(() => {});
  }
}

main();
