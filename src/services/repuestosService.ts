import { supabase } from "../lib/supabase";

export async function crearRepuesto(payload: {
  nombre: string;
  unidad: string;
  stock_minimo: number;
  cantidad_inicial: number;
  usuario_id: string;
}) {
  // 1️⃣ Crear repuesto
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

  // 2️⃣ Crear movimiento inicial (para stock_actual)
  const { error: movError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "ENTRADA",
      repuesto_id: rep.id,
      cantidad: payload.cantidad_inicial,
      empleado_entrega_id: null,
      empleado_recibe_id: null,  // ← Aquí está el fix para que tu vista lo cuente
      notas: "Stock inicial",
      registrado_por: payload.usuario_id,
    });

  if (movError) throw movError;

  return rep;
}