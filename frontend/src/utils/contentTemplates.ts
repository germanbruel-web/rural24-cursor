// ====================================================================
// CONTENT TEMPLATES - Plantillas simples por categoría
// ====================================================================
// 4-5 variantes de texto por categoría que rotan al hacer click.
// Sin complejidad, solo strings que se muestran tal cual.
// ====================================================================

// Clave para localStorage (plantillas editadas por el admin)
const TEMPLATES_STORAGE_KEY = 'rural24_templates';

// Clave para recordar qué variante se mostró último
const LAST_INDEX_KEY = 'rural24_template_index';

// ====================================================================
// TIPOS
// ====================================================================
export interface CategoryTemplates {
  categorySlug: string;
  categoryName: string;
  templates: string[]; // Array de 4-5 variantes de descripción
}

export interface ContentContext {
  categoria: string;
  categorySlug: string;
  subcategoria: string;
  subcategorySlug: string;
  marca?: string;
  modelo?: string;
  año?: string;
  condicion?: string;
  provincia?: string;
  localidad?: string;
  atributos: Record<string, string>;
}

// ====================================================================
// PLANTILLAS POR CATEGORÍA (4-5 variantes cada una)
// ====================================================================
const DEFAULT_TEMPLATES: CategoryTemplates[] = [
  {
    categorySlug: 'maquinarias-agricolas',
    categoryName: 'Maquinarias Agrícolas',
    templates: [
      'Vendo este fierro que está impecable, listo para entrar al rastrojo hoy mismo sin renegar. Tiene el motor serenito y está cuidado como para uno. Venga a verlo, lo pone en marcha y se lo lleva porque un compañero así no espera a nadie.',
      
      'Máquina en excelente estado, lista para trabajar. Motor cuidado, hidráulico sin pérdidas y cubiertas con buen dibujo. Ideal para el que busca calidad sin pagar de más.',
      
      'Equipo confiable para el trabajo pesado. Mantenimiento al día y todo funcionando como corresponde. No va a renegar en plena campaña.',
      
      'Fierro probado y rendidor. Listo para subir y salir a trabajar. El que lo ve se lo lleva porque oportunidades así no abundan.',
      
      'Maquinaria de primera mano, siempre guardada bajo techo. Funcionamiento impecable. Consulte sin compromiso.',
    ],
  },
  {
    categorySlug: 'ganaderia',
    categoryName: 'Ganadería',
    templates: [
      'Vendo lote de hacienda de primera, bien parejos y con mucha caja para meter kilos rápido. Son bichos rústicos, sanos y con una mansedumbre que da gusto. No los deje pasar porque calidad así vuela en cuanto el vecino se entere.',
      
      'Animales en excelente estado, criados a campo natural. Sanidad al día y listos para cargar. El que sabe de hacienda se da cuenta enseguida que acá hay calidad.',
      
      'Lote parejo y bien conformado. Genética probada y sanidad completa. Ideal para el que busca rendimiento sin sorpresas.',
      
      'Hacienda sana, mansa y con potencial. Criados con buen manejo y alimentación. Venga a verlos que el ojo del amo engorda el ganado.',
      
      'Animales de primera selección. Papeles al día y listos para el traslado. Consulte por el lote completo.',
    ],
  },
  {
    categorySlug: 'inmuebles',
    categoryName: 'Inmuebles Rurales',
    templates: [
      'Tengo en venta un campo muy noble, con buena napa y el alambrado firme como rulo de estatua. Es tierra agradecida, lista para producir y con los papeles al día para escriturar sin vueltas. Una inversión segura en un rincón bendecido por la zona.',
      
      'Campo productivo con excelente potencial. Suelo trabajado, mejoras en condiciones y acceso todo el año. Ideal para ampliar o iniciar un proyecto serio.',
      
      'Fracción de campo en zona privilegiada. Tierra fértil, buena agua y vecinos que trabajan. Papeles al día, listo para escriturar.',
      
      'Oportunidad de inversión en tierra. Campo descansado con aptitud mixta. Infraestructura básica y potencial de desarrollo.',
      
      'Propiedad rural con historia y futuro. Suelo noble que responde al trabajo. Consulte condiciones de venta.',
    ],
  },
  {
    categorySlug: 'campos',
    categoryName: 'Campos',
    templates: [
      'Tengo en venta un campo muy noble, con buena napa y el alambrado firme. Es tierra agradecida, lista para producir y con los papeles al día para escriturar sin vueltas.',
      
      'Campo productivo con excelente potencial. Suelo trabajado y mejoras en condiciones. Ideal para ampliar o iniciar un proyecto.',
      
      'Fracción de campo en zona privilegiada. Tierra fértil y buena agua. Papeles al día.',
      
      'Oportunidad de inversión en tierra. Campo descansado con aptitud mixta.',
      
      'Propiedad rural con historia. Suelo noble que responde al trabajo. Consulte condiciones.',
    ],
  },
  {
    categorySlug: 'insumos',
    categoryName: 'Insumos Agropecuarios',
    templates: [
      'Tenemos semillas y fertilizantes de los buenos, de esos que hacen que la planta nazca con fuerza y aguante el castigo. No le mezquine al surco si quiere cosechar en serio. Pase y consulte precios que acá nos arreglamos entre paisanos.',
      
      'Insumos de primera calidad con stock disponible. Productos de marcas reconocidas a precios competitivos. Entrega inmediata.',
      
      'Todo lo que el campo necesita para producir. Calidad garantizada y asesoramiento incluido. Consulte por cantidad.',
      
      'Productos agrícolas de confianza. Stock permanente y buenos precios por volumen. Trabajamos con productores de toda la zona.',
      
      'Insumos que rinden. Marcas probadas y servicio de entrega. Pague en cuotas o al contado con descuento.',
    ],
  },
  {
    categorySlug: 'vehiculos',
    categoryName: 'Vehículos',
    templates: [
      'Vendo este fierro que está impecable, listo para el camino rural hoy mismo. Tiene el motor serenito y está cuidado como para uno. Venga a verlo, lo pone en marcha y se lo lleva porque un compañero así no espera a nadie.',
      
      'Vehículo en excelente estado, mecánica impecable. Interior cuidado y listo para subir y salir. Ideal para el trabajo diario.',
      
      'Unidad confiable para el trajín del campo. Todo funcionando, papeles al día. El que lo ve se lo lleva.',
      
      'Rodado de primera mano, siempre con mantenimiento. Motor sano y carrocería sin detalles. Consulte financiación.',
      
      'Vehículo probado en caminos rurales. Rendidor y económico. Oportunidad para el que busca calidad.',
    ],
  },
  {
    categorySlug: 'equipos',
    categoryName: 'Equipos y Herramientas',
    templates: [
      'Vendo este equipo que está impecable, listo para trabajar hoy mismo. Funcionamiento perfecto y mantenimiento al día. Venga a verlo y se lo lleva porque herramientas así no abundan.',
      
      'Equipo en excelente estado, poco uso. Ideal para el trabajo pesado. Consulte disponibilidad.',
      
      'Herramienta confiable para el campo. Todo funcionando como debe. Precio conversable.',
      
      'Equipamiento de calidad a precio razonable. Listo para usar. Oportunidad.',
      
      'Herramienta probada y rendidora. Sin detalles, funciona perfecto. Consulte.',
    ],
  },
  {
    categorySlug: 'servicios',
    categoryName: 'Servicios Rurales',
    templates: [
      'Hacemos trabajos rurales a conciencia, con equipo propio y de sol a sol hasta terminar la tarea. Somos gente de palabra que no anda con vueltas ni mira el reloj cuando el laburo apremia. Llámenos y quédese tranquilo que el campo queda de diez.',
      
      'Servicios profesionales para el agro. Equipo propio, experiencia comprobada y compromiso con el trabajo bien hecho. Consulte sin cargo.',
      
      'Trabajamos en toda la zona con responsabilidad y puntualidad. Presupuestos sin compromiso. Referencias disponibles.',
      
      'Servicio rural de confianza. Años de experiencia y clientes satisfechos. Llámenos y coordinamos.',
      
      'Soluciones para el campo. Trabajo garantizado y precios justos. Consulte disponibilidad.',
    ],
  },
];

