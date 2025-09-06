-- Script para obtener la estructura de la tabla debts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'debts'
ORDER BY ordinal_position;
