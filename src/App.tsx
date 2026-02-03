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

// Solo verifica autenticación, NO roles
function ProtectedRoute() {
  const { usuario, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;
  if (!usuario) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Publica */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* TODAS SON VISIBLES PARA CUALQUIER ROL */}
              <Route path="/entradas" element={<Entradas />} />
              <Route path="/salidas" element={<Salidas />} />

              <Route path="/inventario" element={<Inventario />} />
              <Route path="/historial" element={<Historial />} />

              {/* Empleados → pero la página misma decide si viewer puede ver o no */}
              <Route path="/empleados" element={<Empleados />} />

              {/* Usuarios → igual */}
              <Route path="/usuarios" element={<Usuarios />} />

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/inventario" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}