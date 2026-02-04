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

  async function loadUserFromSession() {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      // Obtener perfil
      const { data: perfil } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUsuario(perfil ?? null);
    } catch (err) {
      console.error("Auth error:", err);
      setUsuario(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    loadUserFromSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("⚠️ Cambio de sesión:", event);

        if (!session) {
          setUsuario(null);
        } else {
          setLoading(true);
          await loadUserFromSession();
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
      {loading ? (
        <div className="p-8 text-center text-gray-600">Cargando sesión...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);