// Script de diagnóstico para verificar variables de entorno
console.log('🔍 DIAGNÓSTICO DE VARIABLES DE ENTORNO');
console.log('=====================================');
console.log('');

// Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
console.log('📦 SUPABASE:');
console.log(`   URL: ${supabaseUrl ? '✅ Configurada' : '❌ NO configurada'}`);
console.log(`   Key: ${supabaseKey ? '✅ Configurada (' + supabaseKey.substring(0, 20) + '...)' : '❌ NO configurada'}`);
console.log('');

// Backend API
const apiUrl = import.meta.env.VITE_API_URL;
console.log('🔗 BACKEND API:');
console.log(`   URL: ${apiUrl ? '✅ Configurada (' + apiUrl + ')' : '❌ NO configurada'}`);
console.log('');

// Diagnóstico
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ PROBLEMA DETECTADO:');
  console.error('   Variables de Supabase NO están cargadas.');
  console.error('');
  console.error('💡 SOLUCIÓN:');
  console.error('   1. Verifica que .env.local tenga: VITE_SUPABASE_URL y VITE_SUPABASE_KEY');
  console.error('   2. REINICIA el servidor (Ctrl+C y luego npm run dev)');
  console.error('   3. Recarga el navegador (F5)');
} else {
  console.log('✅ Todas las variables están configuradas correctamente');
}

console.log('');
console.log('=====================================');

export {};