// ====================================================================
// FUNCIONES CRUD
// ====================================================================

/**
 * Obtiene todas las plantillas (localStorage o defaults)
 */
export function getTemplates(): CategoryTemplates[] {
  try {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error loading templates:', e);
  }
  return [...DEFAULT_TEMPLATES];
}

/**
 * Guarda las plantillas en localStorage
 */
export function saveTemplates(templates: CategoryTemplates[]): void {
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
}

/**
 * Resetea a los defaults
 */
export function resetTemplates(): void {
  localStorage.removeItem(TEMPLATES_STORAGE_KEY);
  localStorage.removeItem(LAST_INDEX_KEY);
}

/**
 * Exporta plantillas como JSON
 */
export function exportTemplates(): string {
  return JSON.stringify(getTemplates(), null, 2);
}

/**
 * Importa plantillas desde JSON
 */
export function importTemplates(json: string): boolean {
  try {
    const templates = JSON.parse(json) as CategoryTemplates[];
    if (Array.isArray(templates) && templates.every(t => t.categorySlug && Array.isArray(t.templates))) {
      saveTemplates(templates);
      return true;
    }
  } catch (e) {
    console.error('Error importing templates:', e);
  }
  return false;
}

// ====================================================================
// GENERADOR DE CONTENIDO
// ====================================================================

