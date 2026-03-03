import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface SelectProProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SelectPro({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
}: SelectProProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      {/* BOTÓN */}
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full
          px-4 py-2.5
          rounded-xl
          bg-white dark:bg-slate-800
          border border-slate-300 dark:border-slate-700
          text-left
          text-slate-800 dark:text-slate-200
          shadow-sm
          hover:border-indigo-500
          transition
          flex justify-between items-center
        "
      >
        <span>
          {selected ? selected.label : placeholder}
        </span>

        <span
          className={`transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* DROPDOWN */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="
              absolute z-50 mt-2 w-full
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-700
              rounded-2xl
              shadow-xl
              overflow-hidden
            "
          >
            {/* BUSCADOR */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="
                  w-full px-3 py-2
                  rounded-lg
                  bg-slate-100 dark:bg-slate-800
                  text-slate-800 dark:text-slate-200
                  focus:outline-none
                  focus:ring-2 focus:ring-indigo-500
                "
              />
            </div>

            {/* LISTA */}
            <div className="max-h-60 overflow-y-auto custom-scroll">
              {filtered.length === 0 && (
                <div className="p-4 text-sm text-slate-400">
                  Sin resultados
                </div>
              )}

              {filtered.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm
                    hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                    transition
                    ${
                      value === option.value
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600"
                        : "text-slate-700 dark:text-slate-200"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}