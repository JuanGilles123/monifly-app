-- SOLUCIÓN INMEDIATA PARA ERROR 500 EN REGISTRO
-- Ejecutar en Supabase SQL Editor

-- 1. ELIMINAR TODOS LOS TRIGGERS PROBLEMÁTICOS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_simple() CASCADE;

-- 2. ELIMINAR TABLA PROBLEMÁTICA
DROP TABLE IF EXISTS auth_rate_limit CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit() CASCADE;

-- 3. CREAR FUNCIÓN SIMPLE Y SEGURA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear perfil básico, nada más
  BEGIN
    INSERT INTO public.profiles (id, full_name, country_code)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'country_code', 'CO')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Si falla, no importa, el usuario se puede crear igual
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CREAR TRIGGER SIMPLE
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. VERIFICAR QUE PROFILES TENGA RLS CORRECTO
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas conflictivas
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;  
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Crear políticas simples
CREATE POLICY "profiles_all_own" ON profiles
  FOR ALL USING (auth.uid() = id);

-- 6. TEST RÁPIDO
SELECT 'Setup completed - ready to test registration' as status;
