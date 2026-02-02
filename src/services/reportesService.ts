import { supabase } from "../lib/supabase";
import type { CrearRepuestoDTO } from "../types/index";

export async function crearRepuesto(payload: CrearRepuestoDTO): Promise<boolean> {

  // 1️⃣ Verificar si existe un repuesto con ese nombre
  const { data: existe } = await supabase
    .from("repuestos")
    .select("id")
    .eq("nombre", payload.nombre.trim())
    .maybeSingle();

  if (existe) {
    throw new Error("Ya existe un repuesto con ese nombre.");
  }

  // 2️⃣ Crear repuesto
  const { data: rep, error: repError } = await supabase
    .from("repuestos")
    .insert([
      {
        nombre: payload.nombre,
        unidad: payload.unidad,
        stock_minimo: payload.stock_minimo
      }
    ])
    .select("id")
    .single();

  if (repError) throw repError;

  // 3️⃣ Movimiento inicial automático
  const { error: movError } = await supabase.from("movimientos").insert([
    {
      tipo: "ENTRADA",
      repuesto_id: rep.id,
      cantidad: payload.cantidad_inicial,
      empleado_entrega_id: null,
      empleado_recibe_id: null,
      registrado_por: payload.usuario_id,
      notas: "Registro inicial"
    }
  ]);

  if (movError) throw movError;

  return true;
}