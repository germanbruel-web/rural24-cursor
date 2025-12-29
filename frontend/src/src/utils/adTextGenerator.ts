// ====================================================================
// GENERADOR AUTOMÁTICO DE TÍTULOS Y DESCRIPCIONES
// Marketing profesional para agronegocios
// ====================================================================

interface AdData {
  category?: string;
  subcategory?: string;
  type?: string;
  attributes: Record<string, any>;
  province?: string;
  locality?: string;
  price?: string;
  currency?: string;
}

// ====================================================================
// PATRONES DE TÍTULOS (50+)
// ====================================================================
const TITLE_PATTERNS = [
  // Patrón clásico
  '{marca} {modelo} {año} - {condicion}',
  '{marca} {modelo} - {condicion} - {provincia}',
  '{subcategoria} {marca} {modelo} {año}',
  
  // Con urgencia
  '{marca} {modelo} - Oportunidad única',
  '{marca} {modelo} {año} - Imperdible',
  'OPORTUNIDAD: {marca} {modelo} {condicion}',
  '¡OFERTA! {marca} {modelo} {año}',
  
  // Con ubicación
  '{marca} {modelo} {año} - {provincia}',
  '{marca} {modelo} - Entrega en {provincia}',
  '{subcategoria} en {provincia} - {marca} {modelo}',
  
  // Con especificaciones clave
  '{marca} {modelo} {potencia_hp}HP - {año}',
  '{marca} {modelo} {año} - {horas_uso}hs',
  '{marca} {modelo} {traccion} - {condicion}',
  '{subcategoria} {potencia_hp}HP - {marca}',
  
  // Con valor agregado
  '{marca} {modelo} - Garantía incluida',
  '{marca} {modelo} {año} - Como nuevo',
  '{marca} {modelo} - Mantenimiento al día',
  '{marca} {modelo} - Listo para trabajar',
  '{marca} {modelo} {año} - Único dueño',
  
  // Con financiación
  '{marca} {modelo} - Financiación disponible',
  '{marca} {modelo} {año} - Acepto permuta',
  '{marca} {modelo} - Recibo usado',
  
  // Con estado destacado
  '{marca} {modelo} IMPECABLE - {año}',
  '{marca} {modelo} EXCELENTE ESTADO',
  '{marca} {modelo} {año} - Sin detalles',
  '{marca} {modelo} - Estado premium',
  
  // Con precio
  '{marca} {modelo} {año} - Precio especial',
  '{marca} {modelo} - Mejor precio del mercado',
  '{marca} {modelo} - Gran inversión',
  
  // Con tipo de operación
  '{marca} {modelo} - Entrega inmediata',
  '{marca} {modelo} {año} - Para entrega ya',
  '{marca} {modelo} - Disponible ahora',
  
  // Persuasivos
  '{marca} {modelo} - No te lo pierdas',
  '{marca} {modelo} {año} - Última unidad',
  '{marca} {modelo} - Oportunidad concreta',
  '{marca} {modelo} - Vale la pena',
  
  // Con características destacadas
  '{marca} {modelo} {combustible} - {año}',
  '{marca} {modelo} con {cabina_text} - {condicion}',
  '{marca} {modelo} {traccion} {potencia_hp}HP',
  
  // Profesionales
  '{subcategoria} profesional - {marca} {modelo}',
  '{marca} {modelo} - Uso profesional',
  '{marca} {modelo} {año} - Alta producción',
  
  // Con call to action
  'CONSULTÁ: {marca} {modelo} {año}',
  'MIRÁ: {marca} {modelo} {condicion}',
  
  // Especializados por tipo
  'Tractor {marca} {potencia_hp}HP {traccion}',
  'Cosechadora {marca} {modelo} - {horas_uso}hs',
  'Sembradora {marca} - Excelente estado',
  
  // Con beneficios
  '{marca} {modelo} - Papeles al día',
  '{marca} {modelo} {año} - Todo en regla',
  '{marca} {modelo} - Service completo',
  '{marca} {modelo} - Recién revisado',
];

// ====================================================================
// PATRONES DE DESCRIPCIONES - VERSIÓN PERSUASIVA SIN EMOJIS
// Enfoque: Beneficios y valor, no solo especificaciones técnicas
// ====================================================================
const DESCRIPTION_INTRO = [
  'Vendo',
  'Ofrezco',
  'Disponible',
  'En venta',
  'Oportunidad',
];

const DESCRIPTION_BENEFITS = [
  '\n\nListo para trabajar. Mantenimiento al día. Estado óptimo.',
  
  '\n\nAlta productividad. Reduce tiempos y costos operativos.',
  
  '\n\nMantenimiento documentado. Sin sorpresas mecánicas.',
  
  '\n\nPrecio competitivo. Estado superior al promedio.',
  
  '\n\nConservado bajo techo. Service actualizado.',
];

const DESCRIPTION_SPECS_CLEAN = [
  '{marca} {modelo} ({año}). {condicion}.',
  '{marca} {modelo}, año {año}. {condicion}.',
  '{marca} {modelo} - {año} - {condicion}.',
];

