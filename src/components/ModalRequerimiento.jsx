import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";

const INP = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full";

const itemVacio = () => ({
  esSolicitudCompra: false,
  material: "",
  cantidad: "",
  categoriaMaterial: "",
  categoriaNombre: "",
  camposCompra: {},
});

export default function ModalRequerimiento({ ot, onClose, onCreado }) {
  const [solicitadoPor, setSolicitadoPor] = useState("");
  const [dni, setDni] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState([itemVacio()]);
  const [materiales, setMateriales] = useState([]);
  const [categoriasMaterial, setCategoriasMaterial] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAuth("/materiales").then((r) => r.ok && r.json()).then((data) => data && setMateriales(data));
    fetchAuth("/categorias-material").then((r) => r.ok && r.json()).then((data) => data && setCategoriasMaterial(data));
  }, []);

  const actualizarItem = (i, campo, valor) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [campo]: valor } : it));

  const cambiarTipo = (i, esSolicitudCompra) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...itemVacio(), cantidad: it.cantidad, esSolicitudCompra } : it));

  const cambiarCategoria = (i, categoriaId) => {
    const categoria = categoriasMaterial.find((c) => c._id === categoriaId);
    setItems((prev) => prev.map((it, idx) => idx === i ? {
      ...it,
      categoriaMaterial: categoriaId,
      categoriaNombre: categoria?.nombre || "Otros",
      camposCompra: {},
    } : it));
  };

  const actualizarCampoCompra = (i, clave, valor) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, camposCompra: { ...it.camposCompra, [clave]: valor } } : it));

  const agregarItem = () => setItems((prev) => [...prev, itemVacio()]);
  const quitarItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const guardar = async () => {
    if (!solicitadoPor.trim()) return setError("Falta el nombre de quien solicita.");
    for (const it of items) {
      if (!it.cantidad || Number(it.cantidad) <= 0) return setError("Cada ítem necesita una cantidad válida.");
      if (it.esSolicitudCompra && !it.categoriaNombre) return setError("Selecciona la categoría de cada ítem de compra.");
      if (!it.esSolicitudCompra && !it.material) return setError("Selecciona el material de cada ítem de stock.");
    }
    setError("");
    setGuardando(true);

    const res = await fetchAuth("/requerimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ordenTrabajo: ot._id,
        solicitadoPor: solicitadoPor.trim(),
        dni: dni.trim(),
        observaciones,
        items: items.map((it) => ({
          esSolicitudCompra: it.esSolicitudCompra,
          material: it.esSolicitudCompra ? undefined : it.material,
          cantidad: Number(it.cantidad),
          categoriaMaterial: it.esSolicitudCompra ? (it.categoriaMaterial || undefined) : undefined,
          categoriaNombre: it.esSolicitudCompra ? it.categoriaNombre : "",
          camposCompra: it.esSolicitudCompra ? it.camposCompra : {},
        })),
      }),
    });

    if (res.ok) {
      onCreado(await res.json());
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.mensaje || "No se pudo crear el requerimiento.");
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-800">Nuevo Requerimiento de Material</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{ot.codigo}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Solicitado por *</label>
              <input value={solicitadoPor} onChange={(e) => setSolicitadoPor(e.target.value)} className={INP} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">DNI</label>
              <input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Opcional" className={INP} />
            </div>
          </div>

          <div className="space-y-3">
            {items.map((it, i) => {
              const categoria = categoriasMaterial.find((c) => c._id === it.categoriaMaterial);
              return (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-xs">
                      <button type="button" onClick={() => cambiarTipo(i, false)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition ${!it.esSolicitudCompra ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        Stock existente
                      </button>
                      <button type="button" onClick={() => cambiarTipo(i, true)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition ${it.esSolicitudCompra ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        Solicitud de compra
                      </button>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => quitarItem(i)} className="text-gray-400 hover:text-red-600 text-lg leading-none px-1">✕</button>
                    )}
                  </div>

                  {!it.esSolicitudCompra ? (
                    <div className="grid grid-cols-3 gap-2">
                      <select value={it.material} onChange={(e) => actualizarItem(i, "material", e.target.value)} className={`${INP} col-span-2`}>
                        <option value="">Selecciona un material</option>
                        {materiales.map((m) => <option key={m._id} value={m._id}>{m.sku} — {m.nombre} (stock: {m.stock})</option>)}
                      </select>
                      <input type="number" min="0.01" step="any" placeholder="Cantidad"
                        value={it.cantidad} onChange={(e) => actualizarItem(i, "cantidad", e.target.value)} className={INP} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <select value={it.categoriaMaterial} onChange={(e) => cambiarCategoria(i, e.target.value)} className={`${INP} col-span-2`}>
                          <option value="">Otros</option>
                          {categoriasMaterial.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                        </select>
                        <input type="number" min="0.01" step="any" placeholder="Cantidad"
                          value={it.cantidad} onChange={(e) => actualizarItem(i, "cantidad", e.target.value)} className={INP} />
                      </div>
                      {categoria ? (
                        <div className="grid grid-cols-2 gap-2">
                          {categoria.campos.map((c) => (
                            <div key={c.clave}>
                              <label className="text-xs text-gray-500 block mb-1">{c.nombre}{c.requerido && " *"}</label>
                              {c.tipo === "select" ? (
                                <select value={it.camposCompra[c.clave] || ""} onChange={(e) => actualizarCampoCompra(i, c.clave, e.target.value)} className={INP}>
                                  <option value="">Selecciona…</option>
                                  {c.opciones.map((op) => <option key={op} value={op}>{op}</option>)}
                                </select>
                              ) : (
                                <input type={c.tipo === "numero" ? "number" : "text"}
                                  value={it.camposCompra[c.clave] || ""} onChange={(e) => actualizarCampoCompra(i, c.clave, e.target.value)} className={INP} />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                          <input value={it.camposCompra.descripcion || ""} onChange={(e) => actualizarCampoCompra(i, "descripcion", e.target.value)}
                            placeholder="Describe lo que necesitas" className={INP} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={agregarItem} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Agregar ítem
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} className={`${INP} resize-none`} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando}
            className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            {guardando ? "Guardando…" : "Crear requerimiento"}
          </button>
        </div>
      </div>
    </div>
  );
}
