import { supabase } from "../lib/supabase";

export async function obtenerKardexRepuesto(
  repuestoId: string,
  sedeId: string | "all"
) {
  let query = supabase
    .from("kardex_repuesto")
    .select("*")
    .eq("repuesto_id", repuestoId)
    .order("fecha", { ascending: true });

  if (sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}