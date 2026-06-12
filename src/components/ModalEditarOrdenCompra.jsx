import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import ModalFactura from "./ModalFactura";

const INP    = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full";
const INP_RO = "border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 w-full cursor-not-allowed";

function PanelIngresoEquipo({ ie }) {
  if (!ie) return null;
  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
        Ingreso de equipo · <span className="font-mono">{ie.codigo}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Tipo de equipo</label>
          <input value={ie.tipoEquipo || "—"} disabled className={INP_RO} />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Marca / Modelo</label>
          <input value={[ie.marca, ie.modelo].filter(Boolean).join(" / ") || "—"} disabled className={INP_RO} />
        </div>
        {ie.planta && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Planta</label>
            <input value={ie.planta} disabled className={INP_RO} />
          </div>
        )}
        {ie.fechaIngreso && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha de ingreso</label>
            <input value={new Date(ie.fechaIngreso).toLocaleDateString("es-PE", { timeZone: "UTC" })} disabled className={INP_RO} />
          </div>
        )}
        {ie.caracteristicasElectricas && (
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Características eléctricas</label>
            <input value={ie.caracteristicasElectricas} disabled className={INP_RO} />
          </div>
        )}
        {ie.descripcionProblema && (
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Descripción del problema</label>
            <textarea value={ie.descripcionProblema} disabled rows={2} className={`${INP_RO} resize-none`} />
          </div>
        )}
        {ie.numeroGuiaEmision && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">N° guía de remisión</label>
            <input value={ie.numeroGuiaEmision} disabled className={`${INP_RO} font-mono`} />
          </div>
        )}
        {ie.garantia && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Garantía</label>
            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              En garantía
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModalEditarOrdenCompra({ orden, onClose, onGuardada }) {
  const [form, setForm] = useState({
    numeroOrden:   orden.numeroOrden   || "",
    numeroFactura: orden.numeroFactura || "",
    monto:         orden.monto ?? 0,
  });
  const [guardando, setGuardando]   = useState(false);
  const [crearFactura, setCrearFactura] = useState(false);
  const [error, setError]           = useState("");
  const [ie, setIe]                 = useState(null);

  useEffect(() => {
    fetchAuth("/ordenes-trabajo").then((r) => r.ok && r.json()).then((ots) => {
      if (!ots) return;
      const ot = ots.find((o) => o.cotizacion?._id === orden.cotizacion?._id && o.ingresoEquipo);
      setIe(ot?.ingresoEquipo || null);
    });
  }, [orden.cotizacion?._id]);

  const emp = orden.empresa;

  const cotizacionParaFactura = {
    ...orden.cotizacion,
    empresa: orden.empresa,
  };

  const [confirmandoAnular, setConfirmandoAnular] = useState(false);
  const [anulando, setAnulando] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const anular = async () => {
    setAnulando(true);
    const res = await fetchAuth(`/ordenes-compra/${orden._id}/anular`, { method: "PATCH" });
    if (res.ok) onGuardada(await res.json());
    setAnulando(false);
    setConfirmandoAnular(false);
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    const res = await fetchAuth(`/ordenes-compra/${orden._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroOrden: form.numeroOrden, numeroFactura: form.numeroFactura, monto: Number(form.monto) }),
    });
    if (res.ok) {
      onGuardada(await res.json());
    } else {
      setError("Error al guardar los cambios.");
    }
    setGuardando(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${ie ? "max-w-4xl" : "max-w-lg"}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h3 className="font-semibold text-gray-800">Orden de Compra</h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{orden.cotizacion?.codigo}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCrearFactura(true)}
                className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Crear factura
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>
          </div>

          {/* Body — dos columnas cuando hay equipo */}
          <div className="flex-1 overflow-hidden flex">
            {ie && (
              <div className="w-2/5 overflow-y-auto p-6 border-r border-gray-100 bg-blue-50/10">
                <PanelIngresoEquipo ie={ie} />
              </div>
            )}
            <div className={`${ie ? "w-3/5" : "w-full"} overflow-y-auto p-6 space-y-4`}>
              {/* Datos de la cotización — solo lectura */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos de la cotización</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Código cotización</label>
                    <input value={orden.cotizacion?.codigo || "—"} disabled className={INP_RO} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Tipo</label>
                    <input value={orden.cotizacion?.tipo || "—"} disabled className={INP_RO} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Título</label>
                  <input value={orden.titulo} disabled className={INP_RO} />
                </div>
                {emp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Empresa</label>
                      <input value={emp.razonSocial} disabled className={INP_RO} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">RUC</label>
                      <input value={emp.ruc || "—"} disabled className={INP_RO} />
                    </div>
                  </div>
                )}
              </div>

              {/* Campos editables */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Número de orden de compra</label>
                <input name="numeroOrden" value={form.numeroOrden} onChange={handleChange}
                  placeholder="Ej. OC-2024-001" className={INP} />
              </div>
              {/* <div>
                <label className="text-xs text-gray-500 block mb-1">Número de factura</label>
                <input name="numeroFactura" value={form.numeroFactura} onChange={handleChange}
                  placeholder="Ej. F001-00123" className={INP} />
              </div> */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Monto (S/)</label>
                <input type="number" name="monto" value={form.monto} onChange={handleChange}
                  min="0" step="0.01" className={INP} />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end shrink-0">
            <button onClick={() => setConfirmandoAnular(true)} disabled={orden.anulada}
              className="text-sm bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-40 transition">
              {orden.anulada ? "Anulada" : "Anular OC"}
            </button>
            <button onClick={onClose} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando || orden.anulada}
              className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      {crearFactura && (
        <ModalFactura
          cotizacion={cotizacionParaFactura}
          numeroOrdenCompra={form.numeroOrden}
          onClose={() => setCrearFactura(false)}
          onCreada={() => setCrearFactura(false)}
        />
      )}

      {confirmandoAnular && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h4 className="font-semibold text-gray-800 mb-2">¿Anular orden de compra?</h4>
            <p className="text-sm text-gray-500 mb-1">OC: <span className="font-mono font-medium">{orden.codigo}</span></p>
            <p className="text-sm text-red-600 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmandoAnular(false)}
                className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={anular} disabled={anulando}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                {anulando ? "Anulando…" : "Confirmar anulación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
