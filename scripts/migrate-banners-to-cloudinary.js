// Script para migrar banners de Supabase Storage a Cloudinary
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../frontend/.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_KEY;
const CLOUDINARY_CLOUD_NAME = 'ruralcloudinary';
const CLOUDINARY_UPLOAD_PRESET = 'rural24_unsigned';

console.log('🔍 Verificando variables de entorno...');
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
console.log(`   SUPABASE_KEY: ${SUPABASE_ANON_KEY ? '✅' : '❌'}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('\n❌ Faltan variables de entorno. Verifica frontend/.env.local');
  process.exit(1);
}

console.log('✅ Variables cargadas correctamente\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadToCloudinary(imageBuffer, filename) {
  // Usar el endpoint del backend que ya tiene la configuración de Cloudinary
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, filename);

  const response = await fetch('http://localhost:3000/api/uploads', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function migrateBanners() {
  console.log('🚀 Iniciando migración de banners a Cloudinary...\n');

  // Obtener todos los banners
  const { data: banners, error } = await supabase
    .from('banners')
    .select('id, title, image_url')
    .order('created_at');

  if (error) {
    console.error('❌ Error obteniendo banners:', error);
    return;
  }

  console.log(`📦 ${banners.length} banners encontrados\n`);

  let migratedCount = 0;
  let errorCount = 0;

  for (const banner of banners) {
    try {
      console.log(`\n📸 Procesando: ${banner.title}`);
      console.log(`   URL actual: ${banner.image_url}`);

      // Descargar imagen de Supabase
      const imageResponse = await fetch(banner.image_url);
      if (!imageResponse.ok) {
        throw new Error(`HTTP ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.buffer();
      console.log(`   ✅ Imagen descargada (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

      // Generar nombre de archivo único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const filename = `banner_${banner.id.substring(0, 8)}_${timestamp}_${randomStr}.jpg`;

      // Subir a Cloudinary vía backend
      console.log(`   ☁️  Subiendo a Cloudinary...`);
      const cloudinaryResult = await uploadToCloudinary(imageBuffer, filename);

      if (cloudinaryResult.error) {
        throw new Error(cloudinaryResult.error);
      }

      const newUrl = cloudinaryResult.url;
      console.log(`   ✅ URL nueva: ${newUrl}`);

      // Actualizar URL en la base de datos
      const { error: updateError } = await supabase
        .from('banners')
        .update({ image_url: newUrl })
        .eq('id', banner.id);

      if (updateError) {
        throw new Error(`Error actualizando DB: ${updateError.message}`);
      }

      console.log(`   ✅ Base de datos actualizada`);
      migratedCount++;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migración completada:`);
  console.log(`   • Exitosos: ${migratedCount}`);
  console.log(`   • Errores: ${errorCount}`);
  console.log(`   • Total: ${banners.length}`);
  console.log('='.repeat(60));
}

// Ejecutar migración
migrateBanners().catch(console.error);
