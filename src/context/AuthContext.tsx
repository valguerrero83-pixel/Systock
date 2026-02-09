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

  // ----------------------------------
  // CARGAR USUARIO DESDE TOKEN
  // ----------------------------------
  const loadUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();

      const session = data.session;

      if (!session) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      console.log("sesion user id:",
        session.user.id
      );


      const { data: perfil, error: perfilError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    console.log("Perfil ERROR:", perfilError);
    console.log("Perfil DATA:", perfil);

      setUsuario(perfil ?? null);
    } catch (error) {
      console.error("Auth error:", error);
      setUsuario(null);
    }

    setLoading(false);
  };

  // ----------------------------------
  // LISTENER REAL
  // ----------------------------------
  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log("AUTH EVENT:", event);

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await loadUser();
        }

        if (event === "SIGNED_OUT") {
          setUsuario(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);