import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types/index";

export async function obtenerHistorialMovimientos(
  dias: string
): Promise<Movimiento[]> {
  const { data, error } = await supabase.rpc("filtrar_movimientos", {
    dias_param: dias,
  });

  if (error) {
    console.error("Error RPC historial:", error);
    return [];
  }

  if (!Array.isArray(data)) return [];

  return data.map((m: any) => ({
    ...m,
    created_at_tz: m.created_at_tz ?? null,
    repuestos: m.repuestos ?? null,
    empleado_entrega: m.empleado_entrega ?? null,
    empleado_recibe: m.empleado_recibe ?? null,
  })) as Movimiento[];
}
