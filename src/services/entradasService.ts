import { supabase } from "../lib/supabase";
import type { Repuesto, Empleado, StockActual, CrearEntradaDTO, Movimiento } from "../types/index";

/* ========================================
   FECHA COLOMBIA (VERSIÓN CORRECTA)
======================================== */
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


/* ========================================
      OBTENER REPUESTOS
======================================== */
export async function obtenerRepuestos(): Promise<Repuesto[]> {
  const { data, error } = await supabase
    .from("repuestos")
    .select("id, codigo_corto, nombre, unidad")
    .order("nombre");

  if (error) throw error;

  return (data as Repuesto[]) ?? [];
}

/* ========================================
      OBTENER EMPLEADOS
======================================== */
export async function obtenerEmpleados(): Promise<Empleado[]> {
  const { data, error } = await supabase
    .from("empleados")
    .select("id, nombre")
    .order("nombre");

  if (error) throw error;

  return (data as Empleado[]) ?? [];
}

/* ========================================
      OBTENER STOCK ACTUAL
======================================== */
export async function obtenerStockActual(): Promise<StockActual[]> {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("repuesto_id, stock");

  if (error) throw error;

  return (data as StockActual[]) ?? [];
}

/* ========================================
      REGISTRAR ENTRADA
======================================== */
export async function registrarEntrada(payload: CrearEntradaDTO) {
  const { repuesto_id, cantidad, recibido_por, notas, usuario_id } = payload;

  const { error } = await supabase.from("movimientos").insert({
    tipo: "entrada",
    repuesto_id,
    cantidad: Number(cantidad),
    entregado_por: null,
    recibido_por,
    usuario_id,
    notas: notas ?? "",
    created_at_tz: fechaColombia(),
  });

  if (error) {
    console.error("Error al registrar entrada:", error);
    throw error;
  }

  return { success: true };
}

/* ========================================
      HISTORIAL ENTRADAS
======================================== */
export async function obtenerHistorialEntradas(): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at_tz,
      notas,
      repuesto_id,
      usuario_id,

      repuestos:repuesto_id (
        id,
        nombre,
        unidad
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

  if (error) throw error;
  if (!data) return [];

  return data.map((m: any) => ({
    id: m.id,
    tipo: m.tipo,
    cantidad: m.cantidad,
    created_at_tz: m.created_at_tz,
    notas: m.notas ?? null,

    repuesto_id: m.repuesto_id ?? null,
    usuario_id: m.usuario_id ?? null,

    entregado_por: null,
    recibido_por: m.empleado_recibe?.id ?? null,

    repuestos: m.repuestos ?? null,
    empleado_entrega: m.empleado_entrega ?? null,
    empleado_recibe: m.empleado_recibe ?? null,
  })) as Movimiento[];
}
