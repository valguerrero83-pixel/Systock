import { useEffect, useState } from "react";
import { obtenerHistorialMovimientos } from "../services/historialService";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";

import type { Movimiento, Empleado, Repuesto } from "../types/index";

/* ICONO */
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
    <polyline points="8 4 17 12 8 20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Historial() {
  const [histOriginal, setHistOriginal] = useState<Movimiento[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);

  const [filtros, setFiltros] = useState({
    empleado: "",
    repuesto: "",
    tipo: "",
    desde: "",
    hasta: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const hist = await obtenerHistorialMovimientos("365");

    const { data: emp } = await supabase
      .from("empleados")
      .select("id, nombre")
      .order("nombre");

    const { data: rep } = await supabase
      .from("repuestos")
      .select("id, nombre, unidad, stock_minimo")
      .order("nombre");

    setHistOriginal(hist ?? []);
    setMovimientos(hist ?? []);
    setEmpleados(emp ?? []);
    setRepuestos(rep ?? []);
  }

  /* FILTRAR */
  function aplicarFiltros(n = filtros) {
    let lista = [...histOriginal];

    if (n.empleado) {
      lista = lista.filter(
        (m) =>
          m.empleado_entrega?.id == n.empleado ||
          m.empleado_recibe?.id == n.empleado
      );
    }

    if (n.repuesto) lista = lista.filter((m) => m.repuesto_id == n.repuesto);
    if (n.tipo) lista = lista.filter((m) => m.tipo === n.tipo);

    if (n.desde) {
      lista = lista.filter(
        (m) => new Date(m.created_at + "Z") >= new Date(n.desde)
      );
    }

    if (n.hasta) {
      const fechaTope = new Date(n.hasta);
      fechaTope.setHours(23, 59, 59);
      lista = lista.filter(
        (m) => new Date(m.created_at + "Z") <= fechaTope
      );
    }

    setMovimientos(lista);
  }

  function handleFiltro(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    const nuevos = { ...filtros, [name]: value };
    setFiltros(nuevos);
    aplicarFiltros(nuevos);
  }

  /* EXPORTAR CSV */
  function exportarCSV() {
    if (!movimientos.length) return;

    const filas = movimientos.map((m) => ({
      Fecha: new Date(m.created_at + "Z").toLocaleDateString("es-CO"),
      Tipo: m.tipo,
      Repuesto: m.repuestos?.nombre ?? "",
      Cantidad: `${m.tipo === "ENTRADA" ? "+" : "-"}${m.cantidad} ${
        m.repuestos?.unidad ?? ""
      }`,
      EntregadoPor: m.empleado_entrega?.nombre ?? "",
      RecibidoPor: m.empleado_recibe?.nombre ?? "",
    }));

    const encabezado = Object.keys(filas[0]).join(";");
    const contenido = filas
      .map((f) => Object.values(f).map((v) => `"${v}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + encabezado + "\n" + contenido], {
      type: "text/csv;charset=utf-8",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "historial_movimientos.csv";
    a.click();
  }

  return (
    <PageTransition>
      <motion.div
        className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* TÍTULO */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">
            Historial de Movimientos
          </h1>

          <button
            onClick={exportarCSV}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-900 transition"
          >
            Exportar CSV
          </button>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Filtro label="Empleado" name="empleado" value={filtros.empleado} onChange={handleFiltro}>
            <>
              <option value="">Todos</option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </>
          </Filtro>

          <Filtro label="Repuesto" name="repuesto" value={filtros.repuesto} onChange={handleFiltro}>
            <>
              <option value="">Todos</option>
              {repuestos.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </>
          </Filtro>

          <Filtro label="Tipo" name="tipo" value={filtros.tipo} onChange={handleFiltro}>
            <>
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </>
          </Filtro>

          {/* Fecha desde */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Desde</label>
            <input
              type="date"
              name="desde"
              value={filtros.desde}
              onChange={handleFiltro}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-400 focus:border-gray-400"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Hasta</label>
            <input
              type="date"
              name="hasta"
              value={filtros.hasta}
              onChange={handleFiltro}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        </div>

        {/* TABLA */}
        <div className="max-h-[550px] overflow-y-auto pr-2">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="text-gray-600">
                <Th>Fecha/Hora</Th>
                <Th>Tipo</Th>
                <Th>Repuesto</Th>
                <Th>Cantidad</Th>
                <Th>Transacción</Th>
              </tr>
            </thead>

            <tbody>
              {movimientos.map((m, index) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md"
                >
                  <Td>
                    <div className="pl-1">
                      {new Date(m.created_at + "Z").toLocaleDateString("es-CO")}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(m.created_at + "Z").toLocaleTimeString("es-CO")}
                      </span>
                    </div>
                  </Td>

                  <Td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        m.tipo === "ENTRADA"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.tipo}
                    </span>
                  </Td>

                  <Td className="text-center">
                    {m.repuestos?.nombre ?? "—"}
                  </Td>

                  <Td>
                    {m.tipo === "ENTRADA" ? "+" : "-"}
                    {m.cantidad} {m.repuestos?.unidad ?? ""}
                  </Td>

                  <Td>
                    <div className="flex items-center gap-2 pt-1">
                      {m.empleado_entrega?.nombre ?? "—"}
                      <ArrowIcon />
                      {m.empleado_recibe?.nombre ?? "—"}
                    </div>
                  </Td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PageTransition>
  );
}

/* SUBCOMPONENTES */
function Filtro({
  label,
  name,
  value,
  onChange,
  children
}: {
  label: string;
  name?: string;
  value?: string;
  onChange?: any;
  children: any;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-400 focus:border-gray-400"
      >
        {children}
      </select>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3 text-left px-2">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-3 px-2 align-middle ${className}`}>{children}</td>;
}