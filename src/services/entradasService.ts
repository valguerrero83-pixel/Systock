import { supabase } from "../lib/supabase";
import type {
  Repuesto,
  Empleado,
  StockActual,
  CrearEntradaDTO,
  Movimiento
} from "../types/index";

export async function obtenerRepuestos(): Promise<Repuesto[]> {
  const { data, error } = await supabase
    .from("repuestos")
    .select("id, codigo_corto, nombre, unidad")
    .order("nombre");

  if (error) throw error;
  return data as Repuesto[];
}

export async function obtenerEmpleados(): Promise<Empleado[]> {
  const { data, error } = await supabase
    .from("empleados")
    .select("id, nombre")
    .order("nombre");

  if (error) throw error;
  return data as Empleado[];
}

export async function obtenerStockActual(): Promise<StockActual[]> {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("repuesto_id, stock");

  if (error) throw error;
  return data as StockActual[];
}

export async function registrarEntrada(payload: CrearEntradaDTO): Promise<void> {
  const { error } = await supabase.from("movimientos").insert({
    tipo: "ENTRADA",
    repuesto_id: payload.repuesto_id,
    cantidad: payload.cantidad,
    empleado_entrega_id: null,
    empleado_recibe_id: payload.recibido_por,
    notas: payload.notas ?? "",
    registrado_por: payload.usuario_id,
  });

  if (error) throw error;
}

export async function obtenerHistorialEntradas(): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at,
      repuestos:repuesto_id (
        id,
        nombre,
        unidad
      ),
      empleado_entrega:empleado_entrega_id (
        id,
        nombre
      ),
      empleado_recibe:empleado_recibe_id (
        id,
        nombre
      )
    `)
    .eq("tipo", "ENTRADA")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // 🔥 Evita errores de never/undefined
  return (data ?? []).map((m: any) => ({
    ...m,
    repuestos: m.repuestos ?? null,
    empleado_entrega: m.empleado_entrega ?? null,
    empleado_recibe: m.empleado_recibe ?? null,
  })) as Movimiento[];
}