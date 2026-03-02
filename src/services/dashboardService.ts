import { supabase } from "../lib/supabase";

/* =========================================
      TOTAL REPUESTOS
========================================= */
export async function obtenerTotalRepuestos(
  sedeId: string | "all"
) {
  let query = supabase
    .from("repuestos")
    .select("*", { count: "exact", head: true });

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error total repuestos:", error);
    return 0;
  }

  return count ?? 0;
}

/* =========================================
      STOCK BAJO
========================================= */
export async function obtenerStockBajo(
  sedeId: string | "all"
) {
  let query = supabase
    .from("stock_actual")
    .select("*");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error stock bajo:", error);
    return 0;
  }

  return (
    data?.filter(
      (i) => Number(i.stock) < Number(i.stock_minimo)
    ).length ?? 0
  );
}

/* =========================================
      MOVIMIENTOS HOY
========================================= */
export async function obtenerMovimientosHoy(
  sedeId: string | "all"
): Promise<number> {

  const hoy = new Date()
    .toLocaleDateString("sv-SE", {
      timeZone: "America/Bogota",
    });

  const desde = `${hoy}T00:00:00-05:00`;
  const hasta = `${hoy}T23:59:59-05:00`;

  let query = supabase
    .from("movimientos")
    .select("*", { count: "exact", head: false })
    .gte("created_at_tz", desde)
    .lte("created_at_tz", hasta);

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error movimientos hoy:", error);
    return 0;
  }

  return count ?? 0;
}