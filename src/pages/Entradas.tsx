import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  obtenerRepuestos,
  obtenerEmpleados,
  registrarEntrada,
  obtenerHistorialEntradas,
} from "../services/entradasService";

import PageTransition from "../components/PageTransition.bak";
import { motion } from "framer-motion";
import SelectPro from "../components/SelectPro";


/* ================= TOAST ================= */

const Toast = ({ mensaje }: { mensaje: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 30 }}
    className="fixed bottom-6 right-6 bg-slate-900 text-white 
    px-5 py-3 rounded-xl shadow-xl text-sm z-50"
  >
    {mensaje}
  </motion.div>
);

export default function Entradas() {

  const { usuario, sedeActiva } = useAuth();

  const rol = usuario?.rol_usuario;
  const puedeRegistrar = rol === "admin" || rol === "dev";

  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);

  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
  repuesto_id: "",
  cantidad: "",
  recibido_por: "",
  notas: "",
  costo_unitario: "",
  proveedor: "",
  factura: "",
});
const cantidadRef = useRef<HTMLInputElement>(null);
const costoRef = useRef<HTMLInputElement>(null);
const proveedorRef = useRef<HTMLInputElement>(null);
const facturaRef = useRef<HTMLInputElement>(null);


const costoTotal =
  Number(form.cantidad || 0) * Number(form.costo_unitario || 0);

  

  /* ================= CARGA DE DATOS ================= */

  useEffect(() => {

    if (!sedeActiva) return;

    cargarRepuestos();
    cargarEmpleados();
    cargarHistorial();

  }, [sedeActiva]);

  async function cargarRepuestos() {

    try {

      const rep = await obtenerRepuestos(sedeActiva!);
      setRepuestos(rep ?? []);

    } catch {

      showToast("Error cargando repuestos.");

    }

  }

  async function cargarEmpleados() {

    try {

      const emp = await obtenerEmpleados(sedeActiva!);
      setEmpleados(emp ?? []);

    } catch {

      showToast("Error cargando empleados.");

    }

  }

  async function cargarHistorial() {

    try {

      const hist = await obtenerHistorialEntradas(sedeActiva!);
      setHistorial(hist ?? []);

    } catch {

      showToast("Error cargando historial.");

    }

  }

  /* ================= TOAST ================= */

  const showToast = (msg: string) => {

    setToast(msg);

    setTimeout(() => {
      setToast("");
    }, 2500);

  };

  /* ================= FORM ================= */

  function handleChange(e: any) {

    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

  }

  async function handleSubmit() {

    if (!puedeRegistrar) return;

    if (!form.repuesto_id || !form.cantidad || !form.recibido_por) {

      showToast("Completa todos los campos obligatorios.");
      return;

    }

    try {

      await registrarEntrada({
      sede_id: sedeActiva!,
      repuesto_id: form.repuesto_id,
      cantidad: Number(form.cantidad),
      recibido_por: form.recibido_por,
      notas: form.notas,
      usuario_id: usuario!.id,
      costo_unitario: Number(form.costo_unitario || 0),
      costo_total:
        Number(form.cantidad || 0) *
        Number(form.costo_unitario || 0),
      proveedor: form.proveedor,
      factura: form.factura,
    });
    

      showToast("Entrada registrada ✓");

      setForm({
        repuesto_id: "",
        cantidad: "",
        recibido_por: "",
        notas: "",
        costo_unitario: "",
        proveedor: "",
        factura: "",
      });

      /* SOLO RECARGAMOS HISTORIAL */
      await cargarHistorial();

    } catch {

      showToast("Error al registrar entrada.");

    }

  }
  function handleEnter(e: any, siguiente?: any) {
  if (e.key === "Enter") {
    e.preventDefault();

    if (siguiente) {
      siguiente.current?.focus();
    } else {
      handleSubmit();
    }
  }
}
  return (

    <PageTransition>

      <div className="w-full mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">

        {/* ================= FORM ================= */}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="
          bg-white dark:bg-slate-900
          rounded-3xl p-6
          border border-slate-200 dark:border-slate-800
          shadow-lg dark:shadow-black/40
          flex flex-col
        "
        >

          <h2 className="text-lg md:text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
            Registrar Entrada de Repuesto
          </h2>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 
          border border-emerald-200 dark:border-emerald-800 
          rounded-2xl p-4 mb-6">

            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              FECHA Y HORA DEL REGISTRO
            </p>

            <p className="text-base font-bold text-slate-900 dark:text-white">
              {new Date().toLocaleDateString("es-CO")} •{" "}
              {new Date().toLocaleTimeString("es-CO")}
            </p>

          </div>

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Repuesto
          </label>

          <SelectPro
            value={form.repuesto_id}
            onChange={(val) =>
              setForm({ ...form, repuesto_id: val })
            }
            placeholder="Buscar repuesto..."
            options={repuestos.map((r) => ({
              value: r.id,
              label: `${r.codigo_corto ?? ""} — ${r.nombre}`,
            }))}
          />

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Cantidad
          </label>

          <input
            ref={cantidadRef}
            type="number"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            onKeyDown={(e) => handleEnter(e, costoRef)}
            className="w-full mt-1 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70
            border border-slate-200 dark:border-slate-700 rounded-xl mb-4
            text-slate-800 dark:text-slate-100"
          />

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Costo Unitario
          </label>

          <input
            ref={costoRef}
            type="number"
            name="costo_unitario"
            value={form.costo_unitario}
            onChange={handleChange}
            onKeyDown={(e) => handleEnter(e, proveedorRef)}
            className="w-full mt-1 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70
            border border-slate-200 dark:border-slate-700 rounded-xl mb-4
            text-slate-800 dark:text-slate-100"
          />

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Costo Total
          </label>

          <input
            type="text"
            value={costoTotal.toLocaleString("es-CO")}
            disabled
            className="w-full mt-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800
            border border-slate-200 dark:border-slate-700 rounded-xl mb-4
            text-slate-800 dark:text-slate-100"
          />

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Proveedor
          </label>

          <input
            ref={proveedorRef}
            type="text"
            name="proveedor"
            value={form.proveedor}
            onChange={handleChange}
            onKeyDown={(e) => handleEnter(e, facturaRef)}
            className="w-full mt-1 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70
            border border-slate-200 dark:border-slate-700 rounded-xl mb-4
            text-slate-800 dark:text-slate-100"
          />

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Factura
          </label>

          <input
            ref={facturaRef}
            type="text"
            name="factura"
            value={form.factura}
            onChange={handleChange}
            onKeyDown={(e) => handleEnter(e)}
            className="w-full mt-1 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70
            border border-slate-200 dark:border-slate-700 rounded-xl mb-4
            text-slate-800 dark:text-slate-100"
          />

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Recibido por
          </label>

          <SelectPro
            value={form.recibido_por}
            onChange={(val) =>
              setForm({ ...form, recibido_por: val })
            }
            placeholder="Seleccione..."
            options={empleados.map((e) => ({
              value: e.id,
              label: e.nombre,
            }))}
          />

          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Notas
          </label>

          <textarea
            name="notas"
            rows={2}
            value={form.notas}
            onChange={handleChange}
            className="w-full mt-1 py-2.5 px-3 bg-slate-50 dark:bg-slate-800/70
            border border-slate-200 dark:border-slate-700 rounded-xl
            text-slate-800 dark:text-slate-200"
            placeholder="Detalles adicionales..."
          />

          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700
            text-white py-3 rounded-xl font-semibold transition"
          >
            Registrar Entrada
          </button>

        </motion.div>

        {/* ================= HISTORIAL ================= */}

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

          <h2 className="text-lg md:text-xl font-semibold mb-6 text-slate-800 dark:text-slate-100">
            Historial de Entradas
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

                <div>

                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    {new Date(m.created_at_tz).toLocaleDateString("es-CO")}
                  </p>

                  <p className="text-xs text-slate-500">
                    {new Date(m.created_at_tz).toLocaleTimeString("es-CO")}
                  </p>

                </div>

                <span className="
                inline-flex items-center
                w-fit
                px-3 py-1
                text-sm font-semibold
                rounded-full
                bg-emerald-500/15
                text-emerald-400
                whitespace-nowrap
              ">

                  +{m.cantidad} {m.repuestos?.unidad}

                </span>

                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                  {m.repuestos?.nombre}
                </span>

                <div className="flex items-center gap-1.5 text-sm">

                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {m.empleado_recibe?.nombre}
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