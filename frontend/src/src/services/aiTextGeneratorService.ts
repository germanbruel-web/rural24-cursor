/**
 * AI Text Generator Service
 * 
 * Generación de títulos y descripciones usando Gemini AI
 * Adaptativo por categoría con configuración de prompts personalizable
 * 
 * ARQUITECTURA FUTURA:
 * - Los prompts se almacenarán en Supabase (tabla: ai_prompt_templates)
 * - El admin podrá editarlos desde un panel
 * - Sistema de versionado y A/B testing
 * - Machine Learning: aprender de los avisos que más conversión tienen
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPromptConfig, type CategoryPromptConfig } from '../config/categoryPromptConfig';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ Gemini API key no configurada. Revisá tu archivo .env');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ============================================================
// TIPOS
// ============================================================

interface AdDataForAI {
  category: string;
  categoryDisplayName?: string;
  subcategory: string;
  subcategoryDisplayName?: string;
  attributes: Record<string, any>;
  province?: string;
  locality?: string;
  price?: number;
  currency?: string;
}

interface GenerationResult {
  suggestions: string[];
  usedFields: string[];
  model: string;
  timestamp: string;
}

// ============================================================
// FUNCIONES PRINCIPALES
// ============================================================

/**
 * Generar títulos usando Gemini AI
 * Adaptativo por categoría/subcategoría
 */
