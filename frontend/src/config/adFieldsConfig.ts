/**
 * Configuración de campos dinámicos por categoría y subcategoría
 * Define qué campos mostrar en el formulario de alta y en la vista de detalle
 */

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'tel' | 'url';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  helpText?: string;
  unit?: string; // Para mostrar unidades como HP, kg, etc.
}

export interface CategoryFieldsConfig {
  commonFields: FieldConfig[];
  subcategoryFields: Record<string, FieldConfig[]>;
}

// =====================================================
// CAMPOS COMUNES A TODOS LOS AVISOS
// =====================================================
export const UNIVERSAL_FIELDS: FieldConfig[] = [
  {
    name: 'title',
    label: 'Título del aviso',
    type: 'text',
    required: true,
    placeholder: 'Ej: Tractor John Deere 5075E',
    helpText: 'Máximo 100 caracteres'
  },
  {
    name: 'description',
    label: 'Descripción',
    type: 'textarea',
    required: true,
    placeholder: 'Describe las características, estado y detalles importantes...',
    helpText: 'Mínimo 50 caracteres, máximo 2000'
  },
  {
    name: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'Ciudad, Provincia'
  },
  {
    name: 'price',
    label: 'Precio',
    type: 'number',
    required: false,
    placeholder: 'Opcional - Dejar vacío si es "Consultar"',
    min: 0
  },
  {
    name: 'phone',
    label: 'Teléfono / WhatsApp',
    type: 'tel',
    required: true,
    placeholder: '+54 9 11 1234-5678'
  },
  {
    name: 'images',
    label: 'Fotos',
    type: 'text', // Este será manejado por un componente especial de upload
    required: false,
    helpText: 'Máximo 8 fotos, formato JPG/PNG'
  }
];