const DESCRIPTION_VALUE_PROPS = [
  '\n\nEntrega inmediata. Funcionamiento verificado. Documentación al día.',
  
  '\n\nTrato directo. Precio transparente. Facilidades de pago.',
  
  '\n\nProbado en campo. Sin vicios ocultos. Vendedor serio.',
];

const DESCRIPTION_LOCATION_CLEAN = [
  '\n\nUbicación: {provincia}. Visitas coordinadas.',
  
  '\n\nEn {provincia}. Posibilidad de envío.',
  
  '\n\nRetiro en {provincia} o traslado.',
];

const DESCRIPTION_CLOSING_PERSUASIVE = [
  '\n\nConsulte sin compromiso. WhatsApp disponible.',
  
  '\n\nContacto directo. Acepto permuta.',
  
  '\n\nPrecio negociable. Trato serio.',
  
  '\n\nFacilidades de pago. Respuesta rápida.',
];

// ====================================================================
// FUNCIONES HELPER
// ====================================================================
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function replaceTokens(template: string, data: AdData, categoryName: string, subcategoryName: string): string {
  let result = template;
  
  // Tokens básicos
  result = result.replace(/{marca}/g, data.attributes.marca || '{Marca}');
  result = result.replace(/{modelo}/g, data.attributes.modelo || '{Modelo}');
  result = result.replace(/{año}/g, data.attributes.año || data.attributes.anio || '{Año}');
  result = result.replace(/{condicion}/g, data.attributes.condicion || data.attributes.estado || 'Usado');
  
  // Tokens de categoría
  result = result.replace(/{categoria}/g, categoryName);
  result = result.replace(/{subcategoria}/g, subcategoryName);
  
  // Specs técnicas
  result = result.replace(/{potencia_hp}/g, data.attributes.potencia_hp || data.attributes.potencia || '');
  result = result.replace(/{horas_uso}/g, data.attributes.horas_uso || '');
  result = result.replace(/{traccion}/g, data.attributes.traccion || data.attributes.traction || '');
  result = result.replace(/{combustible}/g, data.attributes.combustible || '');
  result = result.replace(/{peso}/g, data.attributes.peso || '');
  
  // Boolean a texto
  const cabina = data.attributes.cabina;
  result = result.replace(/{cabina_text}/g, cabina ? 'cabina' : 'sin cabina');
  
  // Ubicación
  result = result.replace(/{provincia}/g, data.province || '{Provincia}');
  result = result.replace(/{localidad}/g, data.locality || '');
  
  // Características (array a texto)
  const caracteristicas = data.attributes.caracteristicas_adicionales;
  let caracteristicasText = '';
  if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
    caracteristicasText = caracteristicas.map(c => `• ${c}`).join('\n');
  }
  result = result.replace(/{caracteristicas_text}/g, caracteristicasText);
  
  // Limpiar tokens vacíos
  result = result.replace(/\s+/g, ' '); // Múltiples espacios
  result = result.replace(/\s+-\s+/g, ' - '); // Limpiar guiones
  result = result.replace(/\s+,/g, ','); // Limpiar comas
  result = result.trim();
  
  return result;
}

// ====================================================================
// GENERADORES PRINCIPALES
// ====================================================================
export function generateTitles(
  data: AdData,
  categoryName: string,
  subcategoryName: string,
  count: number = 5
): string[] {
  const titles: string[] = [];
  const usedPatterns = new Set<number>();
  
  while (titles.length < count && usedPatterns.size < TITLE_PATTERNS.length) {
    const randomIndex = Math.floor(Math.random() * TITLE_PATTERNS.length);
    
    if (!usedPatterns.has(randomIndex)) {
      usedPatterns.add(randomIndex);
      const pattern = TITLE_PATTERNS[randomIndex];
      const title = replaceTokens(pattern, data, categoryName, subcategoryName);
      
      // Validar que no tenga placeholders vacíos
      if (!title.includes('{}') && !title.includes('{Marca}') && !title.includes('{Modelo}')) {
        titles.push(title);
      }
    }
  }
  
  return titles;
}

export function generateDescription(
  data: AdData,
  categoryName: string,
  subcategoryName: string
): string {
  const intro = getRandomItem(DESCRIPTION_INTRO);
  const specs = getRandomItem(DESCRIPTION_SPECS_CLEAN);
  const benefits = getRandomItem(DESCRIPTION_BENEFITS);
  const valueProps = getRandomItem(DESCRIPTION_VALUE_PROPS);
  const location = data.province ? getRandomItem(DESCRIPTION_LOCATION_CLEAN) : '';
  const closing = getRandomItem(DESCRIPTION_CLOSING_PERSUASIVE);
  
  // Construir descripción enfocada en persuasión y valor
  const template = `${intro} ${subcategoryName} ${data.attributes.marca || ''} ${data.attributes.modelo || ''}.

${specs}${benefits}${valueProps}${location}${closing}`;
  
  return replaceTokens(template, data, categoryName, subcategoryName);
}

export function generateDescriptions(
  data: AdData,
  categoryName: string,
  subcategoryName: string,
  count: number = 3
): string[] {
  const descriptions: string[] = [];
  
  for (let i = 0; i < count; i++) {
    descriptions.push(generateDescription(data, categoryName, subcategoryName));
  }
  
  return descriptions;
}
