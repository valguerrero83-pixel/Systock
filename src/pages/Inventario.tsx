import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition.bak";
import { supabase } from "../lib/supabase";

interface ItemInventario {
  repuesto_id: string;
  codigo_corto: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  stock: number;
  total_movimientos: number;
  ultimo_movimiento: string | null;
}

export default function Inventario() {
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarInventario = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("stock_actual")
      .select("*")
      .order("codigo_corto", { ascending: true });

    if (error) {
      console.error("Error cargando inventario:", error);
      alert("Error cargando inventario");
    } else {
      setItems(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
  cargarInventario();

  const channel = supabase
    .channel("rt_inventario")
    .on("postgres_changes", { event: "*", schema: "public", table: "repuestos" }, () =>
      cargarInventario()
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "movimientos" }, () =>
      cargarInventario()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);


return (
  <PageTransition>
    <motion.div
      className="
        max-w-7xl mx-auto
        mt-6 md:mt-8
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        rounded-3xl
        p-6
        shadow-lg dark:shadow-black/40
      "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl md:text-2xl font-semibold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <svg width="22" height="22" stroke="currentColor" fill="none">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <polyline points="3 7 12 2 21 7" />
        </svg>
        Inventario de Repuestos
      </h2>

      {/* TABLA */}
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scroll">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
              <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3">Código</th>
                <th>Nombre</th>
                <th>Stock Actual</th>
                <th>Stock Mín.</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((i, index) => {
                const stockBajo =
                  Number(i.stock) < Number(i.stock_minimo);

                return (
                  <motion.tr
                    key={i.repuesto_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                      transition
                    "
                  >
                    {/* Código */}
                    <td className="py-4 font-semibold text-slate-800 dark:text-slate-100">
                      {i.codigo_corto}
                    </td>

                    {/* Nombre */}
                    <td className="text-slate-700 dark:text-slate-200 font-medium">
                      {i.nombre}
                    </td>

                    {/* Stock actual */}
                    <td className="font-semibold">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            stockBajo
                              ? "bg-red-500/15 text-red-400"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}
                      >
                        {i.stock} {i.unidad}
                      </span>
                    </td>

                    {/* Stock mínimo */}
                    <td className="text-slate-600 dark:text-slate-400">
                      {i.stock_minimo} {i.unidad}
                    </td>

                    {/* Estado */}
                    <td>
                      {stockBajo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-red-500/15 text-red-400">
                          ⚠ Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                          ✓ Normal
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && items.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-8">
          No hay repuestos registrados.
        </p>
      )}

      {loading && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-8 animate-pulse">
          Cargando inventario...
        </p>
      )}
    </motion.div>
  </PageTransition>
);

}
