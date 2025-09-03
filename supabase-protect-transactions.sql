-- PROTECCIÓN URGENTE PARA TABLA TRANSACTIONS
-- Ejecutar INMEDIATAMENTE en Supabase SQL Editor

-- 1. VERIFICAR ESTADO ACTUAL DE TRANSACTIONS
SELECT 
  COUNT(*) as total_transactions,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as oldest_transaction,
  MAX(created_at) as newest_transaction,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24_hours
FROM transactions;

-- 2. IDENTIFICAR USUARIOS CON ACTIVIDAD SOSPECHOSA
SELECT 
  user_id,
  COUNT(*) as transaction_count,
  MIN(created_at) as first_transaction,
  MAX(created_at) as last_transaction,
  AVG(amount::numeric) as avg_amount,
  string_agg(DISTINCT category, ', ') as categories_used
FROM transactions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 10  -- Usuarios con más de 10 transacciones en 24h
ORDER BY transaction_count DESC;

-- 3. ELIMINAR TRANSACCIONES DE USUARIOS FALSOS (EJECUTAR CON CUIDADO)
-- Primero verificar cuáles se van a eliminar:
WITH fake_users AS (
  SELECT u.id, u.email, u.created_at, p.full_name
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE u.created_at > NOW() - INTERVAL '24 hours'
  AND (
    u.email ~* '^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.(com|net|org)$' -- Emails muy simples
    OR u.email ~* '(test|fake|temp|spam|bot)'
    OR p.full_name ~* '(test|fake|temp|spam|bot|user)'
    OR u.email ~* '^.{1,3}@'  -- Emails muy cortos antes del @
  )
)
SELECT 
  fu.email,
  fu.full_name,
  fu.created_at,
  COUNT(t.id) as transaction_count
FROM fake_users fu
LEFT JOIN transactions t ON fu.id = t.user_id
GROUP BY fu.id, fu.email, fu.full_name, fu.created_at
ORDER BY transaction_count DESC;

-- 4. CREAR TRIGGER PARA PROTEGER TRANSACTIONS
CREATE OR REPLACE FUNCTION protect_transactions()
RETURNS TRIGGER AS $$
DECLARE
  user_tx_count INTEGER;
  user_tx_last_hour INTEGER;
  user_created_at TIMESTAMP WITH TIME ZONE;
  rate_ok BOOLEAN;
BEGIN
  -- Verificar que el usuario existe y obtener su fecha de creación
  SELECT created_at INTO user_created_at
  FROM auth.users 
  WHERE id = NEW.user_id;
  
  IF user_created_at IS NULL THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;
  
  -- Sin restricción de tiempo para usuarios nuevos
  
  -- Contar transacciones existentes del usuario
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')
  INTO user_tx_count, user_tx_last_hour
  FROM transactions 
  WHERE user_id = NEW.user_id;
  
  -- Límites de transacciones
  IF user_tx_last_hour >= 20 THEN
    RAISE EXCEPTION 'Transaction rate limit exceeded: maximum 20 per hour';
  END IF;
  
  -- Sin límite total por usuario, solo rate limiting por tiempo
  
  -- Validar datos de la transacción
  IF NEW.amount = 0 OR ABS(NEW.amount) > 1000000 THEN
    RAISE EXCEPTION 'Invalid transaction amount';
  END IF;
  
  IF LENGTH(NEW.description) < 3 OR LENGTH(NEW.description) > 200 THEN
    RAISE EXCEPTION 'Transaction description must be between 3 and 200 characters';
  END IF;
  
  IF NEW.category NOT IN ('food', 'transport', 'entertainment', 'bills', 'shopping', 'health', 'education', 'other', 'income', 'savings') THEN
    RAISE EXCEPTION 'Invalid transaction category';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREAR EL TRIGGER
DROP TRIGGER IF EXISTS protect_transactions_trigger ON transactions;
CREATE TRIGGER protect_transactions_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION protect_transactions();

-- 6. FUNCIÓN PARA LIMPIAR TRANSACCIONES SPAM
CREATE OR REPLACE FUNCTION cleanup_spam_transactions()
RETURNS TEXT AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Eliminar transacciones de usuarios obviamente falsos
  WITH spam_transactions AS (
    SELECT t.id
    FROM transactions t
    JOIN auth.users u ON t.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.id
    WHERE t.created_at > NOW() - INTERVAL '24 hours'
    AND (
      u.email ~* '(test|fake|temp|spam|bot)' OR
      p.full_name ~* '(test|fake|temp|spam|bot|user)' OR
      u.email ~* '^[a-zA-Z0-9]{1,3}@' OR
      -- Usuarios con demasiadas transacciones muy rápido
      t.user_id IN (
        SELECT user_id 
        FROM transactions 
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY user_id 
        HAVING COUNT(*) > 15
      )
    )
  )
  DELETE FROM transactions 
  WHERE id IN (SELECT id FROM spam_transactions);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN 'Deleted ' || deleted_count || ' spam transactions';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. EJECUTAR LIMPIEZA INMEDIATA (DESCOMENTA SI QUIERES LIMPIAR)
-- SELECT cleanup_spam_transactions();

-- 8. CREAR ÍNDICE PARA PERFORMANCE EN CONSULTAS DE RATE LIMITING
CREATE INDEX IF NOT EXISTS idx_transactions_user_created_at ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
