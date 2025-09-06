-- Script para encontrar la restricción CHECK que está fallando
-- Ejecutar línea por línea en Supabase SQL Editor

-- 1. Buscar específicamente la restricción que está fallando
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'debts'
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%payment_type%';

-- 2. Buscar TODAS las restricciones CHECK de la tabla debts
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'debts'
    AND tc.constraint_type = 'CHECK';

-- 3. Ver la definición exacta de la columna payment_type
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'debts' 
    AND column_name = 'payment_type';

-- 4. Intentar insertar valores de prueba para ver qué funciona
-- IMPORTANTE: Estos INSERT fallarán, pero nos dirán qué valores son válidos
-- Ejecutar uno por uno para ver los errores

-- Prueba 1: single
INSERT INTO debts (
    user_id, 
    type, 
    creditor_debtor_name, 
    title, 
    original_amount, 
    remaining_amount, 
    payment_type, 
    status
) VALUES (
    'test-user-id',
    'i_owe',
    'Test Creditor',
    'Test Debt',
    100.00,
    100.00,
    'single',  -- Probando este valor
    'pending'
);

-- Luego borra el registro de prueba
DELETE FROM debts WHERE creditor_debtor_name = 'Test Creditor';

-- Prueba 2: lump_sum
INSERT INTO debts (
    user_id, 
    type, 
    creditor_debtor_name, 
    title, 
    original_amount, 
    remaining_amount, 
    payment_type, 
    status
) VALUES (
    'test-user-id',
    'i_owe',
    'Test Creditor 2',
    'Test Debt 2',
    100.00,
    100.00,
    'lump_sum',  -- Probando este valor
    'pending'
);

-- Luego borra el registro de prueba
DELETE FROM debts WHERE creditor_debtor_name = 'Test Creditor 2';
