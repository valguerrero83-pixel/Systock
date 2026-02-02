import { supabase } from "../lib/supabase";

// Total real de repuestos
export async function obtenerTotalRepuestos() {
  const { count } = await supabase
    .from("repuestos")
    .select("*", { count: "exact", head: true });

  return count ?? 0;
}

// Repuestos con stock bajo de verdad
// Repuestos con stock bajo REAL usando la vista
export async function obtenerStockBajo() {
  const { data, error } = await supabase
    .from("stock_actual")
    .select("stock, stock_minimo");

  if (error) {
    console.error("Error stock bajo:", error);
    return 0;
  }

  const bajos = data.filter(r => Number(r.stock) < Number(r.stock_minimo));
  return bajos.length;
}


// Movimientos del día (reales)
export async function obtenerMovimientosHoy() {
  const hoy = new Date().toISOString().slice(0, 10);

  const { count } = await supabase
    .from("movimientos")
    .select("*", { count: "exact" })
    .gte("created_at", `${hoy}T00:00:00`)
    .lte("created_at", `${hoy}T23:59:59`);

  return count ?? 0;
}

