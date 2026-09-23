import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import ModalEmpresa from "../components/ModalEmpresa";

// Primer contacto disponible entre todas las plantas — solo para la vista
// resumida de la tabla, la edición real es por planta.
const primerContacto = (empresa) => {
  for (const p of empresa.plantas || []) {
    if (p.contactos?.length) return p.contactos[0];
  }
  return null;
};

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const res = await fetchAuth("/empresas");
    if (res.ok) setEmpresas(await res.json());
  };

  const empresasFiltradas = empresas.filter((e) => {
    const q = filtro.toLowerCase();
    return e.razonSocial.toLowerCase().includes(q) || e.ruc.includes(q);
  });

  const abrirNuevo = () => {
    setEditando(null);
    setModal(true);
  };

  const abrirEditar = (empresa) => {
    setEditando(empresa);
    setModal(true);
  };

  return (
    <div className="p-6 m-0">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Empresas</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o RUC…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            onClick={abrirNuevo}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
          >
            + Nueva empresa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-500 text-white text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Alias</th>
              <th className="px-4 py-3 text-left">Razón social</th>
              <th className="px-4 py-3 text-left">RUC</th>
              <th className="px-4 py-3 text-left">Contacto</th>
              <th className="px-4 py-3 text-center">HES / Acta</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {filtro ? "Sin resultados para la búsqueda" : "Sin empresas registradas"}
                </td>
              </tr>
            ) : (
              empresasFiltradas.map((e) => {
                const contacto = primerContacto(e);
                return (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">{e.codigo}</td>
                  <td className="px-4 py-3 font-medium">{e.alias}</td>
                  <td className="px-4 py-3">{e.razonSocial}</td>
                  <td className="px-4 py-3">{e.ruc}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {contacto ? `${contacto.nombre}${contacto.telefono ? ` · ${contacto.telefono}` : ""}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.requiereHes && <span className="inline-block px-1.5 py-0.5 mr-1 rounded bg-amber-50 text-amber-700 text-[10px] font-medium">HES</span>}
                    {e.requiereActaConformidad && <span className="inline-block px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-medium">Acta</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirEditar(e)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modal && (
        <ModalEmpresa
          empresa={editando}
          onClose={() => setModal(false)}
          onGuardada={async () => { await cargar(); setModal(false); }}
        />
      )}
    </div>
  );
}
