import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import { INP } from "../utils/cotizacionItems";

const cuotaVacia = (numero) => ({ numero, monto: "", fechaVencimiento: "" });
const PORCENTAJE_RETENCION = { servicio: 12, venta: 3 };

export default function ModalFactura({ cotizacion, ordenCompra, onClose, onCreada, numeroOrdenCompra = "" }) {
  const [form, setForm] = useState({
    numeroFactura:       "",
    fechaVencimiento:    "",
    monto:               Number(cotizacion.total ?? 0).toFixed(2),
    numeroOrdenCompra:   numeroOrdenCompra,
    numeroGuiaEmision:   "",
    numeroGuiaRemision:  "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState("");
  const [exito, setExito]         = useState(null);
  const [aCredito, setACredito]   = useState(false);
  const [cuotas, setCuotas]       = useState([cuotaVacia(1)]);
  const [preguntandoRetencion, setPreguntandoRetencion] = useState(false);

  const empresa = cotizacion.empresa;
  const porcentaje = PORCENTAJE_RETENCION[cotizacion.tipo] ?? 3;

  const agregarCuota = () => setCuotas((prev) => [...prev, cuotaVacia(prev.length + 1)]);
  const quitarCuota = (i) => setCuotas((prev) => prev.filter((_, idx) => idx !== i).map((c, idx) => ({ ...c, numero: idx + 1 })));
  const actualizarCuota = (i, campo, valor) =>
    setCuotas((prev) => prev.map((c, idx) => idx === i ? { ...c, [campo]: valor } : c));

  useEffect(() => {
    fetchAuth("/ordenes-trabajo").then((r) => r.ok && r.json()).then((ots) => {
      if (!ots) return;
      const ot = ots.find((o) => o.cotizacion?._id === cotizacion._id && o.ingresoEquipo);
      if (ot?.ingresoEquipo?.numeroGuiaEmision) {
        setForm((prev) => ({ ...prev, numeroGuiaRemision: ot.ingresoEquipo.numeroGuiaEmision }));
      }
    });
  }, [cotizacion._id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validar = () => {
    if (!form.numeroFactura.trim())     return setError("El N° de factura es obligatorio."), false;
    if (!form.fechaVencimiento)         return setError("La fecha de vencimiento es obligatoria."), false;
    if (!form.monto || Number(form.monto) <= 0) return setError("El monto es obligatorio."), false;
    if (!form.numeroOrdenCompra.trim()) return setError("El N° de orden de compra es obligatorio."), false;
    if (!empresa?._id) return setError("La cotización no tiene una empresa asociada; no se puede crear la factura."), false;
    if (aCredito && cuotas.some((c) => !c.monto || Number(c.monto) <= 0 || !c.fechaVencimiento)) {
      return setError("Cada cuota necesita un monto y una fecha de vencimiento."), false;
    }
    setError("");
    return true;
  };

  const guardar = async (gravadoRetencion) => {
    setPreguntandoRetencion(false);
    setGuardando(true);

    const payload = {
      cotizacion: cotizacion._id,
      empresa: empresa?._id,
      ordenCompra: ordenCompra?._id,
      ...form,
      gravadoRetencion,
      cuotas: aCredito ? cuotas.map((c) => ({ ...c, monto: Number(c.monto) })) : undefined,
    };
    if (!payload.fechaVencimiento) delete payload.fechaVencimiento;

    const res = await fetchAuth("/facturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setExito(data.codigo);
      setTimeout(() => onCreada(data), 1800);
    } else {
      setError("No se pudo guardar la factura.");
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-800">Nueva factura</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{cotizacion.codigo}</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Datos autocompletos de la cotización */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datos de la cotización</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Empresa</p>
                <p className="font-medium text-gray-700">
                  {empresa ? `${empresa.alias} — ${empresa.razonSocial}` : "Sin empresa"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">RUC</p>
                <p className="text-gray-700">{empresa?.ruc || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Título</p>
                <p className="text-gray-700">{cotizacion.titulo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total cotización</p>
                <p className="text-gray-500">{Number(cotizacion.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Tipo</p>
                <p className="capitalize text-gray-700">{cotizacion.tipo}</p>
              </div>
            </div>
          </div>

          {/* Datos de la factura */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">N° de factura</label>
              <input name="numeroFactura" value={form.numeroFactura} onChange={handleChange}
                placeholder="Ej. F001-00123" required className={`w-full ${INP}`} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Fecha de vencimiento</label>
              <input type="date" name="fechaVencimiento" value={form.fechaVencimiento}
                onChange={handleChange} required className={`w-full ${INP}`} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Monto de la factura</label>
              <input type="number" name="monto" value={form.monto} onChange={handleChange}
                step="0.01" min="0" placeholder="0.00" required className={`w-full ${INP}`} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">N° de orden de compra</label>
              <input disabled name="numeroOrdenCompra" value={form.numeroOrdenCompra} onChange={handleChange}
                placeholder="—" required className={`w-full ${INP}`} />
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

          <div className="border border-gray-100 bg-gray-50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={aCredito} onChange={(e) => setACredito(e.target.checked)} />
              Pago a crédito (varias cuotas)
            </label>
            {aCredito && (
              <div className="space-y-2">
                {cuotas.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6">#{c.numero}</span>
                    <input type="number" min="0" step="0.01" placeholder="Monto"
                      value={c.monto} onChange={(e) => actualizarCuota(i, "monto", e.target.value)}
                      className={`${INP} flex-1`} />
                    <input type="date" value={c.fechaVencimiento}
                      onChange={(e) => actualizarCuota(i, "fechaVencimiento", e.target.value)}
                      className={`${INP} flex-1`} />
                    {cuotas.length > 1 && (
                      <button type="button" onClick={() => quitarCuota(i)}
                        className="text-gray-400 hover:text-red-600 text-lg leading-none px-1">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={agregarCuota}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  + Agregar cuota
                </button>
              </div>
            )}
          </div>

          {exito && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              Factura <strong>{exito}</strong> creada exitosamente.
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end shrink-0">
          <button type="button" onClick={onClose}
            className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="button" onClick={() => validar() && setPreguntandoRetencion(true)} disabled={guardando || !!exito}
            className="text-sm bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-medium">
            {guardando ? "Guardando…" : exito ? "Creada" : "Crear factura"}
          </button>
        </div>
      </div>

      {preguntandoRetencion && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h4 className="font-semibold text-gray-800 mb-2">¿Esta operación está gravada con retención?</h4>
            <p className="text-sm text-gray-500 mb-5">
              Cotización tipo <span className="font-medium capitalize">{cotizacion.tipo}</span> — si respondes
              "Sí" se descontará el <strong>{porcentaje}%</strong> del monto de la factura.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => guardar(false)} disabled={guardando}
                className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition">
                No
              </button>
              <button onClick={() => guardar(true)} disabled={guardando}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                Sí, gravada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
