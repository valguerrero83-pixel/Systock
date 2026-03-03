import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

import { getEmpleados } from "../services/salidasService";
import { obtenerRepuestos } from "../services/entradasService";
import { obtenerHistorialMovimientos } from "../services/historialService";

import type { Empleado, Repuesto, Movimiento } from "../types";

interface PropsModal {
  abierto: boolean;
  onClose: () => void;
}

export default function ModalReportes({ abierto, onClose }: PropsModal) {
  const { sedeActiva } = useAuth();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [historial, setHistorial] = useState<Movimiento[]>([]);

  const [filtros, setFiltros] = useState({
    empleado: "",
    repuesto: "",
    periodo: "30",
  });

  useEffect(() => {
    if (abierto && sedeActiva) {
      cargarDatos();
    }
  }, [abierto, sedeActiva]);

  async function cargarDatos() {
    if (!sedeActiva) return;

    const [emp, rep] = await Promise.all([
      getEmpleados(sedeActiva),
      obtenerRepuestos(sedeActiva),
    ]);

    setEmpleados(emp ?? []);
    setRepuestos(rep ?? []);

    await filtrarMovimientos(filtros.periodo);
  }

  async function filtrarMovimientos(periodo: string) {
    if (!sedeActiva) return;

    const datos = await obtenerHistorialMovimientos(periodo, sedeActiva);

    let lista = datos ?? [];

    if (filtros.empleado) {
      lista = lista.filter(
        (m) =>
          m.empleado_entrega?.id === filtros.empleado ||
          m.empleado_recibe?.id === filtros.empleado
      );
    }

    if (filtros.repuesto) {
      lista = lista.filter((m) => m.repuesto_id === filtros.repuesto);
    }

    setHistorial(lista);
  }

  function handleFiltro(e: React.ChangeEvent<HTMLSelectElement>) {
    const { name, value } = e.target;

    const nuevosFiltros = { ...filtros, [name]: value };
    setFiltros(nuevosFiltros);

    if (name === "periodo") {
      filtrarMovimientos(value);
    } else {
      filtrarMovimientos(nuevosFiltros.periodo);
    }
  }

  function exportarCSV() {
    if (historial.length === 0) return;

    const filas = historial.map((m) => ({
      Fecha: m.created_at_tz,
      Tipo: m.tipo,
      Repuesto: m.repuestos?.nombre,
      Cantidad: m.cantidad,
      EntregadoPor: m.empleado_entrega?.nombre ?? "",
      RecibidoPor: m.empleado_recibe?.nombre ?? "",
      Sede: m.sedes?.nombre ?? "", // 🔥 para modo ALL
    }));

    const encabezados = Object.keys(filas[0]).join(",");
    const contenido = filas
      .map((f) => Object.values(f).join(","))
      .join("\n");

    const blob = new Blob(
      [encabezados + "\n" + contenido],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_movimientos.csv";
    a.click();
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Historial de Movimientos
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={exportarCSV}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-900 text-sm sm:text-base"
            >
              Exportar CSV
            </button>

            <button
              onClick={onClose}
              className="text-gray-600 text-2xl px-3 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-semibold">Empleado</label>
            <select
              name="empleado"
              value={filtros.empleado}
              onChange={handleFiltro}
              className="w-full px-3 py-2 border rounded-lg mt-1"
            >
              <option value="">Todos</option>
              {empleados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Repuesto</label>
            <select
              name="repuesto"
              value={filtros.repuesto}
              onChange={handleFiltro}
              className="w-full px-3 py-2 border rounded-lg mt-1"
            >
              <option value="">Todos</option>
              {repuestos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Periodo</label>
            <select
              name="periodo"
              value={filtros.periodo}
              onChange={handleFiltro}
              className="w-full px-3 py-2 border rounded-lg mt-1"
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
          <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Fecha/Hora</th>
                  <th>Tipo</th>
                  <th>Repuesto</th>
                  <th>Cantidad</th>
                  <th>Entregado por</th>
                  <th>Recibido por</th>
                  {sedeActiva === "all" && <th>Sede</th>}
                </tr>
              </thead>

              <tbody>
                {historial.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(m.created_at_tz).toLocaleDateString("es-CO")}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(m.created_at_tz).toLocaleTimeString("es-CO")}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          m.tipo === "entrada"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {m.repuestos?.nombre}
                    </td>

                    <td className="px-4 py-3">
                      {m.tipo === "entrada" ? "+" : "-"}
                      {m.cantidad}{" "}
                      <span className="text-gray-500">
                        {m.repuestos?.unidad}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {m.empleado_entrega?.nombre ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      {m.empleado_recibe?.nombre ?? "-"}
                    </td>

                    {sedeActiva === "all" && (
                      <td className="px-4 py-3">
                        {m.sedes?.nombre ?? "-"}
                      </td>
                    )}
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