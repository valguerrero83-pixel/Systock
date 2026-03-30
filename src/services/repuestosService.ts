import { supabase } from "../lib/supabase";

export async function crearRepuesto(data:any){

const { data: repuesto, error } = await supabase
.from("repuestos")
.insert([
{
nombre: data.nombre,
referencia: data.referencia,
codigo_siesa: data.codigo_siesa,
marca: data.marca,
proveedor: data.proveedor,
unidad: data.unidad,
stock_minimo: data.stock_minimo,
cantidad_inicial: data.cantidad_inicial,
usuario_id: data.usuario_id,
sede_id: data.sede_id,
categoria_id: data.categoria_id,

// 🔥 ESTE ES EL FIX
ubicacion_id: data.ubicacion_id || null
}
])
.select()

if(error){
  console.error("ERROR CREANDO REPUESTO:", error)
  throw error
}

return repuesto
}