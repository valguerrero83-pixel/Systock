import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { crearEmpleado } from "../services/empleadosService";

export default function ModalNuevoEmpleado({ abierto, onClose, onCreated }: any) {
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) return setError("El nombre es obligatorio");
    if (!cargo.trim()) return setError("El cargo es obligatorio");

    setCargando(true);

    try {
      await crearEmpleado({ nombre, cargo });
      setNombre("");
      setCargo("");
      onCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Ocurrió un error al guardar el empleado.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* MODAL */}
          <motion.div
            className="bg-white w-[90%] max-w-lg rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg width="22" height="22" stroke="currentColor" fill="none">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5.5 21a7 7 0 0 1 13 0" />
                </svg>
                Nuevo Empleado
              </h2>

              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 text-xl"
              >
                ✕
              </button>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NOMBRE */}
              <div>
                <label className="text-sm font-semibold text-gray-700">Nombre Completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* CARGO */}
              <div>
                <label className="text-sm font-semibold text-gray-700">Cargo</label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej: Técnico, Operario, Jefe..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* BOTONES */}
              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={cargando}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 flex items-center gap-2"
                >
                  {cargando ? "Guardando..." : "Agregar Empleado"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
