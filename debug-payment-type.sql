-- Script específico para identificar el problema con payment_type
-- Ejecutar en Supabase SQL Editor

-- 1. Ver la restricción CHECK específica que está fallando
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'debts_payment_type_check';

-- 2. Ver todas las restricciones CHECK de la tabla debts
SELECT 
    tc.constraint_name,
    cc.check_clause,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'debts'
    AND tc.constraint_type = 'CHECK';

-- 3. Ver la definición completa de la tabla debts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'debts'
ORDER BY ordinal_position;

-- 4. Si hay tipos ENUM, mostrar los valores permitidos
SELECT 
    t.typname as type_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as allowed_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
GROUP BY t.typname
ORDER BY t.typname;

-- 5. Ver ejemplos de datos existentes en payment_type (si hay datos)
SELECT DISTINCT payment_type, COUNT(*) as count
FROM debts 
GROUP BY payment_type
ORDER BY count DESC;

-- 6. Ver la definición de la tabla con \d+ (PostgreSQL específico)
-- Nota: Este comando podría no funcionar en Supabase web interface
-- SELECT * FROM pg_get_tabledef('public.debts');
