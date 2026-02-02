import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }: any) {
  const { usuario, loading } = useAuth();

  // ⏳ Evitar parpadeo mientras carga la sesión
  if (loading) return <div className="p-6">Cargando...</div>;

  // 🚫 Si no hay usuario → Login
  if (!usuario) return <Navigate to="/login" replace />;

  return children;
}
