import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuth } from "../utils/fetchAuth";
import {
  FlujoNegocio, TarjetaRelacion, Chip, badgeOT, badgePago, money,
  BotonAnular, BannerAnulado, estadoComprobanteClase,
} from "./detalleShared";

const fechaInput = (v) => (v ? new Date(v).toISOString().split("T")[0] : "");
const RO = "bg-surface-alt border border-line rounded px-2 py-1.5 text-sm text-ink-soft w-full";

function PanelIngresoEquipo({ ie }) {
  if (!ie) return null;
  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
        Ingreso de equipo · <span className="font-mono">{ie.codigo}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-ink-muted block mb-1">Tipo de equipo</label>
          <input value={ie.tipoEquipo || "—"} disabled className={RO} />
        </div>
        <div>
          <label className="text-xs text-ink-muted block mb-1">Marca / Modelo</label>
          <input value={[ie.marca, ie.modelo].filter(Boolean).join(" / ") || "—"} disabled className={RO} />
        </div>
      </div>
    </div>
  );
}

// Reemplaza a ModalEditarFactura cuando se navega desde el panel de Relaciones
// de otro documento — mismo patrón de pantalla completa que
// DetalleCotizacion/DetalleOrdenTrabajo/DetalleOrdenCompra (ver DetalleDocumento.jsx).
export default function DetalleFactura({ factura: inicial, onClose, onGuardada, onNavegar }) {
  const navigate = useNavigate();
  const [factura, setFactura] = useState(inicial);
  const [form, setForm] = useState({
    numeroFactura:      inicial.numeroFactura      || "",
    fechaVencimiento:   fechaInput(inicial.fechaVencimiento),
    monto:              inicial.monto != null ? String(inicial.monto) : "",
    numeroOrdenCompra:  inicial.numeroOrdenCompra  || "",
    numeroGuiaEmision:  inicial.numeroGuiaEmision  || "",
    numeroGuiaRemision: inicial.numeroGuiaRemision || "",
  });
  const [ots, setOts]                     = useState([]);
  const [informes, setInformes]           = useState([]);
  const [oc, setOc]                       = useState(null);
  const [ie, setIe]                       = useState(null);
  const [guardando, setGuardando]         = useState(false);
  const [guardandoCuota, setGuardandoCuota] = useState("");
  const [error, setError]                 = useState("");

  const cotId = factura.cotizacion?._id || factura.cotizacion;
  const empresa    = factura.empresa;
  const cotizacion = factura.cotizacion;

  const cargarRelaciones = () => {
    if (!cotId) { setOts([]); setInformes([]); setOc(null); setIe(null); return; }
    Promise.all([
      fetchAuth("/ordenes-trabajo").then((r) => r.ok ? r.json() : []),
      fetchAuth("/ordenes-compra").then((r) => r.ok ? r.json() : []),
    ]).then(([otsData, ocs]) => {
      const otsFound = otsData.filter((o) => (o.cotizacion?._id || o.cotizacion) === cotId);
      setOts(otsFound);
      setOc(ocs.find((o) => (o.cotizacion?._id || o.cotizacion) === cotId) || null);
      setIe(otsFound.find((o) => o.ingresoEquipo)?.ingresoEquipo || null);
      if (otsFound.length > 0) {
        Promise.all(
          otsFound.map((o) => fetchAuth(`/informes?ordenTrabajo=${o._id}`).then((r) => r.ok ? r.json() : []))
        ).then((listas) => setInformes(listas.flat()));
      } else {
        setInformes([]);
      }
    });
  };

  useEffect(() => {
    cargarRelaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factura._id]);

  const irACotizacion = async () => {
    if (!cotId || !onNavegar) return;
    const res = await fetchAuth("/cotizaciones");
    if (res.ok) {
      const cots = await res.json();
      const encontrada = cots.find((c) => c._id === cotId);
      if (encontrada) onNavegar({ tipo: "cotizacion", data: encontrada });
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async () => {
    setError("");
    setGuardando(true);
    const payload = { ...form };
    if (!payload.fechaVencimiento) delete payload.fechaVencimiento;
    const res = await fetchAuth(`/facturas/${factura._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const actualizada = await res.json();
      onGuardada?.(actualizada);
      setGuardando(false);
      onClose();
      return;
    } else {
      setError("No se pudo guardar los cambios.");
    }
    setGuardando(false);
  };

  const toggleAnular = async () => {
    const res = await fetchAuth(`/facturas/${factura._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anulada: !factura.anulada }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setFactura(actualizada);
      onGuardada?.(actualizada);
    }
  };

  const marcarCuota = async (cuotaId, pagado) => {
    setGuardandoCuota(cuotaId);
    const res = await fetchAuth(`/facturas/${factura._id}/cuotas/${cuotaId}/pagar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagado }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setFactura(actualizada);
      onGuardada?.(actualizada);
    } else {
      setError((await res.json())?.mensaje || "No se pudo actualizar la cuota.");
    }
    setGuardandoCuota("");
  };

  const emitirComprobante = () => {
    navigate("/comprobantes/emitir", {
      state: { prellenarDesdeFactura: { factura, cotizacion, empresa } },
    });
  };

  const pasos = [
    { tipo: "cotizacion",  activo: !!factura.cotizacion, codigo: factura.cotizacion?.codigo },
    { tipo: "ot",          activo: ots.length > 0,       codigo: ots.length > 1 ? `${ots.length} OTs` : ots[0]?.codigo },
    { tipo: "informe",     activo: informes.length > 0,  codigo: informes.length ? `${informes.length} av.` : "" },
    { tipo: "oc",          activo: !!oc,                 codigo: oc?.codigo },
    { tipo: "factura",     activo: true,                 codigo: factura.codigo },
    { tipo: "comprobante", activo: !!factura.comprobanteEmitido, codigo: factura.comprobante?.serie ? `${factura.comprobante.serie}-${factura.comprobante.correlativo}` : "" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-app-bg flex flex-col">
      {/* Header degradado */}
      <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
        <div className="max-w-6xl mx-auto px-8 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={onClose}
              className="text-sm text-white/80 hover:text-white transition flex items-center gap-1.5 group shrink-0">
              <span className="group-hover:-translate-x-0.5 transition">←</span> Facturas
            </button>
            <span className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Factura</p>
              <h1 className="text-lg font-bold font-mono leading-tight">{form.numeroFactura || factura.codigo}</h1>
              <p className="text-xs font-normal text-white/60 leading-tight">
                {factura.codigo}{factura.numeroDocumento != null && ` · Doc. N° ${factura.numeroDocumento}`}
              </p>
              {empresa && <p className="text-xs text-white/80 leading-tight">{empresa.alias} — {empresa.razonSocial}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase tracking-widest leading-none">Total a pagar</p>
              <p className="text-lg font-bold leading-tight">{money(factura.totalAPagar)}</p>
              {factura.estadoPago && <Chip className="mt-0.5 bg-white/20 text-white">{factura.estadoPago}</Chip>}
            </div>
            <BotonAnular anulada={factura.anulada} onToggle={toggleAnular} light />
            {!factura.anulada && (
              <button onClick={guardar} disabled={guardando}
                className="bg-white text-emerald-700 text-sm px-5 py-2 rounded-lg hover:bg-emerald-50 disabled:opacity-60 transition font-semibold shadow-sm shrink-0">
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stepper de flujo */}
      <div className="shrink-0 bg-surface border-b border-line shadow-sm">
        <div className="max-w-4xl mx-auto px-8 py-5">
          <FlujoNegocio pasos={pasos} />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Datos editables */}
          <div className="lg:col-span-2 bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-5 self-start">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Datos de la factura</h2>
            </div>

            {factura.anulada && <BannerAnulado fecha={factura.fechaAnulacion} />}

            <PanelIngresoEquipo ie={ie} />

            <div className="bg-surface-alt rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Datos de la cotización</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Código cotización</label>
                  <input value={cotizacion?.codigo || "—"} disabled className={RO} />
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Tipo</label>
                  <input value={cotizacion?.tipo || "—"} disabled className={`${RO} capitalize`} />
                </div>
              </div>
              {empresa && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">Empresa</label>
                    <input value={`${empresa.alias} — ${empresa.razonSocial}`} disabled className={RO} />
                  </div>
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">RUC</label>
                    <input value={empresa.ruc || "—"} disabled className={RO} />
                  </div>
                </div>
              )}
            </div>

            <fieldset disabled={factura.anulada} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">N° de factura</label>
                  <input name="numeroFactura" value={form.numeroFactura} onChange={handleChange}
                    placeholder="Ej. F001-00123" className="input-field w-full" />
                </div>
                <div>
                  <label className="label">Fecha de vencimiento</label>
                  <input type="date" name="fechaVencimiento" value={form.fechaVencimiento} onChange={handleChange} className="input-field w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">N° de orden de compra</label>
                  <input name="numeroOrdenCompra" value={form.numeroOrdenCompra} onChange={handleChange}
                    placeholder="—" className="input-field w-full" />
                </div>
                <div>
                  <label className="label">Monto de la factura</label>
                  <input type="number" name="monto" value={form.monto} onChange={handleChange}
                    step="0.01" min="0" placeholder="0.00" className="input-field w-full text-lg font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">N° guía de emisión</label>
                  <input name="numeroGuiaEmision" value={form.numeroGuiaEmision} onChange={handleChange}
                    placeholder="—" className="input-field w-full" />
                </div>
                <div>
                  <label className="label">N° guía de remisión</label>
                  <input name="numeroGuiaRemision" value={form.numeroGuiaRemision} onChange={handleChange}
                    placeholder="—" className="input-field w-full" />
                </div>
              </div>

              {/* Cálculos — el backend los recalcula solo cuando cambia `monto` (a partir de
                  gravadoRetencion/porcentajeRetencion, fijos desde la creación de la factura) */}
              <div className="rounded-xl bg-surface-alt border border-line p-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-ink-muted">Detracción</p>
                    <p className="font-semibold text-ink-soft">{Number(factura.detraccion || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink-muted">Retención</p>
                    <p className="font-semibold text-ink-soft">{Number(factura.retencion || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink-muted">Total a pagar</p>
                    <p className="font-semibold text-ink-soft">{Number(factura.totalAPagar || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {factura.cuotas?.length > 0 && (
                <div className="border border-line bg-surface-alt rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Cuotas</p>
                  {factura.cuotas.map((c) => (
                    <label key={c._id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!c.pagado}
                        disabled={guardandoCuota === c._id || factura.anulada}
                        onChange={() => marcarCuota(c._id, !c.pagado)}
                      />
                      Cuota #{c.numero} — {Number(c.monto).toFixed(2)} — vence {new Date(c.fechaVencimiento).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                      {c.pagado && (
                        <span className="text-xs text-green-600">
                          Pagada {c.fechaPago && `el ${new Date(c.fechaPago).toLocaleDateString("es-PE")}`}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}
            </fieldset>
          </div>

          {/* Relaciones */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-teal-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Relaciones</h2>
            </div>

            <TarjetaRelacion tipo="cotizacion" codigo={cotizacion?.codigo} numero={cotizacion?.numeroCotizacion} vacio={!cotizacion}
              onClick={cotizacion && onNavegar ? irACotizacion : undefined} />

            {ots.length === 0 ? (
              <TarjetaRelacion tipo="ot" vacio />
            ) : (
              ots.map((o) => (
                <TarjetaRelacion key={o._id} tipo="ot" codigo={o.codigo}
                  onClick={onNavegar ? () => onNavegar({ tipo: "ot", data: o }) : undefined}>
                  {o.estado && <Chip className={badgeOT(o.estado)}>{o.estado}</Chip>}
                </TarjetaRelacion>
              ))
            )}

            <TarjetaRelacion
              tipo="informe"
              codigo={informes.length ? `${informes.length} avance${informes.length !== 1 ? "s" : ""}` : null}
              vacio={informes.length === 0} />

            <TarjetaRelacion tipo="oc" codigo={oc?.codigo} vacio={!oc}
              onClick={oc && onNavegar ? () => onNavegar({ tipo: "oc", data: oc }) : undefined}>
              {oc?.monto > 0 && <p className="text-xs text-ink-soft">{money(oc.monto)}</p>}
            </TarjetaRelacion>

            <TarjetaRelacion tipo="factura" codigo={factura.codigo} numero={factura.numeroFactura} actual>
              {factura.estadoPago && <Chip className={badgePago(factura.estadoPago)}>{factura.estadoPago}</Chip>}
            </TarjetaRelacion>

            <TarjetaRelacion
              tipo="comprobante"
              codigo={factura.comprobante ? `${factura.comprobante.serie}-${String(factura.comprobante.correlativo).padStart(4, "0")}` : null}
              vacio={!factura.comprobante}
              onCrear={!factura.comprobante && !factura.anulada ? emitirComprobante : undefined}
              crearLabel="comprobante"
            >
              {factura.comprobante?.estado && (
                <Chip className={estadoComprobanteClase(factura.comprobante.estado)}>{factura.comprobante.estado}</Chip>
              )}
            </TarjetaRelacion>
          </section>
        </div>
      </div>
    </div>
  );
}
