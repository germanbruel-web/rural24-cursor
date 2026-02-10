/**
 * API Route: /api/ads/generate-content
 * Genera título y descripción profesional basado en categoría y atributos
 * 
 * ARQUITECTURA:
 * - V1: Generación basada en plantillas (sin LLM)
 * - V2 (futuro): LLM con context especializado por categoría
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type AuthUser } from '@/infrastructure/auth/guard';

interface GenerateContentRequest {
  category_id: string;
  subcategory_id: string;
  category_name: string;
  subcategory_name: string;
  attributes: Record<string, any>;
  province?: string;
  locality?: string;
}

interface GenerateContentResponse {
  titles: string[];
  description: string;
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (_user: AuthUser) => {
    try {
      const body: GenerateContentRequest = await request.json();
      
      const { 
        category_name, 
        subcategory_name, 
        attributes, 
        province 
      } = body;

      if (process.env.NODE_ENV !== 'production') {
        console.log('[generate-content] Generando contenido para:', {
          category: category_name,
          subcategory: subcategory_name,
        });
      }

      const titles = generateTitles(category_name, subcategory_name, attributes);
      const description = generateDescription(category_name, subcategory_name, attributes, province);

      const response: GenerateContentResponse = {
        titles,
        description
      };

      return NextResponse.json(response);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[generate-content] Error:', message);
      return NextResponse.json(
        { error: 'Error generando contenido' },
        { status: 500 }
      );
    }
  });
}

// ============================================
// GENERADORES BASADOS EN PLANTILLAS
// ============================================

/**
 * Genera 3 opciones de título profesional
 */
function generateTitles(
  category: string, 
  subcategory: string, 
  attrs: Record<string, any>
): string[] {
  const brand = attrs.marca || attrs.brand || '';
  const model = attrs.modelo || attrs.model || '';
  const year = attrs.año || attrs.year || '';
  const condition = attrs.estado || attrs.condition || '';
  const power = attrs.potencia || attrs.hp || '';
  
  const titles: string[] = [];

  // Formato 1: [Categoría] [Marca] [Modelo] [Año]
  if (brand && model) {
    let title = `${category} ${brand} ${model}`;
    if (year) title += ` ${year}`;
    titles.push(title);
  }

  // Formato 2: [Marca] [Modelo] Año [Año] - [Subcategoría]
  if (brand && model && year) {
    titles.push(`${brand} ${model} Año ${year} - ${subcategory}`);
  }

  // Formato 3: [Categoría] [Potencia] - [Marca] [Modelo]
  if (power && brand && model) {
    titles.push(`${category} ${power}HP - ${brand} ${model} ${year}`.trim());
  }

  // Formato 4: [Estado] [Marca] [Modelo] [Año]
  if (condition && brand && model) {
    titles.push(`${condition} ${brand} ${model} ${year}`.trim());
  }

  // Formato 5: [Subcategoría] [Marca] [Año]
  if (brand && year) {
    titles.push(`${subcategory} ${brand} ${year}`.trim());
  }

  // Formato fallback si no hay datos suficientes
  if (titles.length === 0) {
    titles.push(`${category} - ${subcategory}`);
  }

  // Retornar máximo 3 títulos únicos
  return [...new Set(titles)].slice(0, 3);
}

/**
 * Genera descripción estructurada basada en atributos
 */
function generateDescription(
  category: string,
  subcategory: string,
  attrs: Record<string, any>,
  province?: string
): string {
  let description = '';

  // Encabezado
  const brand = attrs.marca || attrs.brand || '';
  const model = attrs.modelo || attrs.model || '';
  const year = attrs.año || attrs.year || '';
  
  if (brand && model) {
    description += `${category} ${brand} ${model}`;
    if (year) description += ` año ${year}`;
    description += '.\n\n';
  }

  // Características técnicas
  description += '📋 CARACTERÍSTICAS:\n';
  
  const technicalAttrs = [
    'potencia', 'hp', 'motor', 'combustible', 'transmisión', 'transmision',
    'tracción', 'traccion', 'cilindrada', 'cilindros', 'horas_uso',
    'kilometros', 'kilometraje'
  ];

  const technical = Object.entries(attrs)
    .filter(([key]) => technicalAttrs.some(attr => key.toLowerCase().includes(attr)))
    .filter(([, value]) => value && value !== '');

  technical.forEach(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    description += `• ${label}: ${value}\n`;
  });

  // Condición
  const condition = attrs.estado || attrs.condition || '';
  if (condition) {
    description += `\n🔧 CONDICIÓN: ${condition}\n`;
  }

  // Equipamiento adicional
  const equipment = Object.entries(attrs)
    .filter(([key]) => 
      !technicalAttrs.includes(key.toLowerCase()) && 
      key !== 'marca' && 
      key !== 'modelo' && 
      key !== 'año' && 
      key !== 'estado'
    )
    .filter(([, value]) => value && value !== '' && value !== false);

  if (equipment.length > 0) {
    description += '\n✨ EQUIPAMIENTO:\n';
    equipment.forEach(([key, value]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
      if (typeof value === 'boolean') {
        description += `• ${label}\n`;
      } else {
        description += `• ${label}: ${value}\n`;
      }
    });
  }

  // Ubicación
  if (province) {
    description += `\n📍 UBICACIÓN: ${province}\n`;
  }

  // Llamado a la acción
  description += '\n💬 Consultá disponibilidad y precio. ¡Te respondemos al instante!';

  return description.trim();
}
