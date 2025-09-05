-- Agregar columnas para el sistema de bienvenida
-- Este script agrega las columnas necesarias para controlar si el usuario ya vio la pantalla de bienvenida

BEGIN;

-- Agregar columnas para el sistema de bienvenida a la tabla profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_seen_welcome BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS welcome_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Crear índice para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_profiles_welcome ON profiles(has_seen_welcome);

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN profiles.has_seen_welcome IS 'Indica si el usuario ya vio la pantalla de bienvenida con las nuevas funcionalidades';
COMMENT ON COLUMN profiles.welcome_seen_at IS 'Fecha y hora cuando el usuario vio la pantalla de bienvenida por primera vez';

COMMIT;
