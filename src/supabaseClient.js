// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Lee las variables de entorno inyectadas en build (CRA usa prefijo REACT_APP_)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// (Opcional) URL pública del front para redirecciones de auth (reset password, etc.)
export const SITE_URL =
  process.env.REACT_APP_SITE_URL || window.location.origin;

// Falla temprano si faltan las envs (evita builds "silenciosos" rotos)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno: REACT_APP_SUPABASE_URL y/o REACT_APP_SUPABASE_ANON_KEY'
  );
}

// Cliente Supabase con ajustes recomendados para apps web
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // maneja ?code=... al volver de email
    flowType: 'pkce',         // flujo seguro en SPAs
  },
});
