/**
 * publish-prod.mjs
 * Publicar Producción: sincroniza rama prod en GitHub + Supabase PROD.
 *
 * Uso: npm run publish:prod
 *
 * Hace:
 *   1. git push origin main:prod  → actualiza rama prod en GitHub
 *   2. supabase db push --db-url PROD_DB_URL → aplica migrations pendientes
 *
 * NO hace (manual en Render):
 *   - Trigger del deploy en Render Prod
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

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

function confirm(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

const envVars = loadEnvFile(path.join(root, '.env.db.local'));
const prodDbUrl = envVars.PROD_DB_URL;

if (!prodDbUrl) {
  console.error('❌ Falta PROD_DB_URL en .env.db.local');
  process.exit(1);
}

console.log('\n🔴 PUBLICAR PRODUCCIÓN');
console.log('═══════════════════════════════════════');
console.log('  1. git push origin main → prod (GitHub)');
console.log('  2. db:push:prod (Supabase PROD)');
console.log('');
console.log('  ⚠️  Render deploy = MANUAL (vos lo triggerás)');
console.log('═══════════════════════════════════════');
console.log('');
console.log('  ¿Revisaste el diff en GitHub antes de continuar?');
console.log('  → https://github.com/germanbruel-web/rural24-cursor/compare/prod...main');
console.log('');

const answer = await confirm('  Confirmar publicación a PRODUCCIÓN [s/N]: ');

if (answer !== 's' && answer !== 'si' && answer !== 'sí') {
  console.log('\n  Cancelado.\n');
  process.exit(0);
}

console.log('\n── Paso 1: Actualizando rama prod en GitHub...');
try {
  execSync('git push origin main:prod', { stdio: 'inherit', cwd: root });
  console.log('   ✅ Rama prod actualizada.\n');
} catch {
  console.error('   ❌ Error al pushear a prod.');
  process.exit(1);
}

console.log('── Paso 2: Aplicando migraciones en Supabase PROD...');
try {
  execSync(`npx supabase db push --db-url "${prodDbUrl}"`, { stdio: 'inherit', cwd: root });
  console.log('   ✅ Supabase PROD sincronizado.\n');
} catch {
  console.error('   ❌ Error en migraciones PROD.');
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('✅ Producción lista en GitHub + Supabase.');
console.log('');
console.log('👉 Próximo paso: triggerá el deploy en Render manualmente.');
console.log('   https://dashboard.render.com');
console.log('═══════════════════════════════════════\n');
