import { supabase } from "../lib/supabase";

/* =============================
   OBTENER REPUESTOS
==============================*/
export async function getRepuestos() {
  const { data, error } = await supabase
    .from("repuestos")
    .select("id, nombre, unidad, stock_actual");

  if (error) {
    console.error("Error cargando repuestos:", error);
    return [];
  }

  return data || [];
}

/* =============================
   OBTENER EMPLEADOS
==============================*/
export async function getEmpleados() {
  const { data, error } = await supabase
    .from("empleados")
    .select("id, nombre");

  if (error) {
    console.error("Error cargando empleados:", error);
    return [];
  }

  return data || [];
}

/* =============================
   CREAR SALIDA
==============================*/
export async function crearSalida({
  repuesto_id,
  cantidad,
  entregado_por,
  recibido_por,
  usuario_id,
  unidad
}: any) {
  // 1. Verificar stock actual
  const { data: repuesto } = await supabase
    .from("repuestos")
    .select("stock_actual")
    .eq("id", repuesto_id)
    .single();

  if (!repuesto) {
    return { error: "Repuesto no encontrado" };
  }

  if (cantidad > repuesto.stock_actual) {
    return { error: "No puedes sacar más de lo que hay en stock" };
  }

  // 2. Guardar movimiento
  const { error: movError } = await supabase.from("movimientos").insert({
    repuesto_id,
    cantidad: -cantidad, // salida siempre va en negativo
    tipo: "Salida",
    entregado_por,
    recibido_por,
    usuario_id,
    created_at: new Date().toISOString(),
    notas: `${cantidad} ${unidad} salieron del inventario`
  });

  if (movError) {
    return { error: movError.message };
  }

  // 3. Actualizar inventario
  const { error: updateError } = await supabase
    .from("repuestos")
    .update({
      stock_actual: repuesto.stock_actual - cantidad
    })
    .eq("id", repuesto_id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}

/* =============================
   HISTORIAL DE SALIDAS
==============================*/
export async function getHistorialSalidas() {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      cantidad,
      created_at,
      repuestos:repuesto_id (nombre, unidad),
      entregado_por (nombre),
      recibido_por (nombre)
    `)
    .eq("tipo", "Salida")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error historial:", error);
    return [];
  }

  return data || [];
}
