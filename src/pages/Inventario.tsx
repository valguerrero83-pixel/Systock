import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";

export default function Inventario() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* Cargar inventario desde la vista */
  async function cargarInventario() {
    setLoading(true);

    const { data, error } = await supabase
      .from("stock_actual")
      .select("*")
      .order("codigo_corto", { ascending: true });

    if (error) {
      console.error("Error cargando inventario:", error);
      alert("Error cargando inventario");
    } else {
      setItems(data);
    }

    setLoading(false);
  }

  /* Realtime */
  useEffect(() => {
    cargarInventario();

    const listener = supabase
      .channel("rt_inventario")
      .on("postgres_changes", { event: "*", schema: "public", table: "movimientos" }, cargarInventario)
      .on("postgres_changes", { event: "*", schema: "public", table: "repuestos" }, cargarInventario)
      .subscribe();

    return () => supabase.removeChannel(listener);
  }, []);

  return (
    <PageTransition>
      <motion.div
        className="max-w-6xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <polyline points="3 7 12 2 21 7" />
          </svg>
          Inventario de Repuestos
        </h2>

        <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-600 bg-white sticky top-0 shadow">
                <th className="py-3">Código</th>
                <th>Nombre</th>
                <th>Stock Actual</th>
                <th>Stock Mín.</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {items.map((i, index) => {
                const stockBajo = Number(i.stock) < Number(i.stock_minimo);

                return (
                  <motion.tr
                    key={i.repuesto_id}
                    className={`border-b ${stockBajo ? "bg-yellow-50" : ""}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.25 }}
                  >
                    <td className="py-3">{i.codigo_corto}</td>
                    <td>{i.nombre}</td>
                    <td className="font-semibold">{i.stock} <span className="text-gray-500">{i.unidad}</span></td>
                    <td>{i.stock_minimo} <span className="text-gray-500">{i.unidad}</span></td>
                    <td>
                      {stockBajo ? (
                        <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-lg text-xs font-semibold">
                          ⚠ Stock Bajo
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold">
                          Normal
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && items.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No hay repuestos registrados.</p>
        )}

        {loading && (
          <p className="text-center text-gray-500 mt-6 animate-pulse">
            Cargando inventario...
          </p>
        )}
      </motion.div>
    </PageTransition>
  );
}
