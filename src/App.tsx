import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import Entradas from "./pages/Entradas";
import Salidas from "./pages/Salidas";
import Inventario from "./pages/Inventario";
import Historial from "./pages/Historial";
import Login from "./pages/Login";
import Empleados from "./pages/Empleados";
import Usuarios from "./pages/Usuarios";

// 🔒 Wrapper de permisos
function RequireRole({ allow }: { allow: string[] }) {
  const { usuario } = useAuth();

  if (!usuario) return <Navigate to="/login" replace />;

  return allow.includes(usuario.rol_usuario)
    ? <Outlet />
    : <Navigate to="/inventario" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ROUTA PÚBLICA */}
          <Route path="/login" element={<Login />} />

          {/* RUTAS PROTEGIDAS */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* 🔵 ACCESO SOLO ADMIN + DEV */}
              <Route element={<RequireRole allow={["admin", "dev"]} />}>
                <Route path="/entradas" element={<Entradas />} />
                <Route path="/empleados" element={<Empleados />} />
              </Route>

              {/* 🔵 ACCESO SOLO JEFE + ADMIN + DEV */}
              <Route element={<RequireRole allow={["jefe", "admin", "dev"]} />}>
                <Route path="/salidas" element={<Salidas />} />
              </Route>

              {/* 🔵 ACCESO PARA TODOS LOS ROLES */}
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/historial" element={<Historial />} />
                
              <Route path="/usuarios" element={<Usuarios />} />

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/inventario" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function ProtectedRoute() {
  const { usuario, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;
  if (!usuario) return <Navigate to="/login" replace />;

  return <Outlet />;
}
