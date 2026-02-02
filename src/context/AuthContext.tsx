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

  const loadUser = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users") // ⬅ tu tabla real
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error || !data) {
        console.error("❌ Error obteniendo usuario:", error);
        setUsuario(null);
      } else {
        setUsuario(data as Usuario);
      }
    } catch (e) {
      console.error("❌ Error en loadUser:", e);
      setUsuario(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setUsuario(null);
        } else {
          loadUser();
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUsuario(null);
    } catch (err) {
      console.error("❌ Error cerrando sesión:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
