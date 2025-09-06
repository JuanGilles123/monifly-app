-- Script para investigar las restricciones más profundamente
-- Ejecutar en Supabase SQL Editor

-- 1. Buscar restricciones CHECK de cualquier tipo
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.debts'::regclass;

-- 2. Ver si hay triggers que estén validando los datos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'debts';

-- 3. Ver si hay políticas RLS que puedan estar causando el problema
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'debts';

-- 4. Buscar tipos ENUM que podrían estar limitando los valores
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as allowed_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
GROUP BY t.typname
ORDER BY t.typname;

-- 5. Ver la definición completa de la tabla
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
ORDER BY ordinal_position;
