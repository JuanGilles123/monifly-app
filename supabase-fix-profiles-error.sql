-- CORREGIR ERROR DE updated_at EN TABLA PROFILES
-- Ejecutar INMEDIATAMENTE en Supabase SQL Editor

-- 1. VERIFICAR ESTRUCTURA ACTUAL DE LA TABLA PROFILES
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. AGREGAR CAMPO updated_at SI NO EXISTE
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. CREAR TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. APLICAR TRIGGER A LA TABLA PROFILES
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. CORREGIR EL TRIGGER handle_new_user PARA MANEJAR updated_at
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
  
  -- Verificar rate limiting para registros (más permisivo)
  SELECT check_rate_limit(user_ip, NEW.email, 'signup', 5, 10) INTO rate_ok;
  
  IF NOT rate_ok THEN
    RAISE EXCEPTION 'Rate limit exceeded for signup attempts';
  END IF;
  
  -- Validaciones de seguridad más permisivas
  
  -- 1. Verificar formato de email básico
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- 2. Solo bloquear dominios claramente temporales
  IF NEW.email ~* '(10minutemail|guerrillamail|mailinator|tempmail|yopmail|throwaway)' THEN
    RAISE EXCEPTION 'Temporary email addresses not allowed';
  END IF;
  
  -- 3. Limitar registros por hora globalmente (más permisivo: 100 por hora)
  IF (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '1 hour') > 100 THEN
    RAISE EXCEPTION 'Global registration limit exceeded';
  END IF;
  
  -- Si pasa todas las validaciones, crear el perfil CON updated_at
  INSERT INTO public.profiles (id, full_name, country_code, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'CO'),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del intento sospechoso (solo para intentos realmente sospechosos)
    IF SQLSTATE != '23505' THEN -- No logear errores de duplicado
      INSERT INTO auth_rate_limit (ip_address, email, attempt_type, attempt_count, blocked_until)
      VALUES (user_ip, NEW.email, 'blocked_signup', 999, NOW() + INTERVAL '1 hour')
      ON CONFLICT (ip_address, attempt_type) DO UPDATE SET
        attempt_count = auth_rate_limit.attempt_count + 1,
        last_attempt = NOW(),
        blocked_until = NOW() + INTERVAL '1 hour';
    END IF;
    
    -- Re-lanzar la excepción
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CORREGIR POLÍTICAS RLS PARA PROFILES
DROP POLICY IF EXISTS "Prevent direct profile insertion" ON profiles;
DROP POLICY IF EXISTS "Allow trigger profile insertion" ON profiles;

-- Permitir que los usuarios actualicen sus propios perfiles
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir que los usuarios vean sus propios perfiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Permitir inserción solo durante signup (a través del trigger)
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. ASEGURAR QUE RLS ESTÁ HABILITADO
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 8. CREAR FUNCIÓN PARA ACTUALIZAR PERFIL DE MANERA SEGURA
CREATE OR REPLACE FUNCTION update_user_profile(
  new_full_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Obtener el ID del usuario actual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Validar el nombre
  IF LENGTH(new_full_name) < 2 OR LENGTH(new_full_name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  -- Actualizar el perfil
  UPDATE profiles 
  SET full_name = new_full_name, updated_at = NOW()
  WHERE id = current_user_id;
  
  IF NOT FOUND THEN
    -- Si no existe el perfil, crearlo
    INSERT INTO profiles (id, full_name, country_code, updated_at)
    VALUES (current_user_id, new_full_name, 'CO', NOW());
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. VERIFICAR QUE TODO ESTÁ CORRECTO
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'RLS policies on profiles:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
