/**
 * Configuración de Prompts por Categoría
 * 
 * ARQUITECTURA FUTURA:
 * - Estos prompts se moverán a la base de datos (tabla: ai_prompt_templates)
 * - El superadmin podrá editarlos desde un panel
 * - Sistema de versionado para rollback
 * - A/B testing de prompts
 * 
 * Por ahora están hardcodeados para arrancar rápido.
 */

export interface CategoryPromptConfig {
  category: string;
  subcategory?: string;
  requiredFields: string[];
  optionalFields: string[];
  titlePrompt: string;
  descriptionPrompt: string;
  examples: {
    title: string[];
    description: string[];
  };
}

// ============================================================
// MAQUINARIAS
// ============================================================

export const MAQUINARIAS_PROMPTS: Record<string, CategoryPromptConfig> = {
  default: {
    category: 'maquinarias',
    requiredFields: ['marca', 'modelo'],
    optionalFields: ['anio', 'estado', 'potencia_hp', 'horas_uso', 'traccion', 'provincia'],
    titlePrompt: `Sos un experto en marketing de maquinaria agrícola en Argentina.

TAREA: Generar 5 títulos atractivos y profesionales para un aviso de venta.

DATOS DEL AVISO:
{adData}

REQUISITOS:
- Máximo 80 caracteres
- Incluir marca, modelo y año si están disponibles
- Mencionar características destacadas (potencia, horas, tracción)
- Usar lenguaje persuasivo pero profesional
- Adaptarse al mercado argentino
- Si falta algún dato, improvisá con lo disponible

EJEMPLOS DE BUEN ESTILO:
- "John Deere 6150R 2018 - 150HP 4x4 - 2.500hs"
- "Tractor New Holland TM7040 - Impecable - Financio"
- "Cosechadora Case IH 2388 - Plataforma 30' - Lista"

RETORNÁ SOLO los 5 títulos, uno por línea, sin numeración.`,

    descriptionPrompt: `Sos un experto redactor de avisos de maquinaria agrícola en Argentina.

TAREA: Generar 3 descripciones atractivas y completas para un aviso de venta.

DATOS DEL AVISO:
{adData}

REQUISITOS:
- Entre 150-300 palabras
- Estructura: Intro + Especificaciones + Estado/Mantenimiento + Ubicación + Cierre persuasivo
- Tono profesional pero cercano
- Destacar valor y beneficios, no solo specs técnicas
- Mencionar ubicación si está disponible
- Call to action al final
- Si falta algún dato, escribí igual con lo disponible

EJEMPLOS DE BUEN ESTILO:
"Vendo tractor John Deere 6150R año 2018 en excelente estado. Motor de 150HP con transmisión PowerShift y tracción 4x4. Solo 2.500 horas de uso reales, siempre guardado bajo techo.

Mantenimiento al día con service completo realizado hace 200hs. Incluye cabina climatizada, suspensión neumática y TLS (bloqueo automático del diferencial). Toda la documentación en regla.

Ubicado en zona rural de Pergamino, Buenos Aires. Precio competitivo, acepto permuta por pickup o maquinaria menor. Facilidades de pago para compradores serios.

Consultá sin compromiso, respondo por WhatsApp. Vendo por renovación de flota."

RETORNÁ SOLO las 3 descripciones, separadas por "---".`,

    examples: {
      title: [
        'John Deere 7530 Premium 2010 - 180HP - Excelente',
        'Tractor Valtra BH180 - 4x4 Doble Tracción - Como Nuevo',
        'New Holland TM150 2008 - Impecable - 3.200hs',
      ],
      description: [
        'Vendo tractor John Deere 7530 Premium año 2010 en excelente estado general...',
      ],
    },
  },

  tractores: {
    category: 'maquinarias',
    subcategory: 'tractores',
    requiredFields: ['marca', 'modelo'],
    optionalFields: ['anio', 'potencia_hp', 'traccion', 'horas_uso', 'cabina', 'estado'],
    titlePrompt: `Sos un especialista en venta de tractores agrícolas en Argentina.

DATOS:
{adData}

Generá 5 títulos comerciales para este tractor. Máximo 80 caracteres. Incluí potencia, tracción y año. Si falta algún dato, usá lo disponible.

Ejemplos:
- "Tractor 180HP 4x4 - John Deere 7530 - 2010"
- "New Holland TM150 Doble Tracción - Impecable"
- "Valtra BH180 - Cabina Original - Solo 2.800hs"

SOLO los 5 títulos, sin numeración:`,

    descriptionPrompt: `Redactá 3 descripciones de venta para este tractor:

{adData}

Estructura:
1. Intro con marca, modelo y año
2. Potencia, tracción y características técnicas
3. Estado general y horas de uso
4. Mantenimiento y documentación
5. Ubicación y condiciones de venta

150-250 palabras cada una. Tono profesional. Si falta info, escribí igual.

Separalas con "---":`,

    examples: {
      title: ['Tractor John Deere 180HP - 4x4 - Excelente Estado'],
      description: ['Vendo tractor...'],
    },
  },

  cosechadoras: {
    category: 'maquinarias',
    subcategory: 'cosechadoras',
    requiredFields: ['marca', 'modelo'],
    optionalFields: ['anio', 'horas_uso', 'ancho_plataforma', 'tipo_cosechadora'],
    titlePrompt: `Especialista en cosechadoras. Generá 5 títulos de venta (80 chars max):

{adData}

Destacá: marca, modelo, año, horas, ancho de plataforma. Usá lo disponible.

Ejemplos:
- "Case IH 2388 Axial - Plataforma 30' - 2.100hs"
- "Cosechadora John Deere 9650 STS - Impecable"
- "New Holland CR9090 - Piloto Auto - Como Nueva"

SOLO títulos:`,

    descriptionPrompt: `3 descripciones de venta para cosechadora:

{adData}

Incluí: tipo (axial/convencional), capacidad de tolva, ancho plataforma, horas, mantenimiento, estado.

150-250 palabras c/u. Separadas con "---":`,

    examples: {
      title: [],
      description: [],
    },
  },
};

