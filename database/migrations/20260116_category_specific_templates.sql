-- ============================================================================
-- PLANTILLAS ESPECÍFICAS POR CATEGORÍA Y SUBCATEGORÍA
-- ============================================================================
-- Ejecutar después de 20260116_ad_content_templates.sql
-- Fecha: 16 Enero 2026
-- ============================================================================

-- ============================================================================
-- HELPER: Obtener IDs de categorías/subcategorías
-- ============================================================================
-- Primero verificamos los IDs existentes:
-- SELECT id, name FROM categories WHERE name ILIKE '%maquinaria%';
-- SELECT id, name FROM subcategories WHERE name ILIKE '%tractor%';

-- ============================================================================
-- PLANTILLAS PARA TRACTORES
-- ============================================================================

-- Títulos para Tractores
INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Tractor - Completo',
  '{marca} {modelo} {año} - {atributo:potencia} HP - {condicion}',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%tractor%'
ON CONFLICT DO NOTHING;

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Tractor - Con horas',
  '{marca} {modelo} - {atributo:horas_uso} hs - Excelente estado',
  2
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%tractor%'
ON CONFLICT DO NOTHING;

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Tractor - Urgente',
  '¡OPORTUNIDAD! {marca} {modelo} {año} - Listo para trabajar',
  3
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%tractor%'
ON CONFLICT DO NOTHING;

-- Descripciones para Tractores
INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'description', 
  'Tractor - Descripción técnica',
  'Tractor {marca} {modelo} año {año} en excelente estado.

📊 ESPECIFICACIONES TÉCNICAS:
• Potencia: {atributo:potencia} HP
• Horas de uso: {atributo:horas_uso} hs
• Tracción: {atributo:traccion}
• Rodado: {atributo:rodado}

✅ Condición: {condicion}
📍 Ubicación: {localidad}, {provincia}

Motor funcionando perfectamente, cubiertas en buen estado.
Documentación al día, libre de deuda.

💬 Consultá precio y forma de pago.
📞 Respuesta inmediata.',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%tractor%'
ON CONFLICT DO NOTHING;

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'description', 
  'Tractor - Comercial',
  '{marca} {modelo} {año} - La potencia que tu campo necesita.

Este tractor combina rendimiento y durabilidad para los trabajos más exigentes. Con {atributo:potencia} HP de potencia, es ideal para cualquier labor agrícola.

🚜 Listo para trabajar
📄 Papeles al día
💳 Financiación disponible

Ubicación: {localidad}, {provincia}

Consultá condiciones y disponibilidad.',
  2
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%tractor%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLANTILLAS PARA COSECHADORAS
-- ============================================================================

-- Títulos para Cosechadoras
INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Cosechadora - Completo',
  '{marca} {modelo} {año} - Plataforma {atributo:ancho_labor}m - {condicion}',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%cosechadora%'
ON CONFLICT DO NOTHING;

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Cosechadora - Con horas',
  '{marca} {modelo} - {atributo:horas_uso} hs motor - Lista para campaña',
  2
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%cosechadora%'
ON CONFLICT DO NOTHING;

-- Descripciones para Cosechadoras
INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'description', 
  'Cosechadora - Descripción técnica',
  'Cosechadora {marca} {modelo} año {año}.

📊 ESPECIFICACIONES:
• Motor: {atributo:potencia} HP
• Horas motor: {atributo:horas_uso} hs
• Ancho de plataforma: {atributo:ancho_labor} m
• Capacidad tolva: {atributo:capacidad}

✅ Estado: {condicion}
📍 Ubicación: {localidad}, {provincia}

Máquina en excelente estado de funcionamiento.
Lista para comenzar la campaña.

💬 Consultá precio y disponibilidad.
📞 Atención inmediata.',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%cosechadora%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLANTILLAS PARA SEMBRADORAS
-- ============================================================================

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Sembradora - Completo',
  '{marca} {modelo} - {atributo:ancho_labor}m - {condicion}',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%sembradora%'
ON CONFLICT DO NOTHING;

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'description', 
  'Sembradora - Descripción técnica',
  'Sembradora {marca} {modelo} en excelente estado.

📊 CARACTERÍSTICAS:
• Ancho de labor: {atributo:ancho_labor} m
• Distancia entre surcos: según configuración
• Sistema de siembra: directa

✅ Condición: {condicion}
📍 Ubicación: {localidad}, {provincia}

Equipo completo con todos sus accesorios.
Lista para trabajar.

💬 Consultá precio.
📞 Respuesta rápida.',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%sembradora%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLANTILLAS PARA PULVERIZADORAS
-- ============================================================================

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Pulverizadora - Completo',
  '{marca} {modelo} - {atributo:capacidad} lts - Botalón {atributo:ancho_labor}m',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%pulverizadora%'
ON CONFLICT DO NOTHING;

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'description', 
  'Pulverizadora - Descripción técnica',
  'Pulverizadora {marca} {modelo}.

📊 ESPECIFICACIONES:
• Capacidad tanque: {atributo:capacidad} litros
• Ancho de botalón: {atributo:ancho_labor} m
• Sistema de aplicación: alta precisión

✅ Estado: {condicion}
📍 Ubicación: {localidad}, {provincia}

Equipo en perfecto funcionamiento.
Ideal para aplicaciones eficientes.

💬 Consultá precio y financiación.',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%pulverizadora%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLANTILLAS PARA IMPLEMENTOS AGRÍCOLAS
-- ============================================================================

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, s.id, NULL, 'title', 
  'Implemento - Básico',
  '{marca} {modelo} - {atributo:ancho_labor}m - {condicion}',
  1
FROM categories c
JOIN subcategories s ON s.category_id = c.id
WHERE c.name ILIKE '%maquinaria%' AND s.name ILIKE '%implemento%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PLANTILLAS PARA GANADERÍA (si existe la categoría)
-- ============================================================================

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, NULL, NULL, 'title', 
  'Ganadería - General',
  '{subcategoria} {marca} - {condicion} - {provincia}',
  1
FROM categories c
WHERE c.name ILIKE '%ganader%'
ON CONFLICT DO NOTHING;

INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order)
SELECT 
  c.id, NULL, NULL, 'description', 
  'Ganadería - Descripción general',
  '{subcategoria} {marca} {modelo} en excelente estado.

📋 DETALLES:
• Condición: {condicion}
• Marca: {marca}

📍 Ubicación: {localidad}, {provincia}

Producto de calidad, listo para usar.

💬 Consultá disponibilidad y precio.',
  1
FROM categories c
WHERE c.name ILIKE '%ganader%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT 
--   t.name, 
--   t.template_type,
--   c.name as categoria,
--   s.name as subcategoria
-- FROM ad_content_templates t
-- LEFT JOIN categories c ON c.id = t.category_id
-- LEFT JOIN subcategories s ON s.id = t.subcategory_id
-- ORDER BY c.name, s.name, t.template_type, t.sort_order;
