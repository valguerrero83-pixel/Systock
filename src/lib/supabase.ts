import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,         // Mantener sesión guardada
    autoRefreshToken: true,       // Refrescar token automáticamente
    detectSessionInUrl: false,    // Evita problemas con Vercel
  },
});

// -------------------------------------------------------
// ⭐ OPCIONAL (solo para depurar en navegador)
//    Permite usar supabase desde DevTools:
//    supabase.from("users").select("*")
// -------------------------------------------------------
if (typeof window !== "undefined") {
  // @ts-ignore
  window.supabase = supabase;
}
