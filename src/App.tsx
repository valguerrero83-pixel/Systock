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

// 🚨 YA NO USAMOS logout() AQUÍ ❌
// Porque destruir la sesión rompe TODO el refresco de tokens.
function ProtectedRoute() {
  const { usuario, loading } = useAuth();

  // ⏳ Mientras cargamos la sesión (1 sola vez)
  if (loading) {
    return <div className="p-6 text-center">Cargando...</div>;
  }

  // ❌ Si NO hay usuario → sesión expirada o inválida
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // ✔ Usuario cargado correctamente
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* PÚBLICA */}
          <Route path="/login" element={<Login />} />

          {/* PROTEGIDAS */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              <Route path="/entradas" element={<Entradas />} />
              <Route path="/salidas" element={<Salidas />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/empleados" element={<Empleados />} />
              <Route path="/usuarios" element={<Usuarios />} />

            </Route>
          </Route>

          {/* DEFAULT */}
          <Route path="*" element={<Navigate to="/inventario" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}