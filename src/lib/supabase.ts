import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,       // 🔥 Mantiene la sesión guardada
    autoRefreshToken: true,     // 🔥 Renueva tokens automáticamente
    detectSessionInUrl: true,   // 🔥 Evita problemas de login en producción
  },
});