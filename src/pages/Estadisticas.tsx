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
  LabelList
} from "recharts";
import { motion } from "framer-motion";

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

  /* ================= NORMALIZAR ================= */

  const mov = movimientos.map(m => ({
    ...m,
    cantidad: Math.abs(m.cantidad)
  }));

  /* ================= CONTADORES ================= */

  const total = mov.length;
  const entradas = mov.filter(m => m.tipo === "entrada").length;
  const salidas = mov.filter(m => m.tipo === "salida").length;

  const entradasPct = total ? ((entradas / total) * 100).toFixed(1) : 0;
  const salidasPct = total ? ((salidas / total) * 100).toFixed(1) : 0;

  /* ================= UNIDADES ================= */

  const unidadesEntradas = mov
    .filter(m => m.tipo === "entrada")
    .reduce((acc, m) => acc + m.cantidad, 0);

  const unidadesSalidas = mov
    .filter(m => m.tipo === "salida")
    .reduce((acc, m) => acc + m.cantidad, 0);

  /* ================= COSTOS ================= */

  const dineroInvertido = mov
    .filter(m => m.tipo === "entrada")
    .reduce((acc, m) => acc + (m.costo_total || 0), 0);

  const costoPromedioCompra = unidadesEntradas
    ? (dineroInvertido / unidadesEntradas).toFixed(0)
    : 0;

  /* ================= TENDENCIA ================= */

  const tendencia = useMemo(() => {

    const mapa: any = {};

    mov.forEach(m => {

      const fecha = new Date(m.created_at_tz)
        .toLocaleDateString("es-CO");

      if (!mapa[fecha]) {
        mapa[fecha] = { fecha, movimientos: 0 };
      }

      mapa[fecha].movimientos++;

    });

    return Object.values(mapa);

  }, [mov]);

  /* ================= TOP REPUESTOS ================= */

  const topRepuestos = useMemo(() => {

    const mapa: any = {};

    mov.forEach(m => {

      const nombre = m.repuestos?.nombre ?? "—";

      if (!mapa[nombre]) {
        mapa[nombre] = { nombre, movimientos: 0 };
      }

      mapa[nombre].movimientos++;

    });

    const arr = Object.values(mapa)
      .sort((a: any, b: any) => b.movimientos - a.movimientos)
      .slice(0, 5);

    const totalTop = arr.reduce((acc: number, r: any) => acc + r.movimientos, 0);

    return arr.map((r: any) => ({
      ...r,
      porcentaje: totalTop ? Number(((r.movimientos / totalTop) * 100).toFixed(1)) : 0
    }));

  }, [mov]);

  /* ================= CONSUMO POR CATEGORIA ================= */

  const consumoCategorias = useMemo(() => {

    const mapa: any = {};

    mov.forEach(m => {

      if (m.tipo !== "salida") return;

      const cat = m.repuestos?.categorias?.nombre ?? "Sin categoría";

      if (!mapa[cat]) {
        mapa[cat] = { categoria: cat, movimientos: 0 };
      }

      mapa[cat].movimientos++;

    });

    const arr = Object.values(mapa)
      .sort((a: any, b: any) => b.movimientos - a.movimientos);

    const totalTop = arr.reduce((acc: number, c: any) => acc + c.movimientos, 0);

    return arr.map((c: any) => ({
      ...c,
      porcentaje: totalTop ? Number(((c.movimientos / totalTop) * 100).toFixed(1)) : 0
    }));

  }, [mov]);

  /* ================= INVERSION POR MES ================= */

  const inversionPorMes = useMemo(() => {

    const mapa: any = {};

    mov.forEach(m => {

      if (m.tipo !== "entrada") return;

      const fecha = new Date(m.created_at_tz);
      const mes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;

      if (!mapa[mes]) {
        mapa[mes] = { mes, total: 0 };
      }

      mapa[mes].total += m.costo_total || 0;

    });

    return Object.values(mapa);

  }, [mov]);

  /* ================= UI ================= */

  return (

    <div className="max-w-7xl mx-auto mt-8 px-6">

      <div className="flex justify-between items-center mb-8">

        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
          Panel de Estadísticas
        </h2>

        <button
          onClick={() => navigate("/historial")}
          className="px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600"
        >
          Volver a historial
        </button>

      </div>

      {/* FILTRO PERIODO */}
      <div className="flex gap-3 mb-8">
        {["7", "30", "90", "365"].map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-4 py-2 rounded-xl text-sm
            ${periodo === p ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}
          >
            {p === "7" ? "7 días" :
              p === "30" ? "30 días" :
                p === "90" ? "90 días" : "1 año"}
          </button>
        ))}
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">

        <KPI title="Movimientos" value={total} />
        <KPI title="Entradas" value={`${entradasPct}%`} green />
        <KPI title="Salidas" value={`${salidasPct}%`} red />
        <KPI title="Unidades Entrada" value={unidadesEntradas} />
        <KPI title="Unidades Salida" value={unidadesSalidas} />
        <KPI title="Invertido" value={`$ ${dineroInvertido.toLocaleString("es-CO")}`} />
        <KPI title="Costo Promedio" value={`$ ${costoPromedioCompra}`} />

      </div>

      {/* GRAFICAS */}
      <Card title="Tendencia de movimientos">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={tendencia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="movimientos" stroke="#6366F1" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Top repuestos">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topRepuestos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="porcentaje" fill="#8B5CF6">
              <LabelList dataKey="porcentaje" position="top" formatter={(v: any) => `${v}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Consumo por categoría">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={consumoCategorias}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="categoria" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="porcentaje" fill="#F59E0B">
              <LabelList dataKey="porcentaje" position="top" formatter={(v: any) => `${v}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Dinero invertido por mes">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={inversionPorMes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}

/* COMPONENTES */

function KPI({ title, value, green, red }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-3xl font-bold mt-2
        ${green ? "text-emerald-500" :
          red ? "text-red-500" :
            "text-indigo-500"}`}>
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
}