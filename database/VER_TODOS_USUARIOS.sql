-- ============================================
-- Ver qué usuarios existen en la tabla
-- ============================================

-- Ver TODOS los usuarios (sus emails y roles)
SELECT email, role, full_name, created_at 
FROM users 
ORDER BY created_at DESC;

-- ============================================
-- DESPUÉS de ver los resultados:
-- Copia el email exacto que ves en la lista
-- y ejecútalo con el comando correcto
-- ============================================
