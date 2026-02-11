import { supabase } from "../lib/supabase";

/* ============================
      FECHA COLOMBIA REAL
============================ */
function fechaColombia() {
  const opciones = {
    timeZone: "America/Bogota",
    hour12: false,
  };

  const fechaLocal = new Date()
    .toLocaleString("sv-SE", opciones) // "2026-02-11 11:23:59"
    .replace(" ", "T"); // <-- ESTA ES LA CLAVE

  return `${fechaLocal}-05:00`;
}



/* ============================
      OBTENER REPUESTOS
============================ */
export async function getRepuestos() {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("repuesto_id, nombre, unidad, stock")
    .order("nombre");

  if (error) return [];
  return data.map((r) => ({
    id: r.repuesto_id,
    nombre: r.nombre,
    unidad: r.unidad,
    stock: r.stock,
  }));
}

/* ============================
      OBTENER EMPLEADOS
============================ */
export async function getEmpleados() {
  const { data, error } = await supabase
    .from("empleados")
    .select("id, nombre")
    .order("nombre");

  if (error) return [];
  return data;
}

/* ============================
      OBTENER STOCK POR ID
============================ */
export async function getStockActualById(id: string) {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("stock")
    .eq("repuesto_id", id)
    .single();

  if (error) return null;
  return data?.stock ?? null;
}

/* ============================
       CREAR SALIDA
============================ */
export async function crearSalida({
  repuesto_id,
  cantidad,
  entregado_por,
  recibido_por,
  usuario_id,
  notas,
}: any) {
  
  const { data: stockRow, error: stockError } = await supabase
    .from("stock_actual")
    .select("stock")
    .eq("repuesto_id", repuesto_id)
    .single();

  if (stockError) return { error: "No se pudo obtener stock actual." };

  if (cantidad > stockRow.stock) {
    return { error: "No puedes sacar más de lo disponible." };
  }

  const { error: movError } = await supabase.from("movimientos").insert({
    repuesto_id,
    cantidad: -Math.abs(cantidad),
    tipo: "salida",
    entregado_por,
    recibido_por,
    usuario_id,
    notas: notas || "",
    created_at_tz: fechaColombia(), // FECHA COLOMBIA REAL
  });

  if (movError) return { error: movError.message };

  return { success: true };
}

/* ============================
       HISTORIAL
============================ */
export async function getHistorialSalidas() {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      cantidad,
      created_at_tz,
      notas,
      repuestos:repuesto_id (nombre, unidad),
      entregado:entregado_por (nombre),
      recibido:recibido_por (nombre)
    `)
    .eq("tipo", "salida")
    .order("created_at_tz", { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}
