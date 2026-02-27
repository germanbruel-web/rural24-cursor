/**
 * db-push.mjs
 * Aplica migraciones de supabase/migrations/ al ambiente indicado.
 *
 * Uso:
 *   node scripts/db-push.mjs dev    → push a Supabase DEV
 *   node scripts/db-push.mjs prod   → push a Supabase PROD
 *
 * Requiere: .env.db.local con DEV_DB_URL y PROD_DB_URL
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Leer .env.db.local manualmente (sin dependencia extra)
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

const env = process.argv[2];
if (!env || !['dev', 'prod'].includes(env)) {
  console.error('❌ Uso: node scripts/db-push.mjs [dev|prod]');
  process.exit(1);
}

const envVars = loadEnvFile(path.join(root, '.env.db.local'));
const dbUrl = env === 'prod' ? envVars.PROD_DB_URL : envVars.DEV_DB_URL;

if (!dbUrl) {
  console.error(`❌ Falta ${env === 'prod' ? 'PROD' : 'DEV'}_DB_URL en .env.db.local`);
  console.error('   Copiá .env.db.example → .env.db.local y completá las URLs.');
  process.exit(1);
}

const label = env === 'prod' ? '🔴 PROD' : '🟡 DEV';
console.log(`\n${label} — Aplicando migraciones en Supabase ${env.toUpperCase()}...`);
console.log(`   Migraciones: supabase/migrations/\n`);

try {
  execSync(`npx supabase db push --db-url "${dbUrl}"`, {
    stdio: 'inherit',
    cwd: root,
  });
  console.log(`\n✅ ${label} — Migraciones aplicadas correctamente.\n`);
} catch (err) {
  console.error(`\n❌ ${label} — Error al aplicar migraciones.`);
  process.exit(1);
}
