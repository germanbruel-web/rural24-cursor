-- =====================================================
-- SEED DATA: MODELO DE PRUEBA - JOHN DEERE 5075E
-- Fecha: 16 de diciembre, 2025
-- Descripción: Tractor de prueba con ficha técnica completa
-- =====================================================

-- Insertar modelo John Deere 5075E
INSERT INTO models (
  brand_id,
  name,
  display_name,
  slug,
  year_from,
  year_to,
  is_current_production,
  specifications,
  ai_generated,
  ai_confidence,
  ai_source,
  verified,
  is_active
)
SELECT 
  b.id as brand_id,
  '5075E',
  'John Deere 5075E',
  '5075e',
  2014,
  2025,
  true,
  jsonb_build_object(
    -- Motor
    'motor', jsonb_build_object(
      'marca', 'John Deere PowerTech',
      'modelo', 'PowerTech PSS 3029',
      'tipo', '4 cilindros turboalimentado',
      'cilindros', 4,
      'cilindrada_litros', 2.9,
      'potencia_hp_nominal', 75,
      'potencia_hp_maxima', 82,
      'potencia_kw_nominal', 56,
      'torque_nm', 320,
      'rpm_nominal', 2300,
      'combustible', 'Diesel',
      'norma_emisiones', 'Tier 3 / Stage IIIA',
      'enfriamiento', 'Líquido'
    ),
    
    -- Transmisión
    'transmision', jsonb_build_object(
      'tipo', 'Mecánica sincronizada',
      'nombre_comercial', 'PowrReverser',
      'velocidades_adelante', 12,
      'velocidades_reversa', 12,
      'reversor', 'Electro-hidráulico con modulación',
      'velocidad_maxima_kmh', 30,
      'toma_fuerza_disponible', true,
      'rpm_toma_fuerza', ARRAY[540, 1000],
      'tipo_toma_fuerza', 'Independiente electro-hidráulica'
    ),
    
    -- Hidráulica
    'hidraulica', jsonb_build_object(
      'tipo_bomba', 'Caudal constante',
      'caudal_litros_min', 58,
      'presion_bar', 207,
      'elevacion_posterior_kg', 2200,
      'elevacion_frontal_kg', 1250,
      'salidas_remotas_posteriores', 2,
      'salidas_remotas_frontales', 1,
      'control', 'Mecánico con posición y esfuerzo'
    ),
    
    -- Dimensiones y Pesos
    'dimensiones', jsonb_build_object(
      'longitud_mm', 3840,
      'ancho_mm', 2030,
      'altura_mm', 2640,
      'distancia_entre_ejes_mm', 2160,
      'despeje_suelo_mm', 430,
      'peso_operativo_kg', 3100,
      'peso_maximo_admisible_kg', 5600,
      'capacidad_combustible_litros', 92,
      'radio_giro_minimo_m', 3.8
    ),
    
    -- Neumáticos estándar
    'neumaticos', jsonb_build_object(
      'delanteros_estandar', '9.5-24',
      'traseros_estandar', '16.9-30',
      'opciones_delanteros', ARRAY['9.5-24', '11.2-24'],
      'opciones_traseros', ARRAY['13.6-38', '16.9-30', '18.4-30']
    ),
    
    -- Cabina y confort
    'cabina', jsonb_build_object(
      'tipo', 'Cabina Premium con suspensión',
      'aire_acondicionado', true,
      'calefaccion', true,
      'asiento_suspension_neumatica', true,
      'radio_bluetooth', true,
      'techo_panoramico', true,
      'visibilidad_grados', 360
    ),
    
    -- Sistemas electrónicos
    'electronica', jsonb_build_object(
      'monitor', 'CornerPost Premium',
      'gps_ready', true,
      'autoguiado_compatible', true,
      'control_crucero', true,
      'diagnostic_system', 'Service ADVISOR Remote'
    ),
    
    -- Enganche
    'enganche', jsonb_build_object(
      'tipo_posterior', 'Categoría II',
      'tipo_frontal_opcional', 'Categoría II',
      'puntos_posteriores', 3,
      'estabilizadores', 'Ajustables externos'
    ),
    
    -- Aplicaciones recomendadas
    'aplicaciones', ARRAY[
      'Agricultura general',
      'Trabajo con implementos medianos',
      'Siembra de precisión',
      'Pulverización',
      'Transporte con acoplado',
      'Trabajo de corral'
    ],
    
    -- Características destacadas
    'caracteristicas_destacadas', ARRAY[
      'Reversor electro-hidráulico modulado',
      'Motor turboalimentado de bajo consumo',
      'Excelente visibilidad 360°',
      'Bajo costo de mantenimiento',
      'Compatible con agricultura de precisión',
      'Cabina con suspensión de serie'
    ],
    
    -- Mantenimiento
    'mantenimiento', jsonb_build_object(
      'intervalo_aceite_motor_hs', 500,
      'intervalo_filtro_aceite_hs', 500,
      'intervalo_filtro_aire_hs', 600,
      'intervalo_filtro_combustible_hs', 600,
      'intervalo_transmision_hs', 1200,
      'garantia_meses', 24,
      'garantia_horas', 2000
    ),
    
    -- Datos comerciales
    'comercial', jsonb_build_object(
      'precio_referencia_usd', 45000,
      'disponibilidad_argentina', true,
      'fabricacion', 'India / Argentina (CKD)',
      'segmento', 'Mediano',
      'competidores_directos', ARRAY['Massey Ferguson 4283', 'New Holland TD5.90', 'Case IH Farmall 75A']
    )
  ),
  true, -- ai_generated
  0.95, -- ai_confidence
  'https://www.deere.com.ar/es/tractores/serie-5e/ | Manual del operador JD 5075E', -- ai_source
  true, -- verified (para testing, lo marcamos como verificado)
  true -- is_active
