import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition.bak";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import SelectBuscable from "../components/SelectBuscable";
import ModalEditarRepuesto from "../components/ModalEditarRepuesto";
import ModalKardexRepuesto from "../components/ModalKardexRepuesto";
import { colorCategoria } from "../utils/colorCategoria";

interface Categoria {
  id: string;
  nombre: string;
  color: string;
}

interface ItemInventario {
  repuesto_id: string;
  codigo_corto: string;
  nombre: string;
  unidad: string;
  stock_minimo: number;
  stock: number;
  total_movimientos: number;
  ultimo_movimiento: string | null;

  categoria?: Categoria | null;

  ubicacion?: {
  id: string;
  bodega: string;
  estante: string;
  nivel: string;
} | null;

  usuario?: {
    nombre: string;
    email: string;
  } | null;
  sedes?: {
    id: string;
    nombre: string;
  } | null;
}

/* =================================
   COLOR AUTOMATICO POR CATEGORIA
================================= */


export default function Inventario() {

  const { sedeActiva } = useAuth();

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [conteoCategorias, setConteoCategorias] = useState<Record<string,number>>({});

  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);

  const [modalEditar, setModalEditar] = useState(false);
  const [repuestoEditar, setRepuestoEditar] = useState<any>(null);

  const [modalKardex, setModalKardex] = useState(false);
  const [repuestoKardex, setRepuestoKardex] = useState<any>(null);


  const cargarInventario = async () => {

    if (!sedeActiva) return;

    setLoading(true);

    let query = supabase
    .from("stock_actual")
    .select(`
      *,
      sedes:sede_id (
        id,
        nombre
      )
    `)
    .order("codigo_corto", { ascending: true });

    if (sedeActiva !== "all") {
      query = query.eq("sede_id", sedeActiva);
      
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando inventario:", error);
      alert("Error cargando inventario");
      setLoading(false);
      return;
    }

    if (!data) {
      setItems([]);
      setLoading(false);
      return;
    }

    const repuestoIds = data.map((i: any) => i.repuesto_id);

    const { data: repuestos } = await supabase
.from("repuestos")
.select(`
  id,
  referencia,
  marca,
  proveedor,
  codigo_siesa,
  usuario_id,
  categoria_id,
  ubicacion_id,

  users:usuario_id (
    nombre,
    email
  ),

  categorias (
    id,
    nombre
  ),

  ubicaciones (
    id,
    bodega,
    estante,
    nivel
  )
`)
.in("id", repuestoIds);



    const mapaUsuarios: Record<string, any> = {};
    const mapaCategorias: Record<string, any> = {};
    const mapaExtras: Record<string, any> = {};
    const conteo: Record<string, number> = {};
    const mapaUbicaciones: Record<string, any> = {};

    repuestos?.forEach((r: any) => {

  mapaUsuarios[r.id] = r.users;
  mapaCategorias[r.id] = r.categorias;
  mapaUbicaciones[r.id] = r.ubicaciones ?? null;
  mapaExtras[r.id] = {
  referencia: r.referencia,
  marca: r.marca,
  codigo_siesa: r.codigo_siesa,
  ubicacion: r.ubicaciones
    ? `${r.ubicaciones.bodega}-${r.ubicaciones.estante}-${r.ubicaciones.nivel}`
    : null
};

  if (r.categorias?.id) {
    conteo[r.categorias.id] = (conteo[r.categorias.id] || 0) + 1;
  }

});

    setConteoCategorias(conteo);

    const inventarioConUsuario = data.map((item: any) => ({
  ...item,
  usuario: mapaUsuarios[item.repuesto_id] ?? null,
  categoria: mapaCategorias[item.repuesto_id] ?? null,

  referencia: mapaExtras[item.repuesto_id]?.referencia ?? null,
  marca: mapaExtras[item.repuesto_id]?.marca ?? null,
  codigo_siesa: mapaExtras[item.repuesto_id]?.codigo_siesa ?? null,
  ubicacion: mapaUbicaciones[item.repuesto_id]
  ? {
      id: mapaUbicaciones[item.repuesto_id].id,
      bodega: mapaUbicaciones[item.repuesto_id].bodega,
      estante: mapaUbicaciones[item.repuesto_id].estante,
      nivel: mapaUbicaciones[item.repuesto_id].nivel
    }
  : null,
}));

    setItems(inventarioConUsuario);
    setLoading(false);
  };


