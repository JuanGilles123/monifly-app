-- Script para encontrar valores EXACTOS válidos probando términos más específicos
-- Ejecutar paso a paso en Supabase SQL Editor

-- 1. Deshabilitar RLS temporalmente
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;

-- 2. Probar valores de payment_type más específicos y comunes
-- Ya sabemos que 'single' y 'lump_sum' fallan, probemos otros:

-- Probar: full (pago completo)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test full', 'Test', 'Test',
    100.00, 100.00, 'full', 'pending', CURRENT_DATE
);

-- Probar: partial (pago parcial)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test partial', 'Test', 'Test',
    100.00, 100.00, 'partial', 'pending', CURRENT_DATE
);

-- Probar: fixed (pago fijo)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test fixed', 'Test', 'Test',
    100.00, 100.00, 'fixed', 'pending', CURRENT_DATE
);

-- Probar: variable (pago variable)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test variable', 'Test', 'Test',
    100.00, 100.00, 'variable', 'pending', CURRENT_DATE
);

-- Probar: immediate (inmediato)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test immediate', 'Test', 'Test',
    100.00, 100.00, 'immediate', 'pending', CURRENT_DATE
);

-- Probar: deferred (diferido)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test deferred', 'Test', 'Test',
    100.00, 100.00, 'deferred', 'pending', CURRENT_DATE
);

-- Ver cuáles se insertaron exitosamente
SELECT payment_type, creditor_debtor_name 
FROM debts 
WHERE creditor_debtor_name LIKE 'Test %'
ORDER BY creditor_debtor_name;

-- Si ninguno funcionó, probar valores en español
-- Limpiar primero
DELETE FROM debts WHERE creditor_debtor_name LIKE 'Test %';

-- Probar: completo
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test completo', 'Test', 'Test',
    100.00, 100.00, 'completo', 'pending', CURRENT_DATE
);

-- Probar: cuotas
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test cuotas', 'Test', 'Test',
    100.00, 100.00, 'cuotas', 'pending', CURRENT_DATE
);

-- Ver resultados de valores en español
SELECT payment_type, creditor_debtor_name 
FROM debts 
WHERE creditor_debtor_name LIKE 'Test %'
ORDER BY creditor_debtor_name;

-- Limpiar datos de prueba
DELETE FROM debts WHERE creditor_debtor_name LIKE 'Test %';

-- Rehabilitar RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Mostrar la restricción CHECK exacta para analizar
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'debts_payment_type_check';
