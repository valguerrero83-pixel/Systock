import { supabase } from "../lib/supabase";
import type { CrearEmpleadoDTO, Empleado } from "../types/index";

/* =========================================
      CREAR EMPLEADO (GUARDA SEDE + USUARIO)
========================================= */
export async function crearEmpleado(
  payload: CrearEmpleadoDTO,
  sedeId: string,
  usuarioId: string
): Promise<Empleado[]> {

  const { data, error } = await supabase
    .from("empleados")
    .insert([
      {
        nombre: payload.nombre,
        area: payload.cargo, // seguimos usando area
        sede_id: sedeId,
        usuario_id: usuarioId // 👈 QUIÉN CREÓ EL EMPLEADO
      },
    ])
    .select("*");

  if (error) {
    console.error("Error creando empleado:", error);
    throw error;
  }

  return data as Empleado[];
}

/* =========================================
      OBTENER EMPLEADOS (SOPORTA ALL)
========================================= */
export async function obtenerEmpleados(
  sedeId: string | "all"
): Promise<Empleado[]> {

  let query = supabase
    .from("empleados")
    .select("*")
    .order("nombre");

  if (sedeId && sedeId !== "all") {
    query = query.eq("sede_id", sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error obteniendo empleados:", error);
    throw error;
  }

  return data as Empleado[];
}