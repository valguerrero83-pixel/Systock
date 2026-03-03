import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { obtenerHistorialMovimientos } from "../services/historialService";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { motion } from "framer-motion";

/* ===================================================== */

export default function Estadisticas() {
  const navigate = useNavigate();
  const { sedeActiva } = useAuth();

  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState("30");

  useEffect(() => {
    if (!sedeActiva) return;
    cargar();
  }, [sedeActiva, periodo]);

  async function cargar() {
    const data = await obtenerHistorialMovimientos(periodo, sedeActiva!);
    setMovimientos(data ?? []);
  }

  /* ================= NORMALIZACIÓN ================= */

  const movimientosNormalizados = movimientos.map((m) => ({
    ...m,
    cantidad: Math.abs(m.cantidad),
  }));

  /* ================= COUNT REAL ================= */

  const totalMovimientos = movimientosNormalizados.length;

  const entradasCount = movimientosNormalizados.filter(
    (m) => m.tipo === "entrada"
  ).length;

  const salidasCount = movimientosNormalizados.filter(
    (m) => m.tipo === "salida"
  ).length;

  /* ================= VOLUMEN ================= */

  const volumenEntradas = movimientosNormalizados
    .filter((m) => m.tipo === "entrada")
    .reduce((acc, m) => acc + m.cantidad, 0);

  const volumenSalidas = movimientosNormalizados
    .filter((m) => m.tipo === "salida")
    .reduce((acc, m) => acc + m.cantidad, 0);

  const volumenTotal = volumenEntradas + volumenSalidas;

  /* ================= PORCENTAJES ================= */

  const porcentajeEntradasMov =
    totalMovimientos > 0
      ? ((entradasCount / totalMovimientos) * 100).toFixed(1)
      : 0;

  const porcentajeSalidasMov =
    totalMovimientos > 0
      ? ((salidasCount / totalMovimientos) * 100).toFixed(1)
      : 0;


  /* ================= VARIACIÓN MENSUAL ================= */

  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const añoActual = ahora.getFullYear();

  const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
  const añoMesAnterior = mesActual === 0 ? añoActual - 1 : añoActual;

  const movimientosMesActual = movimientosNormalizados.filter((m) => {
    const d = new Date(m.created_at_tz);
    return d.getMonth() === mesActual && d.getFullYear() === añoActual;
  }).length;

  const movimientosMesAnterior = movimientosNormalizados.filter((m) => {
    const d = new Date(m.created_at_tz);
    return (
      d.getMonth() === mesAnterior &&
      d.getFullYear() === añoMesAnterior
    );
  }).length;

  const variacionMensual =
    movimientosMesAnterior > 0
      ? (
          ((movimientosMesActual - movimientosMesAnterior) /
            movimientosMesAnterior) *
          100
        ).toFixed(1)
      : 0;

  /* ================= SEMANA ================= */

  const hoy = new Date();
  const hace7Dias = new Date();
  hace7Dias.setDate(hoy.getDate() - 7);

  const movimientosSemana = movimientosNormalizados.filter((m) => {
    const d = new Date(m.created_at_tz);
    return d >= hace7Dias;
  }).length;

  /* ================= TENDENCIA DIARIA ================= */

  const dataPorDia = useMemo(() => {
  const mapa: any = {};

  movimientosNormalizados.forEach((m) => {
    const fecha = new Date(m.created_at_tz)
      .toLocaleDateString("es-CO");

    if (!mapa[fecha]) {
      mapa[fecha] = {
        fecha,
        movimientos: 0,
        volumen: 0,
      };
    }

    mapa[fecha].movimientos += 1;
    mapa[fecha].volumen += m.cantidad;
  });

  return Object.values(mapa);
}, [movimientosNormalizados]);

  /* ================= TOP REPUESTOS ================= */

  const topRepuestos = useMemo(() => {
  const mapa: any = {};

  movimientosNormalizados.forEach((m) => {
    const nombre = m.repuestos?.nombre ?? "—";

    if (!mapa[nombre]) {
      mapa[nombre] = {
        nombre,
        movimientos: 0,
        volumen: 0,
      };
    }

    mapa[nombre].movimientos += 1;
    mapa[nombre].volumen += m.cantidad;
  });

  return Object.values(mapa)
    .sort((a: any, b: any) => b.movimientos - a.movimientos)
    .slice(0, 5);
}, [movimientosNormalizados]);

  /* ================= POR SEDE (ALL) ================= */
const porSede = useMemo(() => {
  if (sedeActiva !== "all") return [];

  const mapa: Record<
    string,
    { sede: string; movimientos: number; volumen: number }
  > = {};

  movimientosNormalizados.forEach((m) => {
    const nombreSede =
      m.sedes?.nombre || "Sin sede";

    if (!mapa[nombreSede]) {
      mapa[nombreSede] = {
        sede: nombreSede,
        movimientos: 0,
        volumen: 0,
      };
    }

    mapa[nombreSede].movimientos += 1;
    mapa[nombreSede].volumen += m.cantidad;
  });

  return Object.values(mapa);
}, [movimientosNormalizados, sedeActiva]);

  /* ===================================================== */

return (
  <div className="max-w-7xl mx-auto mt-8 px-6">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
        Panel de Estadísticas
      </h2>

      <button
        onClick={() => navigate("/historial")}
        className="px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        Volver a historial
      </button>
    </div>

    {/* FILTRO PERIODO */}
    <div className="flex gap-3 mb-8">
      {["7", "30", "90", "365"].map((p) => (
        <button
          key={p}
          onClick={() => setPeriodo(p)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
            ${
              periodo === p
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800"
            }`}
        >
          {p === "7"
            ? "7 días"
            : p === "30"
            ? "30 días"
            : p === "90"
            ? "90 días"
            : "1 año"}
        </button>
      ))}
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <StatCard title="Movimientos" value={totalMovimientos} />
      <StatCard
        title={`Entradas (${porcentajeEntradasMov}% mov)`}
        value={entradasCount}
        green
      />
      <StatCard
        title={`Salidas (${porcentajeSalidasMov}% mov)`}
        value={salidasCount}
        red
      />
    </div>

    {/* DISTRIBUCIÓN + TENDENCIA */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

      <Card title="Distribución por movimientos">
        <div className="mb-4 text-sm text-slate-500">
          Entradas:{" "}
          <span className="text-emerald-500 font-semibold">
            {entradasCount}
          </span>{" "}
          ({porcentajeEntradasMov}%) &nbsp;|&nbsp;
          Salidas:{" "}
          <span className="text-red-500 font-semibold">
            {salidasCount}
          </span>{" "}
          ({porcentajeSalidasMov}%)
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={[
                { name: "Entradas", value: entradasCount },
                { name: "Salidas", value: salidasCount },
              ]}
              dataKey="value"
              outerRadius={90}
            >
              <Cell fill="#10B981" />
              <Cell fill="#EF4444" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Tendencia diaria">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dataPorDia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip
              formatter={(value: any, name: any) =>
                name === "movimientos"
                  ? [`${value} movimientos`, "Movimientos"]
                  : [`${value} volumen`, "Volumen"]
              }
            />
            <Line
              type="monotone"
              dataKey="movimientos"
              stroke="#6366F1"
              name="movimientos"
            />
            <Line
              type="monotone"
              dataKey="volumen"
              stroke="#10B981"
              name="volumen"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

    </div>

    {/* TOP REPUESTOS */}
    <Card title="Top 5 repuestos más movidos">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topRepuestos}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="nombre" />
          <YAxis />
          <Tooltip
            formatter={(value: any, name: any) =>
              name === "movimientos"
                ? [`${value} movimientos`, "Movimientos"]
                : [`${value} volumen`, "Volumen"]
            }
          />
          <Bar dataKey="movimientos" fill="#8B5CF6" name="movimientos" />
          <Bar dataKey="volumen" fill="#F59E0B" name="volumen" />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* POR SEDE SOLO EN ALL */}
    {sedeActiva === "all" && porSede.length > 0 && (
  <Card title="Movimientos por sede">

    <div className="mb-4 text-sm text-slate-500">
      Total sedes activas:{" "}
      <span className="font-semibold text-indigo-500">
        {porSede.length}
      </span>
    </div>

    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={porSede}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="sede" />
        <YAxis />
        <Tooltip
          formatter={(value: any, name: any) =>
            name === "movimientos"
              ? [`${value} movimientos`, "Movimientos"]
              : [`${value} volumen`, "Volumen"]
          }
        />
        <Bar
          dataKey="movimientos"
          fill="#6366F1"
          name="movimientos"
          radius={[6, 6, 0, 0]}
        />
        <Bar
          dataKey="volumen"
          fill="#F59E0B"
          name="volumen"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>

  </Card>
)}

  </div>
);
/* ================= COMPONENTES ================= */

function StatCard({ title, value, green, red }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md">
      <p className="text-sm text-slate-500">{title}</p>
      <p
        className={`text-3xl font-bold mt-2 ${
          green
            ? "text-emerald-500"
            : red
            ? "text-red-500"
            : "text-indigo-500"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg mb-8"
    >
      <h3 className="mb-4 font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </h3>
      {children}
    </motion.div>
  );
}}