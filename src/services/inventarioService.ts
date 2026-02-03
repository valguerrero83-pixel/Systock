import { supabase } from "../lib/supabase";
import type { InventarioItem } from "../types/index";

export async function obtenerInventario(): Promise<InventarioItem[]> {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("repuesto_id, codigo_corto, nombre, unidad, stock, stock_minimo")
    .order("codigo_corto");

  if (error) {
    console.error("Error obteniendo inventario:", error);
    return [];
  }

  return data ?? [];
}