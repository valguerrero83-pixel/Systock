import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  getRepuestos,
  getEmpleados,
  crearSalida,
  getHistorialSalidas
} from "../services/salidasService";

import PageTransition from "../components/PageTransition.bak";
import { motion } from "framer-motion";

/* ===============================
      TOAST
=============================== */
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

export default function Salidas() {
  const { usuario } = useAuth();

  const rol = usuario?.rol_usuario;
  const puedeRegistrar = rol === "admin" || rol === "dev";
  const esModoLectura = !puedeRegistrar;

  // STATE
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
  repuesto_id: "",
  cantidad: "",
  entregado_por: "",
  recibido_por: "",
  notas: "",
  });

  const repuestoSeleccionado = repuestos.find((r) => r.id === form.repuesto_id);
  const stockDisponible = repuestoSeleccionado?.stock_actual ?? null;
  const unidad = repuestoSeleccionado?.unidad ?? "";

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [rep, emp, hist] = await Promise.all([
        getRepuestos(),
        getEmpleados(),
        getHistorialSalidas(),
      ]);

      setRepuestos(rep);
      setEmpleados(emp);
      setHistorial(hist);
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
      if (!puedeRegistrar) return;

      const cantidadNum = Number(form.cantidad);

      if (
        !form.repuesto_id ||
        !form.cantidad ||
        !form.entregado_por ||
        !form.recibido_por
      ) {
        showToast("Completa todos los campos.");
        return;
      }

      if (isNaN(cantidadNum) || cantidadNum <= 0) {
        showToast("Cantidad inválida.");
        return;
      }

      if (cantidadNum > stockDisponible) {
        showToast(`No puedes sacar más de lo disponible (${stockDisponible} ${unidad})`);
        return;
      }

      try {
        await crearSalida({
          repuesto_id: form.repuesto_id,
          cantidad: cantidadNum,
          entregado_por: form.entregado_por,
          recibido_por: form.recibido_por,
          usuario_id: (usuario as any).id,
          unidad,
          notas: form.notas, // <--- YA SE GUARDA
        });

        showToast("Salida registrada ✓");

        setForm({
          repuesto_id: "",
          cantidad: "",
          entregado_por: "",
          recibido_por: "",
          notas: "",
        });

        cargarDatos();
      } catch {
        showToast("Error al registrar salida.");
      }
    }


  /* ===============================
        MODO SOLO LECTURA
  =============================== */
  if (esModoLectura) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto mt-8 px-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Salidas (solo lectura)
          </h2>

          <p className="text-gray-600 mb-6">
            Tu rol no permite registrar salidas, pero puedes ver el historial.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
          >
            <h2 className="text-xl font-semibold mb-4">
              Historial de Salidas
            </h2>

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
                      {new Date(m.created_at).toLocaleDateString("es-CO")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(m.created_at).toLocaleTimeString("es-CO")}
                    </p>
                  </div>

                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-semibold text-xs w-fit">
                    -{Math.abs(m.cantidad)} {m.repuestos?.unidad}
                  </span>

                  <span className="font-medium">{m.repuestos?.nombre}</span>

                  <span className="text-gray-600">{m.entregado_por?.nombre}</span>

                  <span className="text-gray-600">{m.recibido_por?.nombre}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  /* ===============================
        FORMULARIO NORMAL
=============================== */
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
            Registrar Salida de Repuesto
          </h2>

          {/* Fecha */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-red-700 font-semibold">
              FECHA Y HORA DEL REGISTRO
            </p>
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
                {r.nombre}
              </option>
            ))}
          </select>

          {stockDisponible !== null && (
            <p className="text-xs text-gray-600 mb-4">
              Disponible: <b>{stockDisponible}</b> {unidad}
            </p>
          )}

          {/* Cantidad */}
          <label className="text-sm font-semibold">Cantidad a sacar</label>
          <input
            type="text"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg mb-4"
            placeholder="Ej: 5"
          />

          {form.cantidad && Number(form.cantidad) > stockDisponible && (
            <p className="text-red-600 text-xs mt-1">
              No puedes sacar más de lo disponible ({stockDisponible} {unidad})
            </p>
          )}

          {/* Entregado por */}
          <label className="text-sm font-semibold">Entregado por</label>
          <select
            name="entregado_por"
            value={form.entregado_por}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg mb-4"
          >
            <option value="">Seleccione...</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* Recibido por */}
          <label className="text-sm font-semibold">Recibido por</label>
          <select
            name="recibido_por"
            value={form.recibido_por}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg mb-4"
          >
            <option value="">Seleccione...</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
            {/* Notas */}
          <label className="text-sm font-semibold">Notas</label>
          <textarea
            name="notas"
            rows={3}
            value={form.notas}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg mb-2"
            placeholder="Detalles adicionales..."
          />

          {/* Botón */}
            <button
              onClick={handleSubmit}
              disabled={!form.repuesto_id || !form.cantidad || !form.entregado_por || !form.recibido_por || Number(form.cantidad) > stockDisponible}
              className={`w-full mt-6 text-white py-3 rounded-lg shadow-sm transition 
                ${
                  Number(form.cantidad) > stockDisponible ||
                  !form.cantidad ||
                  !form.repuesto_id
                    ? "bg-red-300 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
            >
              Registrar Salida
            </button>


        </motion.div>

        {/* HISTORIAL */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
        >
          <h2 className="text-xl font-semibold mb-4">Historial de Salidas</h2>

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
                    {new Date(m.created_at).toLocaleDateString("es-CO")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(m.created_at).toLocaleTimeString("es-CO")}
                  </p>
                </div>

                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-semibold text-xs w-fit">
                  -{Math.abs(m.cantidad)} {m.repuestos?.unidad}
                </span>

                <span className="font-medium">{m.repuestos?.nombre}</span>

                <span className="text-gray-600">{m.entregado_por?.nombre}</span>

                <span className="text-gray-600">{m.recibido_por?.nombre}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {toast && <Toast mensaje={toast} />}
      </div>
    </PageTransition>
  );
}