// ============================================================
// GANADERÍA
// ============================================================

export const GANADERIA_PROMPTS: Record<string, CategoryPromptConfig> = {
  default: {
    category: 'ganaderia',
    requiredFields: ['species', 'quantity'],
    optionalFields: ['category', 'breed', 'weight', 'age', 'sex', 'status', 'provincia'],
    titlePrompt: `Sos un experto ganadero y comercializador de hacienda en Argentina.

TAREA: Generar 5 títulos atractivos para un aviso de venta de ganado.

DATOS DEL AVISO:
{adData}

REQUISITOS:
- Máximo 80 caracteres
- Incluir cantidad, categoría (ternero/vaca/novillo), raza y peso
- Mencionar provincia si está disponible
- Usar terminología ganadera correcta
- Si falta algún dato, usá lo disponible

EJEMPLOS DE BUEN ESTILO:
- "50 Terneros Angus 200kg - Excelente Genética"
- "20 Vacas Hereford Preñadas - Buenos Aires"
- "Lote 100 Novillos 450kg - Para Faena"
- "15 Vaquillonas Braford 1ra Parición - Tandil"

RETORNÁ SOLO los 5 títulos, uno por línea, sin numeración.`,

    descriptionPrompt: `Sos un redactor especializado en avisos ganaderos en Argentina.

TAREA: Generar 3 descripciones completas para un aviso de venta de hacienda.

DATOS DEL AVISO:
{adData}

REQUISITOS:
- Entre 100-200 palabras
- Estructura: Cantidad y categoría + Raza y genética + Peso/edad + Estado sanitario + Ubicación + Condiciones de venta
- Usar terminología ganadera profesional
- Mencionar si están aptos RENSPA, vacunados, etc.
- Call to action al final
- Si falta info, escribí igual con lo disponible

EJEMPLOS DE BUEN ESTILO:
"Vendo lote de 50 terneros machos Aberdeen Angus de excelente genética. Peso promedio 200kg, todos destetados y acostumbrados a comedero. Nacidos en primavera 2024.

Hacienda sana, vacunada completa según calendario oficial (aftosa, carbunclo, clostridiosis). Aptos para RENSPA. Criados a campo en establecimiento libre de brucelosis y tuberculosis.

Ubicados en zona rural de 25 de Mayo, provincia de Buenos Aires. Entrega inmediata. Acepto seña y facilidades de pago para compradores serios. 

Precio por cabeza. Posibilidad de ver la hacienda con cita previa. Consulte sin compromiso."

RETORNÁ SOLO las 3 descripciones, separadas por "---".`,

    examples: {
      title: [
        '80 Terneros Angus 180kg - Destetados - La Pampa',
        'Vacas CUT Preñadas - Hereford - Excelente Estado',
        '50 Novillos 420kg - Para Faena Inmediata',
      ],
      description: ['Vendo lote de...'],
    },
  },

  bovinos: {
    category: 'ganaderia',
    subcategory: 'bovinos',
    requiredFields: ['quantity', 'category'],
    optionalFields: ['breed', 'weight', 'status'],
    titlePrompt: `Especialista en bovinos. Generá 5 títulos (80 chars max):

{adData}

Incluí: cantidad, categoría (ternero/novillo/vaca/vaquillona/toro), raza, peso.

Ejemplos:
- "100 Novillos Angus 450kg - Gordos Para Faena"
- "20 Vaquillonas Hereford - 1ra Parición"
- "Toro Angus Puro - Excelente Genética"

SOLO títulos:`,

    descriptionPrompt: `3 descripciones para bovinos:

{adData}

Incluí: categoría, cantidad, raza, peso, estado sanitario, genética, ubicación.

100-200 palabras c/u. Separadas con "---":`,

    examples: {
      title: [],
      description: [],
    },
  },

  equinos: {
    category: 'ganaderia',
    subcategory: 'equinos',
    requiredFields: ['quantity'],
    optionalFields: ['breed', 'age', 'sex', 'use'],
    titlePrompt: `Especialista en equinos. Generá 5 títulos (80 chars max):

{adData}

Incluí: raza, edad, sexo, uso (trabajo/deporte/cría).

Ejemplos:
- "Caballo Cuarto de Milla - 5 Años - Doma Completa"
- "Yegua Criolla - Para Cría - Excelente Genealogía"
- "Potrillo Pura Sangre - 2 Años - Gran Potencial"

SOLO títulos:`,

    descriptionPrompt: `3 descripciones para equinos:

{adData}

Incluí: raza, edad, sexo, aptitud, carácter, estado de doma, ubicación.

100-200 palabras c/u. Separadas con "---":`,

    examples: {
      title: [],
      description: [],
    },
  },
};

