import { createClient } from '@supabase/supabase-js';

// Tus claves de Supabase para conectar el proyecto
const supabaseUrl = 'https://zgiwtgobrmkirrbtmhkf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaXd0Z29icm1raXJyYnRtaGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTY0NDMsImV4cCI6MjA3MjMzMjQ0M30.osITwDqm6kKetgyU-HN14AoofSYOXg2qyyryO3jczdA';

// Creamos y exportamos el cliente de Supabase para usarlo en toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
