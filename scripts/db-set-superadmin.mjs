/**
 * db-set-superadmin.mjs
 * Asigna rol superadmin a un usuario por email en DEV, PROD o ambas.
 *
 * Uso:
 *   node scripts/db-set-superadmin.mjs dev super@clasify.com
 *   node scripts/db-set-superadmin.mjs prod super@clasify.com
 *   node scripts/db-set-superadmin.mjs all super@clasify.com
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
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
    return vars;
  } catch { return {}; }
}

const [,, target, email] = process.argv;

if (!target || !['dev', 'prod', 'all'].includes(target) || !email) {
  console.error('❌ Uso: node scripts/db-set-superadmin.mjs [dev|prod|all] <email>');
  process.exit(1);
}

const envVars = loadEnvFile(path.join(root, '.env.db.local'));

const targets = [];
if (target === 'dev' || target === 'all') targets.push({ url: envVars.DEV_DB_URL, label: '🟡 DEV' });
if (target === 'prod' || target === 'all') targets.push({ url: envVars.PROD_DB_URL, label: '🔴 PROD' });

for (const { url, label } of targets) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Verificar si existe en auth.users
  const auth = await c.query('SELECT id FROM auth.users WHERE email = $1', [email]);
  if (auth.rows.length === 0) {
    console.log(`${label}: ❌ ${email} no existe en auth.users — creá la cuenta primero (signup o Supabase dashboard).`);
    await c.end();
    continue;
  }

  const userId = auth.rows[0].id;

  // Upsert en public.users con role superadmin
  const res = await c.query(`
    INSERT INTO public.users (id, email, role, full_name, updated_at)
    VALUES ($1, $2, 'superadmin', 'Super Admin', now())
    ON CONFLICT (id) DO UPDATE
      SET role = 'superadmin', updated_at = now()
    RETURNING id, email, role
  `, [userId, email]);

  console.log(`${label}: ✅ ${JSON.stringify(res.rows[0])}`);
  await c.end();
}
