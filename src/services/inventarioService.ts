import { supabase } from "../lib/supabase";
import type { InventarioItem } from "../types/index";

export async function obtenerInventario(): Promise<InventarioItem[]> {
  const { data, error } = await supabase
    .from("stock_actual")  
    .select("*")          
    .order("codigo_corto");

  if (error) throw error;

  return data as InventarioItem[];
}