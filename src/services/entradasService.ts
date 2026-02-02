// src/services/entradasService.ts
import { supabase } from "../lib/supabase";

// REPUESTOS
export async function obtenerRepuestos() {
  const { data, error } = await supabase
    .from("repuestos")
    .select("id, codigo_corto, nombre, unidad")
    .order("nombre");

  if (error) throw error;
  return data;
}

// EMPLEADOS
export async function obtenerEmpleados() {
  const { data, error } = await supabase
    .from("empleados")
    .select("id, nombre")
    .order("nombre");

  if (error) throw error;
  return data;
}

// STOCK REAL DESDE LA VISTA
export async function obtenerStockActual() {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("repuesto_id, stock");

  if (error) throw error;
  return data;
}

// REGISTRAR ENTRADA
export async function registrarEntrada({ repuesto_id, cantidad, recibido_por, notas, usuario_id }) {

  const { error } = await supabase
    .from("movimientos")
    .insert({
      tipo: "ENTRADA",
      repuesto_id,
      cantidad,
      empleado_entrega_id: null,
      empleado_recibe_id: recibido_por,
      notas,
      registrado_por: usuario_id,
    });

  if (error) throw error;
}

// HISTORIAL DE ENTRADAS
export async function obtenerHistorialEntradas() {
  const { data, error } = await supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at,
      repuestos:repuesto_id(id, nombre, unidad),
      empleado_entrega:empleado_entrega_id(id, nombre),
      empleado_recibe:empleado_recibe_id(id, nombre)
    `)
    .eq("tipo", "ENTRADA")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
