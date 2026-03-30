import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface Empleado {
  id: string;
  nombre: string;
  cargo: string;
  total_movs: number;
  entradas: number;
  salidas: number;

  usuario?: {
    nombre: string;
    email: string;
  } | null;
  sede?: {
    id: string;
    nombre: string;
  } | null;
}

export default function Empleados() {

  const { usuario, sedeActiva } = useAuth();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [columnas, setColumnas] = useState({
  entradas: true,
  salidas: true,
  movimientos: true
});
function toggleColumna(key: keyof typeof columnas) {
  setColumnas((prev) => ({
    ...prev,
    [key]: !prev[key]
  }));
}

  /* =========================
      CARGAR EMPLEADOS
  ========================= */

  const cargarEmpleados = async () => {

    setLoading(true);

    let empQuery = supabase
      .from("empleados")
      .select(`
        id,
        nombre,
        area,
        sede_id,
        usuario:usuario_id (
          nombre,
          email
        )
      `);

    if (sedeActiva && sedeActiva !== "all") {
      empQuery = empQuery.eq("sede_id", sedeActiva);
    }

    const { data: lista, error } = await empQuery;

    if (error) {
      console.error("Error cargando empleados:", error);
      setLoading(false);
      return;
    }

    /* =========================
        MOVIMIENTOS
    ========================= */

    let movQuery = supabase
      .from("movimientos")
      .select("entregado_por, recibido_por, tipo, sede_id");

    if (sedeActiva && sedeActiva !== "all") {
      movQuery = movQuery.eq("sede_id", sedeActiva);
    }

    const { data: movimientos } = await movQuery;

    const movStats: Record<
      string,
      { total: number; entradas: number; salidas: number }
    > = {};

    movimientos?.forEach((m: any) => {

      const registrar = (empId: string) => {

        if (!movStats[empId]) {
          movStats[empId] = {
            total: 0,
            entradas: 0,
            salidas: 0
          };
        }

        movStats[empId].total++;

        if (m.tipo === "entrada") movStats[empId].entradas++;
        if (m.tipo === "salida") movStats[empId].salidas++;

      };

      if (m.entregado_por) registrar(m.entregado_por);
      if (m.recibido_por) registrar(m.recibido_por);

    });
    

    const empleadosFormateados = (lista ?? []).map((e: any) => ({
      id: e.id,
      nombre: e.nombre,
      cargo: e.area ?? "—",
      total_movs: movStats[e.id]?.total || 0,
      entradas: movStats[e.id]?.entradas || 0,
      salidas: movStats[e.id]?.salidas || 0,
      usuario: e.usuario ?? null,
    }));

    setEmpleados(empleadosFormateados);
    setLoading(false);
  };

  useEffect(() => {
    if (!sedeActiva) return;
    cargarEmpleados();
  }, [sedeActiva]);

  /* =========================
        ELIMINAR
  ========================= */

  const eliminarEmpleado = async (id: string) => {

    const { data: movs, error: movErr } = await supabase
      .from("movimientos")
      .select("id")
      .or(`entregado_por.eq."${id}",recibido_por.eq."${id}"`);

    if (movErr) {
      console.error(movErr);
      alert("Error verificando movimientos.");
      return;
    }

    if (movs.length > 0) {
      alert("❌ No puedes eliminar un empleado con movimientos.");
      return;
    }

    const { error } = await supabase
      .from("empleados")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error eliminando empleado.");
      return;
    }

    alert("Empleado eliminado correctamente.");
    cargarEmpleados();
  };

  /* =========================
      EXPORTAR CSV
  ========================= */

  async function exportarCSVEmpleado(empId: string) {

    const { data, error } = await supabase
      .from("movimientos")
      .select(`
        tipo,
        cantidad,
        created_at_tz,
        repuestos(nombre, unidad),
        empleado_entrega:entregado_por(nombre),
        empleado_recibe:recibido_por(nombre)
      `)
      .or(`entregado_por.eq.${empId},recibido_por.eq.${empId}`)
      .order("created_at_tz", { ascending: false });

    if (error) {
      console.error(error);
      alert("Error generando CSV");
      return;
    }

    if (!data?.length) {
      alert("Este empleado no tiene movimientos.");
      return;
    }

    const filas = data.map((m: any) => ({
      Fecha: new Date(m.created_at_tz).toLocaleString("es-CO"),
      Tipo: m.tipo,
      Repuesto: m.repuestos?.nombre ?? "",
      Cantidad: `${m.cantidad} ${m.repuestos?.unidad ?? ""}`,
      Entrega: m.empleado_entrega?.nombre ?? "",
      Recibe: m.empleado_recibe?.nombre ?? ""
    }));

    const encabezado = Object.keys(filas[0]).join(";");
    const contenido = filas
      .map((f) => Object.values(f).map((v) => `"${v}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + encabezado + "\n" + contenido], {
      type: "text/csv;charset=utf-8"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `movimientos_empleado_${empId}.csv`;
    a.click();
  }
  function exportarCSVGlobal() {

  if (!empleadosFiltrados.length) {
    alert("No hay empleados para exportar.");
    return;
  }

  const filas = empleadosFiltrados.map((e) => ({
    Nombre: e.nombre,
    Cargo: e.cargo,
    Entradas: e.entradas,
    Salidas: e.salidas,
    Total: e.total_movs
  }));

  const encabezado = Object.keys(filas[0]).join(";");

  const contenido = filas
    .map((f) => Object.values(f).map((v) => `"${v}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + encabezado + "\n" + contenido], {
    type: "text/csv;charset=utf-8"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "empleados_movimientos.csv";
  a.click();
}

/* =========================
        FILTRO
  ========================= */

  const empleadosFiltrados = empleados.filter((e) => {

  const texto = busqueda.toLowerCase();

  const coincideBusqueda =
    e.nombre.toLowerCase().includes(texto) ||
    e.cargo.toLowerCase().includes(texto);

  if (!coincideBusqueda) return false;


  return true;

});

  /* =========================
      KPIs
  ========================= */
  return (
    <motion.div
      className="
        max-w-7xl mx-auto mt-6 md:mt-8 px-6
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-800
        rounded-3xl p-6
        shadow-lg dark:shadow-black/40
      "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >

      <h2 className="text-xl md:text-2xl font-semibold mb-6 
        text-slate-800 dark:text-slate-100">
        Empleados
      </h2>


      {/* BUSCADOR */}
{/* BUSCADOR */}

<div className="mb-6 flex flex-col md:flex-row md:items-center gap-3">

  <input
    type="text"
    placeholder="Buscar empleado por nombre o cargo..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
    className="
      w-full md:w-80
      px-3 py-2.5
      bg-slate-50 dark:bg-slate-800/70
      border border-slate-200 dark:border-slate-700
      rounded-xl
      text-slate-800 dark:text-slate-100
      focus:outline-none focus:ring-2 focus:ring-indigo-500
      transition
    "
  />

</div>
      <div className="mb-6">


    {/* CARDS */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

      <div className="bg-indigo-500/10 p-4 rounded-2xl">
        <p className="text-sm text-slate-500">Empleados</p>
        <p className="text-2xl font-semibold text-indigo-500">
          {empleados.length}
        </p>
      </div>

      <div className="bg-emerald-500/10 p-4 rounded-2xl">
        <p className="text-sm text-slate-500">Entradas</p>
        <p className="text-2xl font-semibold text-emerald-500">
          {empleados.reduce((acc,e)=>acc+e.entradas,0)}
        </p>
      </div>

      <div className="bg-red-500/10 p-4 rounded-2xl">
        <p className="text-sm text-slate-500">Salidas</p>
        <p className="text-2xl font-semibold text-red-500">
          {empleados.reduce((acc,e)=>acc+e.salidas,0)}
        </p>
      </div>

      <div className="bg-amber-500/10 p-4 rounded-2xl">
        <p className="text-sm text-slate-500">Movimientos</p>
        <p className="text-2xl font-semibold text-amber-500">
          {empleados.reduce((acc,e)=>acc+e.total_movs,0)}
        </p>
      </div>

    </div>

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
        {key}
      </button>
    );
  })}

    <button
    onClick={exportarCSVGlobal}
    className="
      px-4 py-2
      text-sm
      rounded-xl
      bg-indigo-600 text-white
      hover:bg-indigo-700
      transition
    "
  >
    Exportar CSV
  </button>

