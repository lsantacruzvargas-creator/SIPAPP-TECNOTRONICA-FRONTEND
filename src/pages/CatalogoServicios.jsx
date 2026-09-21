import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import ModalCatalogoServicio from "../components/ModalCatalogoServicio";

export default function CatalogoServicios() {
  const [catalogo, setCatalogo] = useState([]);
  const [modal, setModal] = useState(null); // null | "nuevo" | objeto grupo
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(null);

  useEffect(() => {
    fetchAuth("/catalogo-servicios").then((r) => r.ok ? r.json() : []).then(setCatalogo);
  }, []);

  const upsert = (g) => {
    setCatalogo((prev) => {
      const existe = prev.find((x) => x._id === g._id);
      return existe ? prev.map((x) => (x._id === g._id ? g : x)) : [...prev, g];
    });
    setModal(null);
  };

  const eliminar = async () => {
    const g = confirmandoEliminar;
    setConfirmandoEliminar(null);
    const res = await fetchAuth(`/catalogo-servicios/${g._id}`, { method: "DELETE" });
    if (res.ok) setCatalogo((prev) => prev.filter((x) => x._id !== g._id));
  };

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Catálogo de Servicios</h2>
          <p className="text-xs text-gray-400 mt-0.5">Grupos e ítems disponibles al armar el detalle de una cotización</p>
        </div>
        <button
          onClick={() => setModal("nuevo")}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Nuevo grupo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-500 text-white text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Grupo</th>
                <th className="px-4 py-3 text-center">Ítems</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {catalogo.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Sin grupos registrados</td></tr>
              ) : catalogo.map((g) => (
                <tr key={g._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 cursor-pointer" onClick={() => setModal(g)}>
                    {g.grupo}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{g.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => setModal(g)} className="text-xs text-blue-600 hover:text-blue-800 transition">
                      Editar
                    </button>
                    <button onClick={() => setConfirmandoEliminar(g)} className="text-xs text-red-400 hover:text-red-600 transition">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ModalCatalogoServicio
          grupoServicio={modal === "nuevo" ? null : modal}
          onClose={() => setModal(null)}
          onGuardado={upsert}
        />
      )}

      {confirmandoEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h4 className="font-semibold text-gray-800 mb-2">¿Eliminar el grupo "{confirmandoEliminar.grupo}"?</h4>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmandoEliminar(null)}
                className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={eliminar}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
