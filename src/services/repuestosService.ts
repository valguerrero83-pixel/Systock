import { supabase } from "../lib/supabase";

export async function crearRepuesto(payload: any) {
  const { data, error } = await supabase
    .from("repuestos")
    .insert({
      nombre: payload.nombre,
      unidad: payload.unidad,
      stock_minimo: payload.stock_minimo,
      cantidad_inicial: payload.cantidad_inicial,
      usuario_id: payload.usuario_id,
      sede_id: payload.sede_id, // 🔥 ESTO ES LO QUE FALTABA
    })
    .select();

  if (error) throw error;

  return data;
}
