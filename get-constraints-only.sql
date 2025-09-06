-- Script para obtener SOLO la restricción CHECK exacta
-- Ejecutar SOLO estas primeras líneas en Supabase SQL Editor

-- VER LA RESTRICCIÓN CHECK EXACTA
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN ('debts_payment_type_check', 'debts_status_check');

-- Ver también todas las restricciones de la tabla debts
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'debts'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';

-- Ver definición de columnas payment_type y status
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'debts' 
    AND table_schema = 'public'
    AND column_name IN ('payment_type', 'status')
ORDER BY column_name;
