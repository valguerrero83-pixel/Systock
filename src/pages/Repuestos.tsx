import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ModalNuevoRepuesto from "../components/ModalNuevoRepuesto";

export default function Repuestos() {
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);

  async function cargarRepuestos() {
    setLoading(true);

    const { data, error } = await supabase
      .from("repuestos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setRepuestos(data);

    setLoading(false);
  }

  useEffect(() => {
    cargarRepuestos();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Repuestos</h1>
        
        <button
          onClick={() => setModalAbierto(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
        >
          Nuevo Repuesto
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left border-b">
            <tr>
              <th className="p-2">Nombre</th>
              <th className="p-2">Unidad</th>
              <th className="p-2">Stock mínimo</th>
            </tr>
          </thead>

          <tbody>
            {repuestos.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.nombre}</td>
                <td className="p-2">{r.unidad}</td>
                <td className="p-2">{r.stock_minimo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ModalNuevoRepuesto
        abierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreated={cargarRepuestos}
      />
    </div>
  );
}
