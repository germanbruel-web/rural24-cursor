/**
 * 🔍 DIAGNÓSTICO DE IMÁGENES - Sistema Profesional
 * Herramienta para debugging de problemas de imágenes
 */

import { supabase } from '../services/supabaseClient';

export interface ImageDiagnostic {
  step: string;
  status: 'success' | 'error' | 'warning';
  data: any;
  message: string;
  timestamp: string;
}

export class ImageDiagnostics {
  private logs: ImageDiagnostic[] = [];

  log(step: string, status: ImageDiagnostic['status'], data: any, message: string) {
    const diagnostic: ImageDiagnostic = {
      step,
      status,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(diagnostic);
    
    const emoji = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    console.log(`${emoji} [${step}] ${message}`, data);
  }

  getLogs() {
    return this.logs;
  }

  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REPORTE DE DIAGNÓSTICO DE IMÁGENES');
    console.log('='.repeat(80));
    
    this.logs.forEach((log, index) => {
      const emoji = log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️';
      console.log(`\n${index + 1}. ${emoji} ${log.step}`);
      console.log(`   ${log.message}`);
      console.log(`   Data:`, log.data);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Resumen
    const errors = this.logs.filter(l => l.status === 'error').length;
    const warnings = this.logs.filter(l => l.status === 'warning').length;
    const success = this.logs.filter(l => l.status === 'success').length;
    
    console.log('\n📈 RESUMEN:');
    console.log(`   ✅ Éxitos: ${success}`);
    console.log(`   ⚠️  Warnings: ${warnings}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log('='.repeat(80) + '\n');
  }
}

/**
 * Diagnostica un aviso completo
 */
export async function diagnoseAd(adId: string): Promise<ImageDiagnostics> {
  const diagnostics = new ImageDiagnostics();

  try {
    // 1. Verificar que el ID es válido
    diagnostics.log(
      'ID_VALIDATION',
      adId ? 'success' : 'error',
      { adId, type: typeof adId, length: adId?.length },
      adId ? 'ID válido' : 'ID inválido o vacío'
    );

    // 2. Consultar BD
    const { data: ad, error: dbError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (dbError) {
      diagnostics.log(
        'DATABASE_QUERY',
        'error',
        { error: dbError },
        `Error en query: ${dbError.message}`
      );
      diagnostics.printReport();
      return diagnostics;
    }

    diagnostics.log(
      'DATABASE_QUERY',
      'success',
      { id: ad.id, title: ad.title },
      'Aviso encontrado en BD'
    );

    // 3. Analizar campo images
    const images = ad.images;
    diagnostics.log(
      'IMAGES_FIELD_RAW',
      images ? 'success' : 'warning',
      {
        exists: !!images,
        type: typeof images,
        isArray: Array.isArray(images),
        length: Array.isArray(images) ? images.length : 0,
        rawValue: images,
      },
      images 
        ? `Campo images encontrado (${Array.isArray(images) ? images.length : 0} items)` 
        : 'Campo images vacío o null'
    );

    // 4. Analizar estructura de cada imagen
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img, index) => {
        const isString = typeof img === 'string';
        const isObject = typeof img === 'object' && img !== null;
        const hasUrl = isObject && 'url' in img;
        const hasPath = isObject && 'path' in img;
        
        diagnostics.log(
          `IMAGE_${index + 1}_STRUCTURE`,
          hasUrl || isString ? 'success' : 'error',
          {
            index,
            type: typeof img,
            isString,
            isObject,
            hasUrl,
            hasPath,
            value: img,
          },
          isString 
            ? `Imagen ${index + 1}: String directo` 
            : hasUrl 
              ? `Imagen ${index + 1}: Objeto con URL` 
              : `Imagen ${index + 1}: Estructura inválida`
        );
        
        // 5. Validar URL accesible
        if (isString || hasUrl) {
          const url = isString ? img : img.url;
          const urlObj = validateImageUrl(url);
          
          diagnostics.log(
            `IMAGE_${index + 1}_URL_VALIDATION`,
            urlObj.isValid ? 'success' : 'error',
            urlObj,
            urlObj.isValid 
              ? `URL válida: ${urlObj.domain}` 
              : `URL inválida: ${urlObj.error}`
          );
        }
      });
    }

    // 6. Verificar configuración de Cloudinary
    const cloudinaryConfig = {
      hasCloudName: !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!import.meta.env.VITE_CLOUDINARY_API_KEY,
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    };

    diagnostics.log(
      'CLOUDINARY_CONFIG',
      cloudinaryConfig.hasCloudName ? 'success' : 'warning',
      cloudinaryConfig,
      cloudinaryConfig.hasCloudName 
        ? 'Cloudinary configurado' 
        : 'Cloudinary no configurado (puede ser normal)'
    );

    diagnostics.printReport();
    return diagnostics;

  } catch (error) {
    diagnostics.log(
      'UNEXPECTED_ERROR',
      'error',
      { error },
      `Error inesperado: ${error}`
    );
    diagnostics.printReport();
    return diagnostics;
  }
}

/**
 * Valida una URL de imagen
 */
function validateImageUrl(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      isValid: true,
      url,
      protocol: urlObj.protocol,
      domain: urlObj.hostname,
      path: urlObj.pathname,
      isCloudinary: urlObj.hostname.includes('cloudinary'),
      isHttps: urlObj.protocol === 'https:',
    };
  } catch (error) {
    return {
      isValid: false,
      url,
      error: 'URL malformada',
    };
  }
}

/**
 * Test de carga de imagen
 */
export async function testImageLoad(url: string): Promise<{
  success: boolean;
  width?: number;
  height?: number;
  loadTime?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const img = new Image();
    
    img.onload = () => {
      resolve({
        success: true,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loadTime: Date.now() - startTime,
      });
    };
    
    img.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to load image',
        loadTime: Date.now() - startTime,
      });
    };
    
    img.src = url;
  });
}

/**
 * Diagnóstico completo del sistema de imágenes
 */
export async function runFullDiagnostics() {
  console.clear();
  console.log('\n🔍 INICIANDO DIAGNÓSTICO COMPLETO DEL SISTEMA DE IMÁGENES\n');
  
  // 1. Obtener último aviso publicado
  const { data: latestAd } = await supabase
    .from('ads')
    .select('id, title, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (!latestAd) {
    console.error('❌ No hay avisos en la BD');
    return;
  }
  
  console.log(`📋 Analizando último aviso: "${latestAd.title}" (${latestAd.id})\n`);
  
  // 2. Diagnosticar
  await diagnoseAd(latestAd.id);
}
