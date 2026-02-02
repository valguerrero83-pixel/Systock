import { supabase } from "../lib/supabase";

export async function obtenerTotalRepuestos(): Promise<number> {
  const { count, error } = await supabase
    .from("repuestos")
    .select("*", { count: "exact", head: true });

  if (error) return 0;

  return count ?? 0;
}

export async function obtenerStockBajo(): Promise<number> {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("stock, stock_minimo");

  if (error || !data) return 0;

  return data.filter(r => Number(r.stock) < Number(r.stock_minimo)).length;
}

export async function obtenerMovimientosHoy(): Promise<number> {
  const hoy = new Date().toISOString().slice(0, 10);

  const { count, error } = await supabase
    .from("movimientos")
    .select("*", { count: "exact" })
    .gte("created_at", `${hoy}T00:00:00`)
    .lte("created_at", `${hoy}T23:59:59`);

  if (error) return 0;

  return count ?? 0;
}