// =====================================================
// MAQUINARIAS
// =====================================================
export const MAQUINARIAS_CONFIG: CategoryFieldsConfig = {
  commonFields: [
    {
      name: 'brand',
      label: 'Marca',
      type: 'select',
      required: true,
      options: [] // Se llenarán dinámicamente desde la BD
    },
    {
      name: 'model',
      label: 'Modelo',
      type: 'select',
      required: true,
      options: [] // Se llenarán dinámicamente según marca
    },
    {
      name: 'year',
      label: 'Año',
      type: 'number',
      required: true,
      placeholder: '2020',
      min: 1950,
      max: new Date().getFullYear() + 1
    },
    {
      name: 'condition',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'nuevo', label: 'Nuevo' },
        { value: 'usado', label: 'Usado' }
      ]
    }
  ],
  subcategoryFields: {
    tractores: [
      {
        name: 'horsepower',
        label: 'Potencia',
        type: 'number',
        required: true,
        placeholder: '75',
        unit: 'HP',
        min: 10,
        max: 600
      },
      {
        name: 'hours',
        label: 'Horas de uso',
        type: 'number',
        required: false,
        placeholder: '1500',
        unit: 'hs',
        min: 0
      },
      {
        name: 'traction_type',
        label: 'Tipo de tracción',
        type: 'select',
        required: true,
        options: [
          { value: '4x2', label: '4x2 (Simple)' },
          { value: '4x4', label: '4x4 (Doble)' }
        ]
      },
      {
        name: 'tractor_type',
        label: 'Tipo de tractor',
        type: 'select',
        required: true,
        options: [
          { value: 'chico', label: 'Chico (hasta 75 HP)' },
          { value: 'mediano', label: 'Mediano (76-150 HP)' },
          { value: 'alta_potencia', label: 'Alta potencia (151-300 HP)' },
          { value: 'especial', label: 'Especial (más de 300 HP)' }
        ]
      }
    ],
    cosechadoras: [
      {
        name: 'engine_hours',
        label: 'Horas de motor',
        type: 'number',
        required: false,
        placeholder: '2000',
        unit: 'hs'
      },
      {
        name: 'threshing_hours',
        label: 'Horas de trilla',
        type: 'number',
        required: false,
        placeholder: '1500',
        unit: 'hs'
      },
      {
        name: 'cutting_width',
        label: 'Ancho de corte',
        type: 'number',
        required: false,
        placeholder: '30',
        unit: 'pies'
      },
      {
        name: 'crop_type',
        label: 'Tipo de cultivo',
        type: 'select',
        required: false,
        options: [
          { value: 'grano_fino', label: 'Grano fino' },
          { value: 'grano_grueso', label: 'Grano grueso' },
          { value: 'maiz', label: 'Maíz' },
          { value: 'multiple', label: 'Múltiple' }
        ]
      },
      {
        name: 'includes_header',
        label: 'Incluye cabezal',
        type: 'select',
        required: false,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' }
        ]
      }
    ],
    sembradoras: [
      {
        name: 'seeder_type',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: [
          { value: 'grano_fino', label: 'Grano fino' },
          { value: 'grano_grueso', label: 'Grano grueso' },
          { value: 'directa', label: 'Siembra directa' }
        ]
      },
      {
        name: 'rows',
        label: 'Cantidad de líneas',
        type: 'number',
        required: true,
        placeholder: '14',
        min: 1
      },
      {
        name: 'row_spacing',
        label: 'Distancia entre líneas',
        type: 'number',
        required: false,
        placeholder: '52',
        unit: 'cm'
      },
      {
        name: 'working_width',
        label: 'Ancho de labor',
        type: 'number',
        required: false,
        placeholder: '7.2',
        unit: 'm'
      }
    ],
    pulverizadoras: [
      {
        name: 'sprayer_type',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: [
          { value: 'autopropulsada', label: 'Autopropulsada' },
          { value: 'arrastre', label: 'De arrastre' }
        ]
      },
      {
        name: 'tank_capacity',
        label: 'Capacidad del tanque',
        type: 'number',
        required: false,
        placeholder: '3000',
        unit: 'litros'
      },
      {
        name: 'boom_width',
        label: 'Ancho de botalón',
        type: 'number',
        required: false,
        placeholder: '24',
        unit: 'm'
      },
      {
        name: 'hours',
        label: 'Horas de uso',
        type: 'number',
        required: false,
        placeholder: '800',
        unit: 'hs'
      }
    ],
    forraje_ganaderia: [
      {
        name: 'equipment_type',
        label: 'Tipo de equipo',
        type: 'select',
        required: true,
        options: [
          { value: 'mixer', label: 'Mixer' },
          { value: 'rotoenfardadora', label: 'Rotoenfardadora' },
          { value: 'henificadora', label: 'Henificadora' },
          { value: 'embolsadora', label: 'Embolsadora' },
          { value: 'otro', label: 'Otro' }
        ]
      },
      {
        name: 'capacity',
        label: 'Capacidad',
        type: 'number',
        required: false,
        placeholder: '10',
        unit: 'm³'
      },
      {
        name: 'work_system',
        label: 'Sistema de trabajo',
        type: 'text',
        required: false,
        placeholder: 'Ej: Rotor, cadena, hidráulico'
      }
    ]
  }
};

