/**
 * ⚠️ ARCHIVO DEPRECADO - NO USAR ⚠️
 * 
 * Este archivo contenía categorías y subcategorías para SERVICIOS AGROPECUARIOS.
 * La categoría "Servicios" ha sido ELIMINADA del sistema.
 * 
 * Este archivo se mantiene solo por referencia histórica y debe ser eliminado en el futuro.
 * NO importar este archivo en componentes nuevos.
 * 
 * Fecha de deprecación: Enero 2025
 * Motivo: Eliminación de categoría "Servicios" del sistema
 */

export const SERVICES_CATEGORIES: Record<string, string[]> = {
  'Asesoría y Consultoría Agropecuaria': [
    'Asesor Agronómico Integral',
    'Consultor de Producción',
    'Planificación de Siembras',
    'Asesoría en Manejo de Suelo',
    'Asesoría en Fertilización / Nutrición',
    'Sanidad Vegetal',
    'Monitoreo de Plagas / Malezas',
    'Auditorías Técnicas',
    'Gestión climática y riesgo',
  ],
  
  'Servicios Agronómicos y de Producción': [
    'Monitoreo de cultivos',
    'Relevamientos de campo',
    'Clasificación de cultivos',
    'Muestreo de suelo',
    'Mapeo de ambientes',
    'Seguimiento fenológico',
  ],
  
  'Servicios Ganaderos y Veterinarios': [
    'Veterinario clínico',
    'Reproducción bovina',
    'Inseminación artificial / IATF',
    'Sanidad animal',
    'Asistencia a feedlots',
    'Manejo de rodeos',
    'Nutrición animal',
    'Control de pesaje / trazabilidad',
  ],
  
  'Maquinarias y Servicios de Campo (Contratistas)': [
    'Siembra',
    'Pulverización',
    'Fertilización',
    'Cosecha',
    'Henificación / Rollos',
    'Desmalezado',
    'Movimiento de suelos',
    'Fumigación terrestre',
    'Excavación / zanjeo',
    'Servicios con tractor',
    'Servicios con maquinaria pesada',
  ],
  
  'Servicios Forestales y Ambientales': [
    'Plantación forestal',
    'Podas y raleos',
    'Manejo de bosques',
    'Estudios de impacto ambiental',
    'Certificaciones ambientales',
    'Restauración de áreas degradadas',
  ],
  
  'Ingeniería, Topografía y Geomática': [
    'Topografía rural',
    'Lotes y mensuras',
    'Relevamientos GPS/GNSS',
    'Agrimensura',
    'Drones – Fotogrametría',
    'Mapeos NDVI',
    'Cartografía y GIS',
  ],
  
  'Servicios de Tecnología y Datos Agro': [
    'Softwares de gestión agropecuaria',
    'Sensores IoT',
    'Plataformas de seguimiento satelital',
    'Procesamiento de datos agronómicos',
    'Automatización / Agricultura de precisión',
    'Configuración de equipos (pilotos, monitores, etc.)',
    'Tableros BI',
  ],
  
  'Comercialización y Gestión Agroempresarial': [
    'Compra/venta de hacienda',
    'Compra/venta de insumos',
    'Brokers de granos',
    'Administración de campos',
    'Contabilidad rural',
    'Planes impositivos',
    'Control de stock y trazabilidad',
    'Representantes comerciales agro',
  ],
  
  'Logística, Transporte y Acopio': [
    'Transporte de granos',
    'Transporte de hacienda',
    'Servicios de balanza',
    'Acopio',
    'Carga y descarga',
    'Gestión de fletes',
  ],
  
  'Construcción Rural e Infraestructura': [
    'Corrales y bretes',
    'Electrificaciones rurales',
    'Montaje de galpones',
    'Alambrados',
    'Perforaciones',
    'Caminos y accesos',
    'Obras hidráulicas',
  ],
  
  'Energía, Riego y Recursos Hídricos': [
    'Instalación de riego por goteo',
    'Diseño de sistemas de riego',
    'Bombas y perforaciones',
    'Energía solar para campo',
    'Gestión de agua',
    'Drenajes rurales',
  ],
  
  'Capacitación, Seguridad y Recursos Humanos': [
    'Capacitación agropecuaria',
    'Seguridad e higiene rural',
    'Cursos de maquinaria agrícola',
    'Habilitaciones y certificaciones',
    'Selección de personal para campo',
  ],
  
  'Otros Servicios Complementarios': [
    'Fotografía y video agro',
    'Marketing agropecuario',
    'Servicios contables',
    'Diseño de marcas y packaging rural',
    'Informes climatológicos personalizados',
    'Servicios legales agrarios',
  ],
};

export const SERVICES_CATEGORIES_LIST = Object.keys(SERVICES_CATEGORIES);

/**
 * Títulos y tecnicaturas del sector agropecuario
 */
export const PROFESSIONAL_TITLES = [
  'Ingeniero Agrónomo',
  'Técnico Agropecuario',
  'Ingeniero Zootecnista',
  'Médico Veterinario',
  'Técnico en Producción Animal',
  'Técnico en Producción Vegetal',
  'Técnico Forestal',
  'Técnico en Agricultura de Precisión',
  'Técnico en Gestión Agropecuaria',
  'Perito clasificador de cereales',
  'Operador de maquinaria agrícola',
  'Piloto de drones certificado',
  'Analista de datos agro',
  'Ingeniero Ambiental',
  'Ingeniero Hidráulico',
  'Ingeniero en Recursos Naturales',
  'Sin título específico',
  'Otro',
] as const;
