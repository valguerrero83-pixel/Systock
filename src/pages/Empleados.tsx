import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface Empleado {
  id: string;
  nombre: string;
  cargo: string; // ← CORRECTO
  total_movs: number;
}

export default function Empleados() {
  const { usuario } = useAuth();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarEmpleados = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("empleados")
      .select(`
        id,
        nombre,
        cargo,      -- ← CAMPO CORRECTO
        movimientos:movimientos(count)
      `);

    if (error) {
      console.error(error);
      return;
    }

    const formato = data.map((e: any) => ({
      id: e.id,
      nombre: e.nombre,
      cargo: e.cargo ?? "—",
      total_movs: e.movimientos?.[0]?.count ?? 0,
    }));

    setEmpleados(formato);
    setLoading(false);
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

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

              {/* ACCIONES SEGÚN ROL */}
              <td className="text-center">
                {(usuario?.rol_usuario === "dev" ||
                  usuario?.rol_usuario === "admin") && (
                  <div className="flex gap-3 justify-center">
                    <button className="text-blue-600 hover:underline">
                      Editar
                    </button>

                    {/* ELIMINAR SOLO SI NO TIENE MOVIMIENTOS */}
                    {e.total_movs === 0 && (
                      <button className="text-red-600 hover:underline">
                        Eliminar
                      </button>
                    )}
                  </div>
                )}

                {/* VIEWER / JEFE / GERENTE */}
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
          Cargando empleados…
        </p>
      )}
    </motion.div>
  );
}
