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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movimientos" },
        () => {
          cargarInventario();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repuestos" },
        () => {
          cargarInventario();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <PageTransition>
      <motion.div
        className="max-w-6xl mx-auto mt-8 bg-white p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <svg width="22" height="22" stroke="currentColor" fill="none">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <polyline points="3 7 12 2 21 7" />
          </svg>
          Inventario de Repuestos
        </h2>

        <div className="max-h-[450px] overflow-y-auto pr-2 rounded-xl">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-white shadow text-gray-600">
              <tr>
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
                    className={`${
                      stockBajo ? "bg-yellow-50" : "bg-gray-50"
                    } hover:bg-gray-100 border border-gray-200 rounded-md`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td className="py-3">{i.codigo_corto}</td>
                    <td>{i.nombre}</td>
                    <td className="font-semibold">
                      {i.stock} {i.unidad}
                    </td>
                    <td>
                      {i.stock_minimo} {i.unidad}
                    </td>
                    <td>
                      {stockBajo ? (
                        <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-lg text-xs">
                          ⚠ Stock Bajo
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs">
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
          <p className="text-center text-gray-500 mt-6">
            No hay repuestos registrados.
          </p>
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
