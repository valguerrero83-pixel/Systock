import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { crearEmpleado } from "../services/empleadosService";

export default function ModalNuevoEmpleado({ abierto, onClose, onCreated }: any) {
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const nombreRef = useRef<HTMLInputElement>(null);
  const cargoRef = useRef<HTMLInputElement>(null);

  const { sedeActiva, usuario } = useAuth();

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    if (!nombre.trim()) return setError("El nombre es obligatorio");
    if (!cargo.trim()) return setError("El cargo es obligatorio");
    if (!sedeActiva) return setError("No hay sede activa");
    if (!usuario?.id) return setError("No hay usuario activo");

    setCargando(true);

    try {
      await crearEmpleado(
        { nombre, cargo },
        sedeActiva,
        usuario.id
      );

      onCreated();
      onClose();

      setNombre("");
      setCargo("");
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al guardar el empleado.");
    }

    setCargando(false);
  }

  // ENTER ENTRE CAMPOS
  function handleKeyDown(e: any, siguiente?: any) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (siguiente) siguiente.current?.focus();
      else handleSubmit(e);
    }

    if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
          >

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100">
                Nuevo Empleado
              </h2>

              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xl transition"
              >
                ✕
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* NOMBRE */}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nombre Completo
                </label>
                <input
                  ref={nombreRef}
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, cargoRef)}
                  placeholder="Ej: Juan Pérez"
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

              {/* CARGO */}
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Cargo
                </label>
                <input
                  ref={cargoRef}
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e)}
                  placeholder="Ej: Técnico, Operario, Jefe..."
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

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
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
                  type="submit"
                  disabled={cargando}
                  className="
                    px-5 py-2 rounded-xl
                    bg-indigo-600 hover:bg-indigo-700
                    text-white font-medium
                    text-sm transition
                    disabled:opacity-60
                  "
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