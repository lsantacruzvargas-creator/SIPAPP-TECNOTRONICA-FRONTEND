import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import { INP } from "../utils/cotizacionItems";

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
            <label className="text-xs text-gray-400 block mb-1">N° guía de emisión</label>
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

export default function ModalEditarFactura({ factura: inicial, onClose, onGuardada }) {
  const [confirmandoAnular, setConfirmandoAnular] = useState(false);
  const [anulando, setAnulando] = useState(false);

  const anular = async () => {
    setAnulando(true);
    const res = await fetchAuth(`/facturas/${inicial._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anulada: !inicial.anulada }),
    });
    if (res.ok) onGuardada(await res.json());
    setAnulando(false);
    setConfirmandoAnular(false);
  };

  const [form, setForm] = useState({
    numeroFactura:      inicial.numeroFactura      || "",
    fechaVencimiento:   inicial.fechaVencimiento
      ? new Date(inicial.fechaVencimiento).toISOString().split("T")[0]
      : "",
    monto:              inicial.monto != null ? String(inicial.monto) : "",
    numeroOrdenCompra:  inicial.numeroOrdenCompra  || "",
    numeroGuiaEmision:  inicial.numeroGuiaEmision  || "",
    numeroGuiaRemision: inicial.numeroGuiaRemision || "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ie, setIe]       = useState(null);

  const empresa    = inicial.empresa;
  const cotizacion = inicial.cotizacion;

  useEffect(() => {
    fetchAuth("/ordenes-trabajo").then((r) => r.ok && r.json()).then((ots) => {
      if (!ots) return;
      const ot = ots.find((o) => o.cotizacion?._id === cotizacion?._id && o.ingresoEquipo);
      const ingresoEquipo = ot?.ingresoEquipo || null;
      setIe(ingresoEquipo);
      if (ingresoEquipo?.numeroGuiaEmision && !inicial.numeroGuiaRemision) {
        setForm((prev) => ({ ...prev, numeroGuiaRemision: ingresoEquipo.numeroGuiaEmision }));
      }
    });
  }, [cotizacion?._id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async () => {
    setError("");
    setGuardando(true);
    const monto = Number(form.monto) || 0;
    const tipo  = cotizacion?.tipo;
    const detraccion  = (tipo === "servicio" && monto > 700) ? parseFloat((monto * 0.12).toFixed(2)) : 0;
    const retencion   = (tipo === "venta"    && monto > 700) ? parseFloat((monto * 0.03).toFixed(2)) : 0;
    const totalAPagar = parseFloat((monto - detraccion - retencion).toFixed(2));

    const payload = { ...form, detraccion, retencion, totalAPagar };
    if (!payload.fechaVencimiento) delete payload.fechaVencimiento;

    const res = await fetchAuth(`/facturas/${inicial._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, montoPagado: inicial.montoPagado, estadoPago: inicial.estadoPago }),
    });

    if (res.ok) {
      onGuardada(await res.json());
    } else {
      setError("No se pudo guardar los cambios.");
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
            <h3 className="font-semibold text-gray-800">Modificar factura</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{inicial.codigo}</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        {/* Body — dos columnas cuando hay equipo */}
        <div className="flex-1 overflow-hidden flex">
          {ie && (
            <div className="w-2/5 overflow-y-auto p-6 border-r border-gray-100 bg-blue-50/10">
              <PanelIngresoEquipo ie={ie} />
            </div>
          )}
          <div className={`${ie ? "w-3/5" : "w-full"} overflow-y-auto p-6 space-y-5`}>

            {/* Datos de la cotización (read-only) */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cotización vinculada</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Empresa</p>
                  <p className="font-medium text-gray-700">
                    {empresa ? `${empresa.alias} — ${empresa.razonSocial}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">RUC</p>
                  <p className="text-gray-700">{empresa?.ruc || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Título</p>
                  <p className="text-gray-700">{cotizacion?.titulo || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Código cot.</p>
                  <p className="font-mono text-xs text-gray-600">{cotizacion?.codigo || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="font-semibold text-gray-800">
                    {cotizacion?.total != null ? Number(cotizacion.total).toFixed(2) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Campos editables */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">N° de factura</label>
                <input name="numeroFactura" value={form.numeroFactura} onChange={handleChange}
                  placeholder="Ej. F001-00123" className={`w-full ${INP}`} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Fecha de vencimiento</label>
                <input type="date" name="fechaVencimiento" value={form.fechaVencimiento}
                  onChange={handleChange} className={`w-full ${INP}`} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Monto de la factura</label>
                <input type="number" name="monto" value={form.monto} onChange={handleChange}
                  step="0.01" min="0" placeholder="0.00" className={`w-full ${INP}`} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-1">N° de orden de compra</label>
                <input name="numeroOrdenCompra" value={form.numeroOrdenCompra} onChange={handleChange}
                  placeholder="—" className={`w-full ${INP}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">N° guía de emisión</label>
                <input name="numeroGuiaEmision" value={form.numeroGuiaEmision} onChange={handleChange}
                  placeholder="—" className={`w-full ${INP}`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">N° guía de remisión</label>
                <input name="numeroGuiaRemision" value={form.numeroGuiaRemision} onChange={handleChange}
                  placeholder="—" className={`w-full ${INP}`} />
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-between shrink-0">
          <button type="button" onClick={() => setConfirmandoAnular(true)}
            className={`text-sm px-4 py-2 rounded-lg transition border ${
              inicial.anulada
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            }`}>
            {inicial.anulada ? "Reactivar factura" : "Anular factura"}
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="button" onClick={guardar} disabled={guardando || inicial.anulada}
              className="text-sm bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition font-medium">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>

    {confirmandoAnular && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            {inicial.anulada ? "¿Reactivar factura?" : "¿Anular factura?"}
          </h4>
          <p className="text-sm text-gray-500 mb-5">Factura: <span className="font-mono font-medium">{inicial.codigo}</span></p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmandoAnular(false)}
              className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button onClick={anular} disabled={anulando}
              className={`text-sm text-white px-4 py-2 rounded-lg disabled:opacity-50 transition ${
                inicial.anulada ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}>
              {anulando
                ? (inicial.anulada ? "Reactivando…" : "Anulando…")
                : (inicial.anulada ? "Confirmar reactivación" : "Confirmar anulación")}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
