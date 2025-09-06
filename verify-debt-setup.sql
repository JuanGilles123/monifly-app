-- Script para verificar que las deudas y pagos funcionen correctamente
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que las políticas RLS estén habilitadas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('debts', 'debt_payments');

-- 2. Ver las políticas activas para debt_payments
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'debt_payments'
ORDER BY policyname;

-- 3. Ver las políticas activas para debts
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'debts'
ORDER BY policyname;

-- 4. Verificar las restricciones CHECK en debt_payments
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%debt_payments%';

-- 5. Ver estructura de debt_payments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'debt_payments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
