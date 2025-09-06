-- Script para obtener información completa de las tablas debts y debt_payments
-- Ejecutar en Supabase SQL Editor

-- 1. Información detallada de columnas para tabla 'debts'
SELECT 
    'debts' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'debts'
ORDER BY ordinal_position;

-- 2. Información detallada de columnas para tabla 'debt_payments'
SELECT 
    'debt_payments' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'debt_payments'
ORDER BY ordinal_position;

-- 3. Restricciones CHECK (muy importante para validar valores permitidos)
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('debts', 'debt_payments')
    AND tc.constraint_type = 'CHECK';

-- 4. Restricciones de clave foránea
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('debts', 'debt_payments');

-- 5. Índices y claves únicas
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('debts', 'debt_payments')
ORDER BY tablename, indexname;

-- 6. Enums y tipos personalizados (si existen)
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%debt%' OR t.typname LIKE '%payment%'
ORDER BY t.typname, e.enumsortorder;
