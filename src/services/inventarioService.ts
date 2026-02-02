// src/services/inventarioService.ts
import { supabase } from "../lib/supabase";

export async function obtenerInventario() {
  const { data, error } = await supabase
    .from("stock_actual") // ← vista correcta
    .select("*")
    .order("codigo_corto", { ascending: true });

  if (error) {
    console.error("Error al obtener inventario:", error);
    throw error;
  }

  return data; // la vista ya devuelve todo limpio
}
