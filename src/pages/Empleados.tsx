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
  const [busqueda, setBusqueda] = useState("");
  const { sedeActiva } = useAuth();

const cargarEmpleados = async () => {
  setLoading(true);

  // 🔹 EMPLEADOS
  let empQuery = supabase
    .from("empleados")
    .select("id, nombre, area, sede_id");

  if (sedeActiva && sedeActiva !== "all") {
    empQuery = empQuery.eq("sede_id", sedeActiva);
  }

  const { data: lista, error } = await empQuery;

  if (error) {
    console.error("Error cargando empleados:", error);
    setLoading(false);
    return;
  }

  // 🔹 MOVIMIENTOS
  let movQuery = supabase
    .from("movimientos")
    .select("entregado_por, recibido_por, sede_id");

  if (sedeActiva && sedeActiva !== "all") {
    movQuery = movQuery.eq("sede_id", sedeActiva);
  }

  const { data: movimientos } = await movQuery;

  const movCount: Record<string, number> = {};

  movimientos?.forEach((m) => {
    if (m.entregado_por) {
      movCount[m.entregado_por] =
        (movCount[m.entregado_por] || 0) + 1;
    }
    if (m.recibido_por) {
      movCount[m.recibido_por] =
        (movCount[m.recibido_por] || 0) + 1;
    }
  });

  const empleadosFormateados = (lista ?? []).map((e) => ({
    id: e.id,
    nombre: e.nombre,
    cargo: e.area ?? "—", // 🔥 IMPORTANTE: tu BD usa area
    total_movs: movCount[e.id] || 0,
  }));

  setEmpleados(empleadosFormateados);
  setLoading(false);
};

useEffect(() => {
  if (!sedeActiva) return;
  cargarEmpleados();
}, [sedeActiva]);

  const eliminarEmpleado = async (id: string) => {
    const { data: movs, error: movErr } = await supabase
      .from("movimientos")
      .select("id")
      .or(`entregado_por.eq."${id}",recibido_por.eq."${id}"`);

    if (movErr) {
      console.error(movErr);
      alert("Error verificando movimientos.");
      return;
    }

    if (movs.length > 0) {
      alert("❌ No puedes eliminar un empleado con movimientos.");
      return;
    }

    const { error } = await supabase
      .from("empleados")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error eliminando empleado.");
      return;
    }

    alert("Empleado eliminado correctamente.");
    cargarEmpleados();
  };

  const empleadosFiltrados = empleados.filter((e) => {
    const texto = busqueda.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(texto) ||
      e.cargo.toLowerCase().includes(texto)
    );
  });

  return (
    <motion.div
      className="
        max-w-7xl mx-auto mt-6 md:mt-8 px-6
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        rounded-3xl p-6
        shadow-lg dark:shadow-black/40
      "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl md:text-2xl font-semibold mb-4 
        text-slate-800 dark:text-slate-100">
        Empleados
      </h2>

      {/* 🔎 BUSCADOR */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o cargo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="
            w-full md:w-96
            px-4 py-2.5
            rounded-xl
            border border-slate-300 dark:border-slate-700
            bg-white dark:bg-slate-800
            text-slate-800 dark:text-slate-200
            focus:outline-none
            focus:ring-2 focus:ring-indigo-500
            transition
          "
        />
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[650px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr className="text-left text-slate-500 dark:text-slate-400">
              <th className="py-3 px-3 font-semibold">Nombre</th>
              <th className="px-3 font-semibold">Cargo</th>
              <th className="px-3 text-center font-semibold">Movimientos</th>
              <th className="px-3 text-center font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {empleadosFiltrados.map((e, index) => (
              <motion.tr
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                <td className="py-4 px-3 font-medium text-slate-800 dark:text-slate-100">
                  {e.nombre}
                </td>

                <td className="px-3 text-slate-600 dark:text-slate-300">
                  {e.cargo}
                </td>

                <td className="text-center px-3">
                  <span className="
                    inline-flex items-center
                    px-3 py-1
                    rounded-full
                    text-xs font-semibold
                    bg-indigo-500/15
                    text-indigo-400
                  ">
                    {e.total_movs}
                  </span>
                </td>

                <td className="text-center px-3">
                  {(usuario?.rol_usuario === "dev" ||
                    usuario?.rol_usuario === "admin") && (
                    <button
                      onClick={() => eliminarEmpleado(e.id)}
                      disabled={e.total_movs > 0}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-semibold transition
                        ${
                          e.total_movs > 0
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                        }
                      `}
                    >
                      Eliminar
                    </button>
                  )}

                  {(usuario?.rol_usuario === "viewer" ||
                    usuario?.rol_usuario === "jefe" ||
                    usuario?.rol_usuario === "gerente") && (
                    <span className="text-slate-400 text-xs">
                      Sin permisos
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && empleadosFiltrados.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-6">
          No se encontraron empleados.
        </p>
      )}

      {loading && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-6 animate-pulse">
          Cargando empleados…
        </p>
      )}
    </motion.div>
  );
}
