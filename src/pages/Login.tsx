import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
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

    navigate("/inventario");
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
        className="bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-sm md:max-w-md"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        <h1 className="text-xl md:text-2xl font-bold text-center mb-4">
          Iniciar Sesión
        </h1>

        <label className="block text-sm font-semibold">Correo</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg mt-1 mb-4 text-sm"
        />

        <label className="block text-sm font-semibold">Contraseña</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg mt-1 mb-4 text-sm"
        />

        <AnimatePresence>
          {errorMsg && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-sm mb-3 text-center"
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm md:text-base mt-2"
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </motion.form>
    </motion.div>
  );
}
