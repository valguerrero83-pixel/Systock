import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  getRepuestos,
  getEmpleados,
  crearSalida,
  getHistorialSalidas,
  getStockActualById,
} from "../services/salidasService";

import PageTransition from "../components/PageTransition.bak";
import { motion } from "framer-motion";

/* ===============================
      TOAST BONITO
=============================== */
const Toast = ({ mensaje }: { mensaje: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold z-50 max-w-[80%]"
  >
    {mensaje}
  </motion.div>
);

export default function Salidas() {
  const { usuario } = useAuth();

  const rol = usuario?.rol_usuario;
  const puedeRegistrar = rol === "admin" || rol === "dev" || rol === "jefe";
  const esModoLectura = !puedeRegistrar;

  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [toast, setToast] = useState("");
  const { sedeActiva } = useAuth();

  const [stockActual, setStockActual] = useState<number | null>(null);

  const [form, setForm] = useState({
    repuesto_id: "",
    cantidad: "",
    entregado_por: "",
    recibido_por: "",
    notas: "",
  });

  const repuestoSeleccionado = repuestos.find((r) => r.id === form.repuesto_id);
  const unidad = repuestoSeleccionado?.unidad ?? "";

  useEffect(() => {
  if (!sedeActiva) return;
  cargarTodo();
}, [sedeActiva]);

  async function cargarTodo() {
  if (!sedeActiva) return;

  try {
    const [rep, emp, hist] = await Promise.all([
      getRepuestos(sedeActiva),
      getEmpleados(sedeActiva),
      getHistorialSalidas(sedeActiva),
    ]);

    setRepuestos(rep ?? []);
    setEmpleados(emp ?? []);
    setHistorial(hist ?? []);
  } catch (err) {
    console.error(err);
    showToast("Error cargando datos.");
  }
}

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  async function handleChange(e: any) {
    const { name, value } = e.target;

    if (name === "repuesto_id") {
      setForm({ ...form, repuesto_id: value });

      if (value) {
        const stock = await getStockActualById(value, sedeActiva!);
        setStockActual(stock);
      } else {
        setStockActual(null);
      }
      return;
    }

    setForm({ ...form, [name]: value });
  }

  async function handleSubmit() {
    if (!puedeRegistrar) return;

    const cantidadNum = Number(form.cantidad);

    if (!form.repuesto_id || !form.cantidad || !form.entregado_por || !form.recibido_por) {
      showToast("Completa todos los campos.");
      return;
    }

    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      showToast("Cantidad inválida.");
      return;
    }

    if (stockActual === null) {
      showToast("No se pudo obtener stock actual.");
      return;
    }

    if (cantidadNum > stockActual) {
      showToast(`No puedes sacar más de lo disponible (${stockActual} ${unidad})`);
      return;
    }

    try {
      const resp = await crearSalida({
        sede_id: sedeActiva!,
        repuesto_id: form.repuesto_id,
        cantidad: cantidadNum,
        entregado_por: form.entregado_por,
        recibido_por: form.recibido_por,
        usuario_id: usuario!.id,
        notas: form.notas,
      });

      if (resp.error) {
        showToast(resp.error);
        return;
      }

      showToast("Salida registrada exitosamente ✓");

      setForm({
        repuesto_id: "",
        cantidad: "",
        entregado_por: "",
        recibido_por: "",
        notas: "",
      });

      setStockActual(null);
      cargarTodo();
    } catch {
      showToast("Error al registrar salida.");
    }
  }

  /* ===============================
        SOLO LECTURA
  =============================== */
  if (esModoLectura) {
    return (
      <PageTransition>
        <div className="max-w-7xl mx-auto mt-4 md:mt-8 px-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">
            Salidas (solo lectura)
          </h2>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 md:p-5 shadow-md border border-gray-100"
          >
            <h2 className="text-lg md:text-xl font-semibold mb-4 
            text-slate-800 dark:text-slate-100"
            >
              Historial de Salidas
            </h2>

            <div className="max-h-[60vh] overflow-y-auto pr-2 divide-y divide-slate-200 dark:divide-slate-700">

              {historial.map((m,) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900
                  rounded-3xl p-6
                  border border-slate-200 dark:border-slate-800
                  shadow-lg dark:shadow-black/40"
                >

                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {new Date(m.created_at_tz).toLocaleDateString("es-CO")}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500">
                      {new Date(m.created_at_tz).toLocaleTimeString("es-CO")}
                    </p>
                  </div>

                  <span className="
                    inline-flex items-center
                    px-2 py-0.5
                    text-[11px] font-semibold
                    rounded-full
                    bg-red-500/15
                    text-red-400
                  ">
                    -{Math.abs(m.cantidad)} {m.repuestos?.unidad}
                  </span>


                  <span className="font-medium text-slate-800 dark:text-slate-100">{m.repuestos?.nombre}</span>

           
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">
                      {m.entregado?.nombre}
                    </span>

                    <div className="flex items-center gap-1">
                      <div className="w-4 h-px bg-slate-600"></div>
                      <span className="text-slate-500 text-xs">→</span>
                      <div className="w-4 h-px bg-slate-600"></div>
                    </div>

                    <span className="text-slate-200 font-medium">
                      {m.recibido?.nombre}
                    </span>
                  </div>



                  {m.notas && (
                    <p className="
                      col-span-2 sm:col-span-4
                      text-sm
                      text-slate-500 dark:text-slate-400
                      italic
                      mt-1
                    ">
                      {m.notas}
                    </p>
                  )}

                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {toast && <Toast mensaje={toast} />}
      </PageTransition>
    );
  }

  /* ===============================
        FORMULARIO COMPLETO
  =============================== */
  return (
    <PageTransition>
      <div className="w-full mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 px-6">
        {/* FORMULARIO */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900
          rounded-3xl p-6
          border border-slate-200 dark:border-slate-800
          shadow-lg dark:shadow-black/40"
        >
          <h2 className="text-lg md:text-xl font-semibold mb-4 
            text-slate-800 dark:text-slate-100"
            >
            Registrar Salida de Repuesto
          </h2>

          <div className="bg-red-50 dark:bg-red-900/20 
          border border-red-200 dark:border-red-800 
          rounded-2xl p-4 mb-6">
            <p className="text-[11px] md:text-xs text-red-700 dark:text-red-400 font-semibold">
              FECHA Y HORA DEL REGISTRO
            </p>
            <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              {new Date().toLocaleDateString("es-CO")} •{" "}
              {new Date().toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>

          {/* REPUESTO */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Repuesto</label>
          <select
            name="repuesto_id"
            value={form.repuesto_id}
            onChange={handleChange}
            className="w-full mt-1 py-2.5 px-3
            bg-slate-50 dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            rounded-xl
            text-slate-800 dark:text-slate-200
            appearance-none
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition"

          >
            <option value="">Buscar repuesto...</option>
            {repuestos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>

          {stockActual !== null && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Disponible: <b>{stockActual}</b> {unidad}
            </p>
          )}

          {/* CANTIDAD */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cantidad a sacar</label>
          <input
            type="text"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            className="w-full mt-1 py-2.5 px-3
            bg-slate-50 dark:bg-slate-800/70 
            dark:focus:ring-indigo-400
            border border-slate-200 dark:border-slate-700
            rounded-xl
            text-slate-800 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition"

            placeholder="Ej: 5"
          />

          {form.cantidad && Number(form.cantidad) > (stockActual ?? 0) && (
            <p className="text-red-600 text-xs mt-1">
              No puedes sacar más de lo disponible ({stockActual} {unidad})
            </p>
          )}

          {/* ENTREGADO POR */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Entregado por</label>
          <select
            name="entregado_por"
            value={form.entregado_por}
            onChange={handleChange}
            className="w-full mt-1 py-2.5 px-3
            bg-slate-50 dark:bg-slate-800/70
            dark:focus:ring-indigo-400
            border border-slate-200 dark:border-slate-700
            rounded-xl
            text-slate-800 dark:text-slate-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition"

          >
            <option value="">Seleccione...</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* RECIBIDO POR */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recibido por</label>
          <select
            name="recibido_por"
            value={form.recibido_por}
            onChange={handleChange}
            className="w-full mt-1 py-2.5 px-3
            bg-slate-50 dark:bg-slate-800/70
            dark:focus:ring-indigo-400
            border border-slate-200 dark:border-slate-700
            rounded-xl
            text-slate-800 dark:text-slate-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition"

          >
            <option value="">Seleccione...</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* NOTAS */}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notas</label>
          <textarea
            name="notas"
            rows={2}
            value={form.notas}
            onChange={handleChange}
            className="w-full mt-1 py-2.5 px-3
            bg-slate-50 dark:bg-slate-800/70
            dark:focus:ring-indigo-400
            border border-slate-200 dark:border-slate-700
            rounded-xl
            text-slate-800 dark:text-slate-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition"

            placeholder="Detalles adicionales..."
          />

          {/* BOTÓN */}
          <button
            onClick={handleSubmit}
            disabled={
              !form.repuesto_id ||
              !form.cantidad ||
              !form.entregado_por ||
              !form.recibido_por ||
              Number(form.cantidad) > (stockActual ?? 0)
            }
            className={`w-full mt-4 text-white py-3 rounded-xl 
            font-semibold shadow-sm transition-all duration-300
            ${
              Number(form.cantidad) > (stockActual ?? 0) ||
              !form.cantidad ||
              !form.repuesto_id
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 hover:shadow-md"
            }`}

          >
            Registrar Salida
          </button>
        </motion.div>

        {/* HISTORIAL */}
        {/* HISTORIAL */}
<motion.div
  initial={{ opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  className="
    bg-white dark:bg-slate-900
    rounded-3xl p-6
    border border-slate-200 dark:border-slate-800
    shadow-lg dark:shadow-black/40
  "
>
  <h2 className="text-lg md:text-xl font-semibold mb-6 
    text-slate-800 dark:text-slate-100">
    Historial de Salidas
  </h2>

  <div className="max-h-[520px] overflow-y-auto pr-2 space-y-3">
    {historial.map((m, i) => (
      <motion.div
  key={m?.id}
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: i * 0.03 }}
  className="
    py-4
    px-3
    grid grid-cols-2 sm:grid-cols-4
    items-center gap-3
    rounded-xl
    hover:bg-slate-50 dark:hover:bg-slate-800/60
    transition
  "
>

  {/* FECHA */}
  <div>
    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
      {new Date(m.created_at_tz).toLocaleDateString("es-CO")}
    </p>
    <p className="text-xs text-slate-500">
      {new Date(m.created_at_tz).toLocaleTimeString("es-CO")}
    </p>
  </div>

  {/* BADGE MÁS COMPACTO */}
  <span className="
    inline-flex items-center
    w-fit
    px-2 py-0.5
    text-sm font-semibold
    rounded-full
    bg-red-500/15
    text-red-400
    whitespace-nowrap
  ">
    -{Math.abs(m.cantidad)} {m.repuestos?.unidad}
  </span>

  {/* REPUESTO (más contraste) */}
  <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
    {m.repuestos?.nombre}
  </span>

  {/* MOVIMIENTO (menos claro, mejor contraste) */}
  <div className="flex items-center gap-1.5 text-sm">
    <span className="text-slate-400 dark:text-slate-300">
      {m.entregado?.nombre}
    </span>

    <span className="text-slate-500 dark:text-slate-400 font-medium">
      →
    </span>

    <span className="text-slate-700 dark:text-slate-200 font-medium">
      {m.recibido?.nombre}
    </span>
  </div>

  {m.notas && (
  <p
    className="
      col-span-2 sm:col-span-4
      text-sm
      text-slate-500 dark:text-slate-400
      italic
      mt-1
    "
  >
    {m.notas}
  </p>
)}

</motion.div>


    ))}
  </div>
</motion.div>
      </div>
      {toast && <Toast mensaje={toast} />}
    </PageTransition>
  );
}
