import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ModalNuevoRepuesto from "../components/ModalNuevoRepuesto";
import { motion } from "framer-motion";

interface Repuesto {
  id: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  created_at: string;
}

export default function Repuestos() {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargarRepuestos() {
    setLoading(true);

    const { data, error } = await supabase
    .from("repuestos")
    .select(`
      *,
      usuario:usuario_id (
        id,
        nombre
      )
    `)
    .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setRepuestos(data as Repuesto[]);
    setLoading(false);
  }

  useEffect(() => {
    cargarRepuestos();
  }, []);

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 md:px-6 py-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-lg md:text-xl font-bold">Repuestos</h1>

        <button
          onClick={() => setModalAbierto(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition text-sm md:text-base w-full sm:w-auto"
        >
          Nuevo Repuesto
        </button>
      </div>

      {/* TABLA */}
      {loading ? (
        <p className="animate-pulse text-gray-500 text-sm md:text-base">
          Cargando...
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full min-w-[500px] text-xs md:text-sm">
            <thead className="bg-gray-100 text-left border-b">
              <tr>
                <th className="p-2 font-semibold">Nombre</th>
                <th className="p-2 font-semibold">Unidad</th>
                <th className="p-2 font-semibold">Stock mínimo</th>
                <th className="p-2 font-semibold">Registrado</th>
              </tr>
            </thead>

            <tbody>
              {repuestos.map((r: any) => (
                <tr
                  key={r.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-2">{r.nombre}</td>
                  <td className="p-2">{r.unidad}</td>
                  <td className="p-2">{r.stock_minimo}</td>
                  <td className="p-2">
                  {r.usuario?.email ? (
                    <span className="inline-flex items-center justify-center
                      w-7 h-7 rounded-full
                      bg-indigo-500/15 text-indigo-400
                      text-xs font-semibold">

                      {r.usuario.email
                        .split("@")[0]
                        .slice(0,2)
                        .toUpperCase()}
                    </span>
                  ) : "—"}
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalNuevoRepuesto
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreated={cargarRepuestos}
      />
    </motion.div>
  );
}