// =====================================================
// GANADERÍA
// =====================================================
export const GANADERIA_CONFIG: CategoryFieldsConfig = {
  commonFields: [
    {
      name: 'species',
      label: 'Especie',
      type: 'select',
      required: true,
      options: [] // Se llenará desde subcategorías
    },
    {
      name: 'quantity',
      label: 'Cantidad',
      type: 'number',
      required: true,
      placeholder: '50',
      min: 1
    },
    {
      name: 'price_type',
      label: 'Precio por',
      type: 'select',
      required: false,
      options: [
        { value: 'cabeza', label: 'Por cabeza' },
        { value: 'lote', label: 'Lote completo' },
        { value: 'kg', label: 'Por kilogramo' }
      ]
    }
  ],
  subcategoryFields: {
    bovinos: [
      {
        name: 'category',
        label: 'Categoría',
        type: 'select',
        required: true,
        options: [
          { value: 'ternero', label: 'Ternero' },
          { value: 'ternera', label: 'Ternera' },
          { value: 'novillo', label: 'Novillo' },
          { value: 'vaquillona', label: 'Vaquillona' },
          { value: 'vaca', label: 'Vaca' },
          { value: 'toro', label: 'Toro' }
        ]
      },
      {
        name: 'weight',
        label: 'Peso aproximado',
        type: 'number',
        required: false,
        placeholder: '350',
        unit: 'kg'
      },
      {
        name: 'breed',
        label: 'Raza',
        type: 'select',
        required: false,
        options: [
          { value: 'aberdeen_angus', label: 'Aberdeen Angus' },
          { value: 'hereford', label: 'Hereford' },
          { value: 'braford', label: 'Braford' },
          { value: 'holando', label: 'Holando' },
          { value: 'cruza', label: 'Cruza' },
          { value: 'otro', label: 'Otro' }
        ]
      },
      {
        name: 'status',
        label: 'Estado',
        type: 'select',
        required: false,
        options: [
          { value: 'cria', label: 'Cría' },
          { value: 'invernada', label: 'Invernada' },
          { value: 'gordo', label: 'Gordo/Faena' }
        ]
      }
    ],
    ovinos: [
      {
        name: 'category',
        label: 'Categoría',
        type: 'select',
        required: true,
        options: [
          { value: 'cordero', label: 'Cordero' },
          { value: 'oveja', label: 'Oveja' },
          { value: 'carnero', label: 'Carnero' }
        ]
      },
      {
        name: 'breed',
        label: 'Raza',
        type: 'text',
        required: false,
        placeholder: 'Ej: Merino, Corriedale'
      }
    ],
    equinos: [
      {
        name: 'breed',
        label: 'Raza',
        type: 'text',
        required: false,
        placeholder: 'Ej: Criollo, Cuarto de Milla'
      },
      {
        name: 'age',
        label: 'Edad',
        type: 'number',
        required: false,
        placeholder: '5',
        unit: 'años'
      },
      {
        name: 'sex',
        label: 'Sexo',
        type: 'select',
        required: false,
        options: [
          { value: 'macho', label: 'Macho' },
          { value: 'hembra', label: 'Hembra' }
        ]
      },
      {
        name: 'use',
        label: 'Uso',
        type: 'select',
        required: false,
        options: [
          { value: 'trabajo', label: 'Trabajo de campo' },
          { value: 'deporte', label: 'Deporte' },
          { value: 'recreacion', label: 'Recreación' },
          { value: 'cria', label: 'Cría' }
        ]
      }
    ],
    porcinos: [
      {
        name: 'system',
        label: 'Sistema',
        type: 'select',
        required: false,
        options: [
          { value: 'cria', label: 'Cría' },
          { value: 'engorde', label: 'Engorde' },
          { value: 'lechon', label: 'Lechón' }
        ]
      }
    ],
    aves: [
      {
        name: 'bird_type',
        label: 'Tipo de ave',
        type: 'select',
        required: false,
        options: [
          { value: 'gallina', label: 'Gallina ponedora' },
          { value: 'pollo', label: 'Pollo parrillero' },
          { value: 'pato', label: 'Pato' },
          { value: 'ganso', label: 'Ganso' },
          { value: 'otro', label: 'Otro' }
        ]
      }
    ]
  }
};

