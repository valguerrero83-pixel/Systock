import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition.bak";
import {
  obtenerUsuarios,
  actualizarRol,
  actualizarArea,
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

  // 🔐 Validación de permisos
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
      <div className="max-w-5xl mx-auto mt-6 md:mt-8 bg-white p-4 md:p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg md:text-xl font-bold mb-4">
          Gestión de Usuarios
        </h2>

        {cargando ? (
          <p className="text-center text-gray-500 text-sm md:text-base">
            Cargando...
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full min-w-[650px] text-xs md:text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-700">
                  <th className="py-3 px-2 text-left">Nombre</th>
                  <th className="text-left px-2">Email</th>
                  <th className="text-left px-2">Rol</th>
                  <th className="text-left px-2">Área</th>
                  <th className="text-left px-2">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((u, index) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-3 px-2 font-semibold">{u.nombre}</td>
                    <td className="px-2">{u.email}</td>

                    {/* ROL */}
                    <td className="px-2">
                      <select
                        value={u.rol_usuario || ""}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white text-xs md:text-sm"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* ÁREA */}
                    <td className="px-2">
                      <input
                        type="text"
                        className="border px-2 py-1 rounded-lg bg-white w-full text-xs md:text-sm"
                        value={u.area || ""}
                        placeholder="Área..."
                        onChange={(e) => cambiarArea(u.id, e.target.value)}
                      />
                    </td>

                    <td className="px-2">
                      <button
                        className="text-blue-600 hover:underline text-xs md:text-sm"
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
            className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs md:text-sm max-w-[80%]"
          >
            {toast}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
