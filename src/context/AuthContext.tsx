import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/* ============================
        TIPOS
============================ */

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol_usuario: string;
  area: string | null;
  sede_id: string;
};

type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  logout: () => Promise<void>;
  sedeActiva: string | "all" | null;
  setSedeActiva: React.Dispatch<
    React.SetStateAction<string | "all" | null>
  >;
};

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

/* ============================
        PROVIDER
============================ */

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [sedeActiva, setSedeActiva] = useState<
    string | "all" | null
  >(null);

  /* ============================
        LOGOUT
  ============================ */
  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setSedeActiva(null);
  };

  /* ============================
        CARGAR USUARIO
  ============================ */
  const loadUser = async () => {
    setLoading(true);

    const { data: sessionData } =
      await supabase.auth.getSession();

    const session = sessionData.session;

    if (!session) {
      setUsuario(null);
      setSedeActiva(null);
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
      setSedeActiva(null);
      setLoading(false);
      return;
    }

    setUsuario(perfil);

    // 🔥 Lógica multi-sede
    if (perfil.rol_usuario === "dev") {
      setSedeActiva("all");
    } else {
      setSedeActiva(perfil.sede_id);
    }

    setLoading(false);
  };

  /* ============================
        LISTENER AUTH
  ============================ */
  useEffect(() => {
    loadUser();

    const { data: listener } =
      supabase.auth.onAuthStateChange(() => {
        loadUser();
      });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ============================
        LOADING SCREEN
  ============================ */
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  /* ============================
        PROVIDER
  ============================ */
  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        logout,
        sedeActiva,
        setSedeActiva,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);