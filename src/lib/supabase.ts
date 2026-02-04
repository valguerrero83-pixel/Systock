import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,       // Mantiene sesión
    autoRefreshToken: true,     // 🔥 Renueva token automáticamente
    detectSessionInUrl: false,  // 🔥 Debe ser FALSE en SPA (React + Vercel)
  },
});