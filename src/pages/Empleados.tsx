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

  const cargarEmpleados = async () => {
    setLoading(true);

    const { data: lista, error } = await supabase
      .from("empleados")
      .select("id, nombre, cargo");

    if (error) {
      console.error("Error cargando empleados:", error);
      setLoading(false);
      return;
    }

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
      total_movs: movCount[e.id] || 0,
    }));

    setEmpleados(empleadosFormateados);
    setLoading(false);
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

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

return (
  <motion.div
    className="
      max-w-6xl mx-auto mt-6 md:mt-8 px-6
      bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-800
      rounded-3xl p-6
      shadow-lg dark:shadow-black/40
    "
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h2 className="text-xl md:text-2xl font-semibold mb-6 
      text-slate-800 dark:text-slate-100">
      Empleados
    </h2>

    {/* TABLA RESPONSIVE */}
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
          {empleados.map((e, index) => (
            <motion.tr
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
            >
              {/* NOMBRE */}
              <td className="py-4 px-3 font-medium text-slate-800 dark:text-slate-100">
                {e.nombre}
              </td>

              {/* CARGO */}
              <td className="px-3 text-slate-600 dark:text-slate-300">
                {e.cargo}
              </td>

              {/* MOVIMIENTOS */}
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

              {/* ACCIONES */}
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

    {loading && (
      <p className="text-center text-slate-500 dark:text-slate-400 mt-6 animate-pulse">
        Cargando empleados…
      </p>
    )}
  </motion.div>
);
}
