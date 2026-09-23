import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";

const INP = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full";

// Panel para buscar y elegir una OT existente a vincular a una cotización —
// mismo diseño que SIPAPP-HUAQUIAN (BuscadorOrdenTrabajo.jsx). A diferencia
// de Huaquian (que vincula de inmediato vía PATCH), acá solo se elige: el
// padre (DetalleCotizacion) aplica el vínculo recién al guardar, igual que
// el resto del formulario.
export default function BuscadorOrdenTrabajo({ excluirCotizacionId, onSelect, onClose }) {
  const [lista, setLista] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchAuth("/ordenes-trabajo").then((r) => r.ok && r.json()).then((d) => setLista(d || []));
  }, []);

  const filtradas = lista.filter((o) => !q ||
    [o.codigo, o.titulo, o.empresa?.razonSocial]
      .some((v) => v?.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h4 className="font-semibold text-gray-800">Buscar Orden de Trabajo</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="px-4 pt-4">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="N° OT, título o empresa…" className={INP} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filtradas.length === 0
            ? <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
            : filtradas.map((o) => {
                const otraCotId = o.cotizacion?._id || o.cotizacion;
                const yaVinculada = otraCotId && String(otraCotId) !== String(excluirCotizacionId);
                return (
                  <button key={o._id} type="button" onClick={() => onSelect(o)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-mono text-xs text-blue-600">{o.codigo}</span>
                      {yaVinculada && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide shrink-0">
                          Ya vinculada a {o.cotizacion?.codigo || "otra cotización"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 truncate">{o.ingresoEquipo?.tipoEquipo || o.titulo}</p>
                    {o.empresa && <p className="text-xs text-gray-400">{o.empresa.razonSocial}</p>}
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}
