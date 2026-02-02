import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setErrorMsg("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }

    // Esperar a que AuthContext cargue
    setTimeout(() => {
      navigate("/inventario");
    }, 300);
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-100 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {/* TÍTULO */}
        <motion.h1
          className="text-2xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Iniciar Sesión
        </motion.h1>

        <motion.p
          className="text-center text-gray-600 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Accede a tu panel de inventario
        </motion.p>

        {/* CORREO */}
        <label className="block text-sm font-semibold">Correo</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg mt-1 mb-4"
        />

        {/* CONTRASEÑA */}
        <label className="block text-sm font-semibold">Contraseña</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg mt-1 mb-4"
        />

        {/* ERROR ANIMADO */}
        <AnimatePresence>
          {errorMsg && (
            <motion.p
              className="text-red-500 text-sm mb-3 text-center"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* BOTÓN */}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.96 }}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm mt-2 transition"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </motion.button>
      </motion.form>
    </motion.div>
  );
}
