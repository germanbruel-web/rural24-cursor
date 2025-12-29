-- ============================================
-- SOLUCIÓN SIMPLE: Actualizar super@clasify.com a superadmin
-- ============================================
-- Esta es la forma más directa basada en tu código existente

UPDATE users 
SET role = 'superadmin' 
WHERE email = 'super@clasify.com';

-- ============================================
-- VERIFICAR (ejecuta esto después del UPDATE)
-- ============================================
SELECT id, email, full_name, role 
FROM users 
WHERE email = 'super@clasify.com';

-- ============================================
-- ALTERNATIVA: Si quieres ver todos los roles primero
-- ============================================
-- SELECT DISTINCT role FROM users;

-- ============================================
-- DESPUÉS DE EJECUTAR:
-- ============================================
-- 1. Cerrar sesión en la app
-- 2. Volver a iniciar sesión con super@clasify.com
-- 3. Ir a Dashboard
-- 4. Deberías ver "⚙️ Categorías" en el menú
-- ============================================
