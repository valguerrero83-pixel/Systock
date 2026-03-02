import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types/index";

/* =========================================
      HISTORIAL MOVIMIENTOS (SOPORTA ALL)
========================================= */
export async function obtenerHistorialMovimientos(
  dias: string,
  sedeId: string | "all"
): Promise<Movimiento[]> {

  // 🔥 Calcular fecha desde
  const diasNum = Number(dias);
  const fechaDesde = new Date();
  fechaDesde.setDate(fechaDesde.getDate() - diasNum);

  let query = supabase
    .from("movimientos")
    .select(`
      id,
      tipo,
      cantidad,
      created_at_tz,
      notas,
      repuesto_id,
      usuario_id,
      sede_id,

      repuestos:repuesto_id (
        id,
        nombre,
        unidad,
        stock_minimo
      ),

      empleado_entrega:entregado_por (
        id,
        nombre
      ),

      empleado_recibe:recibido_por (
        id,
        nombre
      )
    `)
    .gte("created_at_tz", fechaDesde.toISOString())
    .order("created_at_tz", { ascending: false });

  // 🔥 SOLO filtra si no es modo global
  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error historial:", error);
    return [];
  }

  if (!data) return [];

  return data.map((m: any) => ({
    id: m.id,
    tipo: m.tipo,
    cantidad: m.cantidad,
    created_at_tz: m.created_at_tz ?? null,
    notas: m.notas ?? null,
    repuesto_id: m.repuesto_id ?? null,
    usuario_id: m.usuario_id ?? null,
    repuestos: m.repuestos ?? null,
    empleado_entrega: m.empleado_entrega ?? null,
    empleado_recibe: m.empleado_recibe ?? null,
  })) as Movimiento[];
}