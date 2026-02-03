import { supabase } from "../lib/supabase";

export async function crearRepuesto(payload: {
  nombre: string;
  unidad: string;
  stock_minimo: number;
  cantidad_inicial: number;
  usuario_id: string;
}) {
  // Crear repuesto (trigger genera codigo_corto y lo inserta en stock_actual)
  const { data: rep, error: repError } = await supabase
    .from("repuestos")
    .insert({
      nombre: payload.nombre,
      unidad: payload.unidad,
      stock_minimo: payload.stock_minimo,
    })
    .select()
    .single();

  if (repError) throw repError;

  // Registrar movimiento inicial
  const { error: movError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "ENTRADA",
      repuesto_id: rep.id,
      cantidad: payload.cantidad_inicial,
      empleado_entrega_id: null,
      empleado_recibe_id: payload.usuario_id,
      notas: "Stock inicial",
      registrado_por: payload.usuario_id,
    });

  if (movError) throw movError;

  return rep;
}