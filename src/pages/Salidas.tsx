// @ts-nocheck

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

  const [repuestos, setRepuestos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [selectedRepuesto, setSelectedRepuesto] = useState(null);
  const [cantidad, setCantidad] = useState(0);
  const [entregadoPor, setEntregadoPor] = useState("");
  const [recibidoPor, setRecibidoPor] = useState("");
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    async function load() {
      setRepuestos(await getRepuestos());
      setEmpleados(await getEmpleados());
      setHistorial(await getHistorialSalidas());
    }
    load();
  }, []);

  const handleSalida = async () => {
    if (!selectedRepuesto || !cantidad || !entregadoPor || !recibidoPor) {
      alert("Completa todos los campos");
      return;
    }

    const resp = await crearSalida({
      repuesto_id: selectedRepuesto.id,
      cantidad,
      entregado_por: entregadoPor,
      recibido_por: recibidoPor,
      usuario_id: usuario.id,
      unidad: selectedRepuesto.unidad
    });

    if (resp.error) {
      alert(resp.error);
      return;
    }

    alert("Salida registrada correctamente");

    // actualizar datos
    setRepuestos(await getRepuestos());
    setHistorial(await getHistorialSalidas());
    setCantidad(0);
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

      {/* Mostrar stock */}
      {selectedRepuesto && (
        <p className="text-sm text-gray-600 mb-2">
          Stock actual: <b>{selectedRepuesto.stock_actual}</b> {selectedRepuesto.unidad}
        </p>
      )}

      {/* CANTIDAD */}
      <div className="mb-3">
        <label>Cantidad</label>
        <input
          type="number"
          className="w-full border p-2 rounded"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
        />
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

      <button
        className="w-full bg-blue-600 text-white py-2 rounded"
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
              <b>{mov.repuestos?.nombre}</b>
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
