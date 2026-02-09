import { supabase } from "../lib/supabase";

export async function crearRepuesto(repuesto: any) {
  const { data, error } = await supabase
    .from("repuestos")
    .insert([
      {
        nombre: repuesto.nombre,
        unidad: repuesto.unidad,
        stock_minimo: repuesto.stock_minimo,
        cantidad_inicial: repuesto.cantidad_inicial,
        usuario_id: repuesto.usuario_id,
      }
    ])
    .select();

  if (error) throw error;
  return data;
}
