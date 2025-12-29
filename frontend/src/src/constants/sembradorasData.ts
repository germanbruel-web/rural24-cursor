// Taxonomía completa de Sembradoras
// Organizado por: Tipo → Marca → Modelos

export interface SembradoraBrandModel {
  marca: string;
  modelos: string[];
}

export interface SembradoraTipo {
  tipo: string;
  marcas: SembradoraBrandModel[];
}

export const SEMBRADORAS_TIPOS = [
  'De grano grueso',
  'De grano fino',
  'Combinadas',
  'De pasturas',
  'De cobertura'
] as const;

export const SEMBRADORAS_DATA: Record<string, SembradoraBrandModel[]> = {
  'De grano grueso': [
    {
      marca: 'Agrometal',
      modelos: ['TX Mega II', 'TX Pivot', 'Mini Mega', 'MSX', 'Otro']
    },
    {
      marca: 'Crucianelli',
      modelos: ['Gringa', 'Plantor', 'Otro']
    },
    {
      marca: 'Fercam',
      modelos: ['G350', 'G420', 'CP', 'Otro']
    },
    {
      marca: 'Pierobon',
      modelos: ['Multimix', 'Otro']
    },
    {
      marca: 'PLA',
      modelos: ['STP G22', 'STP G15', 'Otro']
    },
    {
      marca: 'Apache',
      modelos: ['27000', '6120', '315', 'Otro']
    },
    {
      marca: 'Erca',
      modelos: ['Serie III G', 'Serie V G', 'Serie VI G', 'Otro']
    },
    {
      marca: 'Super Walter',
      modelos: ['W650', 'Otro']
    },
    {
      marca: 'Bertini',
      modelos: ['30000', '50mil', 'Otro']
    },
    {
      marca: 'Monumental',
      modelos: ['4600', '5450', '6750', '7250', '8300', 'Otro']
    },
    {
      marca: 'Otra',
      modelos: ['Otro']
    }
  ],
  'De grano fino': [
    {
      marca: 'Agrometal',
      modelos: ['MSX', 'MXY II', 'Otro']
    },
    {
      marca: 'Crucianelli',
      modelos: ['Pionera', 'Otro']
    },
    {
      marca: 'Fercam',
      modelos: ['F440', 'Otro']
    },
    {
      marca: 'Bertini',
      modelos: ['8000', '32000', 'Otro']
    },
    {
      marca: 'Ascanelli',
      modelos: ['RS 4000 Magnum GF', 'Otro']
    },
    {
      marca: 'Gherardi',
      modelos: ['G100', 'G230', 'G240', 'Otro']
    },
    {
      marca: 'Cele',
      modelos: ['Activa II', 'Activa Max', 'Otro']
    },
    {
      marca: 'Tanzi',
      modelos: ['Special 3', 'Otro']
    },
    {
      marca: 'Otra',
      modelos: ['Otro']
    }
  ],
  'Combinadas': [
    {
      marca: 'Fercam',
      modelos: ['F440', 'Otro']
    },
    {
      marca: 'Monumental',
      modelos: ['10000 Air Drill', 'Otro']
    },
    {
      marca: 'Crucianelli',
      modelos: ['Drilor Mixia', 'Otro']
    },
    {
      marca: 'Otra',
      modelos: ['Otro']
    }
  ],
  'De pasturas': [
    {
      marca: 'Fercam',
      modelos: ['F440', 'Otro']
    },
    {
      marca: 'Otra',
      modelos: ['Otro']
    }
  ],
  'De cobertura': [
    {
      marca: 'Otra',
      modelos: ['Otro']
    }
  ]
};

// Helper functions
export const getMarcasForTipo = (tipo: string): string[] => {
  const data = SEMBRADORAS_DATA[tipo];
  if (!data) return [];
  return data.map(item => item.marca);
};

export const getModelosForMarca = (tipo: string, marca: string): string[] => {
  const data = SEMBRADORAS_DATA[tipo];
  if (!data) return [];
  const brandData = data.find(item => item.marca === marca);
  return brandData?.modelos || [];
};

export const getAllMarcasSembradoras = (): string[] => {
  const allMarcas = new Set<string>();
  Object.values(SEMBRADORAS_DATA).forEach(tipos => {
    tipos.forEach(item => {
      allMarcas.add(item.marca);
    });
  });
  return Array.from(allMarcas).sort();
};
