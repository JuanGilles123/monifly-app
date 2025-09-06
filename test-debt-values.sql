
-- Script para probar valores permitidos en la tabla debts
-- Ejecutar en Supabase SQL Editor (como superusuario)

-- 1. Deshabilitar RLS temporalmente para testing
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;

-- 2. Probar diferentes valores de payment_type y status
-- Prueba 1: single + pending
INSERT INTO debts (
    user_id,
    type,
    creditor_debtor_name,
    title,
    description,
    original_amount,
    remaining_amount,
    payment_type,
    status,
    due_date
) VALUES (
    gen_random_uuid(),
    'i_owe',
    'Test User 1',
    'Test Debt 1',
    'Test description',
    100.00,
    100.00,
    'single',
    'pending',
    CURRENT_DATE
);

-- Si el anterior funciona, probar otros valores:
-- Prueba 2: lump_sum + active
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test User 2', 'Test Debt 2', 'Test description',
    100.00, 100.00, 'lump_sum', 'active', CURRENT_DATE
);

-- Prueba 3: installment + open  
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test User 3', 'Test Debt 3', 'Test description',
    100.00, 100.00, 'installment', 'open', CURRENT_DATE
);

-- Prueba 4: installments + pending
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test User 4', 'Test Debt 4', 'Test description',
    100.00, 100.00, 'installments', 'pending', CURRENT_DATE
);

-- 3. Ver qué registros se insertaron exitosamente
SELECT payment_type, status, COUNT(*) as count
FROM debts 
WHERE creditor_debtor_name LIKE 'Test User%'
GROUP BY payment_type, status;

-- 4. Ver todos los valores únicos actuales (si existen registros reales)
SELECT DISTINCT payment_type FROM debts WHERE payment_type IS NOT NULL;
SELECT DISTINCT status FROM debts WHERE status IS NOT NULL;

-- 5. Limpiar datos de prueba
DELETE FROM debts WHERE creditor_debtor_name LIKE 'Test User%';

-- 6. Rehabilitar RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- 7. Ver las restricciones CHECK exactas
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%debts%';
