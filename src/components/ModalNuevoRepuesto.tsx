import { useState } from "react";
import { crearRepuesto } from "../services/repuestosService";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface ModalNuevoRepuestoProps {
  abierto: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function ModalNuevoRepuesto({
  abierto,
  onClose,
  onCreated,
}: ModalNuevoRepuestoProps) {
  const { usuario } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    cantidad_inicial: "",
    unidad: "Unidades",
    stock_minimo: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit() {
    setError("");

    if (!form.nombre || !form.cantidad_inicial || !form.unidad || !form.stock_minimo) {
      setError("Completa todos los campos.");
      return;
    }

    if (!usuario?.id) {
      setError("Usuario no autenticado.");
      return;
    }

    try {
      setLoading(true);

      await crearRepuesto({
        nombre: form.nombre,
        unidad: form.unidad,
        stock_minimo: Number(form.stock_minimo),
        cantidad_inicial: Number(form.cantidad_inicial),
        usuario_id: usuario.id,
      });

      setForm({
        nombre: "",
        cantidad_inicial: "",
        unidad: "Unidades",
        stock_minimo: "",
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      setError("Error al registrar el repuesto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex justify-center items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="
              bg-white dark:bg-slate-900
              w-full max-w-lg
              rounded-3xl
              shadow-2xl
              border border-slate-200 dark:border-slate-800
              p-6 sm:p-8
            "
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <svg width="22" height="22" fill="none" stroke="currentColor">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <polyline points="3 7 12 2 21 7" />
                </svg>
                Nuevo Repuesto
              </h2>

              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xl transition"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <div className="space-y-5">

              {/* NOMBRE */}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nombre del Repuesto
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Aceite hidráulico 10W40"
                  className="
                    w-full mt-1 px-3 py-2.5
                    bg-slate-50 dark:bg-slate-800/70
                    border border-slate-200 dark:border-slate-700
                    rounded-xl
                    text-slate-800 dark:text-slate-100
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                    transition
                  "
                />
              </div>

              {/* GRID CANTIDAD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    name="cantidad_inicial"
                    value={form.cantidad_inicial}
                    onChange={handleChange}
                    className="
                      w-full mt-1 px-3 py-2.5
                      bg-slate-50 dark:bg-slate-800/70
                      border border-slate-200 dark:border-slate-700
                      rounded-xl
                      text-slate-800 dark:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                    "
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Unidad
                  </label>
                  <select
                    name="unidad"
                    value={form.unidad}
                    onChange={handleChange}
                    className="
                      w-full mt-1 px-3 py-2.5
                      bg-slate-50 dark:bg-slate-800/70
                      border border-slate-200 dark:border-slate-700
                      rounded-xl
                      text-slate-800 dark:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                    "
                  >
                    <option>Unidades</option>
                    <option>Litros</option>
                    <option>Metros</option>
                    <option>Kilos</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={form.stock_minimo}
                    onChange={handleChange}
                    className="
                      w-full mt-1 px-3 py-2.5
                      bg-slate-50 dark:bg-slate-800/70
                      border border-slate-200 dark:border-slate-700
                      rounded-xl
                      text-slate-800 dark:text-slate-100
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                    "
                  />
                </div>

              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="
                    px-4 py-2 rounded-xl
                    border border-slate-300 dark:border-slate-600
                    text-slate-600 dark:text-slate-300
                    hover:bg-slate-100 dark:hover:bg-slate-800
                    text-sm transition
                  "
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="
                    px-5 py-2 rounded-xl
                    bg-indigo-600 hover:bg-indigo-700
                    text-white font-medium
                    text-sm transition
                    disabled:opacity-60
                  "
                >
                  {loading ? "Guardando..." : "Agregar Repuesto"}
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