// =====================================================
// INSUMOS
// =====================================================
export const INSUMOS_CONFIG: CategoryFieldsConfig = {
  commonFields: [
    {
      name: 'input_type',
      label: 'Tipo de insumo',
      type: 'select',
      required: true,
      options: [] // Se llenará desde subcategorías
    },
    {
      name: 'brand',
      label: 'Marca',
      type: 'text',
      required: false,
      placeholder: 'Marca del producto'
    },
    {
      name: 'quantity',
      label: 'Cantidad / Presentación',
      type: 'text',
      required: false,
      placeholder: 'Ej: 20 litros, Bolsa de 50kg'
    }
  ],
  subcategoryFields: {
    semillas: [
      {
        name: 'crop',
        label: 'Cultivo',
        type: 'select',
        required: true,
        options: [
          { value: 'soja', label: 'Soja' },
          { value: 'maiz', label: 'Maíz' },
          { value: 'trigo', label: 'Trigo' },
          { value: 'girasol', label: 'Girasol' },
          { value: 'sorgo', label: 'Sorgo' },
          { value: 'alfalfa', label: 'Alfalfa' },
          { value: 'otro', label: 'Otro' }
        ]
      },
      {
        name: 'variety',
        label: 'Variedad',
        type: 'text',
        required: false,
        placeholder: 'Ej: DM 4670, ACA 315'
      }
    ],
    agroquimicos: [
      {
        name: 'chemical_type',
        label: 'Tipo',
        type: 'select',
        required: false,
        options: [
          { value: 'herbicida', label: 'Herbicida' },
          { value: 'insecticida', label: 'Insecticida' },
          { value: 'fungicida', label: 'Fungicida' },
          { value: 'acaricida', label: 'Acaricida' },
          { value: 'otro', label: 'Otro' }
        ]
      },
      {
        name: 'presentation',
        label: 'Presentación',
        type: 'text',
        required: false,
        placeholder: 'Ej: Bidón 20L, Bolsa 1kg'
      }
    ],
    sanidad_animal: [
      {
        name: 'use',
        label: 'Uso',
        type: 'select',
        required: false,
        options: [
          { value: 'vacuna', label: 'Vacuna' },
          { value: 'antiparasitario', label: 'Antiparasitario' },
          { value: 'antibiotico', label: 'Antibiótico' },
          { value: 'vitamina', label: 'Vitamina/Suplemento' },
          { value: 'otro', label: 'Otro' }
        ]
      },
      {
        name: 'target_species',
        label: 'Especie',
        type: 'select',
        required: false,
        options: [
          { value: 'bovinos', label: 'Bovinos' },
          { value: 'ovinos', label: 'Ovinos' },
          { value: 'equinos', label: 'Equinos' },
          { value: 'porcinos', label: 'Porcinos' },
          { value: 'aves', label: 'Aves' },
          { value: 'multiple', label: 'Múltiple' }
        ]
      }
    ]
  }
};

// =====================================================
// INMUEBLES RURALES
// =====================================================
export const INMUEBLES_CONFIG: CategoryFieldsConfig = {
  commonFields: [
    {
      name: 'surface',
      label: 'Superficie',
      type: 'number',
      required: true,
      placeholder: '100',
      unit: 'hectáreas'
    },
    {
      name: 'operation_type',
      label: 'Tipo de operación',
      type: 'select',
      required: true,
      options: [
        { value: 'venta', label: 'Venta' },
        { value: 'alquiler', label: 'Alquiler' }
      ]
    }
  ],
  subcategoryFields: {
    campos_venta: [
      {
        name: 'aptitude',
        label: 'Aptitud',
        type: 'select',
        required: true,
        options: [
          { value: 'agricola', label: 'Agrícola' },
          { value: 'ganadero', label: 'Ganadero' },
          { value: 'mixto', label: 'Mixto' }
        ]
      },
      {
        name: 'improvements',
        label: 'Mejoras',
        type: 'select',
        required: false,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' }
        ]
      },
      {
        name: 'improvements_detail',
        label: 'Detalle de mejoras',
        type: 'textarea',
        required: false,
        placeholder: 'Galpones, aguadas, alambrados, casa, etc.'
      }
    ],
    campos_alquiler: [
      {
        name: 'aptitude',
        label: 'Aptitud',
        type: 'select',
        required: true,
        options: [
          { value: 'agricola', label: 'Agrícola' },
          { value: 'ganadero', label: 'Ganadero' },
          { value: 'mixto', label: 'Mixto' }
        ]
      }
    ],
    chacras: [
      {
        name: 'services',
        label: 'Servicios',
        type: 'text',
        required: false,
        placeholder: 'Luz, agua, gas, etc.'
      },
      {
        name: 'has_house',
        label: 'Vivienda',
        type: 'select',
        required: false,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' }
        ]
      }
    ],
    quintas: [
      {
        name: 'services',
        label: 'Servicios',
        type: 'text',
        required: false,
        placeholder: 'Luz, agua, gas, etc.'
      },
      {
        name: 'has_house',
        label: 'Vivienda',
        type: 'select',
        required: false,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' }
        ]
      }
    ]
  }
};

