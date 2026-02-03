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

          {/* 🔓 PÚBLICA */}
          <Route path="/login" element={<Login />} />

          {/* 🔐 PROTEGIDAS */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* ✔ ADMIN + DEV + VIEWER pueden entrar a ENTRADAS (pero viewer no registra) */}
              <Route element={<RequireRole allow={["admin", "dev", "viewer"]} />}>
                <Route path="/entradas" element={<Entradas />} />
              </Route>

              {/* ✔ JEFE + ADMIN + DEV + VIEWER pueden entrar a SALIDAS (viewer solo mira) */}
              <Route element={<RequireRole allow={["jefe", "admin", "dev", "viewer"]} />}>
                <Route path="/salidas" element={<Salidas />} />
              </Route>

              {/* ✔ SOLO ADMIN + DEV → Empleados */}
              <Route element={<RequireRole allow={["admin", "dev"]} />}>
                <Route path="/empleados" element={<Empleados />} />
                <Route path="/usuarios" element={<Usuarios />} />
              </Route>

              {/* ✔ TODOS LOS ROLES */}
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/historial" element={<Historial />} />

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