import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../components/PageTransition.bak";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import SelectBuscable from "../components/SelectBuscable";

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

function colorCategoria(nombre: string) {

const estilos = [
"bg-indigo-500/15 text-indigo-400",
"bg-blue-500/15 text-blue-400",
"bg-emerald-500/15 text-emerald-400",
"bg-teal-500/15 text-teal-400",
"bg-cyan-500/15 text-cyan-400",
"bg-purple-500/15 text-purple-400",
"bg-pink-500/15 text-pink-400",
"bg-rose-500/15 text-rose-400",
"bg-amber-500/15 text-amber-400",
"bg-orange-500/15 text-orange-400",
"bg-lime-500/15 text-lime-400",
"bg-sky-500/15 text-sky-400"
]

let hash = 0

for (let i = 0; i < nombre.length; i++) {
hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
}

const index = Math.abs(hash) % estilos.length

return estilos[index]

}

export default function Inventario() {

  const { sedeActiva } = useAuth();

  const [items, setItems] = useState<ItemInventario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [conteoCategorias, setConteoCategorias] = useState<Record<string,number>>({});

  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");


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
    users:usuario_id (
      nombre,
      email
    ),
    categorias (
      id,
      nombre
    )
  `)
      .in("id", repuestoIds);

    const mapaUsuarios: Record<string, any> = {};
    const mapaCategorias: Record<string, any> = {};
    const mapaExtras: Record<string, any> = {};
    const conteo: Record<string, number> = {};

    repuestos?.forEach((r: any) => {

  mapaUsuarios[r.id] = r.users;
  mapaCategorias[r.id] = r.categorias;

  mapaExtras[r.id] = {
    referencia: r.referencia,
    marca: r.marca,
    proveedor: r.proveedor,
    codigo_siesa: r.codigo_siesa
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
  proveedor: mapaExtras[item.repuesto_id]?.proveedor ?? null,
  codigo_siesa: mapaExtras[item.repuesto_id]?.codigo_siesa ?? null
}));

    setItems(inventarioConUsuario);
    setLoading(false);
  };

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
  referencia: false,
  marca: false,
  proveedor: false,
  codigo_siesa: false,
  ubicacion: false
});

const toggleColumna = (key: keyof typeof columnas) => {
  setColumnas(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
};
  
  useEffect(() => {

    if (!sedeActiva) return;

    cargarInventario();
    cargarCategorias();

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
      i.codigo_corto.toLowerCase().includes(texto) ||
      i.unidad.toLowerCase().includes(texto);

    const coincideCategoria =
      !categoriaFiltro || i.categoria?.id === categoriaFiltro;

    return coincideBusqueda && coincideCategoria;

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

        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Inventario de Repuestos
        </h2>

        {/* BUSCADOR + FILTRO */}

        <div className="mb-6 flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Buscar por código, nombre o unidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="
              w-full md:w-96
              px-4 py-2.5
              rounded-xl
              border border-slate-300 dark:border-slate-700
              bg-white dark:bg-slate-800
              text-slate-800 dark:text-slate-200
              focus:outline-none
              focus:ring-2 focus:ring-indigo-500
            "
          />

          <SelectBuscable
            value={categoriaFiltro || "all"}
            placeholder="Todas las categorías"
            onChange={(id) => setCategoriaFiltro(id === "all" ? "" : id)}
            items={[
              {
                id: "all",
                nombre: `Todas las categorías (${categorias.length})`,
              },
              ...categorias.map((c) => ({
                id: c.id,
                nombre: `${c.nombre} (${conteoCategorias[c.id] ?? 0})`,
              })),
            ]}
          />
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
          ${activo
            ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
            : "border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"}
        `}
      >
        {key}
      </button>
    );
  })}

</div>

        {/* TABLA */}

        <div className="overflow-x-auto">

          <div className="max-h-[500px] overflow-y-auto pr-2 custom-scroll">

            <table className="w-full text-sm">

              <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">

                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  {sedeActiva === "all" && <th>Sede</th>}
                  <th className="py-3">Código</th>
                  <th>Categoría</th>
                  {columnas.referencia && <th>Referencia</th>}
                  {columnas.marca && <th>Marca</th>}
                  {columnas.proveedor && <th>Proveedor</th>}
                  {columnas.codigo_siesa && <th>Código Siesa</th>}
                  {columnas.ubicacion && <th>Ubicación</th>}
                  <th>Nombre</th>
                  <th>Stock Actual</th>
                  <th>Stock Mín.</th>
                  <th>Estado</th>
                  <th>Creado por</th>


                </tr>

              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

                {itemsFiltrados.map((i, index) => {

                  const stockBajo =
                    Number(i.stock) < Number(i.stock_minimo);

                  return (

                    <motion.tr
                      key={i.repuesto_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                    >
                      {sedeActiva === "all" && (
                      <td className="text-slate-600 dark:text-slate-400">
                        {i.sedes?.nombre ?? "—"}
                      </td>
                      )}

                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {i.codigo_corto}
                      </td>
                       <td>

                        {i.categoria ? (

                          <div className="relative group">

                            <span
                              className={`
                                inline-flex items-center
                                px-3 py-1
                                rounded-full
                                text-xs font-semibold
                                ${colorCategoria(i.categoria.nombre)}
                              `}
                            >

                              {i.categoria.nombre}

                            </span>

                            <div
                              className="
                                absolute right-0 bottom-full mb-2
                                hidden group-hover:block
                                bg-slate-900 text-white
                                text-xs px-3 py-2 rounded-md
                                text-left
                                w-max
                                z-[999]
                                shadow-lg
                              "
                            >

                              {conteoCategorias[i.categoria.id] ?? 0} repuestos en esta categoría

                            </div>

                          </div>

                        ) : (

                          <span className="text-slate-400">—</span>

                        )}

                      </td>

                      {columnas.referencia && (
                        <td className="text-slate-600 dark:text-slate-400">
                          {(i as any).referencia ?? "—"}
                        </td>
                      )}

                      {columnas.marca && (
                        <td className="text-slate-600 dark:text-slate-400">
                          {(i as any).marca ?? "—"}
                        </td>
                      )}

                      {columnas.proveedor && (
                        <td className="text-slate-600 dark:text-slate-400">
                          {(i as any).proveedor ?? "—"}
                        </td>
                      )}

                      {columnas.codigo_siesa && (
                        <td className="text-slate-600 dark:text-slate-400">
                          {(i as any).codigo_siesa ?? "—"}
                        </td>
                      )}

                      {columnas.ubicacion && (
                        <td className="text-slate-600 dark:text-slate-400">
                          {(i as any).ubicacion ?? "—"}
                        </td>
                      )}

                      <td className="text-slate-800 dark:text-slate-200">
                        {i.nombre}
                      </td>
                     
                      {/* STOCK */}

                      <td>

                        <span
                          className={`
                            px-3 py-1 rounded-full text-xs font-semibold
                            ${
                              stockBajo
                                ? "bg-red-500/15 text-red-400"
                                : "bg-emerald-500/15 text-emerald-400"
                            }
                          `}
                        >
                          {i.stock} {i.unidad}
                        </span>

                      </td>

                      <td className="text-slate-600 dark:text-slate-400">
                        {i.stock_minimo} {i.unidad}
                      </td>

                      <td>

                        {stockBajo ? (

                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                            ⚠ Stock Bajo
                          </span>

                        ) : (

                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                            ✓ Normal
                          </span>

                        )}

                      </td>

                      {/* USUARIO */}

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
                                w-max max-w-[340px]
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

                        ) : "—"}

                      </td>

                    </motion.tr>

                  );

                })}

              </tbody>

            </table>

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