/**
 * Script para verificar estado de RLS en Supabase
 * Ejecutar: node scripts/verify-rls.js
 */

require('dotenv').config({ path: './backend/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas');
  console.error('Verificar: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRLS() {
  console.log('🔍 Verificando estado de RLS en Supabase...\n');

  try {
    // Query para verificar RLS en tablas críticas
    const { data, error } = await supabase.rpc('pg_exec', {
      sql: `
        SELECT 
          tablename, 
          rowsecurity as rls_enabled
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('ads', 'users', 'categories', 'subcategories', 
                          'brands', 'models', 'payment_transactions', 
                          'user_subscriptions', 'banners')
        ORDER BY tablename;
      `
    });

    if (error) {
      // Método alternativo si pg_exec no existe
      console.log('⚠️  Usando método alternativo...\n');
      
      const tables = ['ads', 'users', 'categories', 'subcategories', 
                      'brands', 'models', 'banners'];
      
      for (const table of tables) {
        try {
          // Intentar query - si falla por RLS, está habilitado
          const { data: testData, error: testError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (testError) {
            if (testError.message.includes('row-level security')) {
              console.log(`✅ ${table.padEnd(25)} - RLS HABILITADO`);
            } else {
              console.log(`⚠️  ${table.padEnd(25)} - Error: ${testError.message}`);
            }
          } else {
            console.log(`❌ ${table.padEnd(25)} - RLS POSIBLEMENTE DESHABILITADO (query exitoso sin auth)`);
          }
        } catch (err) {
          console.log(`⚠️  ${table.padEnd(25)} - Error al verificar`);
        }
      }
    } else {
      // Mostrar resultados del query directo
      console.log('📊 Resultado de verificación:\n');
      console.log('Tabla                     | RLS Habilitado');
      console.log('--------------------------|---------------');
      
      data.forEach(row => {
        const status = row.rls_enabled ? '✅ SÍ' : '❌ NO';
        console.log(`${row.tablename.padEnd(25)} | ${status}`);
      });
    }

    console.log('\n');
    console.log('📝 Notas:');
    console.log('- Si RLS está DESHABILITADO: Ejecutar database/FIX_500_ERRORS_RLS.sql');
    console.log('- Si RLS está HABILITADO: Verificar políticas con VERIFY_RLS_STATUS.sql');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error al verificar RLS:', error.message);
    process.exit(1);
  }
}

// Verificar políticas de ejemplo
async function checkPolicies() {
  console.log('🔐 Verificando políticas RLS en tabla "ads"...\n');

  try {
    const { data, error } = await supabase
      .from('ads')
      .select('id, title, user_id, status')
      .limit(3);

    if (error) {
      console.log('❌ Error al consultar ads:', error.message);
      if (error.message.includes('row-level security')) {
        console.log('✅ RLS está funcionando (bloqueó la query sin autenticación)');
      }
    } else {
      console.log(`✅ Query exitoso, retornó ${data.length} avisos`);
      console.log('⚠️  Si ves muchos avisos sin autenticar, RLS podría estar OFF');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  console.log('\n');
}

// Ejecutar verificación
(async () => {
  await verifyRLS();
  await checkPolicies();
  
  console.log('✅ Verificación completada');
  console.log('📄 Documentar resultado en: docs/RLS_STATUS_JAN_8_2026.md');
})();