FROM brands b
WHERE b.name = 'john-deere'
ON CONFLICT (brand_id, slug) DO UPDATE
SET 
  specifications = EXCLUDED.specifications,
  updated_at = NOW();

-- =====================================================
-- ✅ VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
  model_count INTEGER;
  model_info RECORD;
BEGIN
  -- Contar modelos
  SELECT COUNT(*) INTO model_count FROM models;
  
  -- Obtener info del modelo creado
  SELECT 
    m.display_name,
    b.display_name as brand,
    m.specifications->>'motor' IS NOT NULL as tiene_motor,
    m.specifications->>'transmision' IS NOT NULL as tiene_transmision,
    m.specifications->>'hidraulica' IS NOT NULL as tiene_hidraulica,
    m.year_from || '-' || m.year_to as years
  INTO model_info
  FROM models m
  JOIN brands b ON b.id = m.brand_id
  WHERE m.name = '5075E'
  LIMIT 1;
  
  RAISE NOTICE '✅ Modelo de prueba creado exitosamente';
  RAISE NOTICE '📊 Total modelos en BD: %', model_count;
  RAISE NOTICE '';
  RAISE NOTICE '🚜 Modelo: %', model_info.display_name;
  RAISE NOTICE '🏷️  Marca: %', model_info.brand;
  RAISE NOTICE '📅 Años: %', model_info.years;
  RAISE NOTICE '✓ Motor: %', model_info.tiene_motor;
  RAISE NOTICE '✓ Transmisión: %', model_info.tiene_transmision;
  RAISE NOTICE '✓ Hidráulica: %', model_info.tiene_hidraulica;
END $$;

-- Query para ver el modelo completo
SELECT 
  m.display_name,
  b.display_name as marca,
  m.year_from || '-' || m.year_to as años,
  m.specifications->'motor'->>'potencia_hp_nominal' as hp,
  m.specifications->'motor'->>'cilindros' as cilindros,
  m.specifications->'transmision'->>'velocidades_adelante' as marchas,
  m.specifications->'hidraulica'->>'elevacion_posterior_kg' as elevacion_kg,
  m.ai_confidence as confianza_ia,
  m.verified as verificado
FROM models m
JOIN brands b ON b.id = m.brand_id
WHERE m.name = '5075E';
