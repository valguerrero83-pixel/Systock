import { supabase } from "../lib/supabase";

/* =========================
   COLORES AUTOMATICOS
========================= */

const colores = [
  "indigo",
  "emerald",
  "blue",
  "purple",
  "amber",
  "rose"
];

/* =========================
   OBTENER CATEGORIAS
========================= */

export async function obtenerCategorias(sedeId: string) {

  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("sede_id", sedeId)
    .order("nombre");

  if (error) throw error;

  return data;
}

/* =========================
   CREAR CATEGORIA
========================= */

export async function crearCategoria(
  nombre: string,
  sedeId: string
) {

  const color = colores[Math.floor(Math.random() * colores.length)];

  const { data, error } = await supabase
    .from("categorias")
    .insert([
      {
        nombre,
        sede_id: sedeId,
        color
      }
    ])
    .select();

  if (error) throw error;

  return data;
}