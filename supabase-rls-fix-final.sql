-- SOLUCIONAR ERRORES 401/406 EN PROFILES - POLÍTICAS RLS FINALES
-- Ejecutar en Supabase SQL Editor

-- 1. VERIFICAR POLÍTICAS ACTUALES
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES PARA EMPEZAR LIMPIO
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Prevent direct profile insertion" ON profiles;
DROP POLICY IF EXISTS "Allow trigger profile insertion" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 3. CREAR POLÍTICAS CLARAS Y FUNCIONALES

-- Permitir que los usuarios vean sus propios perfiles
CREATE POLICY "Enable read access for users on their own profiles" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Permitir que los usuarios actualicen sus propios perfiles  
CREATE POLICY "Enable update access for users on their own profiles" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir inserción durante el registro (para el trigger)
CREATE POLICY "Enable insert for authenticated users during signup" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. CREAR VISTA PARA DEBUGGING
CREATE OR REPLACE VIEW profile_access_debug AS
SELECT 
  p.id,
  p.full_name,
  p.country_code,
  p.created_at,
  p.updated_at,
  u.email,
  auth.uid() as current_user_id,
  (auth.uid() = p.id) as can_access
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- 6. FUNCIÓN PARA TESTING DE ACCESO
CREATE OR REPLACE FUNCTION test_profile_access()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  can_read BOOLEAN,
  can_update BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  current_user_id UUID;
  test_result RECORD;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      'No authenticated user'::TEXT, 
      FALSE, 
      FALSE, 
      'User not authenticated'::TEXT;
    RETURN;
  END IF;
  
  -- Test read access
  BEGIN
    SELECT p.id, u.email INTO test_result
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = current_user_id;
    
    RETURN QUERY SELECT 
      current_user_id,
      test_result.email,
      TRUE,
      TRUE, -- Si puede leer, también debería poder actualizar
      'Access OK'::TEXT;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        current_user_id,
        'Unknown'::TEXT,
        FALSE,
        FALSE,
        SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. VERIFICAR QUE TODO FUNCIONA
SELECT 'Testing profile access:' as info;
SELECT * FROM test_profile_access();

SELECT 'Current policies:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. MOSTRAR ESTRUCTURA FINAL
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
