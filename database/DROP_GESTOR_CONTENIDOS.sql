-- ====================================================================
-- ELIMINAR TODO EL SISTEMA DE GESTOR DE CONTENIDOS
-- ====================================================================

-- Eliminar tablas de Maquinarias (sistema de 3 niveles)
DROP TABLE IF EXISTS maquinarias_modelos CASCADE;
DROP TABLE IF EXISTS maquinarias_marcas CASCADE;
DROP TABLE IF EXISTS maquinarias_subcategorias CASCADE;

-- Eliminar tablas de Ganadería (tipos y razas)
DROP TABLE IF EXISTS ganaderia_razas CASCADE;
DROP TABLE IF EXISTS ganaderia_tipos CASCADE;
DROP TABLE IF EXISTS ganaderia_subcategorias CASCADE;

-- Eliminar tablas de Insumos
DROP TABLE IF EXISTS insumos_marcas CASCADE;
DROP TABLE IF EXISTS insumos_productos CASCADE;
DROP TABLE IF EXISTS insumos_subcategorias CASCADE;

-- Eliminar tablas de Inmuebles
DROP TABLE IF EXISTS inmuebles_subcategorias CASCADE;
DROP TABLE IF EXISTS inmuebles_tipos CASCADE;

-- Eliminar tablas de Servicios
DROP TABLE IF EXISTS servicios_subcategorias CASCADE;
DROP TABLE IF EXISTS servicios_tipos CASCADE;
DROP TABLE IF EXISTS service_subcategories CASCADE;
DROP TABLE IF EXISTS service_main_categories CASCADE;

-- Eliminar tablas V2 (intentos anteriores)
DROP TABLE IF EXISTS subcategories_v2 CASCADE;
DROP TABLE IF EXISTS models_v2 CASCADE;
DROP TABLE IF EXISTS brands_v2 CASCADE;
DROP TABLE IF EXISTS features_v2 CASCADE;
DROP TABLE IF EXISTS ad_features_v2 CASCADE;
DROP TABLE IF EXISTS category_types_v2 CASCADE;
DROP TABLE IF EXISTS categories_v2 CASCADE;
DROP TABLE IF EXISTS ads_v2 CASCADE;

-- Eliminar tablas de formularios dinámicos
DROP TABLE IF EXISTS form_field_validations CASCADE;
DROP TABLE IF EXISTS form_field_options_v2 CASCADE;
DROP TABLE IF EXISTS form_fields_v2 CASCADE;
DROP TABLE IF EXISTS form_fields CASCADE;
DROP TABLE IF EXISTS form_templates_v2 CASCADE;
DROP TABLE IF EXISTS form_templates CASCADE;

-- ====================================================================
-- VERIFICACIÓN: Listar tablas restantes
-- ====================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
