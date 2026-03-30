import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition.bak";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { obtenerKardexCompras } from "../services/kardexComprasService";
import SelectBuscable from "../components/SelectBuscable";

export default function KardexCompras() {

  const { sedeActiva } = useAuth();

  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [repuestoSeleccionado, setRepuestoSeleccionado] = useState("");
const [compras, setCompras] = useState<any[]>([]);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    cargarRepuestos();
  }, []);

  useEffect(() => {
    if (!repuestoSeleccionado) return;
    cargarCompras();
  }, [repuestoSeleccionado, sedeActiva]);

  async function cargarRepuestos() {
    const { data } = await supabase
      .from("repuestos")
      .select("id, nombre")
      .order("nombre");

    setRepuestos(data ?? []);
  }

  async function cargarCompras() {
    const data = await obtenerKardexCompras(
      repuestoSeleccionado,
      sedeActiva!
    );
    setCompras(data);
  }

  const comprasFiltradas = compras.filter((c: any) => {
    if (fechaDesde && c.fecha < fechaDesde) return false;
    if (fechaHasta && c.fecha > fechaHasta) return false;
    return true;
  });

  const totalDinero = comprasFiltradas.reduce(
    (a: number, c: any) => a + Number(c.costo_total),
    0
  );

  const totalCantidad = comprasFiltradas.reduce(
    (a: number, c: any) => a + Number(c.cantidad),
    0
  );

  const precioPromedio =
    totalCantidad > 0 ? totalDinero / totalCantidad : 0;

  return (
    <PageTransition>
      <motion.div
        className="
          max-w-7xl mx-auto
          mt-6
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-800
          rounded-3xl
          p-6
          shadow-lg
        "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <h2 className="text-xl font-semibold mb-4">
          Kardex de Compras
        </h2>

        {/* SELECT REPUESTO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          <SelectBuscable
            value={repuestoSeleccionado || "all"}
            placeholder="Seleccione repuesto"
            onChange={(id) =>
              setRepuestoSeleccionado(id === "all" ? "" : id)
            }
            items={[
              { id: "all", nombre: "Seleccione repuesto" },
              ...repuestos,
            ]}
          />

          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="px-3 py-2 rounded-xl border dark:bg-slate-800"
          />

          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="px-3 py-2 rounded-xl border dark:bg-slate-800"
          />

        </div>

        {/* CARDS */}
        <div className="grid grid-cols-3 gap-4 mb-6">

          <Card titulo="Dinero invertido" valor={totalDinero} color="indigo"/>
          <Card titulo="Cantidad comprada" valor={totalCantidad} color="emerald"/>
          <Card titulo="Precio promedio" valor={precioPromedio} color="amber"/>

        </div>

        {/* TABLA */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cantidad</th>
                <th>Costo Unit</th>
                <th>Costo Total</th>
                <th>Proveedor</th>
                <th>Factura</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map((c: any) => (
                <tr key={c.id}>
                  <td>{new Date(c.fecha).toLocaleDateString()}</td>
                  <td>{c.cantidad}</td>
                  <td>${Number(c.costo_unitario).toLocaleString()}</td>
                  <td className="font-semibold text-indigo-500">
                    ${Number(c.costo_total).toLocaleString()}
                  </td>
                  <td>{c.proveedor}</td>
                  <td>{c.factura}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </motion.div>
    </PageTransition>
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
        ${Number(valor).toLocaleString("es-CO")}
      </p>
    </div>
  );
}