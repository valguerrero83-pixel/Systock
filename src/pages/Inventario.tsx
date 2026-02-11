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
        className="max-w-6xl mx-auto mt-6 md:mt-8 bg-white p-4 md:p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
          <svg width="22" height="22" stroke="currentColor" fill="none">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <polyline points="3 7 12 2 21 7" />
          </svg>
          Inventario de Repuestos
        </h2>

        {/* TABLA RESPONSIVE */}
        <div className="overflow-x-auto rounded-xl shadow-inner">
          <div className="max-h-[380px] md:max-h-[450px] overflow-y-auto pr-2">
            <table className="w-full min-w-[650px] text-xs md:text-sm border-separate border-spacing-y-1">
              <thead className="sticky top-0 bg-white shadow text-gray-600 z-10">
                <tr>
                  <th className="py-3 px-2 text-left">Código</th>
                  <th className="text-left px-2">Nombre</th>
                  <th className="text-left px-2">Stock Actual</th>
                  <th className="text-left px-2">Stock Mín.</th>
                  <th className="text-left px-2">Estado</th>
                </tr>
              </thead>

              <tbody>
                {items.map((i, index) => {
                  const stockBajo = Number(i.stock) < Number(i.stock_minimo);

                  return (
                    <motion.tr
                      key={i.repuesto_id}
                      className={`
                        ${stockBajo ? "bg-yellow-50" : "bg-gray-50"}
                        hover:bg-gray-100 border border-gray-200 rounded-md
                      `}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <td className="py-3 px-2 font-semibold">{i.codigo_corto}</td>
                      <td className="px-2">{i.nombre}</td>
                      <td className="px-2 font-semibold">
                        {i.stock} {i.unidad}
                      </td>
                      <td className="px-2">
                        {i.stock_minimo} {i.unidad}
                      </td>
                      <td className="px-2">
                        {stockBajo ? (
                          <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-lg text-[10px] md:text-xs">
                            ⚠ Stock Bajo
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] md:text-xs">
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
        </div>

        {!loading && items.length === 0 && (
          <p className="text-center text-gray-500 mt-6 text-sm md:text-base">
            No hay repuestos.
          </p>
        )}

        {loading && (
          <p className="text-center text-gray-500 mt-6 animate-pulse text-sm md:text-base">
            Cargando inventario...
          </p>
        )}
      </motion.div>
    </PageTransition>
  );
}
