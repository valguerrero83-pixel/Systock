import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  obtenerRepuestos,
  obtenerEmpleados,
  registrarSalida,
  obtenerHistorialSalidas,
  obtenerStockActual,
} from "../services/salidasService";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition";

// --- TOAST ---
const Toast = ({ mensaje }: { mensaje: string }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl"
  >
    {mensaje}
  </motion.div>
);

export default function Salidas() {
  const { usuario } = useAuth();

  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    repuesto_id: "",
    cantidad: "",
    entregado_por: "",
    recibido_por: "",
    notas: "",
  });

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
        obtenerHistorialSalidas(),
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

    if (name === "cantidad" && stockDisponible !== null) {
      if (Number(value) > Number(stockDisponible)) {
        showToast("No puedes retirar más de lo disponible.");
        return;
      }
    }

    setForm({ ...form, [name]: value });
  }

  async function handleSubmit() {
    if (!usuario?.id) {
      showToast("Error: usuario no autenticado.");
      return;
    }

    if (!form.repuesto_id || !form.cantidad || !form.entregado_por || !form.recibido_por) {
      showToast("Completa todos los campos obligatorios.");
      return;
    }

    try {
      await registrarSalida({
        repuesto_id: form.repuesto_id,
        cantidad: Number(form.cantidad),
        entregado_por: form.entregado_por,
        recibido_por: form.recibido_por,
        notas: form.notas,
        usuario_id: usuario.id,
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

  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString("es-CO");
  const horaStr = fecha.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  if (usuario?.rol_usuario === "viewer") {
  return (
    <PageTransition>
      <div className="text-center text-gray-600 mt-20">
        <h2 className="text-xl font-semibold">Modo Visor</h2>
        <p>No tienes permisos para registrar salidas.</p>
      </div>
    </PageTransition>
  );
}

  return (
    <PageTransition>
      <motion.div
        className="w-full max-w-7xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* FORM */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Registrar Salida de Repuesto
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-red-700 font-semibold">FECHA Y HORA DEL REGISTRO</p>
            <p className="text-lg font-bold text-gray-900">
              {fechaStr} • {horaStr}
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
              Disponible: <span className="font-bold">{stockDisponible}</span>
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

          {/* Empleados */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Entregado por</label>
              <select
                name="entregado_por"
                value={form.entregado_por}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-200 rounded-lg"
              >
                <option value="">Seleccione...</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Recibido por</label>
              <select
                name="recibido_por"
                value={form.recibido_por}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-200 rounded-lg"
              >
                <option value="">Seleccione...</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <label className="text-sm font-semibold mt-4">Notas</label>
          <textarea
            name="notas"
            rows={3}
            value={form.notas}
            onChange={handleChange}
            className="w-full py-2 px-3 border border-gray-200 rounded-lg"
            placeholder="Observaciones..."
          />

          {/* Botón */}
          <motion.button
            onClick={handleSubmit}
            whileTap={{ scale: 0.96 }}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg shadow-sm transition"
          >
            Registrar Salida
          </motion.button>
        </motion.div>

        {/* HISTORIAL */}
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <h2 className="text-xl font-semibold mb-4">Historial de Movimientos</h2>

          <div className="max-h-[520px] overflow-y-auto pr-2 divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {historial.slice(0, 12).map((m, index) => (
              <motion.div
                key={m.id}
                className="py-4 grid grid-cols-5 text-sm items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {new Date(m.created_at + "Z").toLocaleDateString("es-CO")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(m.created_at + "Z").toLocaleTimeString("es-CO")}
                  </p>
                </div>

                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-semibold text-xs w-fit">
                  -{m.cantidad} {m.repuestos?.unidad}
                </span>

                <span className="font-medium">{m.repuestos?.nombre}</span>

                <span className="text-gray-600">{m.empleado_entrega?.nombre}</span>

                <span className="text-gray-600">→ {m.empleado_recibe?.nombre}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {toast && <Toast mensaje={toast} />}
      </motion.div>
    </PageTransition>
  );
}