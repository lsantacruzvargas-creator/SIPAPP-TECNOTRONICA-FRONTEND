import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import ModalFactura from "./ModalFactura";
import {
  FlujoNegocio, TarjetaRelacion, Chip, badgeOT, badgePago, money,
  BotonAnular, BannerAnulado,
} from "./detalleShared";

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

// Reemplaza a ModalEditarOrdenCompra cuando se navega desde el panel de
// Relaciones de otro documento — mismo patrón de pantalla completa que
// DetalleCotizacion/DetalleOrdenTrabajo/DetalleFactura (ver DetalleDocumento.jsx).
export default function DetalleOrdenCompra({ orden: inicial, onClose, onGuardada, onNavegar }) {
  const [orden, setOrden] = useState(inicial);
  const [form, setForm] = useState({
    numeroOrden: inicial.numeroOrden || "",
    monto:       inicial.monto ?? 0,
  });
  const [ots, setOts]                             = useState([]);
  const [informes, setInformes]                   = useState([]);
  const [factura, setFactura]                     = useState(null);
  const [ie, setIe]                               = useState(null);
  const [crearFactura, setCrearFactura]           = useState(false);
  const [guardando, setGuardando]                 = useState(false);
  const [guardandoConfirmacion, setGuardandoConfirmacion] = useState("");
  const [error, setError]                         = useState("");

  const cotId = orden.cotizacion?._id || orden.cotizacion;
  const empresa = orden.empresa;

  const cargarRelaciones = () => {
    if (!cotId) { setOts([]); setInformes([]); setFactura(null); setIe(null); return; }
    Promise.all([
      fetchAuth("/ordenes-trabajo").then((r) => r.ok ? r.json() : []),
      fetchAuth("/facturas").then((r) => r.ok ? r.json() : []),
    ]).then(([otsData, facts]) => {
      const otsFound = otsData.filter((o) => (o.cotizacion?._id || o.cotizacion) === cotId);
      setOts(otsFound);
      setIe(otsFound.find((o) => o.ingresoEquipo)?.ingresoEquipo || null);
      setFactura(facts.find((f) => (f.ordenCompra?._id || f.ordenCompra) === orden._id) || null);
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
  }, [orden._id]);

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

  const toggleConfirmacion = async (campo) => {
    setGuardandoConfirmacion(campo);
    const res = await fetchAuth(`/ordenes-compra/${orden._id}/confirmaciones`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: !orden[campo] }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setOrden(actualizada);
      onGuardada?.(actualizada);
    }
    setGuardandoConfirmacion("");
  };

  const toggleAnular = async () => {
    const res = await fetchAuth(`/ordenes-compra/${orden._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anulada: !orden.anulada }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setOrden(actualizada);
      onGuardada?.(actualizada);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    const res = await fetchAuth(`/ordenes-compra/${orden._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numeroOrden: form.numeroOrden, monto: Number(form.monto) }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      onGuardada?.(actualizada);
      setGuardando(false);
      onClose();
      return;
    } else {
      setError("Error al guardar los cambios.");
    }
    setGuardando(false);
  };

  const cotizacionParaFactura = { ...orden.cotizacion, empresa: orden.empresa };

  const pasos = [
    { tipo: "cotizacion", activo: !!orden.cotizacion, codigo: orden.cotizacion?.codigo },
    { tipo: "ot",         activo: ots.length > 0,      codigo: ots.length > 1 ? `${ots.length} OTs` : ots[0]?.codigo },
    { tipo: "informe",    activo: informes.length > 0, codigo: informes.length ? `${informes.length} av.` : "" },
    { tipo: "oc",         activo: true,                codigo: orden.codigo },
    { tipo: "factura",    activo: !!factura,           codigo: factura?.codigo },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-app-bg flex flex-col">
      {/* Header degradado */}
      <div className="shrink-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-8 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={onClose}
              className="text-sm text-white/80 hover:text-white transition flex items-center gap-1.5 group shrink-0">
              <span className="group-hover:-translate-x-0.5 transition">←</span> Órdenes de Compra
            </button>
            <span className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Orden de Compra</p>
              <h1 className="text-lg font-bold font-mono leading-tight">{orden.codigo}</h1>
              <p className="text-xs font-normal text-white/60 leading-tight">
                {orden.numeroDocumento != null && `Doc. N° ${orden.numeroDocumento}`}
              </p>
              {empresa && <p className="text-xs text-white/80 leading-tight">{empresa.alias} — {empresa.razonSocial}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-white/60 uppercase tracking-widest leading-none">Monto</p>
              <p className="text-lg font-bold leading-tight">{money(orden.monto)}</p>
            </div>
            <BotonAnular anulada={orden.anulada} onToggle={toggleAnular} light />
            {!orden.anulada && (
              <button onClick={() => setCrearFactura(true)}
                className="bg-white/10 border border-white/30 text-white text-sm px-4 py-2 rounded-lg hover:bg-white/20 transition font-medium shrink-0">
                Crear factura
              </button>
            )}
            {!orden.anulada && (
              <button onClick={guardar} disabled={guardando}
                className="bg-white text-blue-700 text-sm px-5 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-60 transition font-semibold shadow-sm shrink-0">
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
              <span className="w-1.5 h-5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Datos de la orden de compra</h2>
            </div>

            {orden.anulada && <BannerAnulado fecha={orden.fechaAnulacion} />}

            <PanelIngresoEquipo ie={ie} />

            <div className="bg-surface-alt rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Datos de la cotización</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Código cotización</label>
                  <input value={orden.cotizacion?.codigo || "—"} disabled className={RO} />
                </div>
                <div>
                  <label className="text-xs text-ink-muted block mb-1">Tipo</label>
                  <input value={orden.cotizacion?.tipo || "—"} disabled className={`${RO} capitalize`} />
                </div>
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">Título</label>
                <input value={orden.titulo} disabled className={RO} />
              </div>
              {empresa && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">Empresa</label>
                    <input value={empresa.razonSocial} disabled className={RO} />
                  </div>
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">RUC</label>
                    <input value={empresa.ruc || "—"} disabled className={RO} />
                  </div>
                </div>
              )}
            </div>

            <fieldset disabled={orden.anulada} className="space-y-5">
              <div>
                <label className="label">Número de orden de compra</label>
                <input name="numeroOrden" value={form.numeroOrden} onChange={handleChange}
                  placeholder="Ej. OC-2024-001" className="input-field w-full" />
              </div>
              <div>
                <label className="label">Monto (S/)</label>
                <input type="number" name="monto" value={form.monto} onChange={handleChange}
                  min="0" step="0.01" className="input-field w-full text-lg font-semibold" />
              </div>

              {(empresa?.requiereHes || empresa?.requiereActaConformidad) && (
                <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Confirmaciones</p>
                  {empresa?.requiereHes && (
                    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!orden.hesConfirmado}
                        disabled={guardandoConfirmacion === "hesConfirmado" || orden.anulada}
                        onChange={() => toggleConfirmacion("hesConfirmado")}
                      />
                      HES confirmado
                      {orden.hesConfirmado && (
                        <span className="text-xs text-ink-muted">
                          — {orden.hesConfirmadoPor} · {orden.hesConfirmadoFecha && new Date(orden.hesConfirmadoFecha).toLocaleDateString("es-PE")}
                        </span>
                      )}
                    </label>
                  )}
                  {empresa?.requiereActaConformidad && (
                    <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!orden.actaConformidadConfirmada}
                        disabled={guardandoConfirmacion === "actaConformidadConfirmada" || orden.anulada}
                        onChange={() => toggleConfirmacion("actaConformidadConfirmada")}
                      />
                      Acta de Conformidad confirmada
                      {orden.actaConformidadConfirmada && (
                        <span className="text-xs text-ink-muted">
                          — {orden.actaConformidadConfirmadaPor} · {orden.actaConformidadConfirmadaFecha && new Date(orden.actaConformidadConfirmadaFecha).toLocaleDateString("es-PE")}
                        </span>
                      )}
                    </label>
                  )}
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}
            </fieldset>
          </div>

          {/* Relaciones */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-sky-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Relaciones</h2>
            </div>

            <TarjetaRelacion tipo="cotizacion" codigo={orden.cotizacion?.codigo} numero={orden.cotizacion?.numeroCotizacion} vacio={!orden.cotizacion}
              onClick={orden.cotizacion && onNavegar ? irACotizacion : undefined} />

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

            <TarjetaRelacion tipo="oc" codigo={orden.codigo} actual>
              <p className="text-sm text-ink-soft line-clamp-2">{orden.titulo}</p>
            </TarjetaRelacion>

            <TarjetaRelacion tipo="factura" codigo={factura?.codigo} numero={factura?.numeroFactura} vacio={!factura}
              onClick={factura && onNavegar ? () => onNavegar({ tipo: "factura", data: factura }) : undefined}
              onCrear={!factura && !orden.anulada ? () => setCrearFactura(true) : undefined} crearLabel="factura">
              {factura?.totalAPagar > 0 && <p className="text-xs text-ink-soft">{money(factura.totalAPagar)}</p>}
              {factura?.estadoPago && <Chip className={badgePago(factura.estadoPago)}>{factura.estadoPago}</Chip>}
            </TarjetaRelacion>
          </section>
        </div>
      </div>

      {crearFactura && (
        <ModalFactura
          cotizacion={cotizacionParaFactura}
          ordenCompra={orden}
          numeroOrdenCompra={form.numeroOrden}
          onClose={() => setCrearFactura(false)}
          onCreada={(nueva) => { setCrearFactura(false); setFactura(nueva); }}
        />
      )}
    </div>
  );
}
