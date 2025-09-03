-- MEDIDA TEMPORAL: DESHABILITAR REGISTRO PÚBLICO COMPLETAMENTE
-- Ejecutar INMEDIATAMENTE en Supabase para detener el ataque

-- 1. CREAR FUNCIÓN QUE BLOQUEA TODO REGISTRO NUEVO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- BLOQUEAR TEMPORALMENTE TODOS LOS REGISTROS
  RAISE EXCEPTION 'Registration temporarily disabled due to security measures. Contact support.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ALTERNATIVA: SOLO PERMITIR REGISTRO A EMAILS WHITELISTED
-- Si prefieres esta opción, ejecuta esto en su lugar:

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo permitir emails específicos (agrega los tuyos)
  IF NEW.email NOT IN ('tu-email@ejemplo.com', 'admin@monifly.app') THEN
    RAISE EXCEPTION 'Registration currently restricted. Contact support for access.';
  END IF;
  
  -- Crear perfil solo para emails autorizados
  INSERT INTO public.profiles (id, full_name, country_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'CO')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
