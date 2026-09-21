import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";

const badgeEstado = (e) => {
  if (e === "atendido") return "bg-green-50 text-green-700";
  if (e === "rechazado") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
};

function descripcionItem(it) {
  if (!it.esSolicitudCompra) return `${it.material?.sku || "—"} — ${it.material?.nombre || "Material eliminado"}`;
  const detalle = Object.entries(it.camposCompra || {}).filter(([, v]) => v).map(([, v]) => v).join(", ");
  return `${it.categoriaNombre || "Otros"}${detalle ? `: ${detalle}` : ""}`;
}

function AccionSalida({ item, onConfirmar, onCancelar }) {
  const materialId = item.esSolicitudCompra ? item.materialAsociado?._id : item.material?._id;
  const [lotes, setLotes] = useState([]);
  const [lote, setLote] = useState("");
  const [cantidad, setCantidad] = useState(item.cantidad);
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!materialId) return;
    fetchAuth(`/movimientos-almacen/lotes/${materialId}`).then((r) => r.ok && r.json()).then((data) => data && setLotes(data));
  }, [materialId]);

  const confirmar = async () => {
    if (!lote || !cantidad || Number(cantidad) <= 0) return;
    setEnviando(true);
    await onConfirmar({ lote, cantidad: Number(cantidad), precioUnitario: precioUnitario ? Number(precioUnitario) : 0 });
    setEnviando(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-green-50/50 border border-green-100 rounded-lg p-2 mt-1">
      <select value={lote} onChange={(e) => setLote(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs">
        <option value="">Lote…</option>
        {lotes.map((l) => <option key={l.lote} value={l.lote}>{l.lote} (disp: {l.cantidadDisponible})</option>)}
      </select>
      <input type="number" min="0.01" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs w-20" placeholder="Cant." />
      <input type="number" min="0" step="0.01" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs w-24" placeholder="P. unit." />
      <button onClick={confirmar} disabled={enviando} className="text-xs bg-green-600 text-white px-2.5 py-1 rounded hover:bg-green-700 disabled:opacity-50">
        Confirmar
      </button>
      <button onClick={onCancelar} className="text-xs text-gray-400 hover:text-gray-700">Cancelar</button>
    </div>
  );
}

function AccionVincular({ materiales, onConfirmar, onCancelar }) {
  const [material, setMaterial] = useState("");
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    if (!material) return;
    setEnviando(true);
    await onConfirmar(material);
    setEnviando(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-purple-50/50 border border-purple-100 rounded-lg p-2 mt-1">
      <select value={material} onChange={(e) => setMaterial(e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-xs flex-1 min-w-40">
        <option value="">Selecciona el SKU…</option>
        {materiales.map((m) => <option key={m._id} value={m._id}>{m.sku} — {m.nombre}</option>)}
      </select>
      <button onClick={confirmar} disabled={enviando} className="text-xs bg-purple-600 text-white px-2.5 py-1 rounded hover:bg-purple-700 disabled:opacity-50">
        Vincular
      </button>
      <button onClick={onCancelar} className="text-xs text-gray-400 hover:text-gray-700">Cancelar</button>
    </div>
  );
}

function AccionTexto({ placeholder, textoBoton, color, onConfirmar, onCancelar }) {
  const [valor, setValor] = useState("");
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    if (!valor.trim()) return;
    setEnviando(true);
    await onConfirmar(valor);
    setEnviando(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2 mt-1">
      <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder={placeholder}
        className="border border-gray-200 rounded px-2 py-1 text-xs flex-1 min-w-40" />
      <button onClick={confirmar} disabled={enviando} className={`text-xs text-white px-2.5 py-1 rounded disabled:opacity-50 ${color}`}>
        {textoBoton}
      </button>
      <button onClick={onCancelar} className="text-xs text-gray-400 hover:text-gray-700">Cancelar</button>
    </div>
  );
}

export default function TablaRequerimientos({ requerimientos, materiales = [], puedeAtender, onCambio }) {
  const [accion, setAccion] = useState(null); // { requerimientoId, itemId, tipo }

  const patch = async (reqId, path, body) => {
    const res = await fetchAuth(`/requerimientos/${reqId}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setAccion(null);
    if (res.ok) onCambio();
    return res.ok;
  };

  if (requerimientos.length === 0) {
    return <p className="text-sm text-gray-400">Sin requerimientos de material</p>;
  }

  return (
    <div className="space-y-3">
      {requerimientos.map((r) => (
        <div key={r._id} className={`border border-gray-100 rounded-xl p-3 ${r.anulada ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-mono font-medium text-gray-700">{r.codigo}</span>
              {r.ordenTrabajo?.codigo && <span>· OT {r.ordenTrabajo.codigo}</span>}
              <span>· {r.solicitadoPor}</span>
              <span>· {new Date(r.createdAt).toLocaleDateString("es-PE")}</span>
            </div>
            {r.anulada && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Anulado</span>}
          </div>
          <div className="space-y-1.5">
            {r.items.map((it) => {
              const enAccion = accion?.requerimientoId === r._id && accion?.itemId === it._id;
              return (
                <div key={it._id}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-700 flex-1">{descripcionItem(it)}</span>
                    <span className="text-gray-500 tabular-nums">{it.cantidad}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeEstado(it.estado)}`}>{it.estado}</span>
                    {puedeAtender && !r.anulada && it.estado === "pendiente" && !enAccion && (
                      <div className="flex gap-1">
                        {it.esSolicitudCompra && !it.materialAsociado ? (
                          <button onClick={() => setAccion({ requerimientoId: r._id, itemId: it._id, tipo: "vincular" })}
                            className="text-xs text-purple-600 hover:text-purple-800">Vincular SKU</button>
                        ) : (
                          <button onClick={() => setAccion({ requerimientoId: r._id, itemId: it._id, tipo: "salida" })}
                            className="text-xs text-green-600 hover:text-green-800">Dar salida</button>
                        )}
                        <button onClick={() => setAccion({ requerimientoId: r._id, itemId: it._id, tipo: "rechazar" })}
                          className="text-xs text-red-500 hover:text-red-700">Rechazar</button>
                      </div>
                    )}
                    {puedeAtender && !r.anulada && it.estado === "atendido" && !enAccion && (
                      <button onClick={() => setAccion({ requerimientoId: r._id, itemId: it._id, tipo: "devolucion" })}
                        className="text-xs text-gray-400 hover:text-gray-700">Devolver</button>
                    )}
                  </div>
                  {it.estado === "rechazado" && it.motivoRechazo && (
                    <p className="text-xs text-red-400 pl-1">Motivo: {it.motivoRechazo}</p>
                  )}
                  {it.cantidadDevuelta > 0 && (
                    <p className="text-xs text-gray-400 pl-1">Devuelto: {it.cantidadDevuelta}</p>
                  )}

                  {enAccion && accion.tipo === "salida" && (
                    <AccionSalida item={it}
                      onConfirmar={(body) => patch(r._id, `/items/${it._id}/salida`, body)}
                      onCancelar={() => setAccion(null)} />
                  )}
                  {enAccion && accion.tipo === "vincular" && (
                    <AccionVincular materiales={materiales}
                      onConfirmar={(material) => patch(r._id, `/items/${it._id}/vincular-material`, { material })}
                      onCancelar={() => setAccion(null)} />
                  )}
                  {enAccion && accion.tipo === "rechazar" && (
                    <AccionTexto placeholder="Motivo del rechazo" textoBoton="Rechazar" color="bg-red-600 hover:bg-red-700"
                      onConfirmar={(motivo) => patch(r._id, `/items/${it._id}/rechazar`, { motivo })}
                      onCancelar={() => setAccion(null)} />
                  )}
                  {enAccion && accion.tipo === "devolucion" && (
                    <AccionTexto placeholder="Cantidad a devolver" textoBoton="Devolver" color="bg-gray-700 hover:bg-gray-800"
                      onConfirmar={(cantidad) => patch(r._id, `/items/${it._id}/devolucion`, { cantidad: Number(cantidad) })}
                      onCancelar={() => setAccion(null)} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
