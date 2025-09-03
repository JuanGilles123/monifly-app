-- MEDIDAS DE SEGURIDAD URGENTES CONTRA CREACIÓN MASIVA DE USUARIOS
-- Ejecutar INMEDIATAMENTE en Supabase SQL Editor

-- 1. CREAR TABLA PARA RATE LIMITING A NIVEL DB
CREATE TABLE IF NOT EXISTS auth_rate_limit (
  ip_address INET NOT NULL,
  email TEXT,
  attempt_type TEXT NOT NULL, -- 'signup', 'login', 'reset'
  attempt_count INTEGER DEFAULT 1,
  first_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (ip_address, attempt_type)
);

-- 2. CREAR FUNCIÓN DE RATE LIMITING
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address INET,
  p_email TEXT,
  p_attempt_type TEXT,
  p_max_attempts INTEGER DEFAULT 3,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  current_attempts INTEGER := 0;
  is_blocked BOOLEAN := FALSE;
BEGIN
  -- Verificar si existe registro
  SELECT attempt_count, (blocked_until > NOW()) INTO current_attempts, is_blocked
  FROM auth_rate_limit 
  WHERE ip_address = p_ip_address AND attempt_type = p_attempt_type;
  
  -- Si está bloqueado, retornar false
  IF is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Si no existe registro o la ventana de tiempo ha pasado, crear/resetear
  IF current_attempts IS NULL OR 
     (SELECT first_attempt FROM auth_rate_limit 
      WHERE ip_address = p_ip_address AND attempt_type = p_attempt_type) < NOW() - (p_window_minutes || ' minutes')::INTERVAL THEN
    
    INSERT INTO auth_rate_limit (ip_address, email, attempt_type, attempt_count, first_attempt, last_attempt)
    VALUES (p_ip_address, p_email, p_attempt_type, 1, NOW(), NOW())
    ON CONFLICT (ip_address, attempt_type) DO UPDATE SET
      attempt_count = 1,
      first_attempt = NOW(),
      last_attempt = NOW(),
      blocked_until = NULL,
      email = p_email;
    
    RETURN TRUE;
  END IF;
  
  -- Incrementar contador
  current_attempts := current_attempts + 1;
  
  UPDATE auth_rate_limit 
  SET attempt_count = current_attempts,
      last_attempt = NOW(),
      email = p_email,
      blocked_until = CASE 
        WHEN current_attempts >= p_max_attempts THEN NOW() + (p_window_minutes * 2 || ' minutes')::INTERVAL
        ELSE NULL
      END
  WHERE ip_address = p_ip_address AND attempt_type = p_attempt_type;
  
  -- Retornar false si excede el límite
  RETURN current_attempts < p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MODIFICAR EL TRIGGER PARA INCLUIR RATE LIMITING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_ip INET;
  rate_ok BOOLEAN;
BEGIN
  -- Intentar obtener IP del usuario (si está disponible en metadata)
  user_ip := COALESCE(
    (NEW.raw_user_meta_data->>'ip_address')::INET,
    '127.0.0.1'::INET
  );
  
  -- Verificar rate limiting para registros
  SELECT check_rate_limit(user_ip, NEW.email, 'signup', 3, 15) INTO rate_ok;
  
  IF NOT rate_ok THEN
    RAISE EXCEPTION 'Rate limit exceeded for signup attempts';
  END IF;
  
  -- Validaciones adicionales de seguridad
  
  -- 1. Verificar formato de email
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- 2. Verificar que no sea un email temporal/desechable común
  IF NEW.email ~* '(10minutemail|guerrillamail|mailinator|tempmail|yopmail|throwaway)' THEN
    RAISE EXCEPTION 'Temporary email addresses not allowed';
  END IF;
  
  -- 3. Limitar registros por hora globalmente
  IF (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '1 hour') > 50 THEN
    RAISE EXCEPTION 'Global registration limit exceeded';
  END IF;
  
  -- 4. Verificar patrón sospechoso en metadata
  IF NEW.raw_user_meta_data->>'full_name' ~* '(test|bot|fake|spam|admin)' THEN
    RAISE EXCEPTION 'Suspicious user data detected';
  END IF;
  
  -- Si pasa todas las validaciones, crear el perfil
  INSERT INTO public.profiles (id, full_name, country_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'CO')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del intento sospechoso
    INSERT INTO auth_rate_limit (ip_address, email, attempt_type, attempt_count, blocked_until)
    VALUES (user_ip, NEW.email, 'blocked_signup', 999, NOW() + INTERVAL '24 hours')
    ON CONFLICT (ip_address, attempt_type) DO UPDATE SET
      attempt_count = auth_rate_limit.attempt_count + 1,
      last_attempt = NOW(),
      blocked_until = NOW() + INTERVAL '24 hours';
    
    -- Re-lanzar la excepción para evitar la creación del usuario
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREAR POLÍTICA ADICIONAL PARA PREVENIR INSERCIÓN DIRECTA EN PROFILES
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Prevent direct profile insertion" ON profiles
  FOR INSERT WITH CHECK (FALSE); -- Prohibir inserción directa

-- Solo permitir inserción a través del trigger
CREATE POLICY "Allow trigger profile insertion" ON profiles
  FOR INSERT TO postgres WITH CHECK (TRUE);

-- 5. FUNCIÓN PARA LIMPIAR USUARIOS SOSPECHOSOS (EJECUTAR MANUALMENTE)
CREATE OR REPLACE FUNCTION cleanup_suspicious_users()
RETURNS TEXT AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Eliminar usuarios creados en los últimos 10 minutos con patrones sospechosos
  WITH suspicious_users AS (
    SELECT u.id 
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE u.created_at > NOW() - INTERVAL '10 minutes'
    AND (
      u.email ~* '(test|bot|fake|spam|admin)' OR
      u.raw_user_meta_data->>'full_name' ~* '(test|bot|fake|spam|admin)' OR
      u.email ~* '(10minutemail|guerrillamail|mailinator|tempmail|yopmail)'
    )
  )
  DELETE FROM auth.users 
  WHERE id IN (SELECT id FROM suspicious_users);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN 'Deleted ' || deleted_count || ' suspicious users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CREAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_ip_type ON auth_rate_limit(ip_address, attempt_type);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_blocked_until ON auth_rate_limit(blocked_until) WHERE blocked_until IS NOT NULL;

-- EJECUTAR LIMPIEZA INMEDIATA (descomenta la siguiente línea si quieres limpiar usuarios sospechosos)
-- SELECT cleanup_suspicious_users();