// ============================================================
// INSUMOS
// ============================================================

export const INSUMOS_PROMPTS: Record<string, CategoryPromptConfig> = {
  default: {
    category: 'insumos',
    requiredFields: ['input_type', 'brand'],
    optionalFields: ['quantity', 'crop', 'chemical_type', 'variety', 'presentation'],
    titlePrompt: `Sos un especialista en comercialización de insumos agropecuarios en Argentina.

TAREA: Generar 5 títulos atractivos para un aviso de venta.

DATOS DEL AVISO:
{adData}

REQUISITOS:
- Máximo 80 caracteres
- Incluir marca, tipo de insumo y cantidad/presentación
- Mencionar cultivo o uso si aplica
- Destacar si es precio mayorista, lote cerrado, etc.
- Si falta algún dato, usá lo disponible

EJEMPLOS DE BUEN ESTILO:
- "Semilla de Soja DM4670 - Bolsa de 40kg - Certificada"
- "Glifosato 50L - Marca Líder - Precio Mayorista"
- "Fertilizante NPK 20-10-10 - Pallet Completo"
- "Vacuna Antiaftosa - Caja x100 Dosis - Vto 2025"

RETORNÁ SOLO los 5 títulos, uno por línea, sin numeración.`,

    descriptionPrompt: `Sos redactor especializado en insumos agropecuarios.

TAREA: Generar 3 descripciones para un aviso de venta.

DATOS DEL AVISO:
{adData}

REQUISITOS:
- Entre 100-150 palabras
- Estructura: Producto y marca + Presentación/cantidad + Características + Precio/condiciones + Contacto
- Mencionar si tiene registros SENASA, certificaciones, etc.
- Si falta info, escribí igual con lo disponible

EJEMPLOS:
"Vendo semilla de soja DM4670 certificada, bolsas de 40kg sin abrir. Variedad de ciclo corto, ideal para siembra en diciembre. Excelente comportamiento en zona núcleo.

Lote completo: 50 bolsas (2.000kg). Almacenadas en condiciones óptimas, con certificado de calidad y análisis de germinación vigente. Vencimiento para siembra: octubre 2025.

Precio por bolsa o lote completo con descuento. Ubicado en Pergamino, Buenos Aires. Entrega inmediata. Acepto transferencia o efectivo.

Consulte sin compromiso por WhatsApp."

RETORNÁ SOLO las 3 descripciones, separadas por "---".`,

    examples: {
      title: [
        'Semilla Maíz ACA 417 - Bolsa x25kg - Híbrido',
        'Herbicida 2,4-D - 20 Litros - Registrado SENASA',
        'Urea Granulada - Big Bag 1000kg - Entrega Inmediata',
      ],
      description: [],
    },
  },

  semillas: {
    category: 'insumos',
    subcategory: 'semillas',
    requiredFields: ['brand', 'crop'],
    optionalFields: ['variety', 'quantity'],
    titlePrompt: `Especialista en semillas. Generá 5 títulos (80 chars max):

{adData}

Incluí: cultivo, marca/variedad, cantidad, certificación.

Ejemplos:
- "Semilla Soja DM4670 - 50 Bolsas - Certificada"
- "Maíz Híbrido ACA 417 - Bolsa x25kg - Tratado"
- "Trigo Klein Serpiente - Lote Cerrado 2.000kg"

SOLO títulos:`,

    descriptionPrompt: `3 descripciones para semillas:

{adData}

Incluí: cultivo, variedad, certificación, germinación, cantidad, almacenamiento, vencimiento.

100-150 palabras c/u. Separadas con "---":`,

    examples: {
      title: [],
      description: [],
    },
  },

  agroquimicos: {
    category: 'insumos',
    subcategory: 'agroquimicos',
    requiredFields: ['brand', 'chemical_type'],
    optionalFields: ['presentation', 'quantity'],
    titlePrompt: `Especialista en agroquímicos. Generá 5 títulos (80 chars max):

{adData}

Incluí: tipo (herbicida/insecticida/fungicida), marca, presentación, registro.

Ejemplos:
- "Glifosato 48% - Bidón 20L - Registrado SENASA"
- "Herbicida 2,4-D - Marca Líder - Precio Mayorista"
- "Insecticida Cipermetrina - Lote x100L"

SOLO títulos:`,

    descriptionPrompt: `3 descripciones para agroquímicos:

{adData}

Incluí: principio activo, marca, registro SENASA, dosis, cultivos, presentación, almacenamiento.

100-150 palabras c/u. Separadas con "---":`,

    examples: {
      title: [],
      description: [],
    },
  },
};

