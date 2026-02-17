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
      className="
        min-h-screen flex items-center justify-center px-4
        bg-slate-100 dark:bg-[#0B1120]
        transition-colors duration-300
      "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.form
        onSubmit={handleLogin}
        className="
          w-full max-w-md
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-800
          rounded-3xl p-8
          shadow-xl dark:shadow-black/40
        "
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
      >
        {/* LOGO / TÍTULO */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Systock
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistema de Inventario
          </p>
        </div>

        {/* EMAIL */}
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Correo
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="
            w-full mt-1 mb-4 px-3 py-2.5
            rounded-xl
            bg-slate-50 dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            text-slate-800 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition
          "
        />

        {/* PASSWORD */}
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Contraseña
        </label>
        <input
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="
            w-full mt-1 mb-4 px-3 py-2.5
            rounded-xl
            bg-slate-50 dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            text-slate-800 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            transition
          "
        />

        {/* ERROR */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="
                bg-red-500/15
                border border-red-500/30
                text-red-500
                text-sm
                rounded-xl
                py-2 px-3
                mb-4 text-center
              "
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full mt-2 py-3
            rounded-xl
            font-semibold
            text-white
            bg-indigo-600 hover:bg-indigo-700
            disabled:bg-slate-400
            transition
          "
        >
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </motion.form>
    </motion.div>
  );
}