function exportarInventarioCSV() {

  if (!itemsFiltrados || itemsFiltrados.length === 0) return;

  const filas = itemsFiltrados.map((i: any) => {

    const fila: any = {};

    fila["Código"] = i.codigo_corto;
    fila["Categoría"] = i.categoria?.nombre ?? "";

    if (columnas.ubicacion) {
      fila["Ubicación"] = i.ubicacion
        ? `${i.ubicacion.bodega}-${i.ubicacion.estante}-${i.ubicacion.nivel}`
        : "";
    }

    fila["Nombre"] = i.nombre;

    if (columnas.referencia) {
      fila["Referencia"] = i.referencia ?? "";
    }

    if (columnas.marca) {
      fila["Marca"] = i.marca ?? "";
    }

    if (columnas.codigo_siesa) {
      fila["Código Siesa"] = i.codigo_siesa ?? "";
    }

    fila["Stock Actual"] = `${i.stock} ${i.unidad}`;
    fila["Stock Mínimo"] = `${i.stock_minimo} ${i.unidad}`;

    fila["Estado"] =
      Number(i.stock) === 0
        ? "Sin stock"
        : Number(i.stock) < Number(i.stock_minimo)
        ? "Stock Bajo"
        : "Normal";

    fila["Creado por"] = i.usuario?.nombre ?? "";

    return fila;
  });

  const headers = Object.keys(filas[0]);

  const csv = [
    headers.join(";"),
    ...filas.map(row =>
      headers.map(h => `"${(row as any)[h] ?? ""}"`).join(";")
    )
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "inventario.csv";
  link.click();
}


  const cargarCategorias = async () => {

    if (!sedeActiva) return;

    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("sede_id", sedeActiva)
      .order("nombre");

    setCategorias(data?? []);
  };
  
  const [columnas, setColumnas] = useState({
  referencia: true,
  marca: true,
  codigo_siesa: true,
  ubicacion: true
});

const toggleColumna = (key: keyof typeof columnas) => {
  setColumnas(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
};
  const cargarUbicaciones = async () => {
  if (!sedeActiva) return;

  const { data } = await supabase
    .from("ubicaciones")
    .select("*")
    .eq("sede_id", sedeActiva);

  setUbicaciones(data ?? []);
};

  useEffect(() => {

    if (!sedeActiva) return;

    cargarInventario();
    cargarCategorias();
    cargarUbicaciones();

    const channel = supabase
      .channel("rt_inventario")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movimientos" },
        () => cargarInventario()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [sedeActiva]);

  const itemsFiltrados = items.filter((i) => {

  const texto = busqueda.toLowerCase();

  const coincideBusqueda =
    i.nombre.toLowerCase().includes(texto) ||
    i.codigo_corto.toLowerCase().includes(texto);

  const coincideCategoria =
    !categoriaFiltro || i.categoria?.id === categoriaFiltro;

  const coincideUbicacion =
    !filtroUbicacion || i.ubicacion?.id === filtroUbicacion;

  return coincideBusqueda && coincideCategoria && coincideUbicacion;

});

  return (

    <PageTransition>

      <motion.div
        className="
          max-w-7xl mx-auto
          mt-6 md:mt-8
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-800
          rounded-3xl
          p-6
          shadow-lg dark:shadow-black/40
        "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100">
  Inventario de Repuestos
</h2>
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

  <div className="bg-indigo-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Repuestos</p>
    <p className="text-2xl font-semibold text-indigo-500">
      {items.length}
    </p>
  </div>

  <div className="bg-red-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Stock bajo</p>
    <p className="text-2xl font-semibold text-red-500">
      {items.filter(i => Number(i.stock) < Number(i.stock_minimo)).length}
    </p>
  </div>

  <div className="bg-emerald-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Categorías</p>
    <p className="text-2xl font-semibold text-emerald-500">
      {categorias.length}
    </p>
  </div>

  <div className="bg-amber-500/10 p-4 rounded-2xl">
    <p className="text-sm text-slate-500">Ubicaciones</p>
    <p className="text-2xl font-semibold text-amber-500">
      {ubicaciones.length}
    </p>
  </div>

</div>
{/* FILTROS */}
<div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">

  {/* BUSCADOR */}
  <div className="md:col-span-6">
    <input
      type="text"
      placeholder="Buscar por código, nombre o unidad..."
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      className="
        w-full
        px-4 py-2.5
        rounded-xl
        border border-slate-300 dark:border-slate-700
        bg-white dark:bg-slate-800
        text-slate-800 dark:text-slate-200
        focus:outline-none
        focus:ring-2 focus:ring-indigo-500
      "
    />
  </div>

  {/* CATEGORIA */}
  <div className="md:col-span-3">
    <SelectBuscable
      value={categoriaFiltro || "all"}
      placeholder="Todas las categorías"
      onChange={(id) => setCategoriaFiltro(id === "all" ? "" : id)}
      items={[
        { id: "all", nombre: `Todas (${categorias.length})` },
        ...categorias.map((c) => ({
          id: c.id,
          nombre: `${c.nombre} (${conteoCategorias[c.id] ?? 0})`,
        })),
      ]}
    />
  </div>

  {/* UBICACION */}
  <div className="md:col-span-3">
    <SelectBuscable
      value={filtroUbicacion || "all"}
      placeholder="Todas las ubicaciones"
      onChange={(id) => setFiltroUbicacion(id === "all" ? "" : id)}
      items={[
        { id: "all", nombre: "Todas las ubicaciones" },
        ...ubicaciones.map((u) => ({
          id: u.id,
          nombre: `${u.bodega}-${u.estante}-${u.nivel}`
        }))
      ]}
    />
  </div>

</div>

{/* COLUMNAS */}
<div className="mb-4 flex flex-wrap items-center gap-2">

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
          px-3 py-1 text-xs rounded-full border transition
          ${activo
            ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
            : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}
        `}
      >
        {key}
      </button>
    );
  })}

  {/* MOSTRAR TODAS */}
  
<button
    onClick={exportarInventarioCSV}
    className="
      bg-indigo-600 hover:bg-indigo-700
      text-white
      px-4 py-2
      rounded-xl
      text-sm
      font-semibold
      shadow-sm
      transition
    "
  >
    Exportar Inventario
  </button>
      </div>

        {/* TABLA */}

        <div className="overflow-x-auto">

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scroll">

              <table className="w-full text-sm table-fixed">

              <thead className="
              sticky top-0
              bg-white/80 dark:bg-slate-900/80
              backdrop-blur
              z-10
              border-b border-slate-200 dark:border-slate-800
              ">
                <tr className="text-left text-slate-500 dark:text-slate-400 text-sm">

                  <th className="py-3 px-2 font-semibold w-[70px]">Código</th>
                  <th className="px-2 font-semibold w-[120px]">Categoría</th>
                  {columnas.ubicacion && <th className="px-2 font-semibold w-[140px]">Ubicación</th>}
                  <th className="px-2 font-semibold w-[220px]">Nombre</th>
                  {columnas.referencia && <th className="px-2 font-semibold w-[110px]">Referencia</th>}
                  {columnas.marca && <th className="px-2 font-semibold w-[110px]">Marca</th>}
                  {columnas.codigo_siesa && <th className="px-2 font-semibold w-[120px]">Código Siesa</th>}
                  <th className="px-2 font-semibold w-[120px]">Stock Actual</th>
                  <th className="px-2 font-semibold w-[110px]">Stock Mín.</th>
                  <th className="px-2 font-semibold w-[110px]">Estado</th>
                  <th className="px-2 font-semibold w-[90px]">Creado</th>
                  <th className="px-2 font-semibold w-[90px]">Editar</th>
                  

                </tr>
                
              </thead>
              

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

{itemsFiltrados.map((i, index) => {

  const stockBajo =
    Number(i.stock) < Number(i.stock_minimo);

  return (

    <motion.tr
      key={`${i.repuesto_id}-${index}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="
        hover:bg-slate-50 dark:hover:bg-slate-800/60
        transition
        border-b border-slate-200 dark:border-slate-800
      "
      onDoubleClick={() => {
      setRepuestoKardex(i);
      setModalKardex(true);
      }}
    >

      {/* CODIGO */}
      <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
        {i.codigo_corto}
      </td>

      {/* CATEGORIA */}
      <td>
        {i.categoria ? (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorCategoria(i.categoria.nombre)}`}>
            {i.categoria.nombre}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>

      {/* UBICACION */}
      {columnas.ubicacion && (
        <td>
          {i.ubicacion ? (
            <span className="
              inline-flex items-center
              px-3 py-1
              rounded-full
              text-xs font-semibold
              bg-amber-500/15 text-amber-500
            ">
              {i.ubicacion.bodega}-{i.ubicacion.estante}-{i.ubicacion.nivel}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          )}
        </td>
      )}

      {/* NOMBRE */}
      <td className="px-2 truncate max-w-[140px] text-slate-700 dark:text-slate-300">
        {i.nombre}
      </td>

      {/* REFERENCIA */}
      {columnas.referencia && (
        <td className="px-2 truncate max-w-[110px] text-slate-600 dark:text-slate-400">
          {(i as any).referencia ?? "—"}
        </td>
      )}

      {/* MARCA */}
      {columnas.marca && (
        <td className="px-2 truncate max-w-[110px] text-slate-600 dark:text-slate-400">
          {(i as any).marca ?? "—"}
        </td>
      )}

      {/* CODIGO SIESA */}
      {columnas.codigo_siesa && (
        <td className="px-2 truncate max-w-[110px] text-slate-600 dark:text-slate-400">
          {(i as any).codigo_siesa ?? "—"}
        </td>
      )}

      {/* STOCK ACTUAL */}
      <td>
        <span className={`
          px-3 py-1 rounded-full text-xs font-semibold
          ${
            Number(i.stock) === 0
              ? "bg-red-500/15 text-red-500"
              : stockBajo
              ? "bg-red-500/15 text-red-500"
              : "bg-emerald-500/15 text-emerald-500"
          }
        `}>
          {i.stock} {i.unidad}
        </span>
      </td>

      {/* STOCK MIN */}
      <td className="text-slate-700 dark:text-slate-300">
        {i.stock_minimo} {i.unidad}
      </td>

      {/* ESTADO */}
      <td>
        {Number(i.stock) === 0 ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-500">
            Sin stock
          </span>
        ) : stockBajo ? (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-500">
            Stock Bajo
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500">
            Normal
          </span>
        )}
      </td>

      {/* CREADO POR */}
      <td>

        {i.usuario?.nombre ? (

          <div className="relative group">

            <span
              className="
                inline-flex items-center justify-center
                w-7 h-7 rounded-full
                bg-indigo-500/15 text-indigo-400
                text-xs font-semibold
              "
            >
              {i.usuario.nombre
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>

            <div
              className="
                absolute right-0 bottom-full mb-2
                hidden group-hover:block
                bg-slate-900 text-white
                text-xs px-3 py-2 rounded-md
                text-left
                w-max max-w-[260px]
                break-words
                z-[999]
                shadow-lg
              "
            >
              <div className="font-semibold">
                {i.usuario.nombre}
              </div>
              <div className="text-slate-300 break-all">
                {i.usuario.email}
              </div>
            </div>

          </div>

        ) : (
          <span className="text-slate-400">—</span>
        )}

      </td>

      {/* EDITAR */}
      <td>
        <button
          onClick={() => {
            setRepuestoEditar(i);
            setModalEditar(true);
          }}
          className="
            px-3 py-1 text-xs rounded-lg
            bg-indigo-500/10 text-indigo-500
            hover:bg-indigo-500/20 transition
          "
        >
          Editar
        </button>
      </td>

    </motion.tr>

  );

})}



</tbody>
<div className="flex justify-between items-center mb-4">

  <div className="text-sm text-slate-500 dark:text-slate-400">
    {itemsFiltrados.length} repuestos
  </div>

  

</div>
            </table>
                <ModalEditarRepuesto
              abierto={modalEditar}
              onClose={() => setModalEditar(false)}
              repuesto={repuestoEditar}
              onUpdated={cargarInventario}
            />

            <ModalKardexRepuesto
              abierto={modalKardex}
              onClose={() => setModalKardex(false)}
              repuesto={repuestoKardex}
            />

            {loading && (

              <p className="text-center text-slate-500 dark:text-slate-400 mt-8 animate-pulse">
                Cargando inventario...
              </p>

            )}

            {!loading && itemsFiltrados.length === 0 && (

              <p className="text-center text-slate-500 dark:text-slate-400 mt-8">
                No se encontraron resultados.
              </p>

            )}

          </div>

        </div>
        

      </motion.div>
      

    </PageTransition>

  );

}