// ============================================================
// FUNCIÓN HELPER PARA OBTENER CONFIGURACIÓN
// ============================================================

export function getPromptConfig(
  category: string,
  subcategory?: string
): CategoryPromptConfig {
  let config: CategoryPromptConfig | undefined;

  // Buscar configuración específica
  if (category === 'maquinarias') {
    config = subcategory ? MAQUINARIAS_PROMPTS[subcategory] : undefined;
    if (!config) config = MAQUINARIAS_PROMPTS.default;
  } else if (category === 'ganaderia') {
    config = subcategory ? GANADERIA_PROMPTS[subcategory] : undefined;
    if (!config) config = GANADERIA_PROMPTS.default;
  } else if (category === 'insumos') {
    config = subcategory ? INSUMOS_PROMPTS[subcategory] : undefined;
    if (!config) config = INSUMOS_PROMPTS.default;
  }

  // Fallback genérico
  if (!config) {
    config = {
      category,
      subcategory,
      requiredFields: [],
      optionalFields: [],
      titlePrompt: 'Generá 5 títulos atractivos para este aviso:\n\n{adData}\n\nMáximo 80 caracteres cada uno.',
      descriptionPrompt: 'Generá 3 descripciones completas para este aviso:\n\n{adData}\n\n150-250 palabras cada una. Separadas por "---".',
      examples: { title: [], description: [] },
    };
  }

  return config;
}
