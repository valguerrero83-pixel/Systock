import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import Entradas from "./pages/Entradas";
import Salidas from "./pages/Salidas";
import Inventario from "./pages/Inventario";
import Historial from "./pages/Historial";
import Login from "./pages/Login";
import Empleados from "./pages/Empleados";
import Usuarios from "./pages/Usuarios";

// --------------------------------------
// PROTECTED ROUTE
// --------------------------------------
function ProtectedRoute() {
  const { usuario, loading } = useAuth();

  if (loading) return null;
  if (!usuario) return <Navigate to="/login" replace />;

  return <Outlet />; // Permite rutas anidadas
}

// --------------------------------------
// APP
// --------------------------------------
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PRIVADAS */}
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

        {/* RUTA POR DEFECTO */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
