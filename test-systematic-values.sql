-- Script corregido para probar payment_type (sin NULL)
-- Ejecutar en Supabase SQL Editor

-- 1. PRIMERO: Ver la restricción CHECK exacta
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN ('debts_payment_type_check', 'debts_status_check');

-- 2. Deshabilitar RLS para pruebas
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;

-- 3. Probar valores más sistemáticos (payment_type es NOT NULL, así que siempre incluirlo)

-- Probar letras simples
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test A', 'Test', 'Test',
    100.00, 100.00, 'A', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test B', 'Test', 'Test',
    100.00, 100.00, 'B', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test C', 'Test', 'Test',
    100.00, 100.00, 'C', 'pending', CURRENT_DATE
);

-- Probar números como texto
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test 1', 'Test', 'Test',
    100.00, 100.00, '1', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test 0', 'Test', 'Test',
    100.00, 100.00, '0', 'pending', CURRENT_DATE
);

-- Probar palabras comunes en español/inglés
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test unico', 'Test', 'Test',
    100.00, 100.00, 'unico', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test cuotas', 'Test', 'Test',
    100.00, 100.00, 'cuotas', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test pago', 'Test', 'Test',
    100.00, 100.00, 'pago', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test mensual', 'Test', 'Test',
    100.00, 100.00, 'mensual', 'pending', CURRENT_DATE
);

-- Probar valor vacío (string vacío, no NULL)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test empty', 'Test', 'Test',
    100.00, 100.00, '', 'pending', CURRENT_DATE
);

-- Ver cuáles funcionaron
SELECT payment_type, creditor_debtor_name, created_at
FROM debts 
WHERE creditor_debtor_name LIKE 'Test %'
ORDER BY created_at;

-- Limpiar
DELETE FROM debts WHERE creditor_debtor_name LIKE 'Test %';

-- Rehabilitar RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
