import { supabase } from "../lib/supabase";
import type { UsuarioApp } from "../types/index";

export async function obtenerUsuarios(): Promise<UsuarioApp[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as UsuarioApp[];
}

export async function actualizarRol(id: string, nuevoRol: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ rol_usuario: nuevoRol })
    .eq("id", id);

  if (error) throw error;
}

export async function actualizarArea(id: string, nuevaArea: string): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ area: nuevaArea })
    .eq("id", id);

  if (error) throw error;
}