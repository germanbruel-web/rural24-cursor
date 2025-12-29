// ====================================================================
// CONFIGURACIÓN DE GRUPOS DE ATRIBUTOS
// ====================================================================
// Define qué atributos pertenecen a cada grupo visual en el detalle del aviso

import { TEXTS } from '../constants/texts';

export interface AttributeGroup {
  key: string;
  title: string;
  attributes: string[];
}

export const ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    key: 'motor',
    title: TEXTS.attributeGroups.motor,
    attributes: ['motor', 'potencia', 'cilindros', 'combustible', 'turbo'],
  },
  {
    key: 'transmision',
    title: TEXTS.attributeGroups.transmision,
    attributes: ['transmision', 'velocidades', 'traccion'],
  },
  {
    key: 'dimensiones',
    title: TEXTS.attributeGroups.dimensiones,
    attributes: [
      'largo',
      'ancho',
      'alto',
      'peso',
      'trocha_delantera',
      'trocha_trasera',
      'distancia_entre_ejes',
    ],
  },
  {
    key: 'hidraulica',
    title: TEXTS.attributeGroups.hidraulica,
    attributes: [
      'sistema_hidraulico',
      'capacidad_elevacion',
      'caudal_hidraulico',
      'puntos_hidraulicos',
    ],
  },
  {
    key: 'cabina',
    title: TEXTS.attributeGroups.cabina,
    attributes: [
      'cabina',
      'aire_acondicionado',
      'calefaccion',
      'suspension_asiento',
      'radio',
    ],
  },
  {
    key: 'neumaticos',
    title: TEXTS.attributeGroups.neumaticos,
    attributes: [
      'neumaticos_delanteros',
      'neumaticos_traseros',
      'estado_neumaticos',
    ],
  },
  {
    key: 'toma_fuerza',
    title: TEXTS.attributeGroups.toma_fuerza,
    attributes: ['toma_fuerza', 'rpm_toma_fuerza', 'tipo_toma_fuerza'],
  },
  {
    key: 'capacidades',
    title: TEXTS.attributeGroups.capacidades,
    attributes: [
      'capacidad_tanque_combustible',
      'capacidad_aceite_motor',
      'capacidad_sistema_hidraulico',
    ],
  },
  {
    key: 'implementos',
    title: TEXTS.attributeGroups.implementos,
    attributes: [
      'enganche_tres_puntos',
      'barra_tiro',
      'implemento_incluido',
      'compatible_implementos',
    ],
  },
  {
    key: 'otros',
    title: TEXTS.attributeGroups.otros,
    attributes: [], // Cualquier atributo que no esté en los grupos anteriores
  },
];

/**
 * Encuentra el grupo al que pertenece un atributo
 * @param attributeKey - Clave del atributo a buscar
 * @returns El grupo encontrado o null
 */
export function findGroupForAttribute(attributeKey: string): AttributeGroup | null {
  const normalizedKey = attributeKey.toLowerCase().trim();
  
  for (const group of ATTRIBUTE_GROUPS) {
    if (group.attributes.includes(normalizedKey)) {
      return group;
    }
  }
  
  return null;
}

/**
 * Agrupa atributos según la configuración
 * @param attributes - Objeto con atributos dinámicos
 * @returns Map con grupos y sus atributos
 */
export function groupAttributes(
  attributes: Record<string, any>
): Map<string, { title: string; items: Array<{ key: string; value: any }> }> {
  const grouped = new Map<string, { title: string; items: Array<{ key: string; value: any }> }>();

  // Inicializar grupos
  ATTRIBUTE_GROUPS.forEach((group) => {
    grouped.set(group.key, { title: group.title, items: [] });
  });

  // Agrupar atributos
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;

    const group = findGroupForAttribute(key);
    const groupKey = group ? group.key : 'otros';
    const groupData = grouped.get(groupKey)!;
    
    groupData.items.push({ key, value });
  });

  // Remover grupos vacíos
  Array.from(grouped.keys()).forEach((key) => {
    if (grouped.get(key)!.items.length === 0) {
      grouped.delete(key);
    }
  });

  return grouped;
}
