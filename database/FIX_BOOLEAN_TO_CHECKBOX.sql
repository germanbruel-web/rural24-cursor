-- Corregir field_type 'boolean' a 'checkbox'
UPDATE dynamic_attributes 
SET field_type = 'checkbox' 
WHERE field_type = 'boolean';

-- Verificar
SELECT id, field_name, field_type 
FROM dynamic_attributes 
WHERE field_type = 'checkbox';
