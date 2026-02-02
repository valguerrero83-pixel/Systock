import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import {
  obtenerUsuarios,
  actualizarRol,
  actualizarArea
} from "../services/userService";
import { useAuth } from "../context/AuthContext";

export default function Usuarios() {
  const { usuario } = useAuth();

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState("");

  const roles = ["admin", "dev", "jefe", "empleado", "gerente"];

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      const data = await obtenerUsuarios();
      setUsuarios(data);
    } catch {
      mostrarToast("Error cargando usuarios.");
    }
    setCargando(false);
  }

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function cambiarRol(id: string, rol: string) {
    try {
      await actualizarRol(id, rol);
      mostrarToast("Rol actualizado ✓");
      cargarUsuarios();
    } catch {
      mostrarToast("Error actualizando rol.");
    }
  }

  async function cambiarArea(id: string, area: string) {
    try {
      await actualizarArea(id, area);
      mostrarToast("Área actualizada ✓");
      cargarUsuarios();
    } catch {
      mostrarToast("Error actualizando área.");
    }
  }

  // 🚫 Si no es admin o dev → NO entra
  if (usuario?.rol_usuario !== "admin" && usuario?.rol_usuario !== "dev") {
    return (
      <PageTransition>
        <div className="p-6 text-center text-red-600 text-lg font-semibold">
          No tienes permisos para acceder a esta sección.
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow-lg">

        <h2 className="text-xl font-bold mb-4">Gestión de Usuarios</h2>

        {cargando ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-700">
                  <th className="py-3">Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Área</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((u, index) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b"
                  >
                    <td className="py-3 font-semibold">{u.nombre}</td>
                    <td>{u.email}</td>

                    {/* ROL */}
                    <td>
                      <select
                        value={u.rol_usuario || ""}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>

                    {/* AREA */}
                    <td>
                      <input
                        type="text"
                        className="border px-2 py-1 rounded-lg bg-white w-full"
                        value={u.area || ""}
                        placeholder="Área..."
                        onChange={(e) => cambiarArea(u.id, e.target.value)}
                      />
                    </td>

                    <td>
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={cargarUsuarios}
                      >
                        Refrescar
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl"
          >
            {toast}
          </motion.div>
        )}

      </div>
    </PageTransition>
  );
}