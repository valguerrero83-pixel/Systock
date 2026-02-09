import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface Empleado {
  id: string;
  nombre: string;
  cargo: string;
  total_movs: number;
}

export default function Empleados() {
  const { usuario } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 🔵 CARGAR EMPLEADOS + MOVIMIENTOS
  // ==========================================
  const cargarEmpleados = async () => {
    setLoading(true);

    // Traemos empleados
    const { data: lista, error } = await supabase
      .from("empleados")
      .select("id, nombre, cargo");

    if (error) {
      console.error("Error cargando empleados:", error);
      setLoading(false);
      return;
    }

    // Movimientos reales
    const { data: movimientos } = await supabase
      .from("movimientos")
      .select("entregado_por, recibido_por");

    const movCount: Record<string, number> = {};

    movimientos?.forEach((m) => {
      if (m.entregado_por) {
        movCount[m.entregado_por] = (movCount[m.entregado_por] || 0) + 1;
      }
      if (m.recibido_por) {
        movCount[m.recibido_por] = (movCount[m.recibido_por] || 0) + 1;
      }
    });

    const empleadosFormateados = lista.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      cargo: e.cargo ?? "—",
      total_movs: movCount[e.id] || 0
    }));

    setEmpleados(empleadosFormateados);
    setLoading(false);
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  // ==========================================
  // 🔴 ELIMINAR EMPLEADO **SOLO SI NO TIENE MOVS**
  // ==========================================
  const eliminarEmpleado = async (id: string) => {
    // Revisar movimientos
    const { data: movs, error: movErr } = await supabase
      .from("movimientos")
      .select("id")
      .or(`entregado_por.eq.${id},recibido_por.eq.${id}`);

    if (movErr) {
      alert("Error verificando movimientos.");
      return;
    }

    if (movs.length > 0) {
      alert("❌ No puedes eliminar un empleado con movimientos.");
      return;
    }

    // Eliminar si no tiene movimientos
    const { error } = await supabase.from("empleados").delete().eq("id", id);

    if (error) {
      alert("Error eliminando empleado.");
      return;
    }

    alert("Empleado eliminado.");
    cargarEmpleados();
  };

  // ==========================================
  // 🟡 EDITAR EMPLEADO **SOLO SI NO TIENE MOVS**
  // (Aquí solo mostramos alerta porque no sé tu modal)
  // ==========================================
  const editarEmpleado = async (empleado: Empleado) => {
    if (empleado.total_movs > 0) {
      alert("❌ Este empleado no se puede editar porque tiene movimientos.");
      return;
    }

    alert("👉 Aquí iría tu modal de edición.");
  };

  return (
    <motion.div
      className="max-w-5xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl font-semibold mb-6">Empleados</h2>

      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="py-2 text-left">Nombre</th>
            <th className="py-2 text-left">Cargo</th>
            <th className="py-2 text-center">Movs</th>
            <th className="py-2 text-center">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {empleados.map((e) => (
            <tr key={e.id} className="border-b">
              <td className="py-3">{e.nombre}</td>
              <td>{e.cargo}</td>
              <td className="text-center">{e.total_movs}</td>

              <td className="text-center">
                {(usuario?.rol_usuario === "dev" ||
                  usuario?.rol_usuario === "admin") && (
                  <div className="flex gap-3 justify-center">

                    {/* EDITAR */}
                    <button
                      onClick={() => editarEmpleado(e)}
                      disabled={e.total_movs > 0}
                      className={`${
                        e.total_movs > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:underline"
                      }`}
                    >
                      Editar
                    </button>

                    {/* ELIMINAR */}
                    <button
                      onClick={() => eliminarEmpleado(e.id)}
                      disabled={e.total_movs > 0}
                      className={`${
                        e.total_movs > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:underline"
                      }`}
                    >
                      Eliminar
                    </button>
                  </div>
                )}

                {(usuario?.rol_usuario === "viewer" ||
                  usuario?.rol_usuario === "jefe" ||
                  usuario?.rol_usuario === "gerente") && (
                  <span className="text-gray-500 text-xs">Sin permisos</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && (
        <p className="text-center text-gray-500 mt-4 animate-pulse">
          Cargando empleados en el sistema…
        </p>
      )}
    </motion.div>
  );
}
