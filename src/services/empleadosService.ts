import { supabase } from "../lib/supabase";
import type { CrearEmpleadoDTO, Empleado } from "../types/index";

export async function crearEmpleado(payload: CrearEmpleadoDTO): Promise<Empleado[]> {
  const { data, error } = await supabase
    .from("empleados")
    .insert([{ nombre: payload.nombre, area: payload.cargo }])
    .select("*");

  if (error) throw error;

  return data as Empleado[];
}

export async function obtenerEmpleados(): Promise<Empleado[]> {
  const { data, error } = await supabase
    .from("empleados")
    .select("*")
    .order("nombre");

  if (error) throw error;

  return data as Empleado[];
}