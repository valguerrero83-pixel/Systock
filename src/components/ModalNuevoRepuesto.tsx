import { useState, useEffect, useRef } from "react";
import { crearRepuesto } from "../services/repuestosService";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { obtenerCategorias, crearCategoria } from "../services/categoriasService";
import SelectBuscable from "../components/SelectBuscable";
import { supabase } from "../lib/supabase";

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

  const { usuario, sedeActiva } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    referencia: "",
    codigo_siesa: "",
    marca: "",
    proveedor: "",
    cantidad_inicial: "",
    unidad: "Unidades",
    stock_minimo: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaId, setCategoriaId] = useState("");

  const [modalCategoria, setModalCategoria] = useState(false);
  const [nombreCategoria, setNombreCategoria] = useState("");

  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [ubicacionId, setUbicacionId] = useState("");

  const [modalUbicacion, setModalUbicacion] = useState(false);
const [nuevaUbicacion, setNuevaUbicacion] = useState({
  bodega: "",
  estante: "",
  nivel: "",
  descripcion: ""
});

  const unidades = [
    { id: "Unidades", nombre: "Unidades" },
    { id: "Litros", nombre: "Litros" },
    { id: "Metros", nombre: "Metros" },
    { id: "Kilos", nombre: "Kilos" },
  ];

  const nombreRef = useRef<HTMLInputElement>(null);
  const referenciaRef = useRef<HTMLInputElement>(null);
  const siesaRef = useRef<HTMLInputElement>(null);
  const marcaRef = useRef<HTMLInputElement>(null);
  // const proveedorRef = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  if (!sedeActiva) return;

  async function cargar() {

    // CARGAR CATEGORIAS
    const data = await obtenerCategorias(sedeActiva!);
    setCategorias((data ?? []).filter((c:any) => c?.id));

    // CARGAR UBICACIONES
    const { data: ubic } = await supabase
      .from("ubicaciones")
      .select("id,bodega,estante,nivel")
      .eq("sede_id", sedeActiva)
      .order("bodega");

    setUbicaciones(ubic ?? []);

  }

  cargar();

}, [sedeActiva]);

  useEffect(() => {

  function handleEsc(e: KeyboardEvent) {
    if (e.key === "Escape") {
      setModalCategoria(false)
    }
  }
  

  if (modalCategoria) {
    document.addEventListener("keydown", handleEsc)
  }

  return () => {
    document.removeEventListener("keydown", handleEsc)
  }

}, [modalCategoria])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }
  function labelUbicacion(u:any){
  return `${u.bodega}-${u.estante}-${u.nivel}`;
}

  function handleEnter(
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<HTMLInputElement | null>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();

      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        handleSubmit();
      }
    }
  }

  async function handleCrearCategoria() {
    if (!sedeActiva) return;

    if (!nombreCategoria.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    try {
      const nueva = await crearCategoria(nombreCategoria.trim(), sedeActiva);

      setCategorias(prev => {
      const map = new Map(prev.map(c => [c.id, c]));
      nueva.forEach((c:any) => map.set(c.id, c));
      return Array.from(map.values());
    });
      setCategoriaId(String(nueva[0].id));

      setNombreCategoria("");
      setModalCategoria(false);

    } catch (err: any) {
      console.error(err);
      setError("Error creando la categoría.");
    }
  }
  async function crearUbicacion(){

if(!sedeActiva) return;

const { error } = await supabase
.from("ubicaciones")
.insert({
sede_id:sedeActiva,
bodega:nuevaUbicacion.bodega,
estante:nuevaUbicacion.estante,
nivel:nuevaUbicacion.nivel,
descripcion:nuevaUbicacion.descripcion
});

if(error){
console.error(error);
return;
}

const { data } = await supabase
.from("ubicaciones")
.select("id,bodega,estante,nivel")
.eq("sede_id",sedeActiva);

setUbicaciones(data ?? []);

setModalUbicacion(false);

}
console.log("UBICACION ID:", ubicacionId);

  async function handleSubmit() {

    setError("");

    if (!form.nombre || !form.referencia || !form.cantidad_inicial || !form.stock_minimo) {
      setError("Completa todos los campos obligatorios.");
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
        referencia: form.referencia,
        codigo_siesa: form.codigo_siesa || null,
        marca: form.marca || null,
        proveedor: form.proveedor || null,
        unidad: form.unidad,
        stock_minimo: Number(form.stock_minimo),
        cantidad_inicial: Number(form.cantidad_inicial),
        usuario_id: usuario.id,
        sede_id: sedeActiva!,
        categoria_id: categoriaId || null,
        ubicacion_id: ubicacionId || null
      });

      setForm({
        nombre: "",
        referencia: "",
        codigo_siesa: "",
        marca: "",
        proveedor: "",
        cantidad_inicial: "",
        unidad: "Unidades",
        stock_minimo: "",
      });

      setCategoriaId("");

      setUbicacionId("");

      onCreated();

      nombreRef.current?.focus();

    } catch (err: any) {

      console.error(err);

      if (err?.code === "23505") {
        setError("Ya existe un repuesto con esa referencia en esta categoría.");
      } else {
        setError("Error al registrar el repuesto.");
      }

    } finally {
      setLoading(false);
    }
  }

  const inputStyle = `
  w-full
  px-3 py-2.5
  rounded-xl
  border border-slate-300 dark:border-slate-700
  bg-white dark:bg-slate-800
  text-slate-900 dark:text-slate-100
  placeholder-slate-400
  focus:outline-none
  focus:ring-2
  focus:ring-indigo-500/40
  transition
  `;

