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
    .toLocaleString("sv-SE", opciones)
    .replace(" ", "T");

  return `${fechaLocal}-05:00`;
}

/* ============================
      OBTENER REPUESTOS (SOPORTA ALL)
============================ */
export async function getRepuestos(
  sedeId: string | "all"
) {

  let query = supabase
    .from("stock_actual")
    .select("repuesto_id, nombre, unidad, stock")
    .order("nombre");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return (
    data?.map((r) => ({
      id: r.repuesto_id,
      nombre: r.nombre,
      unidad: r.unidad,
      stock: r.stock,
    })) ?? []
  );
}

/* ============================
      OBTENER EMPLEADOS (SOPORTA ALL)
============================ */
export async function getEmpleados(
  sedeId: string | "all"
) {

  let query = supabase
    .from("empleados")
    .select("id, nombre")
    .order("nombre");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

/* ============================
      OBTENER STOCK POR ID (SOPORTA ALL)
============================ */
export async function getStockActualById(
  repuestoId: string,
  sedeId: string | "all"
) {

  let query = supabase
    .from("stock_actual")
    .select("stock")
    .eq("repuesto_id", repuestoId);

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error(error);
    return null;
  }

  return data?.stock ?? null;
}

/* ============================
       CREAR SALIDA (GUARDA SEDE)
============================ */
export async function crearSalida({
  repuesto_id,
  cantidad,
  entregado_por,
  recibido_por,
  usuario_id,
  notas,
  sede_id,
}: any) {

  // 🔎 Validar stock por sede
  const { data: stockRow, error: stockError } = await supabase
    .from("stock_actual")
    .select("stock")
    .eq("repuesto_id", repuesto_id)
    .eq("sede_id", sede_id)
    .single();

  if (stockError) {
    console.error(stockError);
    return { error: "No se pudo obtener stock actual." };
  }

  if (!stockRow) {
    return { error: "No existe stock para esta sede." };
  }

  if (cantidad > stockRow.stock) {
    return { error: "No puedes sacar más de lo disponible." };
  }

  const { error: movError } = await supabase
    .from("movimientos")
    .insert({
      repuesto_id,
      cantidad: -Math.abs(cantidad),
      tipo: "salida",
      entregado_por,
      recibido_por,
      usuario_id,
      notas: notas || "",
      sede_id,
      created_at_tz: fechaColombia(),
    });

  if (movError) {
    console.error(movError);
    return { error: movError.message };
  }

  return { success: true };
}

/* ============================
       HISTORIAL SALIDAS (SOPORTA ALL)
============================ */
export async function getHistorialSalidas(
  sedeId: string | "all"
) {

  let query = supabase
    .from("movimientos")
    .select(`
      id,
      cantidad,
      created_at_tz,
      notas,
      sede_id,
      repuestos:repuesto_id (nombre, unidad),
      entregado:entregado_por (nombre),
      recibido:recibido_por (nombre)
    `)
    .eq("tipo", "salida")
    .order("created_at_tz", { ascending: false })
    .limit(50);

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}