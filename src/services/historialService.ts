import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types/index";

export async function obtenerHistorialMovimientos(
  dias: string
): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at,
      repuesto_id,
      empleado_entrega_id,
      empleado_recibe_id,
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
    .gte("created_at", `now() - interval '${dias} days'`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((m: any) => ({
    ...m,
    repuestos: m.repuestos ?? null,
    empleado_entrega: m.empleado_entrega ?? null,
    empleado_recibe: m.empleado_recibe ?? null,
  })) as Movimiento[];
}