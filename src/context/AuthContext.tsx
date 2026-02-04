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

  // --------- FUNCION QUE LIMPIA TODO Y MUESTRA LOGIN ---------
  const hardLogout = async () => {
    console.warn("⚠ Sesión inválida → Limpiando todo...");
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    setUsuario(null);
  };

  const loadUser = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      // Verificar si el token ya es inválido
      const jwt = session.access_token;
      const payload = JSON.parse(atob(jwt.split(".")[1]));
      const exp = payload.exp * 1000;

      if (Date.now() > exp) {
        await hardLogout();
        setLoading(false);
        return;
      }

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
      await hardLogout();
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);

        if (event === "SIGNED_OUT") {
          await hardLogout();
        }

        // Si el token se refrescó, recargar usuario
        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          await loadUser();
        }

        // Si no hay sesión pero tenía usuario
        if (!session) {
          await hardLogout();
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
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