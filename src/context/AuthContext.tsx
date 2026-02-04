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

  // Cargar usuario desde la sesión actual
  const loadUser = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      const { data: perfil } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUsuario(perfil ?? null);
    } catch (error) {
      console.error("Error en loadUser:", error);
      setUsuario(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    console.log("🔄 AuthContext cargando...");
    loadUser();

    // Escuchar cambios de sesión reales (incluye refresh tokens)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("🔔 Sesión cambió:", _event);

        if (!session) {
          setUsuario(null);
        } else {
          await loadUser(); // SIEMPRE refrescar perfil
        }
      }
    );

    return () => {
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