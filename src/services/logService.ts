import { supabase } from "../lib/supabase";

export async function registrarLog(
usuario_id: string,
accion: string,
tabla: string,
registro_id: string,
descripcion: string
){
await supabase.from("logs").insert({
usuario_id,
accion,
tabla,
registro_id,
descripcion
});
}