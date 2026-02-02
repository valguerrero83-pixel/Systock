import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types/index";

export async function obtenerHistorialMovimientos(
  dias: string
): Promise<Movimiento[]> {
  const { data, error } = await supabase.rpc("filtrar_movimientos", {
    dias_param: dias,
  });

  if (error) throw error;

  if (!Array.isArray(data)) return [];

  // 🔥 Asegurar que siempre existan las relaciones esperadas
  return data.map((m: any) => ({
    ...m,
    repuestos: m.repuestos ?? null,
    empleado_entrega: m.empleado_entrega ?? null,
    empleado_recibe: m.empleado_recibe ?? null,
  })) as Movimiento[];
}