import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";

const INP = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full";

export default function ModalMovimiento({ tipoInicial, materiales, ordenesTrabajo, onClose, onCreado }) {
  const [form, setForm] = useState({
    tipo: tipoInicial,
    material: "",
    cantidad: "",
    precioUnitario: "",
    guiaProveedor: "",
    ordenCompra: "",
    proveedor: "",
    loteOrigen: "",
    ordenTrabajo: "",
    notas: "",
  });
  const [lotes, setLotes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  useEffect(() => {
    let activo = true;
    const cargarLotes = async () => {
      if (form.tipo !== "egreso" || !form.material) {
        if (activo) setLotes([]);
        return;
      }
      const r = await fetchAuth(`/movimientos-almacen/lotes/${form.material}`);
      const data = r.ok ? await r.json() : [];
      if (activo) setLotes(data || []);
    };
    cargarLotes();
    return () => { activo = false; };
  }, [form.tipo, form.material]);

  const materialSel = materiales.find((m) => m._id === form.material);

  const guardar = async () => {
    if (!form.material) return setError("Selecciona un material.");
    if (!form.cantidad || Number(form.cantidad) <= 0) return setError("Ingresa una cantidad válida.");
    if (form.tipo === "egreso" && !form.loteOrigen) return setError("Selecciona el lote del que se egresa.");
    setError("");
    setGuardando(true);

    const payload = {
      tipo: form.tipo,
      material: form.material,
      cantidad: Number(form.cantidad),
      precioUnitario: form.precioUnitario ? Number(form.precioUnitario) : 0,
      notas: form.notas,
      ...(form.tipo === "ingreso"
        ? { guiaProveedor: form.guiaProveedor, ordenCompra: form.ordenCompra, proveedor: form.proveedor }
        : { loteOrigen: form.loteOrigen, ordenTrabajo: form.ordenTrabajo || undefined }),
    };

    const res = await fetchAuth("/movimientos-almacen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onCreado(await res.json());
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.mensaje || "No se pudo registrar el movimiento.");
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-800">{form.tipo === "ingreso" ? "Registrar Ingreso" : "Registrar Egreso"}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Material *</label>
            <select name="material" value={form.material} onChange={handleChange} className={INP}>
              <option value="">Selecciona un material</option>
              {materiales.map((m) => (
                <option key={m._id} value={m._id}>{m.sku} — {m.nombre} (stock: {m.stock})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cantidad *</label>
              <input type="number" min="0.01" step="any" name="cantidad" value={form.cantidad} onChange={handleChange} className={INP} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio unitario (S/)</label>
              <input type="number" min="0" step="0.01" name="precioUnitario" value={form.precioUnitario} onChange={handleChange}
                placeholder="Opcional" className={INP} />
            </div>
          </div>

          {form.tipo === "ingreso" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Proveedor</label>
                  <input name="proveedor" value={form.proveedor} onChange={handleChange} className={INP} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Guía del proveedor</label>
                  <input name="guiaProveedor" value={form.guiaProveedor} onChange={handleChange} className={INP} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Orden de compra</label>
                <input name="ordenCompra" value={form.ordenCompra} onChange={handleChange} placeholder="Opcional" className={INP} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Lote de origen (FIFO) *</label>
                <select name="loteOrigen" value={form.loteOrigen} onChange={handleChange} className={INP}>
                  <option value="">Selecciona un lote</option>
                  {lotes.map((l) => (
                    <option key={l.lote} value={l.lote}>
                      {l.lote} — disponible: {l.cantidadDisponible} ({new Date(l.fecha).toLocaleDateString("es-PE")})
                    </option>
                  ))}
                </select>
                {form.material && lotes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Este material no tiene lotes con stock disponible.</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Orden de Trabajo destino</label>
                <select name="ordenTrabajo" value={form.ordenTrabajo} onChange={handleChange} className={INP}>
                  <option value="">Sin OT asociada</option>
                  {ordenesTrabajo.map((ot) => <option key={ot._id} value={ot._id}>{ot.codigo} — {ot.titulo}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-gray-500 block mb-1">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className={`${INP} resize-none`} />
          </div>

          {materialSel && form.tipo === "egreso" && Number(form.cantidad) > materialSel.stock && (
            <p className="text-xs text-red-500">La cantidad supera el stock disponible ({materialSel.stock}).</p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando}
            className={`text-sm text-white px-5 py-2 rounded-lg disabled:opacity-50 transition font-medium ${
              form.tipo === "ingreso" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"
            }`}>
            {guardando ? "Guardando…" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
