import { supabase } from "../lib/supabase";

export async function obtenerKardexCompras(
  repuestoId: string,
  sedeId: string | "all"
) {
  let query = supabase
    .from("kardex_compras")
    .select("*")
    .eq("repuesto_id", repuestoId)
    .order("fecha", { ascending: false });

  if (sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}