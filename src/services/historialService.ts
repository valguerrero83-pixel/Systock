import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types";

export async function obtenerHistorialMovimientos(): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo_movimiento,
      cantidad,
      created_at,
      repuesto_id,
      repuestos (*),
      empleado_entrega:empleado_entrega_id (*),
      empleado_recibe:empleado_recibe_id (*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo historial:", error);
    return [];
  }

  return data.map((m: any) => ({
    id: m.id,
    tipo: m.tipo_movimiento, // renombramos para el frontend
    cantidad: m.cantidad,
    created_at: m.created_at,
    repuesto_id: m.repuesto_id,
    repuestos: m.repuestos,
    empleado_entrega: m.empleado_entrega,
    empleado_recibe: m.empleado_recibe
  })) as Movimiento[];
}