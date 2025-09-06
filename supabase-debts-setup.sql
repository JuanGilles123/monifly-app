-- Script SQL para configurar el sistema completo de deudas
-- Ejecutar en Supabase SQL Editor

-- 1. Crear la tabla debts
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  original_amount DECIMAL(12,2) NOT NULL CHECK (original_amount > 0),
  type TEXT CHECK (type IN ('debt_owed', 'debt_owing')) NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('fixed', 'installments')) NOT NULL,
  payment_frequency TEXT CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  total_installments INTEGER CHECK (total_installments > 0),
  due_date DATE NOT NULL,
  creditor_debtor_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'paid', 'overdue', 'cancelled')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear la tabla debt_payments para manejar los pagos
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  installment_number INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar RLS (Row Level Security) para ambas tablas
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para la tabla debts
-- Política para SELECT (ver deudas propias)
CREATE POLICY "Users can view their own debts" ON debts
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT (crear deudas propias)
CREATE POLICY "Users can insert their own debts" ON debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (actualizar deudas propias)
CREATE POLICY "Users can update their own debts" ON debts
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE (eliminar deudas propias)
CREATE POLICY "Users can delete their own debts" ON debts
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Crear políticas RLS para la tabla debt_payments
-- Política para SELECT (ver pagos de deudas propias)
CREATE POLICY "Users can view their own debt payments" ON debt_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT (crear pagos de deudas propias)
CREATE POLICY "Users can insert their own debt payments" ON debt_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (actualizar pagos de deudas propias)
CREATE POLICY "Users can update their own debt payments" ON debt_payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE (eliminar pagos de deudas propias)
CREATE POLICY "Users can delete their own debt payments" ON debt_payments
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para actualizar updated_at en debts
CREATE OR REPLACE TRIGGER update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Crear función para actualizar automáticamente el estado de las deudas vencidas
CREATE OR REPLACE FUNCTION update_overdue_debts()
RETURNS void AS $$
BEGIN
    UPDATE debts 
    SET status = 'overdue'
    WHERE status = 'active' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON debt_payments(user_id);

-- 10. Crear función para calcular el monto restante de una deuda
CREATE OR REPLACE FUNCTION get_debt_remaining_amount(debt_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    original_amount DECIMAL(12,2);
    paid_amount DECIMAL(12,2);
BEGIN
    -- Obtener el monto original
    SELECT d.original_amount INTO original_amount
    FROM debts d
    WHERE d.id = debt_uuid;
    
    -- Obtener el monto pagado
    SELECT COALESCE(SUM(dp.amount), 0) INTO paid_amount
    FROM debt_payments dp
    WHERE dp.debt_id = debt_uuid;
    
    -- Retornar el monto restante
    RETURN original_amount - paid_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios sobre el diseño:
-- - type: 'debt_owed' = alguien me debe, 'debt_owing' = yo debo
-- - payment_type: 'fixed' = pago único, 'installments' = pago a cuotas
-- - payment_frequency: frecuencia de pagos (solo relevante para installments)
-- - total_installments: número total de cuotas (solo relevante para installments)
-- - status: 'active' = activa, 'paid' = pagada, 'overdue' = vencida, 'cancelled' = cancelada
