import { supabase } from "../lib/supabase";

export async function crearRepuesto(payload: {
  nombre: string;
  unidad: string;
  stock_minimo: number;
  cantidad_inicial: number;
  usuario_id: string;
}) {
  // 🔹 1. Crear repuesto y obtener su ID real
  const { data: rep, error: repError } = await supabase
    .from("repuestos")
    .insert({
      nombre: payload.nombre,
      unidad: payload.unidad,
      stock_minimo: payload.stock_minimo,
    })
    .select("id")   // <= SOLO pedimos el ID
    .single();

  if (repError) throw repError;

  // 🔹 Validar ID
  if (!rep?.id) throw new Error("No se obtuvo el ID del repuesto");

  // 🔹 2. Registrar movimiento inicial correctamente
  const { error: movError } = await supabase
    .from("movimientos")
    .insert({
      tipo: "ENTRADA",
      repuesto_id: rep.id,                    // <= AHORA SEGURO
      cantidad: payload.cantidad_inicial,     // <= SE SUMA A LA VISTA
      empleado_entrega_id: null,
      empleado_recibe_id: null,               // <= No queremos mezclar empleados con usuarios
      notas: "Stock inicial",
      registrado_por: payload.usuario_id,
    });

  if (movError) throw movError;

  return rep;
}