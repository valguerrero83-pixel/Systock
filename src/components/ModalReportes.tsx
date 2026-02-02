import { useEffect, useState } from "react";
import { obtenerEmpleados } from "../services/salidasService";
import { obtenerRepuestos } from "../services/entradasService";
import { obtenerHistorialMovimientos } from "../services/reportesService";

export default function ModalReportes({ abierto, onClose }: any) {
  const [empleados, setEmpleados] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [historial, setHistorial] = useState([]);

  const [filtros, setFiltros] = useState({
    empleado: "",
    repuesto: "",
    periodo: "30",
  });

  useEffect(() => {
    if (abierto) cargarFiltros();
  }, [abierto]);

  async function cargarFiltros() {
    const [emp, rep] = await Promise.all([
      obtenerEmpleados(),
      obtenerRepuestos(),
    ]);

    setEmpleados(emp);
    setRepuestos(rep);
    filtrarMovimientos("30");
  }

  async function filtrarMovimientos(periodo: string) {
    const datos = await obtenerHistorialMovimientos(periodo);
    setHistorial(datos);
  }

  async function handleFiltro(e: any) {
    const { name, value } = e.target;
    setFiltros({ ...filtros, [name]: value });

    if (name === "periodo") {
      filtrarMovimientos(value);
    }
  }

  function exportarCSV() {
    if (historial.length === 0) return;

    const filas = historial.map((m) => ({
      Fecha: m.created_at,
      Tipo: m.tipo,
      Repuesto: m.repuestos?.nombre,
      Cantidad: m.cantidad,
      EntregadoPor: m.empleado_entrega?.nombre ?? "",
      RecibidoPor: m.empleado_recibe?.nombre ?? "",
    }));

    const encabezados = Object.keys(filas[0]).join(",");
    const contenido = filas.map((row) =>
      Object.values(row).join(",")
    );

    const csv = [encabezados, ...contenido].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_movimientos.csv";
    a.click();
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-start pt-10 z-50">

      <div className="bg-white w-[90%] max-w-6xl rounded-2xl shadow-xl p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            Historial de Movimientos
          </h2>

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

          <button onClick={onClose} className="text-gray-600 text-lg px-3 hover:text-gray-800">
            ✕
          </button>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          {/* Empleado */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Empleado</label>
            <select
              name="empleado"
              value={filtros.empleado}
              onChange={handleFiltro}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="">Todos</option>
              {empleados.map((e: any) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          {/* Repuesto */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Repuesto</label>
            <select
              name="repuesto"
              value={filtros.repuesto}
              onChange={handleFiltro}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="">Todos</option>
              {repuestos.map((r: any) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          {/* Periodo */}
          <div>
            <label className="text-sm font-semibold text-gray-700">Periodo</label>
            <select
              name="periodo"
              value={filtros.periodo}
              onChange={handleFiltro}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="90">Últimos 90 días</option>
              <option value="365">Último año</option>
            </select>
          </div>

        </div>

        {/* TABLA */}
        <div className="border rounded-xl overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha/Hora</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Repuesto</th>
                  <th className="px-4 py-3 text-left">Cantidad</th>
                  <th className="px-4 py-3 text-left">Entregado por</th>
                  <th className="px-4 py-3 text-left">Recibido por</th>
                </tr>
              </thead>

              <tbody>
                {historial.map((m: any) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">

                    <td className="px-4 py-3">
                      {new Date(m.created_at).toLocaleDateString("es-CO")} <br />
                      <span className="text-xs text-gray-500">
                        {new Date(m.created_at).toLocaleTimeString("es-CO")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-white text-xs ${
                        m.tipo === "ENTRADA" ? "bg-green-500" : "bg-red-500"
                      }`}>
                        {m.tipo}
                      </span>
                    </td>

                    <td className="px-4 py-3">{m.repuestos?.nombre}</td>

                    <td className="px-4 py-3">
                      {m.tipo === "ENTRADA" ? "+" : "-"}
                      {m.cantidad} <span className="text-gray-500">{m.repuestos?.unidad}</span>
                    </td>

                    <td className="px-4 py-3">{m.empleado_entrega?.nombre ?? "-"}</td>
                    <td className="px-4 py-3">{m.empleado_recibe?.nombre ?? "-"}</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}