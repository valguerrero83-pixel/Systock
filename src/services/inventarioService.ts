import { supabase } from "../lib/supabase";
import type { InventarioItem } from "../types/index";

export async function obtenerInventario(): Promise<InventarioItem[]> {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("repuesto_id, codigo_corto, nombre, unidad, stock_minimo, stock")
    .order("codigo_corto", { ascending: true });

  if (error) throw error;

  return data as InventarioItem[];
}