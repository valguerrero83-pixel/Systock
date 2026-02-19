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
  const [busqueda, setBusqueda] = useState("");

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repuestos" },
        () => cargarInventario()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movimientos" },
        () => cargarInventario()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const itemsFiltrados = items.filter((i) => {
    const texto = busqueda.toLowerCase();
    return (
      i.nombre.toLowerCase().includes(texto) ||
      i.codigo_corto.toLowerCase().includes(texto) ||
      i.unidad.toLowerCase().includes(texto)
    );
  });

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
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <svg width="22" height="22" stroke="currentColor" fill="none">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <polyline points="3 7 12 2 21 7" />
          </svg>
          Inventario de Repuestos
        </h2>

        {/* 🔎 BUSCADOR */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por código, nombre o unidad..."
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
                {itemsFiltrados.map((i, index) => {
                  const stockBajo =
                    Number(i.stock) < Number(i.stock_minimo);

                  return (
                    <motion.tr
                      key={i.repuesto_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                    >
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {i.codigo_corto}
                      </td>

                      <td className="text-slate-700 dark:text-slate-300">
                        {i.nombre}
                      </td>

                      <td className="font-semibold">
                        <span
                          className={`
                            px-3 py-1 rounded-full text-xs font-semibold
                            ${
                              stockBajo
                                ? "bg-red-500/15 text-red-400"
                                : "bg-emerald-500/15 text-emerald-400"
                            }
                          `}
                        >
                          {i.stock} {i.unidad}
                        </span>
                      </td>

                      <td className="text-slate-600 dark:text-slate-400">
                        {i.stock_minimo} {i.unidad}
                      </td>

                      <td>
                        {stockBajo ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                            ⚠ Stock Bajo
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
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

        {/* SIN RESULTADOS */}
        {!loading && itemsFiltrados.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-8">
            No se encontraron resultados.
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
