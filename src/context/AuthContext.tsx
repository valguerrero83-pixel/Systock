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

  /** 🔥 Cargar usuario de la sesión actual */
  const loadUser = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setUsuario(null);
        return;
      }

      const { data: perfil, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error cargando perfil:", error);
        setUsuario(null);
      } else {
        setUsuario(perfil);
      }
    } catch (err) {
      console.error("Error en loadUser:", err);
      setUsuario(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadUser();
      if (mounted) setLoading(false);
    };

    init();

    // Listener de sesión (maneja refresh tokens, logout, login)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth event:", _event);

        if (!session) {
          setUsuario(null);
        } else {
          await loadUser();
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);