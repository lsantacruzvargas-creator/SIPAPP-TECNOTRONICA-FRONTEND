import { useState } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import ModalServicioExterno from "./ModalServicioExterno";

const money = (v) => "S/ " + Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 });

// Sección de Servicios Externos (terceros) para el detalle de una OT — no la
// ve el rol técnico (gate ya hecho en el componente padre, este asume que ya
// se filtró). Embebida en ModalVerOT.jsx.
export default function TablaServiciosExternos({ ot, servicios, puedeEditar, onCambio }) {
  const [crearOpen, setCrearOpen] = useState(false);
  const [confirmandoAnular, setConfirmandoAnular] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);

  const anular = async () => {
    if (!motivo.trim()) return;
    setAnulando(true);
    const res = await fetchAuth(`/servicios-externos/${confirmandoAnular._id}/anular`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    setAnulando(false);
    setConfirmandoAnular(null);
    setMotivo("");
    if (res.ok) onCambio();
  };

  const totalCosto = servicios.filter((s) => !s.anulada).reduce((s, v) => s + (Number(v.costo) || 0), 0);

  return (
    <div className="border border-purple-100 bg-purple-50/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
          Servicios Externos ({servicios.length})
        </p>
        {puedeEditar && !ot.anulada && (
          <button type="button" onClick={() => setCrearOpen(true)}
            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition font-medium">
            + Agregar servicio
          </button>
        )}
      </div>

      {servicios.length === 0 ? (
        <p className="text-sm text-gray-400">Sin servicios externos registrados</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <tr>
                <th className="text-left py-2 pr-3">Código</th>
                <th className="text-left py-2 pr-3">Proveedor</th>
                <th className="text-left py-2 pr-3">Tipo de trabajo</th>
                <th className="text-right py-2 pr-3">Cantidad</th>
                <th className="text-right py-2 pr-3">Costo</th>
                {puedeEditar && <th className="text-left py-2 pr-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {servicios.map((s) => (
                <tr key={s._id} className={s.anulada ? "opacity-50" : ""}>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-700">{s.codigo}</td>
                  <td className="py-2 pr-3 text-gray-700">{s.nombreProveedor}</td>
                  <td className="py-2 pr-3 text-gray-600">{s.tipoTrabajo}</td>
                  <td className="py-2 pr-3 text-right text-gray-700 tabular-nums">{s.cantidad}</td>
                  <td className="py-2 pr-3 text-right text-gray-700 tabular-nums">{s.costo > 0 ? money(s.costo) : "—"}</td>
                  {puedeEditar && (
                    <td className="py-2 pr-3">
                      {!s.anulada && (
                        <button type="button" onClick={() => setConfirmandoAnular(s)}
                          className="text-xs text-gray-400 hover:text-red-500 transition">
                          Anular
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {totalCosto > 0 && (
              <tfoot>
                <tr className="border-t border-gray-100 font-semibold">
                  <td colSpan={3} className="py-2 pr-3 text-right text-xs uppercase tracking-wide text-gray-400">Total</td>
                  <td />
                  <td className="py-2 pr-3 text-right text-gray-800 tabular-nums">{money(totalCosto)}</td>
                  {puedeEditar && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {crearOpen && (
        <ModalServicioExterno ot={ot} onClose={() => setCrearOpen(false)}
          onCreado={() => { setCrearOpen(false); onCambio(); }} />
      )}

      {confirmandoAnular && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h4 className="font-semibold text-gray-800 mb-2">Anular servicio {confirmandoAnular.codigo}</h4>
            <label className="text-xs text-gray-500 block mb-1">Motivo de anulación</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full mb-4 focus:outline-none focus:ring-2 focus:ring-purple-300" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setConfirmandoAnular(null); setMotivo(""); }}
                className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={anular} disabled={anulando || !motivo.trim()}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                {anulando ? "Anulando…" : "Confirmar anulación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
