import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  obtenerRepuestos,
  obtenerEmpleados,
  registrarEntrada,
  obtenerHistorialEntradas,
  obtenerStockActual,
} from "../services/entradasService";

import PageTransition from "../components/PageTransition";
import { motion } from "framer-motion";
import type {
  Repuesto,
  Empleado,
  StockActual,
  Movimiento,
} from "../types/index";

// --- TOAST ---
const Toast = ({ mensaje }: { mensaje: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 30 }}
    className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl"
  >
    {mensaje}
  </motion.div>
);

export default function Entradas() {
  const { usuario } = useAuth();

  // ---------------- PERMISOS ----------------
  const rol = usuario?.rol_usuario;
  const puedeRegistrar =
    rol === "admin" || rol === "dev"; // únicos permitidos

  const esModoLectura = !puedeRegistrar; // jefe, gerente, viewer

  // ---------------- STATE ----------------
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [stock, setStock] = useState<StockActual[]>([]);
  const [historial, setHistorial] = useState<Movimiento[]>([]);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    repuesto_id: "",
    cantidad: "",
    recibido_por: "",
    notas: "",
  });

  const repuestoSeleccionado = repuestos.find((r) => r.id === form.repuesto_id);
  const stockDisponible =
    stock.find((s) => s.repuesto_id === form.repuesto_id)?.stock ?? null;

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [rep, emp, hist, stk] = await Promise.all([
        obtenerRepuestos(),
        obtenerEmpleados(),
        obtenerHistorialEntradas(),
        obtenerStockActual(),
      ]);

      setRepuestos(rep);
      setEmpleados(emp);
      setHistorial(hist);
      setStock(stk);
    } catch {
      showToast("Error cargando datos.");
    }
  }

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  function handleChange(e: any) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit() {
    if (!puedeRegistrar) return; // seguridad adicional

    if (!form.repuesto_id || !form.cantidad || !form.recibido_por) {
      showToast("Completa todos los campos obligatorios.");
      return;
    }

    try {
      await registrarEntrada({
        repuesto_id: form.repuesto_id,
        cantidad: Number(form.cantidad),
        recibido_por: form.recibido_por,
        notas: form.notas,
        usuario_id: usuario!.id,
      });

      showToast("Entrada registrada ✓");

      setForm({
        repuesto_id: "",
        cantidad: "",
        recibido_por: "",
        notas: "",
      });

      cargarDatos();
    } catch {
      showToast("Error al registrar entrada.");
    }
  }

  // ---------------- MODO VISOR / SOLO LECTURA ----------------
  if (esModoLectura) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto mt-8 px-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Entradas (solo lectura)
          </h2>

          <p className="text-gray-600 mb-6">
            Tu rol no permite registrar entradas, pero puedes ver el historial.
          </p>

          {/* HISTORIAL */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
          >
            <h2 className="text-xl font-semibold mb-4">Historial de Movimientos</h2>

            <div className="max-h-[520px] overflow-y-auto pr-2 divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {historial.slice(0, 12).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="py-4 grid grid-cols-5 text-sm items-center gap-2"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {new Date(m.created_at + "Z").toLocaleDateString("es-CO")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(m.created_at + "Z").toLocaleTimeString("es-CO")}
                    </p>
                  </div>

                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-semibold text-xs w-fit">
                    +{m.cantidad} {m.repuestos?.unidad}
                  </span>

                  <span className="font-medium">{m.repuestos?.nombre}</span>

                  <span className="text-gray-600">—</span>

                  <span className="text-gray-600">{m.empleado_recibe?.nombre}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // ---------------- FORMULARIO NORMAL (ADMIN / DEV) ----------------
  return (
    <PageTransition>
      <div className="w-full max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">

        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
        >
          <h2 className="text-xl font-semibold mb-4">
            Registrar Entrada de Repuesto
          </h2>

          {/* FECHA */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-green-700 font-semibold">FECHA Y HORA DEL REGISTRO</p>
            <p className="text-lg font-bold text-gray-900">
              {new Date().toLocaleDateString("es-CO")} •{" "}
              {new Date().toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>

          {/* Repuesto */}
          <label className="text-sm font-semibold">Repuesto</label>
          <select
            name="repuesto_id"
            value={form.repuesto_id}
            onChange={handleChange}
            className="w-full mt-1 py-2 px-3 border border-gray-200 rounded-lg mb-2"
          >
            <option value="">Buscar repuesto...</option>
            {repuestos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.codigo_corto} — {r.nombre}
              </option>
            ))}
          </select>

          {stockDisponible !== null && (
            <p className="text-xs text-gray-600 mb-4">
              Disponible: <b>{stockDisponible}</b>{" "}
              {repuestoSeleccionado?.unidad}
            </p>
          )}

          {/* Cantidad */}
          <label className="text-sm font-semibold">Cantidad</label>
          <input
            type="number"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg mb-4"
          />

          {/* Empleado */}
          <label className="text-sm font-semibold">Recibido por</label>
          <select
            name="recibido_por"
            value={form.recibido_por}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg mb-4"
          >
            <option value="">Seleccione...</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>

          {/* Notas */}
          <label className="text-sm font-semibold">Notas</label>
          <textarea
            name="notas"
            rows={3}
            value={form.notas}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg"
          />

          {/* Botón */}
          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg shadow-sm transition"
          >
            Registrar Entrada
          </button>
        </motion.div>

        {/* HISTORIAL */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
        >
          <h2 className="text-xl font-semibold mb-4">Historial de Movimientos</h2>

          <div className="max-h-[520px] overflow-y-auto pr-2 divide-y divide-gray-100">
            {historial.slice(0, 12).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="py-4 grid grid-cols-5 text-sm items-center gap-2"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {new Date(m.created_at + "Z").toLocaleDateString("es-CO")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(m.created_at + "Z").toLocaleTimeString("es-CO")}
                  </p>
                </div>

                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-semibold text-xs w-fit">
                  +{m.cantidad} {m.repuestos?.unidad}
                </span>

                <span className="font-medium">{m.repuestos?.nombre}</span>

                <span className="text-gray-600">—</span>

                <span className="text-gray-600">{m.empleado_recibe?.nombre}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {toast && <Toast mensaje={toast} />}
      </div>
    </PageTransition>
  );
}