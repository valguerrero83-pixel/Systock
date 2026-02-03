import { supabase } from "../lib/supabase";

export async function obtenerInventario() {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("*")
    .order("codigo_corto", { ascending: true });

  if (error) throw error;

  return data;
}

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

  // 2️⃣ Registrar movimiento inicial (CORRECTO)
  const { error: movError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "ENTRADA",
      repuesto_id: rep.id,
      cantidad: payload.cantidad_inicial,

      // estos campos permiten null
      empleado_entrega_id: null,
      empleado_recibe_id: null,

      // obligatorio por RLS
      registrado_por: payload.usuario_id,

      notas: "Registro inicial",
    });

  if (movError) throw movError;

  return rep;
}