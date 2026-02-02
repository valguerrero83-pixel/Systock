import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ allowed, children }: any) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  if (!allowed.includes(usuario.rol_usuario)) {
    return <Navigate to="/inventario" replace />;
  }

  return children;
}
