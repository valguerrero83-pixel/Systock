import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Item {
  id: string;
  nombre: string;
}

interface Props {
  value: string;
  items: Item[];
  placeholder: string;
  onChange: (id: string) => void;
}

export default function SelectBuscable({
  value,
  items,
  placeholder,
  onChange,
}: Props) {

  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event:any) {
      if(ref.current && !ref.current.contains(event.target)){
        setAbierto(false)
      }
    }

    document.addEventListener("mousedown",handleClickOutside)

    return () => {
      document.removeEventListener("mousedown",handleClickOutside)
    }

  },[])

  /* ---------- NORMALIZAR ITEMS ---------- */

  const itemsSeguros = useMemo(() => {

    const map = new Map<string, Item>();

    items.forEach((i) => {
      if (!i?.id) return;
      map.set(String(i.id), {
        id: String(i.id),
        nombre: i.nombre
      });
    });

    return Array.from(map.values());

  }, [items]);

  const seleccionado = itemsSeguros.find((i)=>i.id===value)

  const filtrados = itemsSeguros.filter((i)=>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div ref={ref} className="relative w-full">

      <button
        type="button"
        onClick={()=>setAbierto(!abierto)}
        className="
        w-full
        px-3
        py-2.5
        rounded-xl
        border border-slate-300 dark:border-slate-700
        bg-white dark:bg-slate-800
        text-slate-800 dark:text-slate-100
        flex justify-between items-center
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-500/40
        transition
        "
      >

        <span className={seleccionado ? "" : "text-slate-400"}>
          {seleccionado ? seleccionado.nombre : placeholder}
        </span>

        <span className="text-slate-400 text-sm">▾</span>

      </button>

      <AnimatePresence>

        {abierto && (

          <motion.div
            key="dropdown"
            initial={{opacity:0,y:6}}
            animate={{opacity:1,y:0}}
            exit={{opacity:0}}
            transition={{duration:0.15}}
            className="
            absolute
            mt-2
            w-full
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            rounded-xl
            shadow-xl
            z-50
            overflow-hidden
            "
          >

            <div className="p-2 border-b border-slate-200 dark:border-slate-700">

              <input
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e)=>setBusqueda(e.target.value)}
                className="
                w-full
                px-2.5
                py-2
                rounded-lg
                text-sm
                bg-slate-100 dark:bg-slate-800
                text-slate-700 dark:text-slate-100
                placeholder-slate-400
                focus:outline-none
                "
              />

            </div>

            <div className="max-h-60 overflow-y-auto">

              {filtrados.map((item) => {

                const activo = value === item.id

                return (
                  <button
                    key={`select-item-${item.id}`}
                    onClick={()=>{
                      onChange(item.id)
                      setAbierto(false)
                      setBusqueda("")
                    }}
                    className={`
                    w-full
                    px-3
                    py-2
                    text-left
                    text-sm
                    transition
                    ${
                      activo
                        ? "bg-indigo-500/10 text-indigo-500"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    }
                    `}
                  >
                    {item.nombre}
                  </button>
                )

              })}

              {filtrados.length===0 && (
                <p className="p-3 text-sm text-slate-400 text-center">
                  Sin resultados
                </p>
              )}

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  )
}