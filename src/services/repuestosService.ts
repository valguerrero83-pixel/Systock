import { supabase } from "../lib/supabase";
import type { StockActual } from "../types/index";

export async function obtenerInventario(): Promise<StockActual[]> {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("*")
    .order("codigo_corto");

  if (error) throw error;

  return data as StockActual[];
}