</div>
      <div className="flex flex-wrap gap-3 mb-6">




</div>



      {/* TABLA */}

      <div className="overflow-x-auto">

        <table className="w-full text-sm min-w-[720px]">

          <thead className="border-b border-slate-200 dark:border-slate-800">

            <tr className="text-left text-slate-500 dark:text-slate-400">
                {sedeActiva === "all" && <th>Sede</th>}
                <th className="py-3 px-3 font-semibold">Nombre</th>
                <th className="px-3 font-semibold">Cargo</th>
                {columnas.entradas && (
                  <th className="px-3 text-center font-semibold">Entradas</th>
                )}

                {columnas.salidas && (
                  <th className="px-3 text-center font-semibold">Salidas</th>
                )}

                {columnas.movimientos && (
                  <th className="px-3 text-center font-semibold">Movimientos</th>
                )}
                <th className="px-3 text-center font-semibold">Creado por</th>
                <th className="px-3 text-center font-semibold">Acciones</th>

            </tr>

          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">

            {empleadosFiltrados.map((e, index) => (

              <motion.tr
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
              >
                {sedeActiva === "all" && (
                  <td>{e.sede?.nombre ?? "—"}</td>
                  )}

                <td className="py-4 px-3 font-medium text-slate-800 dark:text-slate-100">
                  {e.nombre}
                </td>

                <td className="px-3 text-slate-600 dark:text-slate-300">
                  {e.cargo}
                </td>
                {columnas.entradas && (
<td className="text-center px-3">
  <span className="
    inline-flex items-center
    px-3 py-1
    rounded-full
    text-xs font-semibold
    bg-emerald-500/15
    text-emerald-400
  ">
    {e.entradas}
  </span>
</td>
)}

{columnas.salidas && (
<td className="text-center px-3">
  <span className="
    inline-flex items-center
    px-3 py-1
    rounded-full
    text-xs font-semibold
    bg-red-500/15
    text-red-400
  ">
    {e.salidas}
  </span>
</td>
)}

{columnas.movimientos && (
<td className="text-center px-3">
  <span className="
    inline-flex items-center
    px-3 py-1
    rounded-full
    text-xs font-semibold
    bg-indigo-500/15
    text-indigo-400
  ">
    {e.total_movs}
  </span>
</td>
)}

                {/* USUARIO */}

                <td className="text-center px-3">

                  {e.usuario?.nombre ? (

                    <div className="relative group inline-block">

                      <span className="
                        inline-flex items-center justify-center
                        w-7 h-7 rounded-full
                        bg-indigo-500/15 text-indigo-400
                        text-xs font-semibold
                      ">
                        {e.usuario.nombre
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>

                      <div className="
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
                      ">

                        <div className="font-semibold">
                          {e.usuario.nombre}
                        </div>

                        <div className="text-slate-300 break-all">
                          {e.usuario.email}
                        </div>

                      </div>

                    </div>

                  ) : "—"}

                </td>

                {/* ACCIONES */}

                <td className="text-center px-3">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => exportarCSVEmpleado(e.id)}
                      className="
                        px-3 py-1.5 rounded-lg text-xs font-semibold
                        bg-indigo-500/15 text-indigo-400
                        hover:bg-indigo-500/25 transition
                      "
                    >
                      CSV
                    </button>

                    {(usuario?.rol_usuario === "dev" ||
                      usuario?.rol_usuario === "admin") && (

                      <button
                        onClick={() => eliminarEmpleado(e.id)}
                        disabled={e.total_movs > 0}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-semibold transition
                          ${
                            e.total_movs > 0
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                              : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                          }
                        `}
                      >
                        Eliminar
                      </button>

                    )}

                  </div>

                </td>

              </motion.tr>

            ))}

          </tbody>

        </table>

      </div>

      {!loading && empleadosFiltrados.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-6">
          No se encontraron empleados.
        </p>
      )}

      {loading && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-6 animate-pulse">
          Cargando empleados…
        </p>
      )}

    </motion.div>
  );
}

/* =========================
    STAT COMPONENT
========================= */