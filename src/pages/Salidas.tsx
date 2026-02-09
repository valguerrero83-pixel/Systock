import { useEffect, useState } from "react";
import {
  getRepuestos,
  getEmpleados,
  crearSalida,
  getHistorialSalidas
} from "../services/salidasService";

import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Salidas() {
  const { usuario } = useAuth();

  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [selectedRepuesto, setSelectedRepuesto] = useState<any | null>(null);
  const [cantidad, setCantidad] = useState<string>("");
  const [entregadoPor, setEntregadoPor] = useState<string>("");
  const [recibidoPor, setRecibidoPor] = useState<string>("");
  const [historial, setHistorial] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setRepuestos(await getRepuestos());
      setEmpleados(await getEmpleados());
      setHistorial(await getHistorialSalidas());
    }
    load();
  }, []);

  // VALIDACIÓN EN TIEMPO REAL
  const cantidadNum = Number(cantidad);
  const stockDisponible = selectedRepuesto?.stock_actual ?? 0;
  const cantidadInvalida =
    isNaN(cantidadNum) ||
    cantidadNum <= 0 ||
    cantidadNum > stockDisponible;

  const handleSalida = async () => {
    if (!selectedRepuesto || !entregadoPor || !recibidoPor) {
      alert("Completa todos los campos");
      return;
    }

    if (cantidadInvalida) {
      alert("Cantidad inválida o mayor al stock disponible");
      return;
    }

    const resp = await crearSalida({
      repuesto_id: selectedRepuesto.id,
      cantidad: cantidadNum,
      entregado_por: entregadoPor,
      recibido_por: recibidoPor,
      usuario_id: (usuario as any).id,
      unidad: selectedRepuesto.unidad
    });

    if (resp.error) {
      alert(resp.error);
      return;
    }

    alert("Salida registrada correctamente");

    setRepuestos(await getRepuestos());
    setHistorial(await getHistorialSalidas());
    setCantidad("");
  };

  return (
    <motion.div className="p-6 bg-white rounded-xl shadow max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Registrar Salida</h2>

      {/* REPUESTO */}
      <div className="mb-3">
        <label>Repuesto</label>
        <select
          className="w-full border p-2 rounded"
          onChange={(e) => {
            const rep = repuestos.find((r) => r.id === e.target.value);
            setSelectedRepuesto(rep || null);
            setCantidad("");
          }}
        >
          <option value="">Seleccione un repuesto</option>
          {repuestos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {selectedRepuesto && (
        <p className="text-sm text-gray-600 mb-2">
          Stock actual:{" "}
          <b>{selectedRepuesto.stock_actual}</b>{" "}
          {selectedRepuesto.unidad}
        </p>
      )}

      {/* CANTIDAD */}
      <div className="mb-3">
        <label>Cantidad</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Ingresa la cantidad"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
        {cantidad !== "" && cantidadInvalida && (
          <p className="text-red-600 text-xs mt-1">
            Cantidad mayor al stock o inválida
          </p>
        )}
      </div>

      {/* ENTREGADO POR */}
      <div className="mb-3">
        <label>Entregado por</label>
        <select
          className="w-full border p-2 rounded"
          onChange={(e) => setEntregadoPor(e.target.value)}
        >
          <option value="">Seleccione</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* RECIBIDO POR */}
      <div className="mb-4">
        <label>Recibido por</label>
        <select
          className="w-full border p-2 rounded"
          onChange={(e) => setRecibidoPor(e.target.value)}
        >
          <option value="">Seleccione</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* BOTÓN */}
      <button
        disabled={cantidadInvalida || !selectedRepuesto}
        className={`w-full py-2 rounded text-white ${
          cantidadInvalida || !selectedRepuesto
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
        onClick={handleSalida}
      >
        Registrar salida
      </button>

      {/* HISTORIAL */}
      <h2 className="text-xl font-semibold mt-8 mb-3">Historial de Salidas</h2>

      <div className="max-h-72 overflow-y-auto pr-2">
        {historial.slice(0, 5).map((mov) => (
          <div
            key={mov.id}
            className="border p-3 rounded mb-3 bg-gray-50 text-sm shadow-sm"
          >
            <p>
              <b>{mov.repuestos?.nombre}</b>{" "}
              <span className="text-red-600 ml-2">
                -{Math.abs(mov.cantidad)} {mov.repuestos?.unidad}
              </span>
            </p>

            <p className="text-xs text-gray-600 mt-1">
              {new Date(mov.created_at).toLocaleString()}
            </p>

            <p className="text-xs mt-1">
              {mov.entregado_por?.nombre} → {mov.recibido_por?.nombre}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
