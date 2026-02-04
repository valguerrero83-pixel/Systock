import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol_usuario: string;
  area: string | null;
};

type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const hardLogout = async () => {
    console.warn("⚠ Sesión inválida → cerrando todo");
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    setUsuario(null);
  };

  const loadUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      // SESIÓN VACÍA → logout inmediato
      if (!session) {
        await hardLogout();
        return;
      }

      // Validar expiración del token
      const payload = JSON.parse(atob(session.access_token.split(".")[1]));
      const exp = payload.exp * 1000;

      if (Date.now() > exp) {
        await hardLogout();
        return;
      }

      // Obtener perfil
      const { data: perfil, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !perfil) {
        await hardLogout();
        return;
      }

      setUsuario(perfil);
    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
      await hardLogout();
    }

    setLoading(false);
  };

  useEffect(() => {
    // cargar user inicial
    loadUser();

    // escuchar login y logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log("🔔 EVENT:", event);

        if (event === "SIGNED_IN") {
          await loadUser();
          return;
        }

        if (event === "SIGNED_OUT") {
          await hardLogout();
          return;
        }

        // "INITIAL_SESSION" se ignora, no hacer nada
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await hardLogout();
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);