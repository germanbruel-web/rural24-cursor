/**
 * Subcategorías y Features (características) para Maquinarias
 * Cada subcategoría tiene subtipos con features específicas que se mostrarán como checkboxes
 */

export interface SubcategoryFeature {
  categoria: string; // Subcategoría de Maquinarias (ej: "Tractores")
  subcategoria: string; // Tipo dentro de la subcategoría (ej: "Tractores Chicos")
  features: string[]; // Características específicas
}

export const MAQUINARIAS_SUBCATEGORIES = [
  'Tractores',
  'Sembradoras',
  'Acoplados',
  'Tolvas',
  'Cabezales',
  'Cosechadoras',
  'Pulverizadoras',
  'Camiones',
  'Camionetas',
  'Fertilizadoras',
  'Desmalezadoras',
  'Maquinaria Vial',
  'Rastras',
  'Palas',
  'Mixers',
  'Rolos',
  'Embolsadoras / Embutidoras',
  'Niveladoras',
  'Rotoenfardadoras',
  'Casillas Rurales',
  'Otros'
] as const;

// Descripciones de subtipos para mejor comprensión del usuario
export const SUBTYPE_DESCRIPTIONS: Record<string, string> = {
  'Tractores Chicos': '20–60 HP aprox.',
  'Tractores Medianos': '60–120/150 HP aprox.',
  'Alta Potencia': '150–300+ HP',
  'Especiales': 'viñateros, fruteros, compactos, minicargadores, línea jardín, etc.'
};

