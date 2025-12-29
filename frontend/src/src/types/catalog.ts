// =====================================================
// TIPOS DEL SISTEMA DE CATÁLOGO MAESTRO
// =====================================================

export interface Category {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  ml_keywords?: string[];
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  slug: string;
  icon?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  has_brands: boolean;
  has_models: boolean;
  has_year: boolean;
  has_condition: boolean;
  ml_keywords?: string[];
  created_at: string;
  updated_at: string;
  
  // Relaciones (opcionales)
  category?: Category;
  brands?: Brand[];
}

export interface Brand {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  country?: string;
  is_active: boolean;
  ml_aliases?: string[];
  sort_order?: number;
  created_at: string;
  updated_at: string;
  
  // Relaciones (opcionales)
  models?: Model[];
}

export interface Model {
  id: string;
  brand_id: string;
  name: string;
  display_name: string;
  slug: string;
  year_from?: number;
  year_to?: number;
  is_current_production: boolean;
  specifications: ModelSpecifications;
  features?: string[];
  typical_uses?: string[];
  short_description?: string;
  full_description?: string;
  main_image_url?: string;
  gallery_images?: string[];
  technical_drawing_url?: string;
  brochure_url?: string;
  manual_url?: string;
  spec_sheet_url?: string;
  price_range?: {
    min_usd?: number;
    max_usd?: number;
    currency?: string;
  };
  related_models?: string[];
  ai_generated: boolean;
  ai_confidence?: number;
  ai_source?: string;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  ml_aliases?: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relaciones (opcionales)
  brand?: Brand;
}

// Especificaciones del modelo (JSONB)
export interface ModelSpecifications {
  motor?: {
    marca?: string;
    modelo?: string;
    tipo?: string;
    cilindros?: number;
    cilindrada_litros?: number;
    potencia_hp_nominal?: number;
    potencia_hp_maxima?: number;
    potencia_kw_nominal?: number;
    torque_nm?: number;
    rpm_nominal?: number;
    combustible?: string;
    norma_emisiones?: string;
    enfriamiento?: string;
  };
  
  transmision?: {
    tipo?: string;
    nombre_comercial?: string;
    velocidades_adelante?: number;
    velocidades_reversa?: number;
    reversor?: string;
    velocidad_maxima_kmh?: number;
    toma_fuerza_disponible?: boolean;
    rpm_toma_fuerza?: number[];
    tipo_toma_fuerza?: string;
  };
  
  hidraulica?: {
    tipo_bomba?: string;
    caudal_litros_min?: number;
    presion_bar?: number;
    elevacion_posterior_kg?: number;
    elevacion_frontal_kg?: number;
    salidas_remotas_posteriores?: number;
    salidas_remotas_frontales?: number;
    control?: string;
  };
  
  dimensiones?: {
    longitud_mm?: number;
    ancho_mm?: number;
    altura_mm?: number;
    distancia_entre_ejes_mm?: number;
    despeje_suelo_mm?: number;
    peso_operativo_kg?: number;
    peso_maximo_admisible_kg?: number;
    capacidad_combustible_litros?: number;
    radio_giro_minimo_m?: number;
  };
  
  neumaticos?: {
    delanteros_estandar?: string;
    traseros_estandar?: string;
    opciones_delanteros?: string[];
    opciones_traseros?: string[];
  };
  
  cabina?: {
    tipo?: string;
    aire_acondicionado?: boolean;
    calefaccion?: boolean;
    asiento_suspension_neumatica?: boolean;
    radio_bluetooth?: boolean;
    techo_panoramico?: boolean;
    visibilidad_grados?: number;
  };
  
  electronica?: {
    monitor?: string;
    gps_ready?: boolean;
    autoguiado_compatible?: boolean;
    control_crucero?: boolean;
    diagnostic_system?: string;
  };
  
  enganche?: {
    tipo_posterior?: string;
    tipo_frontal_opcional?: string;
    puntos_posteriores?: number;
    estabilizadores?: string;
  };
  
  aplicaciones?: string[];
  caracteristicas_destacadas?: string[];
  
  mantenimiento?: {
    intervalo_aceite_motor_hs?: number;
    intervalo_filtro_aceite_hs?: number;
    intervalo_filtro_aire_hs?: number;
    intervalo_filtro_combustible_hs?: number;
    intervalo_transmision_hs?: number;
    garantia_meses?: number;
    garantia_horas?: number;
  };
  
  comercial?: {
    precio_referencia_usd?: number;
    disponibilidad_argentina?: boolean;
    fabricacion?: string;
    segmento?: string;
    competidores_directos?: string[];
  };
  
  // Permite cualquier otra propiedad adicional
  [key: string]: any;
}

// =====================================================
// TIPOS PARA RESPUESTAS DE API
// =====================================================

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export interface SubcategoryWithBrands extends Subcategory {
  brands: Brand[];
}

export interface BrandWithModels extends Brand {
  models: Model[];
}

// =====================================================
// TIPOS PARA FORMULARIOS
// =====================================================

export interface CatalogFormSelection {
  category?: Category;
  subcategory?: Subcategory;
  brand?: Brand;
  model?: Model;
}

export interface AdFormData {
  // Catálogo
  category_id?: string;
  subcategory_id?: string;
  brand_id?: string;
  model_id?: string;
  
  // Detalles básicos
  title: string;
  description: string;
  price?: number;
  currency?: string;
  
  // Condicionales según subcategoría
  year?: number;
  condition?: 'nuevo' | 'usado' | 'reacondicionado';
  hours?: number;
  
  // Ubicación
  location?: string;
  province?: string;
  
  // Contacto
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  
  // Imágenes
  images?: string[];
  
  // Campos dinámicos adicionales
  dynamic_fields?: Record<string, any>;
}
