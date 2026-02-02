import { supabase } from "../lib/supabase";

export async function crearEmpleado({ nombre, cargo }: any) {
  const { data, error } = await supabase
    .from("empleados")
    .insert([{ nombre, area:cargo }]);

  if (error) throw error;
  return data;
}

export async function obtenerEmpleados() {
  const { data, error } = await supabase
    .from("empleados")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw error;
  return data;
}