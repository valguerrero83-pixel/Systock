import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";
import type { Empleado } from "../types/index";

interface EmpleadoConMovimientos extends Empleado {
  movimientos: number;
}

export default function Empleados() {
  const { usuario } = useAuth();

  const [empleados, setEmpleados] = useState<EmpleadoConMovimientos[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Cargar empleados + contar movimientos real
  async function cargarEmpleados() {
    setLoading(true);

    // 1️⃣ Obtener empleados
    const { data: empleadosData, error: empError } = await supabase
      .from("empleados")
      .select("*")
      .order("nombre", { ascending: true });

    if (empError || !empleadosData) {
      console.error("Error cargando empleados:", empError);
      setLoading(false);
      return;
    }

    // 2️⃣ Obtener movimientos
    const { data: movData } = await supabase
      .from("movimientos")
      .select("empleado_entrega_id, empleado_recibe_id");

    const movCount: Record<string, number> = {};

    movData?.forEach((m) => {
      if (m.empleado_entrega_id)
        movCount[m.empleado_entrega_id] = (movCount[m.empleado_entrega_id] || 0) + 1;

      if (m.empleado_recibe_id)
        movCount[m.empleado_recibe_id] = (movCount[m.empleado_recibe_id] || 0) + 1;
    });

    // 3️⃣ Unir
    const empleadosFinal: EmpleadoConMovimientos[] = empleadosData.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      area: e.area ?? null,
      movimientos: movCount[e.id] || 0,
    }));

    setEmpleados(empleadosFinal);
    setLoading(false);
  }

  useEffect(() => {
    cargarEmpleados();
  }, []);

  async function eliminarEmpleado(id: string) {
    const confirmar = confirm("¿Seguro que deseas eliminar este empleado?");
    if (!confirmar) return;

    // 1️⃣ Verificar movimientos
    const { count: movCount } = await supabase
      .from("movimientos")
      .select("*", { count: "exact", head: true })
      .or(`empleado_entrega_id.eq.${id},empleado_recibe_id.eq.${id}`);

    if (movCount && movCount > 0) {
      alert("❌ No puedes eliminar este empleado: tiene movimientos.");
      return;
    }

    // 2️⃣ Eliminar
    await supabase.from("empleados").delete().eq("id", id);

    alert("Empleado eliminado ✓");
    cargarEmpleados();
  }

  return (
    <PageTransition>
      <motion.div
        className="max-w-5xl mx-auto bg-white p-6 rounded-2xl shadow mt-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-6">Empleados</h1>

        {loading ? (
          <p>Cargando…</p>
        ) : (
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead>
              <tr className="text-gray-700">
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Movs</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {empleados.map((e) => (
                <tr key={e.id} className="bg-gray-50 hover:bg-gray-100">
                  <td className="py-3 px-2 font-medium">{e.nombre}</td>
                  <td className="py-3 px-2">{e.area || "—"}</td>
                  <td className="py-3 px-2">{e.movimientos}</td>

                  <td className="py-3 px-2">
                    {usuario?.rol_usuario === "admin" ? (
                      <button
                        onClick={() => eliminarEmpleado(e.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                      >
                        Eliminar
                      </button>
                    ) : (
                      <p className="text-gray-500 text-xs">Sin permisos</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </PageTransition>
  );
}