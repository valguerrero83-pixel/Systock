import { useEffect, useState } from "react";
import { obtenerHistorialMovimientos } from "../services/historialService";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import type { Movimiento, Empleado, Repuesto } from "../types/index";

/* ============================
   FORMATEAR FECHA / HORA
============================ */
function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return { fecha: "—", hora: "" };

  try {
    const f = new Date(fecha);
    return {
      fecha: f.toLocaleDateString("es-CO", { timeZone: "America/Bogota" }),
      hora: f.toLocaleTimeString("es-CO", {
        timeZone: "America/Bogota",
        hour12: false,
      }),
    };
  } catch {
    return { fecha: "—", hora: "" };
  }
}

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

  /* ============================
         CARGAR DATOS
  ============================= */
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

  /* ============================
         FILTROS
  ============================= */
  function aplicarFiltros(n = filtros) {
    let lista = [...histOriginal];

    if (n.empleado) {
      lista = lista.filter(
        (m) =>
          m.empleado_entrega?.id === n.empleado ||
          m.empleado_recibe?.id === n.empleado
      );
    }

    if (n.repuesto) lista = lista.filter((m) => m.repuesto_id === n.repuesto);
    if (n.tipo) lista = lista.filter((m) => m.tipo === n.tipo);

    if (n.desde) {
      const d = new Date(n.desde);
      lista = lista.filter((m) => new Date(m.created_at_tz) >= d);
    }

    if (n.hasta) {
      const h = new Date(n.hasta);
      h.setHours(23, 59, 59);
      lista = lista.filter((m) => new Date(m.created_at_tz) <= h);
    }

    setMovimientos(lista);
  }

  function handleFiltro(e: any) {
    const { name, value } = e.target;
    const nuevos = { ...filtros, [name]: value };
    setFiltros(nuevos);
    aplicarFiltros(nuevos);
  }

  /* ============================
       EXPORTAR CSV
  ============================= */
  function exportarCSV() {
    if (!movimientos.length) return;

    const filas = movimientos.map((m) => {
      const { fecha, hora } = formatearFecha(m.created_at_tz);

      return {
        Fecha: `${fecha} ${hora}`,
        Tipo: m.tipo,
        Repuesto: m.repuestos?.nombre ?? "",
        Cantidad:
          (m.tipo === "entrada" ? "+" : "-") +
          m.cantidad +
          " " +
          (m.repuestos?.unidad ?? ""),
        Entrega: m.empleado_entrega?.nombre ?? "",
        Recibe: m.empleado_recibe?.nombre ?? "",
      };
    });

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

  /* ============================
        RENDER
  ============================= */

  return (
    <div className="max-w-7xl mx-auto mt-6 md:mt-8 px-4">
      <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
        <ArrowIcon /> Historial de Movimientos
      </h2>

      {/* FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Filtro label="Empleado" name="empleado" value={filtros.empleado} onChange={handleFiltro}>
          <option value="">Todos</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </Filtro>

        <Filtro label="Repuesto" name="repuesto" value={filtros.repuesto} onChange={handleFiltro}>
          <option value="">Todos</option>
          {repuestos.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
          ))}
        </Filtro>

        <Filtro label="Tipo" name="tipo" value={filtros.tipo} onChange={handleFiltro}>
          <option value="">Todos</option>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
        </Filtro>

        <FiltroFecha label="Desde" name="desde" value={filtros.desde} onChange={handleFiltro} />
        <FiltroFecha label="Hasta" name="hasta" value={filtros.hasta} onChange={handleFiltro} />
      </div>

      {/* TABLA RESPONSIVE */}
      <div className="overflow-x-auto rounded-2xl shadow bg-white">
        <div className="max-h-[420px] md:max-h-[460px] overflow-y-auto">
          <table className="w-full text-xs md:text-sm min-w-[700px] border-separate border-spacing-y-1">
            <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
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
              {movimientos.map((m, i) => {
                const { fecha, hora } = formatearFecha(m.created_at_tz);

                return (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-gray-50 hover:bg-gray-100 rounded-lg"
                  >
                    <Td>
                      <div className="font-medium">{fecha}</div>
                      <div className="text-[10px] md:text-xs text-gray-500">{hora}</div>
                    </Td>

                    <Td>
                      <span
                        className={`px-2 py-1 rounded-lg text-white text-[10px] md:text-xs font-semibold
                        ${m.tipo === "entrada" ? "bg-green-400" : "bg-red-400"}`}
                      >
                        {m.tipo}
                      </span>
                    </Td>


                    <Td>{m.repuestos?.nombre}</Td>

                    <Td>
                      <span
                        className={`font-semibold ${
                          m.tipo === "entrada" ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {m.tipo === "entrada" ? "+" : "-"}
                        {m.cantidad}
                      </span>{" "}
                      <span className="text-gray-700 text-[10px] md:text-xs">
                        {m.repuestos?.unidad}
                      </span>
                    </Td>

                    <Td>{m.empleado_entrega?.nombre ?? "—"}</Td>
                    <Td>{m.empleado_recibe?.nombre ?? "—"}</Td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTÓN EXPORTAR */}
      <button
        onClick={exportarCSV}
        className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 text-sm md:text-base"
      >
        Exportar CSV
      </button>
    </div>
  );
}

/* ============================
    SUBCOMPONENTES
============================ */

function Filtro({ label, name, value, onChange, children }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-white text-sm"
      >
        {children}
      </select>
    </div>
  );
}

function FiltroFecha({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full mt-1 px-3 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-white text-sm"
      />
    </div>
  );
}

function Th({ children }: any) {
  return (
    <th className="py-3 px-2 font-semibold text-gray-700 text-left">
      {children}
    </th>
  );
}

function Td({ children }: any) {
  return (
    <td className="py-3 px-2 text-gray-800">
      {children}
    </td>
  );
}
