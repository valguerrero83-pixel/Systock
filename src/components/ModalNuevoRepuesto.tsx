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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit() {
    if (!form.nombre || !form.cantidad_inicial || !form.unidad || !form.stock_minimo) {
      alert("Completa todos los campos");
      return;
    }

    if (!usuario?.id) {
      alert("Error: el usuario no está autenticado.");
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
      alert("Error al registrar el repuesto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="
            fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm 
            flex justify-center items-center p-3
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="
              bg-white w-full max-w-lg rounded-2xl shadow-xl 
              p-6 sm:p-8 max-h-[88vh] overflow-y-auto
            "
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <polyline points="3 7 12 2 21 7" />
                </svg>
                Nuevo Repuesto
              </h2>

              <button onClick={onClose} className="text-gray-600 text-lg hover:text-gray-800">
                ✕
              </button>
            </div>

            {/* FORM */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Nombre del Repuesto</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="
                    w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 
                    focus:ring-blue-300 outline-none text-sm
                  "
                  placeholder="Ej: Aceite hidráulico 10W40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Cantidad</label>
                  <input
                    type="number"
                    name="cantidad_inicial"
                    value={form.cantidad_inicial}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Unidad</label>
                  <select
                    name="unidad"
                    value={form.unidad}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    <option>Unidades</option>
                    <option>Litros</option>
                    <option>Metros</option>
                    <option>Kilos</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700">Stock mínimo</label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={form.stock_minimo}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm"
              >
                Cancelar
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="
                  px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 
                  flex items-center gap-2 text-sm disabled:opacity-70
                "
              >
                {loading ? "Guardando..." : "Agregar Repuesto"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
