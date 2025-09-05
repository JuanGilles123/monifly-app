-- Script para agregar columnas de rachas a la tabla profiles
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar columnas para el sistema de rachas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_activity 
ON profiles(last_activity_date);

-- Actualizar la política RLS para las nuevas columnas
-- Las políticas existentes deberían cubrir estas columnas automáticamente

-- Comentario: Este script agrega soporte para el sistema de rachas
-- current_streak: días consecutivos de actividad
-- max_streak: récord máximo de días consecutivos
-- last_activity_date: última fecha de actividad registrada
