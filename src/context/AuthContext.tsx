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

  // ----------------------------
  // Cargar usuario desde Supabase
  // ----------------------------
  const loadUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

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

  // ----------------------------
  // Listener REAL sin romper nada
  // ----------------------------
useEffect(() => {
  const init = async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      await loadUser();
    } else {
      setUsuario(null);
      setLoading(false);
    }
  };

  init();

  const { data: listener } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log("AUTH EVENT:", event);

      if (session) {
        await loadUser();
      } else {
        setUsuario(null);
      }
    }
  );

  return () => listener.subscription.unsubscribe();
}, []);

  // ----------------------------
  // Logout manual
  // ----------------------------
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