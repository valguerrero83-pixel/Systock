import { supabase } from "../lib/supabase";

export async function obtenerComprasDetalle(sedeId: string | "all") {
  let query = supabase
    .from("compras_detalle")
    .select("*")
    .order("fecha", { ascending: false });

  if (sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}