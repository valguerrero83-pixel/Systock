import { useEffect, useState } from "react";
import { obtenerHistorialMovimientos } from "../services/historialService";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import type { Movimiento, Empleado, Repuesto } from "../types/index";
import { useAuth } from "../context/AuthContext";
import SelectPro from "../components/SelectPro";
import React from "react";
import { useNavigate } from "react-router-dom";
import { colorCategoria } from "../utils/colorCategoria";

/* ============================
   FORMATEAR FECHA / HORA
============================ */
function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return { fecha: "—", hora: "" };

  try {
    const f = new Date(fecha);
    return {
      fecha: f.toLocaleDateString("es-CO", { timeZone: "America/Bogota" }),
      hora: f.toLocaleTimeString("es-CO", {
        timeZone: "America/Bogota",
        hour12: true,
      }),
    };
  } catch {
    return { fecha: "—", hora: "" };
  }
}

/* ICONO */
const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
    <polyline
      points="8 4 17 12 8 20"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Historial() {

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  const { sedeActiva } = useAuth();
  const navigate = useNavigate();




  const [filtros, setFiltros] = useState({
    empleado: "",
    repuesto: "",
    tipo: "",
    desde: "",
    hasta: "",
    categoria: ""
  });
  const [columnas, setColumnas] = useState({
  codigo_app: true,
  codigo_siesa: true,
  referencia: true,
  categoria: true,
  marca: true,
});
function toggleColumna(key: keyof typeof columnas) {
  setColumnas((prev) => ({
    ...prev,
    [key]: !prev[key]
  }));
}

  useEffect(() => {
    if (!sedeActiva) return;
    cargarDatos();
  }, [sedeActiva]);
  useEffect(() => {

  if (!sedeActiva) return;

  aplicarFiltros(filtros);

}, [filtros, sedeActiva]);


  /* ============================
         CARGAR DATOS
  ============================= */

  async function cargarDatos() {

    if (!sedeActiva) return;

    const hist = await obtenerHistorialMovimientos("365", sedeActiva, filtros);

    const { data: emp } = await supabase
      .from("empleados")
      .select("id, nombre")
      .eq("sede_id", sedeActiva)
      .order("nombre");

    const { data: rep } = await supabase
    .from("repuestos")
    .select("id, nombre, unidad, stock_minimo, categoria_id, referencia, marca, codigo_siesa, codigo_corto")
    .eq("sede_id", sedeActiva)
    .order("nombre");


    const { data: categoriasData } = await supabase
      .from("categorias")
      .select("*")
      .eq("sede_id", sedeActiva)
      .order("nombre");

    setMovimientos(hist ?? []);
    setEmpleados(
    (emp ?? []).map((e: any) => ({
      id: e.id,
      nombre: e.nombre,
      cargo: e.area ?? "—",
      total_movs: 0,
      entradas: 0,
      salidas: 0,
      ultimo_mov: null,
      usuario: e.usuario ?? null
    }))
  );
    setRepuestos(rep ?? []);
    setCategorias(categoriasData ?? []);
  }

    const repuestosFiltrados = filtros.categoria
? repuestos.filter(r => r.categoria_id === filtros.categoria)
: repuestos;


{/* CARDS RESUMEN */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

  <div className="bg-indigo-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Movimientos</p>
    <p className="text-2xl font-semibold text-indigo-500">
      {movimientos.length}
    </p>
  </div>

  <div className="bg-emerald-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Entradas</p>
    <p className="text-2xl font-semibold text-emerald-500">
      {movimientos.filter(m => m.tipo === "entrada").length}
    </p>
  </div>

  <div className="bg-red-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Salidas</p>
    <p className="text-2xl font-semibold text-red-500">
      {movimientos.filter(m => m.tipo === "salida").length}
    </p>
  </div>

  <div className="bg-amber-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Repuestos movidos</p>
    <p className="text-2xl font-semibold text-amber-500">
      {new Set(movimientos.map(m => m.repuesto_id)).size}
    </p>
  </div>

</div>
  /* ============================
         FILTROS
  ============================= */

    async function aplicarFiltros(n = filtros) {

    if (!sedeActiva) return;

    const data = await obtenerHistorialMovimientos(
      "365",
      sedeActiva,
      n
    );

    setMovimientos(data);
  }

  function handleFiltro(e:any){

  const { name, value } = e.target;

  const nuevos = { ...filtros, [name]: value };

  if(name === "categoria"){
    nuevos.repuesto = "";
  }

  setFiltros(nuevos);

}

  /* ============================
       EXPORTAR CSV
  ============================= */
function exportarCSV() {

if (!movimientos.length) return;

const filas = movimientos.map((m) => {

const { fecha, hora } = formatearFecha(m.created_at_tz);

const fila:any = {};

/* SEDE */

if (sedeActiva === "all") {
fila["Sede"] = m.sedes?.nombre ?? "";
}

/* FIJAS */

fila["Fecha"] = `${fecha} ${hora}`;
fila["Tipo"] = m.tipo;

/* COLUMNAS ACTIVAS */

if (columnas.codigo_app) {
fila["Código App"] = m.repuestos?.codigo_corto ?? "";
}

if (columnas.codigo_siesa) {
fila["Código Siesa"] = (m.repuestos as any)?.codigo_siesa ?? "";
}

if (columnas.referencia) {
  fila["Referencia"] = (m.repuestos as any)?.referencia ?? "";
}

if (columnas.marca) {
  fila["Marca"] = (m.repuestos as any)?.marca ?? "";
}

if (columnas.categoria) {
  fila["Categoría"] = m.repuestos?.categorias?.nombre ?? "";
}

/* PRINCIPAL */

fila["Repuesto"] = m.repuestos?.nombre ?? "";

/* CANTIDAD */

fila["Cantidad"] =
(m.tipo === "entrada" ? "+" : "-") +
m.cantidad +
" " +
(m.repuestos?.unidad ?? "");

/* EMPLEADOS */

fila["Entrega"] = m.empleado_entrega?.nombre ?? "";
fila["Recibe"] = m.empleado_recibe?.nombre ?? "";

/* USUARIO */

fila["Usuario"] = m.usuario?.nombre ?? "";

return fila;

});

/* GENERAR CSV */

const headers = Object.keys(filas[0]);

const csv = [
headers.join(";"),
...filas.map(row =>
headers.map(h => `"${row[h] ?? ""}"`).join(";")
)
].join("\n");

const blob = new Blob(["\uFEFF" + csv], {
type: "text/csv;charset=utf-8;"
});

const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = "historial_movimientos.csv";
link.click();

}

  /* ============================
        RENDER
  ============================= */
  
  return (
    <div className="max-w-7xl mx-auto mt-6 md:mt-8 px-6">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div className="flex items-center gap-2">
          <ArrowIcon />
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Historial de Movimientos
          </h2>
        </div>

        <button
          onClick={() => navigate("/estadisticas")}
          className="
            px-4 py-2
            text-sm
            rounded-xl
            border border-slate-300 dark:border-slate-600
            text-slate-700 dark:text-slate-200
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition
            font-medium
          "
        >
          Ver estadísticas
        </button>

      </div>

      {/* FILTROS */}

      <div className="bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        rounded-3xl p-6 shadow-lg dark:shadow-black/40 mb-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">

          <Filtro label="Empleado" name="empleado" value={filtros.empleado} onChange={handleFiltro}>
            <option value="">Todos</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </Filtro>

          <Filtro label="Repuesto" name="repuesto" value={filtros.repuesto} onChange={handleFiltro}>
            <option value="">Todos</option>
            {repuestosFiltrados.map((r) => (
            <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </Filtro>

          <Filtro label="Tipo" name="tipo" value={filtros.tipo} onChange={handleFiltro}>
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </Filtro>

          <Filtro label="Categoría" name="categoria" value={filtros.categoria} onChange={handleFiltro}>
            <option value="">Todas</option>
            {categorias.map((c:any)=>(
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Filtro>

          <FiltroFecha label="Desde" name="desde" value={filtros.desde} onChange={handleFiltro} />
          <FiltroFecha label="Hasta" name="hasta" value={filtros.hasta} onChange={handleFiltro} />

        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">

  <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">
    Mostrar columnas:
  </span>

  {Object.keys(columnas).map((key) => {

    const activo = columnas[key as keyof typeof columnas];

    return (
      <button
        key={key}
        onClick={() => toggleColumna(key as keyof typeof columnas)}
        className={`
          px-3 py-1 text-xs rounded-full border
          ${
            activo
              ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
              : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
          }
        `}
      >
        {{
  codigo_app: "Código",
  codigo_siesa: "Siesa",
  referencia: "Referencia",
  marca: "Marca",
  categoria: "Categoría"
}[key]}
      </button>
    );
  })}
  <button
onClick={exportarCSV}
className="
bg-indigo-600 hover:bg-indigo-700
text-white
px-4 py-2
rounded-xl
text-sm
font-semibold
shadow-sm
transition
ml-auto
"
>
Exportar CSV
</button>

</div>


      {/* TABLA */}

      <div className="bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        rounded-3xl p-6 shadow-lg dark:shadow-black/40">

        <div className="max-h-[520px] overflow-y-auto overflow-x-visible pr-2 custom-scroll">

          <table className="w-full text-sm">

            <thead className="
            sticky top-0
            bg-white/80 dark:bg-slate-900/80
            backdrop-blur
            z-10
            border-b border-slate-200 dark:border-slate-800
            ">
              <tr className="border-b border-slate-200 dark:border-slate-800
                text-slate-500 dark:text-slate-400 text-left">

                {sedeActiva === "all" && <Th>Sede</Th>}
                <Th>Fecha</Th>
                <Th>Tipo</Th>
                {columnas.codigo_app && <Th>Código</Th>}
                {columnas.codigo_siesa && <Th>Siesa</Th>}
                {columnas.referencia && <Th>Referencia</Th>}
                {columnas.marca && <Th>Marca</Th>}
                {columnas.categoria && <Th>Categoría</Th>}
                <Th>Repuesto</Th>
                <Th>Cantidad</Th>
                <Th>Entrega</Th>
                <Th>Recibe</Th>
                <Th>Registrado</Th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

{movimientos.map((m, i) => {

const { fecha, hora } = formatearFecha(m.created_at_tz);

return (

<motion.tr
key={m.id}
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: i * 0.02 }}
className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
>

{sedeActiva === "all" && (
<Td>{m.sedes?.nombre ?? "—"}</Td>
)}

<Td>
<div className="font-semibold text-slate-800 dark:text-slate-100">
{fecha}
</div>
<div className="text-xs text-slate-500 dark:text-slate-400">
{hora}
</div>
</Td>

<Td>
<span
className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
${
m.tipo === "entrada"
? "bg-emerald-500/15 text-emerald-400"
: "bg-red-500/15 text-red-400"
}`}
>
{m.tipo === "entrada" ? "Entrada" : "Salida"}
</span>
</Td>

{columnas.codigo_app && (
<Td>
{m.repuestos?.codigo_corto ?? "—"}
</Td>
)}

{columnas.codigo_siesa && (
<Td>
{m.repuestos?.codigo_siesa ?? "—"}
</Td>
)}
{columnas.referencia && (
<Td>
{(m.repuestos as any)?.referencia ?? "—"}
</Td>
)}

{columnas.marca && (
<Td>
{(m.repuestos as any)?.marca ?? "—"}
</Td>
)}

{columnas.categoria && (
<Td>

{m.repuestos?.categorias?.nombre ? (

<span
className={`
inline-flex items-center
px-3 py-1
rounded-full
text-xs font-semibold
${colorCategoria(m.repuestos.categorias.nombre)}
`}
>
{m.repuestos.categorias.nombre}
</span>

) : (

<span className="text-slate-400">—</span>

)}

</Td>
)}

<Td>
<span className="font-medium text-slate-800 dark:text-slate-200">
{m.repuestos?.nombre ?? "—"}
</span>
</Td>

<Td>
<span
className={`font-semibold
${
m.tipo === "entrada"
? "text-emerald-400"
: "text-red-400"
}`}
>
{m.tipo === "entrada" ? "+" : "-"}
{m.cantidad}
</span>

<span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
{m.repuestos?.unidad ?? ""}
</span>
</Td>

<Td>
<span className="text-slate-600 dark:text-slate-300">
{m.empleado_entrega?.nombre ?? "—"}
</span>
</Td>

<Td>
<span className="text-slate-800 dark:text-slate-200 font-medium">
{m.empleado_recibe?.nombre ?? "—"}
</span>
</Td>

<Td>
{m.usuario?.nombre ? (

<div className="relative group">

<span
className="inline-flex items-center justify-center
w-7 h-7 rounded-full
bg-indigo-500/15 text-indigo-400
text-xs font-semibold"
>

{m.usuario.nombre
.split(" ")
.map((n: string) => n[0])
.join("")
.slice(0, 2)
.toUpperCase()}

</span>

<div
className="
absolute right-0
bottom-full mb-2
hidden group-hover:block
bg-slate-900 text-white
text-xs px-3 py-2 rounded-md
text-left
w-max max-w-[340px]
break-words
z-[999]
shadow-lg
"
>

<div className="font-semibold">
{m.usuario.nombre}
</div>

<div className="text-slate-300 break-all">
{m.usuario.email}
</div>

</div>

</div>

) : "—"}

</Td>

</motion.tr>

);

})}

</tbody>

          </table>
        </div>
      </div>

      {/* EXPORTAR */}

    </div>
  );

/* ============================
    SUBCOMPONENTES
============================ */

function Filtro({ label, name, value, onChange, children }: any) {

  const options = React.Children.toArray(children).map((child: any) => ({
    value: child.props.value,
    label: child.props.children,
  }));

  return (
    <div>

      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <SelectPro
        value={value}
        onChange={(val) =>
          onChange({ target: { name, value: val } })
        }
        options={options}
        placeholder="Seleccionar..."
      />

    </div>
  );
}

function FiltroFecha({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="
          w-full mt-1 px-3 py-2.5
          bg-slate-50 dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          rounded-xl text-sm
          text-slate-800 dark:text-slate-200
        "
      />
    </div>
  );
}

function Th({ children }: any) {
  return (
    <th className="py-3 font-semibold text-sm">
      {children}
    </th>
  );
}

function Td({ children }: any) {
  return (
    <td className="py-4 text-sm">
      {children}
    </td>
  );
}
}