/**
 * Obtiene el índice actual para una categoría y lo incrementa
 */
function getNextIndex(categorySlug: string, totalTemplates: number): number {
  try {
    const stored = localStorage.getItem(LAST_INDEX_KEY);
    const indices: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    const currentIndex = indices[categorySlug] ?? -1;
    const nextIndex = (currentIndex + 1) % totalTemplates;
    
    indices[categorySlug] = nextIndex;
    localStorage.setItem(LAST_INDEX_KEY, JSON.stringify(indices));
    
    return nextIndex;
  } catch {
    return 0;
  }
}

/**
 * Genera título basado en los datos del formulario
 */
function generateTitle(ctx: ContentContext): string {
  const parts: string[] = [];
  
  // Campos principales para el título
  if (ctx.marca) parts.push(ctx.marca);
  if (ctx.modelo) parts.push(ctx.modelo);
  if (ctx.año) parts.push(ctx.año);
  if (ctx.condicion) parts.push(ctx.condicion);
  
  // Si no hay datos, usar subcategoría
  if (parts.length === 0) {
    return ctx.subcategoria || 'Nuevo aviso';
  }
  
  return parts.join(' - ');
}

/**
 * Genera descripción rotando entre las plantillas de la categoría
 */
function generateDescription(ctx: ContentContext): string {
  const templates = getTemplates();
  
  // Buscar plantillas de la categoría
  let categoryTemplates = templates.find(t => t.categorySlug === ctx.categorySlug);
  
  // Fallback a maquinarias si no encuentra
  if (!categoryTemplates) {
    categoryTemplates = templates.find(t => t.categorySlug === 'maquinarias-agricolas');
  }
  
  if (!categoryTemplates || categoryTemplates.templates.length === 0) {
    return 'Consulte disponibilidad y condiciones.';
  }
  
  // Obtener siguiente índice (rota en cada click)
  const index = getNextIndex(ctx.categorySlug, categoryTemplates.templates.length);
  let description = categoryTemplates.templates[index];
  
  // Agregar ubicación si hay
  if (ctx.provincia || ctx.localidad) {
    const location = [ctx.localidad, ctx.provincia].filter(Boolean).join(', ');
    description += `\n\nUbicación: ${location}`;
  }
  
  return description;
}

/**
 * Genera contenido completo (título + descripción)
 */
export function generateContent(ctx: ContentContext): { title: string; description: string } {
  return {
    title: generateTitle(ctx),
    description: generateDescription(ctx),
  };
}

/**
 * Lista todas las categorías con sus plantillas para el admin
 */
export function getTemplatesList(): { category: string; slug: string; count: number }[] {
  return getTemplates().map(t => ({
    category: t.categoryName,
    slug: t.categorySlug,
    count: t.templates.length,
  }));
}
