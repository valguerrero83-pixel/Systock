import { supabase } from "../lib/supabase";
import type { Movimiento } from "../types/index";

export async function obtenerHistorialMovimientos(
  dias: string
): Promise<Movimiento[]> {
  const { data, error } = await supabase.rpc("filtrar_movimientos", {
    dias_param: dias,
  });

  if (error) {
    console.error("Error RPC:", error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}