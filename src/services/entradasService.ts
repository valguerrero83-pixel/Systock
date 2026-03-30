import { supabase } from "../lib/supabase";
import type {
  Repuesto,
  Empleado,
  StockActual,
  CrearEntradaDTO,
  Movimiento,
} from "../types/index";

/* ========================================
   FECHA COLOMBIA
======================================== */
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

/* ========================================
      OBTENER REPUESTOS (SOPORTA ALL)
======================================== */
export async function obtenerRepuestos(
  sedeId: string | "all"
): Promise<Repuesto[]> {

  let query = supabase
    .from("repuestos")
    .select("id, codigo_corto, nombre, unidad")
    .order("nombre");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo repuestos:", error);
    throw error;
  }

  return (data as Repuesto[]) ?? [];
}

/* ========================================
      OBTENER EMPLEADOS (SOPORTA ALL)
======================================== */
export async function obtenerEmpleados(
  sedeId: string | "all"
): Promise<Empleado[]> {

  let query = supabase
    .from("empleados")
    .select("id, nombre")
    .order("nombre");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo empleados:", error);
    throw error;
  }

  return (data as Empleado[]) ?? [];
}

/* ========================================
      OBTENER STOCK ACTUAL (SOPORTA ALL)
======================================== */
export async function obtenerStockActual(
  sedeId: string | "all"
): Promise<StockActual[]> {

  let query = supabase
    .from("stock_actual")
    .select("repuesto_id, stock");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo stock:", error);
    throw error;
  }

  return (data as StockActual[]) ?? [];
}

/* ========================================
      REGISTRAR ENTRADA (GUARDA SEDE)
======================================== */
export async function registrarEntrada(
  payload: CrearEntradaDTO & {
    sede_id: string;
    costo_unitario?: number;
    costo_total?: number;
    proveedor?: string;
    factura?: string;
  }
): Promise<{ success: boolean }> {

  const {
    repuesto_id,
    cantidad,
    recibido_por,
    notas,
    usuario_id,
    sede_id,
    costo_unitario,
    costo_total,
    proveedor,
    factura,
  } = payload;

  const { error } = await supabase.from("movimientos").insert({
    tipo: "entrada",
    repuesto_id,
    cantidad: Number(cantidad),
    entregado_por: null,
    recibido_por,
    usuario_id,
    sede_id,
    notas: notas ?? "",
    created_at_tz: fechaColombia(),

    // COSTOS
    costo_unitario: costo_unitario ?? null,
    costo_total: costo_total ?? null,
    proveedor: proveedor ?? null,
    factura: factura ?? null,
  });

  if (error) {
    console.error("Error registrando entrada:", error);
    throw error;
  }

  return { success: true };
}
/* ========================================
      HISTORIAL ENTRADAS (SOPORTA ALL)
======================================== */
export async function obtenerHistorialEntradas(
  sedeId: string | "all"
): Promise<Movimiento[]> {

  let query = supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at_tz,
      notas,
      repuesto_id,
      usuario_id,
      sede_id,

      repuestos:repuesto_id (
        id,
        nombre,
        unidad,
        stock_minimo
      ),

      empleado_entrega:entregado_por (
        id,
        nombre
      ),

      empleado_recibe:recibido_por (
        id,
        nombre
      )
    `)
    .eq("tipo", "entrada")
    .order("created_at_tz", { ascending: false });

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error historial entradas:", error);
    throw error;
  }

  if (!data) return [];

  return data.map((m: any) => ({
    id: m.id,
    tipo: m.tipo,
    cantidad: m.cantidad,
    created_at_tz: m.created_at_tz ?? null,
    notas: m.notas ?? null,
    repuesto_id: m.repuesto_id ?? null,
    usuario_id: m.usuario_id ?? null,
    repuestos: m.repuestos ?? null,
    empleado_entrega: m.empleado_entrega ?? null,
    empleado_recibe: m.empleado_recibe ?? null,
  }));
}