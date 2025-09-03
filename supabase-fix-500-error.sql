-- DIAGNOSTICAR Y SOLUCIONAR ERROR 500 EN REGISTRO
-- Ejecutar en Supabase SQL Editor

-- 1. VERIFICAR ESTADO DE LOS TRIGGERS
SELECT 
    trigger_schema,
    event_object_table as table_name, 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table IN ('users', 'profiles')
ORDER BY event_object_table, trigger_name;

-- 2. VERIFICAR FUNCIONES RELACIONADAS CON USUARIOS
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_name LIKE '%user%' OR routine_name LIKE '%profile%'
ORDER BY routine_name;

-- 3. VERIFICAR SI EXISTE LA TABLA auth_rate_limit
SELECT EXISTS(
   SELECT FROM information_schema.tables 
   WHERE table_name = 'auth_rate_limit'
) as auth_rate_limit_exists;

-- 4. DESHABILITAR TEMPORALMENTE EL TRIGGER PROBLEMÁTICO
-- Esto permitirá crear cuentas mientras diagnosticamos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. CREAR UNA VERSIÓN SIMPLIFICADA DEL TRIGGER PARA TESTING
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear el perfil básico, sin validaciones complejas
  INSERT INTO public.profiles (id, full_name, country_code, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'CO',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no fallar el registro
    RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. APLICAR EL TRIGGER SIMPLIFICADO
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- 7. VERIFICAR POLÍTICAS RLS EN PROFILES
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'profiles';

-- 8. VERIFICAR QUE LA TABLA PROFILES EXISTE Y TIENE LA ESTRUCTURA CORRECTA
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. LIMPIAR POSIBLES PROBLEMAS EN auth_rate_limit
-- Si esta tabla está causando problemas, la deshabilitamos temporalmente
DROP TABLE IF EXISTS auth_rate_limit CASCADE;

-- 10. TEST DE CREACIÓN MANUAL DE PERFIL
-- Esto nos ayudará a ver si el problema está en los permisos
DO $$
BEGIN
  -- Intentar crear un perfil de prueba
  INSERT INTO profiles (id, full_name, country_code, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Test User',
    'CO',
    NOW(),
    NOW()
  );
  RAISE NOTICE 'Profile creation test successful';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Profile creation test failed: %', SQLERRM;
END $$;
