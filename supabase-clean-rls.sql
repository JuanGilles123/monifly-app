-- LIMPIEZA COMPLETA Y RECONFIGURACIÓN DE POLÍTICAS RLS
-- Ejecutar en Supabase SQL Editor

-- 1. DESHABILITAR RLS TEMPORALMENTE PARA LIMPIAR
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES (CON TODOS LOS NOMBRES POSIBLES)
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Obtener todos los nombres de políticas de la tabla profiles
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_name);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- 3. VERIFICAR QUE NO QUEDEN POLÍTICAS
SELECT 'Políticas restantes (debería estar vacío):' as info;
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';

-- 4. CREAR POLÍTICAS LIMPIAS CON NOMBRES ÚNICOS
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. HABILITAR RLS NUEVAMENTE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR POLÍTICAS CREADAS
SELECT 'Políticas activas:' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 7. AGREGAR CAMPO updated_at SI NO EXISTE
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. ACTUALIZAR TRIGGER PARA updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. FUNCIÓN PARA ACTUALIZAR PERFIL DE MANERA SEGURA
CREATE OR REPLACE FUNCTION update_user_profile(
  new_full_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF LENGTH(new_full_name) < 2 OR LENGTH(new_full_name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  UPDATE profiles 
  SET full_name = new_full_name, updated_at = NOW()
  WHERE id = current_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO profiles (id, full_name, country_code, updated_at)
    VALUES (current_user_id, new_full_name, 'CO', NOW());
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. TEST FINAL
SELECT 'Test de acceso:' as info;
SELECT 
  p.id,
  p.full_name,
  auth.uid() as current_user,
  (auth.uid() = p.id) as should_have_access
FROM profiles p 
LIMIT 3;
