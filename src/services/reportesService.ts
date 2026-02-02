import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types";

export async function obtenerHistorialMovimientos(periodo: string): Promise<Movimiento[]> {
  const dias = Number(periodo);
  const fechaDesde = new Date();
  fechaDesde.setDate(fechaDesde.getDate() - dias);

  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at,
      repuestos:repuesto_id(id, nombre, unidad),
      empleado_entrega:empleado_entrega_id(id, nombre),
      empleado_recibe:empleado_recibe_id(id, nombre)
    `)
    .gte("created_at", fechaDesde.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Movimiento[];
}