// =====================================================
// GUÍA DEL CAMPO
// =====================================================
export const GUIA_CAMPO_CONFIG: CategoryFieldsConfig = {
  commonFields: [
    {
      name: 'business_name',
      label: 'Nombre o razón social',
      type: 'text',
      required: true,
      placeholder: 'Nombre del profesional o empresa'
    },
    {
      name: 'main_activity',
      label: 'Actividad principal',
      type: 'text',
      required: true,
      placeholder: 'Descripción de la actividad'
    },
    {
      name: 'work_zone',
      label: 'Zona de trabajo',
      type: 'text',
      required: true,
      placeholder: 'Ciudades, provincias o regiones'
    },
    {
      name: 'website',
      label: 'Web / Redes sociales',
      type: 'url',
      required: false,
      placeholder: 'https://ejemplo.com'
    }
  ],
  subcategoryFields: {
    productores: [],
    contratistas: [],
    veterinarios: [
      {
        name: 'license',
        label: 'Matrícula',
        type: 'text',
        required: false,
        placeholder: 'Número de matrícula profesional'
      }
    ],
    ingenieros_agronomos: [
      {
        name: 'license',
        label: 'Matrícula',
        type: 'text',
        required: false,
        placeholder: 'Número de matrícula profesional'
      }
    ],
    consignatarios: [
      {
        name: 'years_active',
        label: 'Años de actividad',
        type: 'number',
        required: false,
        placeholder: '15',
        min: 0
      }
    ],
    cabanas: [
      {
        name: 'years_active',
        label: 'Años de actividad',
        type: 'number',
        required: false,
        placeholder: '20',
        min: 0
      }
    ],
    casas_insumos: [
      {
        name: 'years_active',
        label: 'Años de actividad',
        type: 'number',
        required: false,
        placeholder: '10',
        min: 0
      }
    ],
    talleres_rurales: [
      {
        name: 'years_active',
        label: 'Años de actividad',
        type: 'number',
        required: false,
        placeholder: '8',
        min: 0
      }
    ],
    transporte_rural: [
      {
        name: 'years_active',
        label: 'Años de actividad',
        type: 'number',
        required: false,
        placeholder: '12',
        min: 0
      }
    ],
    servicios_rurales: [
      {
        name: 'years_active',
        label: 'Años de actividad',
        type: 'number',
        required: false,
        placeholder: '5',
        min: 0
      }
    ]
  }
};

// =====================================================
// MAPEO PRINCIPAL: CATEGORÍA → CONFIGURACIÓN
// =====================================================
export const CATEGORY_CONFIGS: Record<string, CategoryFieldsConfig> = {
  maquinarias: MAQUINARIAS_CONFIG,
  ganaderia: GANADERIA_CONFIG,
  insumos: INSUMOS_CONFIG,
  inmuebles_rurales: INMUEBLES_CONFIG,
  guia_campo: GUIA_CAMPO_CONFIG
};

/**
 * Obtiene los campos que se deben mostrar para una categoría y subcategoría específica
 */
export function getFieldsForAd(categoryName: string, subcategoryName?: string): FieldConfig[] {
  const config = CATEGORY_CONFIGS[categoryName];
  if (!config) return UNIVERSAL_FIELDS;

  let fields = [...UNIVERSAL_FIELDS, ...config.commonFields];

  if (subcategoryName && config.subcategoryFields[subcategoryName]) {
    fields = [...fields, ...config.subcategoryFields[subcategoryName]];
  }

  return fields;
}

/**
 * Valida que los campos requeridos estén completos
 */
export function validateAdFields(
  data: Record<string, any>,
  categoryName: string,
  subcategoryName?: string
): { isValid: boolean; errors: string[] } {
  const fields = getFieldsForAd(categoryName, subcategoryName);
  const errors: string[] = [];

  fields.forEach(field => {
    if (field.required && !data[field.name]) {
      errors.push(`El campo "${field.label}" es obligatorio`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
