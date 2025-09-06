-- Script para encontrar los valores EXACTOS permitidos para payment_type y status
-- Ejecutar paso a paso en Supabase SQL Editor

-- 1. Deshabilitar RLS temporalmente
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;

-- 2. Probar TODOS los valores comunes para payment_type uno por uno
-- Solo cambiamos payment_type, mantenemos status = 'pending' por ahora

-- Probar: lump_sum
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test lump_sum', 'Test', 'Test',
    100.00, 100.00, 'lump_sum', 'pending', CURRENT_DATE
);

-- Probar: installment (singular)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test installment', 'Test', 'Test',
    100.00, 100.00, 'installment', 'pending', CURRENT_DATE
);

-- Probar: installments (plural)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test installments', 'Test', 'Test',
    100.00, 100.00, 'installments', 'pending', CURRENT_DATE
);

-- Probar: one_time
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test one_time', 'Test', 'Test',
    100.00, 100.00, 'one_time', 'pending', CURRENT_DATE
);

-- Probar: monthly
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test monthly', 'Test', 'Test',
    100.00, 100.00, 'monthly', 'pending', CURRENT_DATE
);

-- Probar: weekly
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test weekly', 'Test', 'Test',
    100.00, 100.00, 'weekly', 'pending', CURRENT_DATE
);

-- Ver qué se insertó exitosamente
SELECT payment_type, creditor_debtor_name 
FROM debts 
WHERE creditor_debtor_name LIKE 'Test %'
ORDER BY creditor_debtor_name;

-- Limpiar los exitosos para probar status
DELETE FROM debts WHERE creditor_debtor_name LIKE 'Test %';

-- Ahora probar valores de STATUS con el payment_type que funcionó
-- Usando el primer payment_type que haya funcionado, probar diferentes status:

-- Probar: active
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test active', 'Test', 'Test',
    100.00, 100.00, 'lump_sum', 'active', CURRENT_DATE
);

-- Probar: open
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test open', 'Test', 'Test',
    100.00, 100.00, 'lump_sum', 'open', CURRENT_DATE
);

-- Probar: unpaid
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test unpaid', 'Test', 'Test',
    100.00, 100.00, 'lump_sum', 'unpaid', CURRENT_DATE
);

-- Probar: outstanding
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test outstanding', 'Test', 'Test',
    100.00, 100.00, 'lump_sum', 'outstanding', CURRENT_DATE
);

-- Ver qué status funcionaron
SELECT status, creditor_debtor_name 
FROM debts 
WHERE creditor_debtor_name LIKE 'Test %'
ORDER BY creditor_debtor_name;

-- Ver las restricciones CHECK exactas para entender mejor
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%debts%payment%' OR constraint_name LIKE '%debts%status%';

-- Limpiar todo
DELETE FROM debts WHERE creditor_debtor_name LIKE 'Test %';

-- Rehabilitar RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
