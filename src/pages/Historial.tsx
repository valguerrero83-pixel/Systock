import { useEffect, useState } from "react";
import { obtenerHistorial } from "../services/historialService";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";

/* ICONOS */
const CalendarIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
    <polyline points="8 4 17 12 8 20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Historial() {
  const [histOriginal, setHistOriginal] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [repuestos, setRepuestos] = useState<any[]>([]);

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
    const hist = await obtenerHistorial();

    const { data: emp } = await supabase
      .from("empleados")
      .select("id, nombre")
      .order("nombre");

    const { data: rep } = await supabase
      .from("repuestos")
      .select("id, nombre")
      .order("nombre");

    setHistOriginal(hist);
    setMovimientos(hist);
    setEmpleados(emp || []);
    setRepuestos(rep || []);
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

  function handleFiltro(e: any) {
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
      Repuesto: m.repuestos?.nombre,
      Cantidad: `${m.tipo === "ENTRADA" ? "+" : "-"}${m.cantidad} ${m.repuestos?.unidad}`,
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

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historial_movimientos.csv";
    a.click();
  }

  return (
    <PageTransition>
      <motion.div
        className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >

        {/* TITULO */}
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-3 rounded-xl">
              <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-9" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">
              Historial de Movimientos
            </h1>
          </div>

          <button
            onClick={exportarCSV}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-900 flex items-center gap-2"
          >
            <svg width="18" height="18" stroke="currentColor" fill="none">
              <path d="M12 3v12M5 10l7 7 7-7" />
              <path d="M5 19h14" />
            </svg>
            Exportar CSV
          </button>
        </motion.div>

        {/* FILTROS */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
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
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
          </Filtro>

          <Filtro label="Desde">
            <input type="date" name="desde" value={filtros.desde} onChange={handleFiltro}
              className="w-full mt-1 px-3 py-2 border rounded-lg"/>
          </Filtro>

          <Filtro label="Hasta">
            <input type="date" name="hasta" value={filtros.hasta} onChange={handleFiltro}
              className="w-full mt-1 px-3 py-2 border rounded-lg"/>
          </Filtro>
        </motion.div>

        {/* TABLA */}
        <div className="max-h-[550px] overflow-y-auto pr-2">
          <table className="w-full text-sm border-separate border-spacing-y-1">
            <thead className="sticky top-0 bg-white z-10 shadow-sm rounded-md">
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
                  className="bg-gray-50 hover:bg-gray-100 transition border border-gray-200 rounded-md"
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      <CalendarIcon />
                      <div>
                        <p className="font-medium text-gray-700">
                          {new Date(m.created_at + "Z").toLocaleDateString("es-CO")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(m.created_at + "Z").toLocaleTimeString("es-CO")}
                        </p>
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      m.tipo === "ENTRADA"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {m.tipo}
                    </span>
                  </Td>

                  <Td className="font-medium text-gray-700">{m.repuestos?.nombre}</Td>

                  <Td>
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      m.tipo === "ENTRADA"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {m.tipo === "ENTRADA" ? "+" : "-"}
                      {m.cantidad} {m.repuestos?.unidad}
                    </span>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-2 text-gray-600">
                      {m.empleado_entrega?.nombre || "—"}
                      <ArrowIcon />
                      {m.empleado_recibe?.nombre || "—"}
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
function Filtro({ label, name, value, onChange, children }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      {(children?.type === "option" || children?.length > 0) ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full mt-1 px-3 py-2 border rounded-lg"
        >
          {children}
        </select>
      ) : (
        children
      )}
    </div>
  );
}

function Th({ children }: any) {
  return <th className="py-3 text-left">{children}</th>;
}

function Td({ children }: any) {
  return <td className="py-3">{children}</td>;
}
