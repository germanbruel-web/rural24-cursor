-- ============================================================================
-- AD CONTENT TEMPLATES - Plantillas de Títulos y Descripciones
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 16 Enero 2026
-- ============================================================================

-- 1. Crear tabla ad_content_templates
CREATE TABLE IF NOT EXISTS ad_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope jerárquico (NULL = aplica a nivel superior)
  -- Global: todos NULL
  -- Categoría: solo category_id
  -- Subcategoría: category_id + subcategory_id
  -- Tipo: category_id + subcategory_id + type_id
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  type_id UUID REFERENCES category_types(id) ON DELETE CASCADE,
  
  -- Tipo de plantilla
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('title', 'description')),
  
  -- Nombre interno para identificar en admin
  name VARCHAR(100) NOT NULL,
  
  -- Contenido con variables interpolables
  -- Variables: {categoria}, {subcategoria}, {tipo}, {marca}, {modelo}, 
  --            {año}, {condicion}, {provincia}, {localidad}, {precio}
  --            {atributo:FIELD_NAME} para atributos dinámicos
  template_text TEXT NOT NULL,
  
  -- Orden y estado
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_templates_category ON ad_content_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_templates_subcategory ON ad_content_templates(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON ad_content_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_scope ON ad_content_templates(category_id, subcategory_id, type_id);

-- 3. RLS Policies
ALTER TABLE ad_content_templates ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para el formulario de publicar)
CREATE POLICY "templates_public_read" ON ad_content_templates
  FOR SELECT USING (is_active = true);

-- CRUD solo para superadmin
CREATE POLICY "templates_superadmin_all" ON ad_content_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- 4. Insertar plantillas de ejemplo (globales)
INSERT INTO ad_content_templates (category_id, subcategory_id, type_id, template_type, name, template_text, sort_order) VALUES
-- Títulos globales
(NULL, NULL, NULL, 'title', 'Título básico', '{marca} {modelo} {año} - {condicion}', 1),
(NULL, NULL, NULL, 'title', 'Título con ubicación', '{subcategoria} {marca} en {provincia}', 2),
(NULL, NULL, NULL, 'title', 'Título urgente', '¡Oportunidad! {marca} {modelo} listo para entregar', 3),

-- Descripciones globales
(NULL, NULL, NULL, 'description', 'Descripción estándar', 
'{subcategoria} {marca} {modelo}, en excelente estado y lista para trabajar.

✅ Condición: {condicion}
📍 Ubicación: {localidad}, {provincia}

💬 Consultá precio y disponibilidad.
📞 Respuesta inmediata.', 1),

(NULL, NULL, NULL, 'description', 'Descripción comercial',
'{subcategoria} moderna, pensada para maximizar la productividad con gran comodidad de uso.

Ideal para trabajos exigentes, con tecnología que simplifica la operación.
Opciones de financiación disponibles.

💬 Consultá precio y disponibilidad.', 2);

-- 5. Comentarios de documentación
COMMENT ON TABLE ad_content_templates IS 'Plantillas configurables para títulos y descripciones de avisos';
COMMENT ON COLUMN ad_content_templates.template_text IS 'Variables: {categoria}, {subcategoria}, {tipo}, {marca}, {modelo}, {año}, {condicion}, {provincia}, {localidad}, {precio}, {atributo:FIELD_NAME}';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT * FROM ad_content_templates ORDER BY template_type, sort_order;
