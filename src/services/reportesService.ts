import { supabase } from "../lib/supabase";

export async function obtenerHistorialMovimientos(dias: string) {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at,
      repuestos:repuesto_id(nombre, unidad),
      empleado_entrega:empleado_entrega_id(nombre),
      empleado_recibe:empleado_recibe_id(nombre)
    `)
    .gte("created_at", new Date(Date.now() - Number(dias) * 86400000).toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}