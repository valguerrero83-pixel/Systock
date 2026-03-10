import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types/index";

export async function obtenerHistorialMovimientos(
  dias: string,
  sedeId: string | "all",
  filtros?: {
    empleado?: string
    categoria?: string
    repuesto?: string
    tipo?: string
    desde?: string
    hasta?: string
  }
): Promise<Movimiento[]> {

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

      repuestos:repuesto_id!inner (
        id,
        nombre,
        unidad,
        stock_minimo,
        codigo_corto,
        codigo_siesa,
        categoria_id,
        categorias (
          id,
          nombre
        )
      ),
      
      empleado_entrega:entregado_por (
        id,
        nombre
      ),

      empleado_recibe:recibido_por (
        id,
        nombre
      ),

      sedes:sede_id (
        id,
        nombre
      ),

      usuario:usuario_id (
        id,
        nombre,
        email
      )
    `)
    .gte("created_at_tz", fechaDesde.toISOString())
    .order("created_at_tz", { ascending: false });

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  if (filtros?.empleado) {
  query = query.or(
    `recibido_por.eq.${filtros.empleado},entregado_por.eq.${filtros.empleado}`
  );
}

  if (filtros?.repuesto) {
    query = query.eq("repuesto_id", filtros.repuesto);
  }

  if (filtros?.tipo) {
    query = query.eq("tipo", filtros.tipo);
  }

  if (filtros?.categoria) {
    query = query.eq("repuestos.categoria_id", filtros.categoria);
  }

  if (filtros?.desde) {
    query = query.gte("created_at_tz", filtros.desde);
  }

  if (filtros?.hasta) {
    query = query.lte("created_at_tz", filtros.hasta);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error historial:", error);
    return [];
  }

  return (data ?? []) as unknown as Movimiento[];
}