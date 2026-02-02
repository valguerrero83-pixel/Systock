// src/services/historialService.ts
import { supabase } from "../lib/supabase";

export async function obtenerHistorial() {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at,
      notas,
      repuesto_id,
      repuestos:repuesto_id(id, nombre, unidad),
      empleado_entrega:empleado_entrega_id(id, nombre),
      empleado_recibe:empleado_recibe_id(id, nombre)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
