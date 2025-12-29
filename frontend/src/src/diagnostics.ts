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

// Gemini
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log('🤖 GEMINI AI:');
console.log(`   Key: ${geminiKey ? '✅ Configurada (' + geminiKey.substring(0, 20) + '...)' : '❌ NO configurada'}`);
console.log('');

// Diagnóstico
if (!geminiKey) {
  console.error('❌ PROBLEMA DETECTADO:');
  console.error('   La API Key de Gemini NO está cargada.');
  console.error('');
  console.error('💡 SOLUCIÓN:');
  console.error('   1. Verifica que .env.local tenga: VITE_GEMINI_API_KEY=tu_key');
  console.error('   2. REINICIA el servidor (Ctrl+C y luego npm run dev)');
  console.error('   3. Recarga el navegador (F5)');
} else {
  console.log('✅ Todas las variables están configuradas correctamente');
}

console.log('');
console.log('=====================================');

export {};
