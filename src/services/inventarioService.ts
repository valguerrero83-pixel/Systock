import { supabase } from "../lib/supabase";

/* =========================================
      OBTENER INVENTARIO (SOPORTA ALL)
========================================= */
export async function obtenerInventario(
  sedeId: string | "all"
) {

  let query = supabase
    .from("stock_actual")
    .select("*")
    .order("nombre");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error inventario:", error);
    throw error;
  }

  return data ?? [];
}