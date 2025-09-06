-- Script para obtener la restricción CHECK exacta y probar valores más básicos
-- Ejecutar en Supabase SQL Editor

-- 1. PRIMERO: Ver la restricción CHECK exacta
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN ('debts_payment_type_check', 'debts_status_check');

-- 2. Ver también todas las restricciones de la tabla debts
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'debts'
    AND tc.table_schema = 'public';

-- 3. Ver la definición completa de las columnas
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

-- 4. Buscar si hay ENUMs definidos
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as allowed_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%payment%' OR t.typname LIKE '%status%' OR t.typname LIKE '%debt%'
GROUP BY t.typname
ORDER BY t.typname;

-- 5. Ver si hay dominios personalizados
SELECT 
    domain_name,
    data_type,
    character_maximum_length,
    domain_default
FROM information_schema.domains
WHERE domain_schema = 'public';

-- 6. Deshabilitar RLS para pruebas básicas
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;

-- 7. Probar valores MUY básicos y comunes
-- Probar sin especificar payment_type (NULL)
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test NULL payment_type', 'Test', 'Test',
    100.00, 100.00, 'pending', CURRENT_DATE
);

-- Probar valor vacío
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test empty payment_type', 'Test', 'Test',
    100.00, 100.00, '', 'pending', CURRENT_DATE
);

-- Probar valores de una sola letra
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test payment_type F', 'Test', 'Test',
    100.00, 100.00, 'F', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test payment_type I', 'Test', 'Test',
    100.00, 100.00, 'I', 'pending', CURRENT_DATE
);

-- Probar números
INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test payment_type 1', 'Test', 'Test',
    100.00, 100.00, '1', 'pending', CURRENT_DATE
);

INSERT INTO debts (
    user_id, type, creditor_debtor_name, title, description,
    original_amount, remaining_amount, payment_type, status, due_date
) VALUES (
    gen_random_uuid(), 'i_owe', 'Test payment_type 2', 'Test', 'Test',
    100.00, 100.00, '2', 'pending', CURRENT_DATE
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
