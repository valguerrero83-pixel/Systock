export function colorCategoria(nombre: string) {

const estilos = [

/* AZULES */
"bg-indigo-500/15 text-indigo-400",
"bg-blue-500/15 text-blue-400",
"bg-sky-500/15 text-sky-400",
"bg-cyan-500/15 text-cyan-400",

/* VERDES */
"bg-emerald-500/15 text-emerald-400",
"bg-green-500/15 text-green-400",
"bg-lime-500/15 text-lime-400",
"bg-teal-500/15 text-teal-400",

/* MORADOS */
"bg-purple-500/15 text-purple-400",
"bg-violet-500/15 text-violet-400",
"bg-fuchsia-500/15 text-fuchsia-400",

/* ROJOS / ROSADOS */
"bg-rose-500/15 text-rose-400",
"bg-pink-500/15 text-pink-400",
"bg-red-500/15 text-red-400",

/* NARANJAS / AMARILLOS */
"bg-amber-500/15 text-amber-400",
"bg-orange-500/15 text-orange-400",
"bg-yellow-500/15 text-yellow-400",

/* GRISES */
"bg-slate-500/15 text-slate-400",
"bg-gray-500/15 text-gray-400",
"bg-zinc-500/15 text-zinc-400",

/* COLORES EXTRA */
"bg-blue-600/15 text-blue-500",
"bg-emerald-600/15 text-emerald-500",
"bg-purple-600/15 text-purple-500",
"bg-pink-600/15 text-pink-500",
"bg-orange-600/15 text-orange-500",
"bg-teal-600/15 text-teal-500",
"bg-cyan-600/15 text-cyan-500",
"bg-indigo-600/15 text-indigo-500",

];

let hash = 0;

for (let i = 0; i < nombre.length; i++) {
  hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
}

const index = Math.abs(hash) % estilos.length;

return estilos[index];
}