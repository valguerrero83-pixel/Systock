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

  // ---------------------------
  // CARGAR PERFIL COMPLETO
  // ---------------------------
  const cargarPerfil = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        setUsuario(null);
        setLoading(false);
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
      console.error("Auth error:", err);
      setUsuario(null);
    }

    setLoading(false);
  };

  // ---------------------------
  // ON MOUNT
  // ---------------------------
  useEffect(() => {
    cargarPerfil();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log("AUTH EVENT:", event);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setLoading(true);
          await cargarPerfil();
        }

        if (event === "SIGNED_OUT") {
          setUsuario(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ---------------------------
  // LOGOUT
  // ---------------------------
  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  // ---------------------------
  // NO MOSTRAR LAYOUT HASTA CARGAR PERFIL
  // ---------------------------
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-500">
        Cargando...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
