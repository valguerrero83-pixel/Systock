import { supabase } from "../lib/supabase";

export async function crearRepuesto({
  nombre,
  unidad,
  stock_minimo,
  cantidad_inicial,
  usuario_id,
}: {
  nombre: string;
  unidad: string;
  stock_minimo: number;
  cantidad_inicial: number;
  usuario_id: string;
}) {
  
  // 1️⃣ Verificar si existe un repuesto con ese nombre
  const { data: existe } = await supabase
    .from("repuestos")
    .select("id")
    .eq("nombre", nombre.trim())
    .maybeSingle();

  if (existe) throw new Error("Ya existe un repuesto con ese nombre.");

  // 2️⃣ Crear repuesto
  const { data: rep, error } = await supabase
    .from("repuestos")
    .insert([{ nombre, unidad, stock_minimo }])
    .select("id")
    .single();

  if (error) throw error;

  // 3️⃣ Crear movimiento inicial (SIN empleados)
  const { error: movErr } = await supabase
    .from("movimientos")
    .insert([
      {
        tipo: "ENTRADA",
        repuesto_id: rep.id,
        cantidad: cantidad_inicial,

        empleado_entrega_id: null,
        empleado_recibe_id: null, // 👈 aquí estaba el error

        registrado_por: usuario_id, // 👌 sí se puede porque apunta a tabla users

        notas: "Registro inicial",
      }
    ]);

  if (movErr) throw movErr;

  return true;
}
