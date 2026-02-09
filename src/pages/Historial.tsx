import { useEffect, useState } from "react";
import { obtenerHistorialMovimientos } from "../services/historialService";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
// import PageTransition from "../components/PageTransition.bak";

import type { Movimiento, Empleado, Repuesto } from "../types/index";

/* ICONO */
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
    <polyline
      points="8 4 17 12 8 20"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

  function handleFiltro(e: any) {
    const { name, value } = e.target;
    const nuevos = { ...filtros, [name]: value };
    setFiltros(nuevos);
    aplicarFiltros(nuevos);
  }

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
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <h2 className="text-xl font-bold mb-4">
        <ArrowIcon/> Historial de Movimientos</h2>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Filtro
          label="Empleado"
          name="empleado"
          value={filtros.empleado}
          onChange={handleFiltro}
        >
          <option value="">Todos</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </Filtro>

        <Filtro
          label="Repuesto"
          name="repuesto"
          value={filtros.repuesto}
          onChange={handleFiltro}
        >
          <option value="">Todos</option>
          {repuestos.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </Filtro>

        <Filtro
          label="Tipo"
          name="tipo"
          value={filtros.tipo}
          onChange={handleFiltro}
        >
          <option value="">Todos</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SALIDA">Salida</option>
        </Filtro>

        <FiltroFecha
          label="Desde"
          name="desde"
          value={filtros.desde}
          onChange={handleFiltro}
        />

        <FiltroFecha
          label="Hasta"
          name="hasta"
          value={filtros.hasta}
          onChange={handleFiltro}
        />
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow">
        <table className="w-full text-sm border-separate border-spacing-y-1">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <Th>Fecha</Th>
              <Th>Tipo</Th>
              <Th>Repuesto</Th>
              <Th>Cantidad</Th>
              <Th>Entrega</Th>
              <Th>Recibe</Th>
            </tr>
          </thead>

          <tbody>
            {movimientos.map((m, i) => (
              <motion.tr
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-gray-50 hover:bg-gray-100 rounded-lg"
              >
                <Td>
                  {new Date(m.created_at + "Z").toLocaleDateString("es-CO")}{" "}
                </Td>
                <Td>{m.tipo}</Td>
                <Td>{m.repuestos?.nombre}</Td>
                <Td>
                  {m.tipo === "ENTRADA" ? "+" : "-"}
                  {m.cantidad} {m.repuestos?.unidad}
                </Td>
                <Td>{m.empleado_entrega?.nombre ?? "—"}</Td>
                <Td>{m.empleado_recibe?.nombre ?? "—"}</Td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={exportarCSV}
        className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700"
      >
        Exportar CSV
      </button>
    </div>
  );
}

/* SUBCOMPONENTES */

interface FiltroProps {
  label: string;
  name?: string;
  value?: string;
  onChange?: (e: any) => void;
  children: React.ReactNode;
}

function Filtro({ label, name, value, onChange, children }: FiltroProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-white"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

interface FiltroFechaProps {
  label: string;
  name?: string;
  value?: string;
  onChange?: (e: any) => void;
}

function FiltroFecha({ label, name, value, onChange }: FiltroFechaProps) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full mt-1 px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-white"
      />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-3 font-semibold text-gray-700">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 text-gray-800">{children}</td>;
}