return (
  <AnimatePresence>

    {abierto && (
      <motion.div
        className="fixed inset-0 z-[99999] bg-black/40 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >

        <motion.div
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
        >

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100">
              Nuevo Repuesto
            </h2>

            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xl"
            >
              ✕
            </button>

          </div>

          <div className="space-y-5 overflow-visible">

            {/* NOMBRE */}

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nombre del Repuesto
              </label>

              <input
                ref={nombreRef}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                onKeyDown={(e)=>handleEnter(e, referenciaRef)}
                placeholder="Ej: Aceite hidráulico"
                className={inputStyle}
              />
            </div>

            {/* REFERENCIA */}

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Referencia
              </label>

              <input
                ref={referenciaRef}
                name="referencia"
                value={form.referencia}
                onChange={handleChange}
                onKeyDown={(e)=>handleEnter(e, siesaRef)}
                placeholder="Ej: E55"
                className={inputStyle}
              />
            </div>

            {/* CODIGO SIESA */}

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Código Siesa
              </label>

              <input
                ref={siesaRef}
                name="codigo_siesa"
                value={form.codigo_siesa}
                onChange={handleChange}
                onKeyDown={(e)=>handleEnter(e, marcaRef)}
                placeholder="Código en Siesa"
                className={inputStyle}
              />
            </div>

            {/* MARCA */}

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Marca
              </label>

              <input
                ref={marcaRef}
                name="marca"
                value={form.marca}
                onChange={handleChange}
                onKeyDown={(e)=>handleEnter(e, cantidadRef)}
                placeholder="Marca"
                className={inputStyle}
              />
            </div>

            {/* CATEGORIA */}

<div>

<label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
Categoría
</label>

<div className="flex gap-2 mt-1">

<SelectBuscable
value={categoriaId || "none"}
items={[
{ id:"none", nombre:"Sin categoría"},
...categorias.map((c)=>({
id:String(c.id),
nombre:c.nombre
}))
]}
placeholder="Seleccionar categoría"
onChange={(id)=>setCategoriaId(id === "none" ? "" : id)}
/>

<button
type="button"
onClick={()=>setModalCategoria(true)}
className="px-3 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
>
+
</button>

</div>

</div>
{/* UBICACION */}

<div>

<label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
Ubicación (opcional)
</label>

<div className="flex gap-2 mt-1">

<SelectBuscable
value={ubicacionId || "none"}
items={[
{ id:"none", nombre:"Sin ubicación"},
...ubicaciones.map((u)=>({
id:u.id,
nombre:labelUbicacion(u)
}))
]}
placeholder="Seleccionar ubicación"
onChange={(id)=>{
  console.log("Seleccion ubicación:", id);
  setUbicacionId(id);
}}
/>

<button
type="button"
onClick={()=>setModalUbicacion(true)}
className="px-3 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
>
+
</button>

</div>

</div>


            {/* CANTIDAD + UNIDAD + STOCK */}

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr] gap-3">

<input
ref={cantidadRef}
type="number"
name="cantidad_inicial"
value={form.cantidad_inicial}
onChange={handleChange}
placeholder="Cantidad"
className={inputStyle}
/>

<SelectBuscable
value={form.unidad || "Unidades"}
items={unidades.map((u)=>({
id:u.id,
nombre:u.nombre
}))}
placeholder="Unidad"
onChange={(id)=>setForm({...form, unidad:id})}
/>

<input
ref={stockRef}
type="number"
name="stock_minimo"
value={form.stock_minimo}
onChange={handleChange}
placeholder="Stock mínimo"
className={inputStyle}
/>

</div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-3">

              <button
                onClick={onClose}
                className="
                px-4 py-2
                rounded-xl
                border border-slate-300 dark:border-slate-700
                text-slate-700 dark:text-slate-200
                bg-white dark:bg-slate-800
                hover:bg-slate-100 dark:hover:bg-slate-700
                transition
                "
              >
                Cancelar
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white"
              >
                {loading ? "Guardando..." : "Agregar Repuesto"}
              </button>

            </div>

          </div>

        </motion.div>
      </motion.div>
    )}

    {/* MODAL CATEGORIA */}

    <AnimatePresence>

      {modalCategoria && (

        <motion.div
          className="fixed inset-0 z-[999999] bg-black/40 dark:bg-black/70 backdrop-blur-sm flex justify-center items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >

          <motion.div
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >

            <div className="flex justify-between items-center mb-4">

              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Nueva Categoría
              </h3>

              <button
                onClick={()=>setModalCategoria(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>

            </div>

            <input
              value={nombreCategoria}
              onChange={(e)=>setNombreCategoria(e.target.value)}
              onKeyDown={(e)=>{
                if(e.key === "Enter"){
                  e.preventDefault()
                  handleCrearCategoria()
                }
              }}
              placeholder="Ej: Tornillos"
              className={inputStyle}
            />

            <div className="flex justify-end gap-3 mt-5">

              <button
  type="button"
  onClick={()=>setModalCategoria(true)}
  className="px-3 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
>
  +
</button>

              <button
                onClick={handleCrearCategoria}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Crear
              </button>

            </div>

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>
    <AnimatePresence>

{modalUbicacion && (

<motion.div
className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-sm flex justify-center items-center p-4"
initial={{opacity:0}}
animate={{opacity:1}}
exit={{opacity:0}}
>

<motion.div
className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
initial={{scale:0.9,opacity:0}}
animate={{scale:1,opacity:1}}
exit={{scale:0.9,opacity:0}}
>

<h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
Nueva Ubicación
</h3>

<div className="space-y-3">

<input
placeholder="Bodega (Ej: Almacén)"
className={inputStyle}
value={nuevaUbicacion.bodega}
onChange={(e)=>setNuevaUbicacion({...nuevaUbicacion,bodega:e.target.value})}
/>

<input
placeholder="Estante (Ej: A)"
className={inputStyle}
value={nuevaUbicacion.estante}
onChange={(e)=>setNuevaUbicacion({...nuevaUbicacion,estante:e.target.value})}
/>

<input
placeholder="Nivel (Ej: 1)"
className={inputStyle}
value={nuevaUbicacion.nivel}
onChange={(e)=>setNuevaUbicacion({...nuevaUbicacion,nivel:e.target.value})}
/>

<input
placeholder="Descripción (opcional)"
className={inputStyle}
value={nuevaUbicacion.descripcion}
onChange={(e)=>setNuevaUbicacion({...nuevaUbicacion,descripcion:e.target.value})}
/>

</div>
<div className="flex justify-end gap-3 mt-5">

<button
onClick={()=>setModalUbicacion(false)}
className="px-4 py-2 rounded-xl border border-slate-300"
>
Cancelar
</button>

<button
onClick={crearUbicacion}
className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
>
Crear
</button>

</div>
</motion.div>
</motion.div>

)}

</AnimatePresence>

  </AnimatePresence>
);}