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
      .select("*")
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
      className="max-w-5xl mx-auto p-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Repuestos</h1>

        <button
          onClick={() => setModalAbierto(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          Nuevo Repuesto
        </button>
      </div>

      {loading ? (
        <p className="animate-pulse text-gray-500">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left border-b">
              <tr>
                <th className="p-2">Nombre</th>
                <th className="p-2">Unidad</th>
                <th className="p-2">Stock mínimo</th>
              </tr>
            </thead>

            <tbody>
              {repuestos.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{r.nombre}</td>
                  <td className="p-2">{r.unidad}</td>
                  <td className="p-2">{r.stock_minimo}</td>
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