export async function generateTitlesWithAI(
  adData: AdDataForAI,
  count: number = 5
): Promise<GenerationResult> {
  if (!API_KEY) {
    console.error('❌ Gemini API key no configurada');
    return {
      suggestions: ['Error: API key no configurada'],
      usedFields: [],
      model: 'error',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // 1. Obtener configuración de prompts para esta categoría
    const config = getPromptConfig(adData.category, adData.subcategory);
    
    // 2. Construir datos del aviso en formato legible
    const adDataText = buildAdDataText(adData, config);
    
    // 3. Reemplazar {adData} en el prompt
    const finalPrompt = config.titlePrompt.replace('{adData}', adDataText);
    
    console.log('🤖 Generando títulos con Gemini...', {
      category: adData.category,
      subcategory: adData.subcategory,
      promptLength: finalPrompt.length,
    });

    // 4. Llamar a Gemini
    const result = await model.generateContent(finalPrompt);
    const response = result.response;
    const text = response.text();
    
    // 5. Parsear respuesta (esperamos líneas separadas)
    const suggestions = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/)) // Quitar numeraciones
      .slice(0, count);

    console.log('✅ Títulos generados:', suggestions.length);

    // 6. Identificar campos usados
    const usedFields = identifyUsedFields(adData.attributes);

    return {
      suggestions,
      usedFields,
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Error generando títulos con Gemini:', error);
    
    // Fallback: generar título básico con lo que hay
    const fallback = generateFallbackTitle(adData);
    
    return {
      suggestions: [fallback],
      usedFields: [],
      model: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Generar descripciones usando Gemini AI
 * Adaptativo por categoría/subcategoría
 */
export async function generateDescriptionsWithAI(
  adData: AdDataForAI,
  count: number = 3
): Promise<GenerationResult> {
  if (!API_KEY) {
    console.error('❌ Gemini API key no configurada');
    return {
      suggestions: ['Error: API key no configurada'],
      usedFields: [],
      model: 'error',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // 1. Obtener configuración de prompts
    const config = getPromptConfig(adData.category, adData.subcategory);
    
    // 2. Construir datos del aviso
    const adDataText = buildAdDataText(adData, config);
    
    // 3. Reemplazar {adData} en el prompt
    const finalPrompt = config.descriptionPrompt.replace('{adData}', adDataText);
    
    console.log('🤖 Generando descripciones con Gemini...', {
      category: adData.category,
      subcategory: adData.subcategory,
      promptLength: finalPrompt.length,
    });

    // 4. Llamar a Gemini
    const result = await model.generateContent(finalPrompt);
    const response = result.response;
    const text = response.text();
    
    // 5. Parsear respuesta (esperamos separación por "---")
    const suggestions = text
      .split('---')
      .map(desc => desc.trim())
      .filter(desc => desc.length > 50) // Mínimo 50 caracteres
      .slice(0, count);

    console.log('✅ Descripciones generadas:', suggestions.length);

    // 6. Identificar campos usados
    const usedFields = identifyUsedFields(adData.attributes);

    return {
      suggestions,
      usedFields,
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Error generando descripciones con Gemini:', error);
    
    // Fallback: generar descripción básica
    const fallback = generateFallbackDescription(adData);
    
    return {
      suggestions: [fallback],
      usedFields: [],
      model: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================
// FUNCIONES HELPER
// ============================================================

/**
 * Construir texto legible de los datos del aviso
 */
function buildAdDataText(adData: AdDataForAI, config: CategoryPromptConfig): string {
  const lines: string[] = [];
  
  // Categoría
  lines.push(`Categoría: ${adData.categoryDisplayName || adData.category}`);
  lines.push(`Subcategoría: ${adData.subcategoryDisplayName || adData.subcategory}`);
  
  // Atributos (campos required primero, luego optional)
  const allFields = [...config.requiredFields, ...config.optionalFields];
  
  for (const field of allFields) {
    const value = adData.attributes[field];
    if (value !== undefined && value !== null && value !== '') {
      // Formatear el nombre del campo (snake_case → Title Case)
      const fieldName = field
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      lines.push(`${fieldName}: ${formatValue(value)}`);
    }
  }
  
  // Ubicación
  if (adData.province) {
    lines.push(`Provincia: ${adData.province}`);
  }
  if (adData.locality) {
    lines.push(`Localidad: ${adData.locality}`);
  }
  
  // Precio
  if (adData.price) {
    const currency = adData.currency === 'USD' ? 'USD' : '$';
    lines.push(`Precio: ${currency} ${adData.price.toLocaleString('es-AR')}`);
  }
  
  return lines.join('\n');
}

/**
 * Formatear valor para display
 */
function formatValue(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}

/**
 * Identificar qué campos se usaron
 */
function identifyUsedFields(attributes: Record<string, any>): string[] {
  return Object.keys(attributes).filter(
    key => attributes[key] !== undefined && 
           attributes[key] !== null && 
           attributes[key] !== ''
  );
}

/**
 * Generar título fallback (si falla Gemini)
 */
function generateFallbackTitle(adData: AdDataForAI): string {
  const attrs = adData.attributes;
  const parts: string[] = [];
  
  // Maquinarias
  if (attrs.marca) parts.push(attrs.marca);
  if (attrs.modelo) parts.push(attrs.modelo);
  if (attrs.anio || attrs.año) parts.push(String(attrs.anio || attrs.año));
  
  // Ganadería
  if (attrs.quantity) parts.push(`${attrs.quantity} ${attrs.category || adData.subcategory}`);
  if (attrs.breed) parts.push(attrs.breed);
  if (attrs.weight) parts.push(`${attrs.weight}kg`);
  
  // Insumos
  if (attrs.brand) parts.push(attrs.brand);
  if (attrs.input_type) parts.push(attrs.input_type);
  if (attrs.quantity) parts.push(attrs.quantity);
  
  // Genérico
  if (parts.length === 0) {
    parts.push(adData.subcategoryDisplayName || adData.subcategory || 'Producto');
  }
  
  // Ubicación
  if (adData.province) {
    parts.push(`- ${adData.province}`);
  }
  
  return parts.join(' ').slice(0, 80);
}

/**
 * Generar descripción fallback (si falla Gemini)
 */
function generateFallbackDescription(adData: AdDataForAI): string {
  const parts: string[] = [];
  
  parts.push(`Vendo ${adData.subcategoryDisplayName || adData.subcategory}.`);
  
  // Agregar algunos atributos disponibles
  const attrs = adData.attributes;
  const details: string[] = [];
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (value && typeof value !== 'object') {
      details.push(`${key}: ${value}`);
    }
  });
  
  if (details.length > 0) {
    parts.push('\n\nCaracterísticas:');
    parts.push(details.slice(0, 5).join(', ') + '.');
  }
  
  if (adData.province) {
    parts.push(`\n\nUbicado en ${adData.province}.`);
  }
  
  parts.push('\n\nConsulte sin compromiso.');
  
  return parts.join(' ');
}

// ============================================================
// ESTADÍSTICAS Y MONITOREO (para futuro ML)
// ============================================================

/**
 * Guardar estadísticas de generación
 * TODO: Implementar guardado en Supabase cuando esté el panel admin
 */
export async function logGenerationStats(data: {
  category: string;
  subcategory: string;
  type: 'title' | 'description';
  promptVersion: string;
  tokensUsed?: number;
  selected?: number; // Índice del título/descripción que eligió el usuario
}) {
  // Por ahora solo console.log
  console.log('📊 Generation Stats:', data);
  
  // TODO: Guardar en tabla ai_generation_logs para análisis ML
  // - Qué prompts generan mejores resultados
  // - Qué títulos/descripciones se eligen más
  // - Patrones de campos que generan más conversión
}
