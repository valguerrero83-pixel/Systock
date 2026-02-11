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
  // Fecha actual en formato YYYY-MM-DD
  const hoy = new Date()
    .toLocaleDateString("sv-SE", { timeZone: "America/Bogota" });

  const desde = `${hoy}T00:00:00-05:00`;
  const hasta = `${hoy}T23:59:59-05:00`;

  const { count, error } = await supabase
    .from("movimientos")
    .select("*", { count: "exact", head: false })
    .gte("created_at_tz", desde)
    .lte("created_at_tz", hasta);

  if (error) {
    console.error("Error movimientos hoy:", error);
    return 0;
  }

  return count ?? 0;
}
