import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import SelectBuscable from "../components/SelectBuscable";
import { useAuth } from "../context/AuthContext";

interface Props {
  abierto: boolean;
  onClose: () => void;
  repuesto: any;
  onUpdated: () => void;
}

export default function ModalEditarRepuesto({
  abierto,
  onClose,
  repuesto,
  onUpdated
}: Props) {

  const { sedeActiva } = useAuth();

  const [form, setForm] = useState<any>({});
  const [categorias, setCategorias] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!repuesto) return;

    setForm({
      nombre: repuesto.nombre,
      referencia: repuesto.referencia,
      marca: repuesto.marca,
      codigo_siesa: repuesto.codigo_siesa,
      stock_minimo: repuesto.stock_minimo,
      categoria_id: repuesto.categoria?.id ?? "",
      ubicacion_id: repuesto.ubicacion?.id ?? ""
    });
  }, [repuesto]);

  useEffect(() => {
    if (!sedeActiva) return;

    cargarDatos();
  }, [sedeActiva]);

  async function cargarDatos() {

    const { data: cat } = await supabase
      .from("categorias")
      .select("id,nombre")
      .eq("sede_id", sedeActiva);

    const { data: ubi } = await supabase
      .from("ubicaciones")
      .select("id,bodega,estante,nivel")
      .eq("sede_id", sedeActiva);

    setCategorias(cat ?? []);
    setUbicaciones(ubi ?? []);
  }

  async function guardar() {

  if (!repuesto) return;

  setLoading(true);

  const updateData = {
    nombre: form.nombre,
    referencia: form.referencia,
    marca: form.marca,
    codigo_siesa: form.codigo_siesa,
    categoria_id: form.categoria_id || null,
    ubicacion_id: form.ubicacion_id || null,
    stock_minimo: Number(form.stock_minimo)
  };

  const { error } = await supabase
    .from("repuestos")
    .update(updateData)
    .eq("id", repuesto.repuesto_id);

  setLoading(false);

  if (error) {
    console.log(error);
    alert("Error al actualizar");
    return;
  }

  onUpdated();
  onClose();
}

  const inputStyle = `
    w-full
    px-3 py-2.5
    rounded-xl
    border border-slate-300 dark:border-slate-700
    bg-white dark:bg-slate-800
    text-slate-900 dark:text-slate-100
    focus:outline-none
    focus:ring-2
    focus:ring-indigo-500/40
  `;

  return (
    <AnimatePresence>
      {abierto && (

        <motion.div
          className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex justify-center items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >

          <motion.div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >

            <h3 className="text-lg font-semibold mb-4 dark:text-white">
              Editar Repuesto
            </h3>

            <div className="space-y-3">

              <input
                className={inputStyle}
                placeholder="Nombre"
                value={form.nombre || ""}
                onChange={(e)=>setForm({...form,nombre:e.target.value})}
              />

              <input
                className={inputStyle}
                placeholder="Referencia"
                value={form.referencia || ""}
                onChange={(e)=>setForm({...form,referencia:e.target.value})}
              />

              <input
                className={inputStyle}
                placeholder="Marca"
                value={form.marca || ""}
                onChange={(e)=>setForm({...form,marca:e.target.value})}
              />

              <input
                className={inputStyle}
                placeholder="Código Siesa"
                value={form.codigo_siesa || ""}
                onChange={(e)=>setForm({...form,codigo_siesa:e.target.value})}
              />

              <input
                className={inputStyle}
                type="number"
                placeholder="Stock mínimo"
                value={form.stock_minimo || ""}
                onChange={(e)=>setForm({...form,stock_minimo:e.target.value})}
              />

              <SelectBuscable
                value={form.categoria_id || "none"}
                items={categorias.map(c=>({
                  id:c.id,
                  nombre:c.nombre
                }))}
                placeholder="Categoría"
                onChange={(id)=>setForm({...form,categoria_id:id})}
              />

              <SelectBuscable
                value={form.ubicacion_id || "none"}
                items={ubicaciones.map(u=>({
                  id:u.id,
                  nombre:`${u.bodega}-${u.estante}-${u.nivel}`
                }))}
                placeholder="Ubicación"
                onChange={(id)=>setForm({...form,ubicacion_id:id})}
              />

            </div>

            <div className="flex justify-end gap-3 mt-5">

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border dark:border-slate-700"
              >
                Cancelar
              </button>

              <button
                onClick={guardar}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
              >
                Guardar
              </button>

            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}