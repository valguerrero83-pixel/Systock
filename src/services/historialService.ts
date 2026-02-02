import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types/index";

export async function obtenerHistorialCompleto(): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at,
      notas,
      repuestos:repuesto_id(id, nombre, unidad),
      empleado_entrega:empleado_entrega_id(id, nombre),
      empleado_recibe:empleado_recibe_id(id, nombre),
      usuario:registrado_por(id, email)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Movimiento[];
}