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

export default function Estadisticas(){

const navigate = useNavigate();
const { sedeActiva } = useAuth();

const [movimientos,setMovimientos] = useState<any[]>([]);
const [periodo,setPeriodo] = useState("30");

useEffect(()=>{
if(!sedeActiva) return;
cargar();
},[sedeActiva,periodo]);

async function cargar(){
const data = await obtenerHistorialMovimientos(periodo,sedeActiva!);
setMovimientos(data ?? []);
}

/* ================= NORMALIZACION ================= */

const mov = movimientos.map(m=>({
...m,
cantidad: Math.abs(m.cantidad)
}));

/* ================= CONTADORES ================= */

const total = mov.length;

const entradas = mov.filter(m=>m.tipo==="entrada").length;
const salidas = mov.filter(m=>m.tipo==="salida").length;

const entradasPct = total ? ((entradas/total)*100).toFixed(1) : 0;
const salidasPct = total ? ((salidas/total)*100).toFixed(1) : 0;

/* ================= CONSUMO POR UNIDAD ================= */

const consumoUnidades = useMemo(()=>{

const mapa:any = {};

mov.forEach(m=>{

const unidad = m.repuestos?.unidad ?? "unidad";

if(!mapa[unidad]){

mapa[unidad] = {
unidad,
total:0
};

}

if(m.tipo==="salida"){
mapa[unidad].total += m.cantidad;
}

});

return Object.values(mapa);

},[mov]);

/* ================= TENDENCIA ================= */

const tendencia = useMemo(()=>{

const mapa:any = {};

mov.forEach(m=>{

const fecha = new Date(m.created_at_tz).toLocaleDateString("es-CO");

if(!mapa[fecha]){

mapa[fecha] = {
fecha,
movimientos:0
};

}

mapa[fecha].movimientos++;

});

return Object.values(mapa);

},[mov]);

/* ================= TOP REPUESTOS ================= */

const topRepuestos = useMemo(()=>{

const mapa:any = {};

mov.forEach(m=>{

const nombre = m.repuestos?.nombre ?? "—";
const ref = m.repuestos?.referencia ?? "";

const key = nombre+ref;

if(!mapa[key]){

mapa[key] = {
nombre,
referencia:ref,
movimientos:0
};

}

mapa[key].movimientos++;

});

const arr = Object.values(mapa)
.sort((a:any,b:any)=>b.movimientos-a.movimientos)
.slice(0,5);

const totalTop = arr.reduce((acc:number,r:any)=>acc+r.movimientos,0);

return arr.map((r:any)=>({
...r,
porcentaje: totalTop ? Number(((r.movimientos/totalTop)*100).toFixed(1)) : 0
}));

},[mov]);

/* ================= TOP USUARIOS ================= */

const topUsuarios = useMemo(()=>{

const mapa:any = {};

mov.forEach(m=>{

const nombre =
m.users?.nombre ||
m.usuario?.nombre ||
"—";

if(!mapa[nombre]){

mapa[nombre] = {
nombre,
movimientos:0
};

}

mapa[nombre].movimientos++;

});

const arr = Object.values(mapa)
.sort((a:any,b:any)=>b.movimientos-a.movimientos)
.slice(0,5);

const totalTop = arr.reduce((acc:number,e:any)=>acc+e.movimientos,0);

return arr.map((e:any)=>({
...e,
porcentaje: totalTop ? Number(((e.movimientos/totalTop)*100).toFixed(1)) : 0
}));

},[mov]);

/* ================= TOP EMPLEADOS ================= */

const topEmpleados = useMemo(()=>{

const mapa:any = {};

mov.forEach(m=>{

const nombre =
m.empleado_recibe?.nombre ||
m.empleado?.nombre ||
"—";

if(!mapa[nombre]){

mapa[nombre] = {
nombre,
entregas:0
};

}

if(m.tipo==="salida"){
mapa[nombre].entregas++;
}

});

const arr = Object.values(mapa)
.sort((a:any,b:any)=>b.entregas-a.entregas)
.slice(0,5);

const totalTop = arr.reduce((acc:number,e:any)=>acc+e.entregas,0);

return arr.map((e:any)=>({
...e,
porcentaje: totalTop ? Number(((e.entregas/totalTop)*100).toFixed(1)) : 0
}));

},[mov]);

/* ================= CONSUMO POR CATEGORIA ================= */

const consumoCategorias = useMemo(()=>{

const mapa:any = {};

mov.forEach(m=>{

if(m.tipo!=="salida") return;

const cat = m.repuestos?.categorias?.nombre ?? "Sin categoría";

if(!mapa[cat]){

mapa[cat] = {
categoria:cat,
movimientos:0
};

}

mapa[cat].movimientos++;

});

const arr = Object.values(mapa)
.sort((a:any,b:any)=>b.movimientos-a.movimientos);

const totalTop = arr.reduce((acc:number,c:any)=>acc+c.movimientos,0);

return arr.map((c:any)=>({
...c,
porcentaje: totalTop ? Number(((c.movimientos/totalTop)*100).toFixed(1)) : 0
}));

},[mov]);

/* ================= REPUESTOS CRITICOS ================= */

const repuestosCriticos = useMemo(()=>{

const mapa:any = {};

mov.forEach(m=>{

if(m.tipo!=="salida") return;

const nombre = m.repuestos?.nombre ?? "—";
const ref = m.repuestos?.referencia ?? "";

const key = nombre+ref;

if(!mapa[key]){

mapa[key] = {
nombre,
referencia:ref,
salidas:0
};

}

mapa[key].salidas++;

});

const arr = Object.values(mapa)
.sort((a:any,b:any)=>b.salidas-a.salidas)
.slice(0,5);

const totalTop = arr.reduce((acc:number,r:any)=>acc+r.salidas,0);

return arr.map((r:any)=>({
...r,
porcentaje: totalTop ? Number(((r.salidas/totalTop)*100).toFixed(1)) : 0
}));

},[mov]);

const repuestoMasUsado = topRepuestos[0]
? `${topRepuestos[0].nombre} (${topRepuestos[0].referencia})`
: "—";

const colores = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6"];

/* ================= UI ================= */

return(

<div className="max-w-7xl mx-auto mt-8 px-6">

<div className="flex justify-between items-center mb-8">

<h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
Panel de Estadísticas
</h2>

<button
onClick={()=>navigate("/historial")}
className="px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
>
Volver a historial
</button>

</div>

{/* FILTRO */}

<div className="flex gap-3 mb-8">

{["7","30","90","365"].map(p=>(

<button
key={p}
onClick={()=>setPeriodo(p)}
className={`px-4 py-2 rounded-xl text-sm font-medium transition
${periodo===p ? "bg-indigo-600 text-white":"bg-slate-100 dark:bg-slate-800"}
`}
>

{p==="7"?"7 días":p==="30"?"30 días":p==="90"?"90 días":"1 año"}

</button>

))}

</div>

{/* KPIS */}

<div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">

<KPI title="Movimientos" value={total}/>
<KPI title={`Entradas (${entradasPct}%)`} value={entradas} green/>
<KPI title={`Salidas (${salidasPct}%)`} value={salidas} red/>
<KPI title="Repuesto más usado" value={repuestoMasUsado}/>

</div>

{/* DISTRIBUCION */}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

<Card title="Distribución de movimientos">

<ResponsiveContainer width="100%" height={260}>

<PieChart>

<Pie
data={[
{name:"Entradas",value:entradas},
{name:"Salidas",value:salidas}
]}
dataKey="value"
outerRadius={90}
label={(d:any)=>`${((d.value/total)*100).toFixed(1)}%`}
>

<Cell fill="#10B981"/>
<Cell fill="#EF4444"/>

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</Card>

<Card title="Consumo por unidad">

<ResponsiveContainer width="100%" height={260}>

<BarChart data={consumoUnidades}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="unidad"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="total" fill="#6366F1"/>

</BarChart>

</ResponsiveContainer>

</Card>

</div>

<Card title="Tendencia diaria de movimientos">

<ResponsiveContainer width="100%" height={260}>

<LineChart data={tendencia}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="fecha"/>

<YAxis/>

<Tooltip/>

<Line type="monotone" dataKey="movimientos" stroke="#6366F1"/>

</LineChart>

</ResponsiveContainer>

</Card>

<Card title="Top repuestos más movidos">

<ResponsiveContainer width="100%" height={300}>

<BarChart data={topRepuestos}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="nombre"/>

<YAxis/>

<Tooltip
formatter={(value:any, name:any, props:any)=>[
`${value}%`,
`${props.payload.movimientos} movimientos`
]}
/>

<Bar dataKey="porcentaje" fill="#8B5CF6">

<LabelList
dataKey="porcentaje"
position="top"
formatter={(v:any)=>`${v}%`}
/>

</Bar>

</BarChart>

</ResponsiveContainer>

</Card>

<Card title="Usuarios con más movimientos">

<ResponsiveContainer width="100%" height={300}>

<BarChart data={topUsuarios}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="nombre"/>

<YAxis/>

<Tooltip
formatter={(value:any,name:any,props:any)=>[
`${value}%`,
`${props.payload.movimientos} movimientos`
]}
/>

<Bar dataKey="porcentaje" fill="#6366F1">

<LabelList
dataKey="porcentaje"
position="top"
formatter={(v:any)=>`${v}%`}
/>

</Bar>

</BarChart>

</ResponsiveContainer>

</Card>

<Card title="Empleados con más entregas">

<ResponsiveContainer width="100%" height={300}>

<BarChart data={topEmpleados}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="nombre"/>

<YAxis/>

<Tooltip
formatter={(value:any,name:any,props:any)=>[
`${value}%`,
`${props.payload.entregas} entregas`
]}
/>

<Bar dataKey="porcentaje" fill="#10B981">

<LabelList
dataKey="porcentaje"
position="top"
formatter={(v:any)=>`${v}%`}
/>

</Bar>

</BarChart>

</ResponsiveContainer>

</Card>

<Card title="Consumo por categoría">

<ResponsiveContainer width="100%" height={300}>

<BarChart data={consumoCategorias}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="categoria"/>

<YAxis/>

<Tooltip
formatter={(value:any,name:any,props:any)=>[
`${value}%`,
`${props.payload.movimientos} movimientos`
]}
/>

<Bar dataKey="porcentaje" fill="#F59E0B">

<LabelList
dataKey="porcentaje"
position="top"
formatter={(v:any)=>`${v}%`}
/>

</Bar>

</BarChart>

</ResponsiveContainer>

</Card>

{/* <Card title="Repuestos críticos">

<ResponsiveContainer width="100%" height={300}>

<BarChart data={repuestosCriticos}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="nombre"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="porcentaje" fill="#EF4444"/>

</BarChart>

</ResponsiveContainer>

</Card> */}

<Card title="Análisis de costos">

<div className="text-center py-12">

<p className="text-lg font-semibold text-slate-600 dark:text-slate-300">
Módulo de costos
</p>

<p className="text-xs text-indigo-500 mt-4 font-semibold">
EN DESARROLLO
</p>

</div>

</Card>

</div>

);

}

/* COMPONENTES */

function KPI({title,value,green,red}:any){

return(

<div className="bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 shadow-md">

<p className="text-sm text-slate-500">{title}</p>

<p className={`text-3xl font-bold mt-2 ${
green ? "text-emerald-500"
: red ? "text-red-500"
: "text-indigo-500"
}`}>
{value}
</p>

</div>

);

}

function Card({title,children}:any){

return(

<motion.div
initial={{opacity:0,y:10}}
animate={{opacity:1,y:0}}
className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg mb-8"
>

<h3 className="mb-4 font-semibold text-slate-700 dark:text-slate-200">
{title}
</h3>

{children}

</motion.div>

);

}