export const MAQUINARIAS_FEATURES: SubcategoryFeature[] = [
  // Tractores
  {
    categoria: 'Tractores',
    subcategoria: 'Tractores Chicos',
    features: ['20–60 HP', 'Doble tracción', 'Compacto']
  },
  {
    categoria: 'Tractores',
    subcategoria: 'Tractores Medianos',
    features: ['60–120 HP', 'Cabina', 'Toma de fuerza']
  },
  {
    categoria: 'Tractores',
    subcategoria: 'Alta Potencia',
    features: ['120–300+ HP', '4x4 articulado', 'Hidráulico reforzado']
  },
  {
    categoria: 'Tractores',
    subcategoria: 'Especiales',
    features: ['Viñatero', 'Frutihortícola', 'Oruga']
  },

  // Sembradoras
  {
    categoria: 'Sembradoras',
    subcategoria: 'Grano Fino',
    features: ['Alfalfa', 'Trigo', 'Siembra al voleo']
  },
  {
    categoria: 'Sembradoras',
    subcategoria: 'Grano Grueso',
    features: ['Maíz', 'Soja', 'Dosificación variable']
  },
  {
    categoria: 'Sembradoras',
    subcategoria: 'Directa',
    features: ['Cuerpos independientes', 'Alta presión', 'Corte por sección']
  },
  {
    categoria: 'Sembradoras',
    subcategoria: 'Air Drill',
    features: ['Tolva presurizada', 'Distribución neumática', 'Gran ancho']
  },

  // Cosechadoras
  {
    categoria: 'Cosechadoras',
    subcategoria: 'Convencionales',
    features: ['Sacudidores', 'Cabezales intercambiables', 'Tracción simple']
  },
  {
    categoria: 'Cosechadoras',
    subcategoria: 'Axiales',
    features: ['Rotor', 'Bajo daño de grano', 'Alta capacidad']
  },
  {
    categoria: 'Cosechadoras',
    subcategoria: 'De Arrastre',
    features: ['Tractorizadas', 'Banda/Rotor', 'Bajo costo']
  },
  {
    categoria: 'Cosechadoras',
    subcategoria: 'Compactas',
    features: ['Pequeña escala', 'Familiar', 'Multicultivo']
  },

  // Acoplados
  {
    categoria: 'Acoplados',
    subcategoria: 'Acoplado Rural',
    features: ['Doble eje', 'Carga general', 'Barandas desmontables']
  },
  {
    categoria: 'Acoplados',
    subcategoria: 'Playos',
    features: ['Carga maquinaria', 'Rampa', 'Baja altura']
  },
  {
    categoria: 'Acoplados',
    subcategoria: 'Jaula Ganadera',
    features: ['Multi piso', 'Desmontable', 'Ventilación']
  },
  {
    categoria: 'Acoplados',
    subcategoria: 'Carro Agrícola',
    features: ['Forrajero', 'Descarga trasera', 'Liviano']
  },

  // Tolvas
  {
    categoria: 'Tolvas',
    subcategoria: 'Autodescargables',
    features: ['Sinfin', 'Doble eje', 'Alta capacidad']
  },
  {
    categoria: 'Tolvas',
    subcategoria: 'Tolvas Graneleras',
    features: ['Arrastre', 'Bajo mantenimiento', 'Divisiones']
  },
  {
    categoria: 'Tolvas',
    subcategoria: 'Tolvas Semilleras',
    features: ['Doble compartimiento', 'Inoxidable', 'Control de flujo']
  },

  // Cabezales
  {
    categoria: 'Cabezales',
    subcategoria: 'Maíz',
    features: ['Fijo', 'Plegado', 'Picador']
  },
  {
    categoria: 'Cabezales',
    subcategoria: 'Soja/Trigo (Plataforma)',
    features: ['Flexible', 'Draper', 'Sin fin']
  },
  {
    categoria: 'Cabezales',
    subcategoria: 'Girasol',
    features: ['Peine', 'Embocadores', 'Recolección limpia']
  },
  {
    categoria: 'Cabezales',
    subcategoria: 'Especiales',
    features: ['Arroz', 'Pick up', 'Varios cultivos']
  },

  // Pulverizadoras
  {
    categoria: 'Pulverizadoras',
    subcategoria: 'Autopropulsadas',
    features: ['Barra 25–40 m', 'Cabina', 'GPS']
  },
  {
    categoria: 'Pulverizadoras',
    subcategoria: 'De Arrastre',
    features: ['Tanque 1000–4000 L', 'Bomba triple', 'Ploteo']
  },
  {
    categoria: 'Pulverizadoras',
    subcategoria: 'Manuales',
    features: ['Mochila', 'Presión manual', 'Pequeño lote']
  },

  // Fertilizadoras
  {
    categoria: 'Fertilizadoras',
    subcategoria: 'Al Voceo',
    features: ['Doble disco', 'Regulación eléctrica', 'Acero inoxidable']
  },
  {
    categoria: 'Fertilizadoras',
    subcategoria: 'Neumáticas',
    features: ['Precisión', 'Uso con GPS', 'Alta cobertura']
  },
  {
    categoria: 'Fertilizadoras',
    subcategoria: 'Inyectores',
    features: ['Líquidos', 'Directo al suelo', 'Cultivo especial']
  },

  // Desmalezadoras
  {
    categoria: 'Desmalezadoras',
    subcategoria: 'De Arrastre',
    features: ['Martillos', 'Cuchillas', 'Potente']
  },
  {
    categoria: 'Desmalezadoras',
    subcategoria: 'De 3 puntos',
    features: ['Toma de fuerza', 'Liviana', 'Regulación de altura']
  },
  {
    categoria: 'Desmalezadoras',
    subcategoria: 'Rotativas',
    features: ['Pastizales', 'Gran ancho', 'Alta velocidad']
  },

  // Palas
  {
    categoria: 'Palas',
    subcategoria: 'Pala Frontal Tractor',
    features: ['Balde', 'Pinche rollo', 'Levante hidráulico']
  },
  {
    categoria: 'Palas',
    subcategoria: 'Mini Cargadoras',
    features: ['Bobcat', 'Múltiples accesorios', '4x4']
  },
  {
    categoria: 'Palas',
    subcategoria: 'Pala Oruga',
    features: ['Orugas', 'Trabajo pesado', 'Terraplén']
  },

  // Rastras
  {
    categoria: 'Rastras',
    subcategoria: 'Discos',
    features: ['Liviana', 'Media', 'Pesada']
  },
  {
    categoria: 'Rastras',
    subcategoria: 'De Dientes',
    features: ['Nivelación', 'Liviana', 'Arrastre']
  },

  // Mixers
  {
    categoria: 'Mixers',
    subcategoria: 'Verticales',
    features: ['1 sinfín', '2 sinfines', 'Fibrosos']
  },
  {
    categoria: 'Mixers',
    subcategoria: 'Horizontales',
    features: ['Paletas', 'Gran volumen', 'Fibra corta']
  },

  // Rolos
  {
    categoria: 'Rolos',
    subcategoria: 'Desmalezadores',
    features: ['Cuchillas', 'Gramilla', 'Alta resistencia']
  },
  {
    categoria: 'Rolos',
    subcategoria: 'Picadores',
    features: ['Residuo grueso', 'Cultivos altos', 'Fierro pesado']
  },

  // Camiones
  {
    categoria: 'Camiones',
    subcategoria: 'Chasis',
    features: ['Liviano', 'Mediano', 'Pesado']
  },
  {
    categoria: 'Camiones',
    subcategoria: 'Batea',
    features: ['Granel', 'Descarga lateral', 'Volcador']
  },

  // Camionetas
  {
    categoria: 'Camionetas',
    subcategoria: '4x2',
    features: ['Doble cabina', 'Motor diesel', 'Caja larga']
  },
  {
    categoria: 'Camionetas',
    subcategoria: '4x4',
    features: ['Alta gama', 'Off road', 'Suspensión elevada']
  },

  // Maquinaria Vial
  {
    categoria: 'Maquinaria Vial',
    subcategoria: 'Retroexcavadoras',
    features: ['Balde', 'Martillo', 'Brazo extensible']
  },
  {
    categoria: 'Maquinaria Vial',
    subcategoria: 'Motoniveladoras',
    features: ['Articulada', 'GPS', 'Lámina frontal']
  },
  {
    categoria: 'Maquinaria Vial',
    subcategoria: 'Topadoras',
    features: ['Oruga', 'Hoja', 'Ripper']
  },

  // Embolsadoras
  {
    categoria: 'Embolsadoras / Embutidoras',
    subcategoria: 'Embolsadoras Grano',
    features: ['Bolsa 9 pies', 'Bolsa 10 pies', 'Sin fin grande']
  },
  {
    categoria: 'Embolsadoras / Embutidoras',
    subcategoria: 'Extractor de Bolsa',
    features: ['Desenbolsado', 'Descarga lateral', 'Sin fin']
  },

  // Otros
  {
    categoria: 'Casillas Rurales',
    subcategoria: 'Casillas Rurales',
    features: ['Térmicas', 'Rodantes', 'Dormitorios']
  },
  {
    categoria: 'Rotoenfardadoras',
    subcategoria: 'Rotoenfardadoras',
    features: ['Rollos', 'Cámara fija', 'Cámara variable']
  },
  {
    categoria: 'Niveladoras',
    subcategoria: 'Niveladoras',
    features: ['Láser', 'Hidráulica', 'Terreno irregular']
  }
];

/**
 * Obtiene los subtipos (sub-subcategorías) disponibles para una subcategoría
 */
export const getSubtypesForSubcategory = (subcategory: string): string[] => {
  const subtypes = MAQUINARIAS_FEATURES
    .filter(item => item.categoria === subcategory)
    .map(item => item.subcategoria);
  return [...new Set(subtypes)]; // Eliminar duplicados
};

/**
 * Obtiene las features (características) disponibles para un subtipo específico
 */
export const getFeaturesForSubtype = (subcategory: string, subtype: string): string[] => {
  const item = MAQUINARIAS_FEATURES.find(
    f => f.categoria === subcategory && f.subcategoria === subtype
  );
  return item?.features || [];
};

/**
 * Obtiene todas las features disponibles para una subcategoría (todos sus subtipos)
 */
export const getAllFeaturesForSubcategory = (subcategory: string): string[] => {
  const features = MAQUINARIAS_FEATURES
    .filter(item => item.categoria === subcategory)
    .flatMap(item => item.features);
  return [...new Set(features)]; // Eliminar duplicados
};
