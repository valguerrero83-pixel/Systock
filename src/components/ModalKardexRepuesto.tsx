import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

export default function ModalKardexRepuesto({
  abierto,
  onClose,
  repuesto,
}: any) {

  const { sedeActiva } = useAuth();
  const [compras, setCompras] = useState<any[]>([]);

  useEffect(() => {
    if (repuesto && abierto) cargar();
  }, [repuesto, abierto]);

  async function cargar() {
    const { data } = await supabase
      .from("movimientos")
      .select("*")
      .eq("repuesto_id", repuesto.repuesto_id)
      .eq("tipo", "entrada")
      .order("created_at_tz", { ascending: false });

    setCompras(data ?? []);
  }

  if (!abierto) return null;

  const totalCompras = compras.length;

  const cantidadTotal = compras.reduce(
    (a, c) => a + Number(c.cantidad),
    0
  );

  const totalDinero = compras.reduce(
    (a, c) => a + Number(c.costo_total || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

      <div className="bg-white dark:bg-slate-900 rounded-3xl w-[95%] max-w-6xl p-6 shadow-lg">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
            Kardex – {repuesto.nombre}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500"
          >
            Cerrar
          </button>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-3 gap-4 mb-6">

          <Card titulo="Compras" valor={totalCompras} color="indigo" />
          <Card titulo="Cantidad Comprada" valor={cantidadTotal} color="emerald" />
          <Card titulo="Dinero Invertido" valor={totalDinero} color="amber" />

        </div>

        {/* TABLA */}
        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scroll">

          <table className="w-full text-sm">

            <thead className="
              sticky top-0
              bg-white/80 dark:bg-slate-900/80
              backdrop-blur
              border-b border-slate-200 dark:border-slate-800
            ">
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="py-3 px-2">Fecha</th>
                <th>Cantidad</th>
                <th>Costo Unit</th>
                <th>Costo Total</th>
                <th>Proveedor</th>
                <th>Factura</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

              {compras.map((c, index) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                >
                  <td className="py-3 px-2">
                    {new Date(c.created_at_tz).toLocaleDateString("es-CO")}
                  </td>

                  <td>{c.cantidad}</td>

                  <td className="text-slate-700 dark:text-slate-300">
                    ${Number(c.costo_unitario || 0).toLocaleString()}
                  </td>

                  <td className="font-semibold text-indigo-500">
                    ${Number(c.costo_total || 0).toLocaleString()}
                  </td>

                  <td>{c.proveedor || "—"}</td>
                  <td>{c.factura || "—"}</td>
                </motion.tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>
    </div>
  );
}

function Card({ titulo, valor, color }: any) {

  const colores: any = {
    indigo: "bg-indigo-500/10 text-indigo-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div className={`p-4 rounded-2xl ${colores[color]}`}>
      <p className="text-sm">{titulo}</p>
      <p className="text-2xl font-semibold">
        {Number(valor).toLocaleString("es-CO")}
      </p>
    </div>
  );
}