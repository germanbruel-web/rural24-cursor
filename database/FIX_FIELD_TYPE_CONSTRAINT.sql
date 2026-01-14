-- Ver el constraint actual
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'dynamic_attributes'::regclass 
AND conname LIKE '%field_type%';

-- Eliminar el constraint viejo
ALTER TABLE dynamic_attributes DROP CONSTRAINT IF EXISTS dynamic_attributes_field_type_check;

-- Agregar constraint actualizado con checkbox
ALTER TABLE dynamic_attributes ADD CONSTRAINT dynamic_attributes_field_type_check 
CHECK (field_type IN ('text', 'number', 'select', 'multiselect', 'textarea', 'checkbox', 'date', 'boolean'));

-- Ahora sí corregir los datos
UPDATE dynamic_attributes 
SET field_type = 'checkbox' 
WHERE field_type = 'boolean';
