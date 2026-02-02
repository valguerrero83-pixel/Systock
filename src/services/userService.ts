import { supabase } from "../lib/supabase";

// Obtener todos los usuarios
export async function obtenerUsuarios() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Actualizar rol
export async function actualizarRol(id: string, nuevoRol: string) {
  const { error } = await supabase
    .from("users")
    .update({ rol_usuario: nuevoRol })
    .eq("id", id);

  if (error) throw error;
}

// Actualizar área
export async function actualizarArea(id: string, nuevaArea: string) {
  const { error } = await supabase
    .from("users")
    .update({ area: nuevaArea })
    .eq("id", id);

  if (error) throw error;
}