import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuth, getUsuario } from "../utils/fetchAuth";
import ModalInforme from "./ModalInforme";
import TablaServiciosExternos from "./TablaServiciosExternos";
import TablaRequerimientos from "./TablaRequerimientos";
import ModalRequerimiento from "./ModalRequerimiento";
import ModalDetalleGuia from "./ModalDetalleGuia";
import {
  FlujoNegocio, TarjetaRelacion, Chip, badgePago, money, estadoComprobanteClase,
} from "./detalleShared";

const RO = "bg-surface-alt border border-line rounded px-2 py-1.5 text-sm text-ink-soft w-full";
const PRIORIDADES = ["alta", "media", "baja"];
const ESTADOS = ["pendiente", "en progreso", "completado", "entregado"];
const codigoDeGuia = (g) => `${g.serie}-${String(g.correlativo).padStart(4, "0")}`;

const colorPrioridad = (p, activa) => {
  if (!activa) return "bg-surface-hover text-ink-muted hover:bg-surface-alt";
  if (p === "alta") return "bg-red-500 text-white";
  if (p === "media") return "bg-amber-400 text-white";
  return "bg-green-500 text-white";
};
const colorEstado = (e, activo) => {
  if (!activo) return "bg-surface-hover text-ink-muted hover:bg-surface-alt";
  if (e === "entregado")   return "bg-teal-600 text-white";
  if (e === "completado")  return "bg-green-600 text-white";
  if (e === "en progreso") return "bg-blue-600 text-white";
  return "bg-amber-500 text-white";
};

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
        {ie.descripcionProblema && (
          <div className="col-span-2">
            <label className="text-xs text-ink-muted block mb-1">Descripción del problema</label>
            <textarea value={ie.descripcionProblema} disabled rows={2} className={`${RO} resize-none`} />
          </div>
        )}
      </div>
    </div>
  );
}

// Reemplaza a ModalVerOT/ModalEditarOT cuando se navega desde el panel de
// Relaciones de otro documento — mismo patrón de pantalla completa que
// DetalleCotizacion/DetalleOrdenCompra/DetalleFactura (ver DetalleDocumento.jsx).
// No incluye la jerarquía de sub-OT (ordenPadre/sufijo/estadoPrueba) — sigue
// pendiente igual que antes de esta fase (ver plan maestro, Fase 5 frontend).
export default function DetalleOrdenTrabajo({ orden: inicial, onClose, onActualizada, onNavegar }) {
  const navigate = useNavigate();
  const [ot, setOt] = useState(inicial);
  const [form, setForm] = useState({
    titulo: inicial.titulo || "",
    descripcion: inicial.descripcion || "",
    prioridad: inicial.prioridad || "media",
    estado: inicial.estado || "pendiente",
    fechaEntrega: inicial.fechaEntrega ? new Date(inicial.fechaEntrega).toISOString().split("T")[0] : "",
    personalAsignado: inicial.personalAsignado?._id || "",
  });
  const [personal, setPersonal]       = useState([]);
  const [servicios, setServicios]     = useState([]);
  const [requerimientos, setReq]      = useState([]);
  const [materiales, setMateriales]   = useState([]);
  const [oc, setOc]                   = useState(null);
  const [factura, setFactura]         = useState(null);
  const [informes, setInformes]       = useState([]);
  const [gres, setGres]               = useState([]);
  const [guiaDetalle, setGuiaDetalle] = useState(null);
  const [verInforme, setVerInforme]   = useState(false);
  const [crearRequerimiento, setCrearRequerimiento] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState("");

  const rolUsuario = getUsuario()?.rol;
  const puedeVerServicios = rolUsuario !== "tecnico";
  const puedeAtenderRQ    = rolUsuario === "admin" || rolUsuario === "almacenero";
  const puedeEmitirGRE    = ["admin", "vendedor", "almacenero"].includes(rolUsuario);

  const empresa = ot.empresa;
  const cotId = ot.cotizacion?._id || ot.cotizacion;

  const cargarServicios = () => {
    if (!puedeVerServicios) return;
    fetchAuth(`/servicios-externos?ordenTrabajo=${ot._id}`).then((r) => r.ok && r.json()).then((d) => d && setServicios(d));
  };
  const cargarRequerimientos = () => {
    fetchAuth(`/requerimientos?ordenTrabajo=${ot._id}`).then((r) => r.ok && r.json()).then((d) => d && setReq(d));
  };
  const cargarInformes = () => {
    fetchAuth(`/informes?ordenTrabajo=${ot._id}`).then((r) => r.ok ? r.json() : []).then(setInformes);
  };
  const cargarGres = () => {
    if (!puedeEmitirGRE) return;
    fetchAuth(`/guias?ordenesTrabajo=${ot._id}&limit=1000`)
      .then((r) => r.ok && r.json())
      .then((data) => data?.ok && setGres(data.data));
  };

  useEffect(() => {
    fetchAuth("/personal/lista").then((r) => r.ok && r.json()).then((p) => p && setPersonal(p));
    cargarServicios();
    cargarRequerimientos();
    cargarInformes();
    cargarGres();
    if (cotId) {
      Promise.all([
        fetchAuth("/ordenes-compra").then((r) => r.ok ? r.json() : []),
        fetchAuth("/facturas").then((r) => r.ok ? r.json() : []),
      ]).then(([ocs, facts]) => {
        setOc(ocs.find((o) => (o.cotizacion?._id || o.cotizacion) === cotId) || null);
        setFactura(facts.find((f) => (f.cotizacion?._id || f.cotizacion) === cotId) || null);
      });
    } else {
      setOc(null);
      setFactura(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ot._id]);

  useEffect(() => {
    if (!puedeAtenderRQ) return;
    fetchAuth("/materiales").then((r) => r.ok && r.json()).then((d) => d && setMateriales(d));
  }, [puedeAtenderRQ]);

  const irACotizacion = async () => {
    if (!cotId || !onNavegar) return;
    const res = await fetchAuth("/cotizaciones");
    if (res.ok) {
      const cots = await res.json();
      const encontrada = cots.find((c) => c._id === cotId);
      if (encontrada) onNavegar({ tipo: "cotizacion", data: encontrada });
    }
  };

  const generarGRE = () => {
    navigate("/guias/emitir", {
      state: {
        prellenarGRE: {
          items: [{ descripcion: ot.titulo, cantidad: 1, unidad: "NIU" }],
          destinatario: empresa
            ? { schemeID: "6", numDoc: empresa.ruc || "", nombre: empresa.razonSocial || "" }
            : undefined,
          ordenesTrabajo: [ot._id],
        },
      },
    });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async () => {
    if (!form.titulo.trim()) { setError("El título es obligatorio."); return; }
    setGuardando(true);
    setError("");
    const body = { ...form };
    if (!body.personalAsignado) delete body.personalAsignado;
    if (!body.fechaEntrega) delete body.fechaEntrega;
    const res = await fetchAuth(`/ordenes-trabajo/${ot._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const actualizada = await res.json();
      onActualizada?.(actualizada);
      setGuardando(false);
      onClose();
      return;
    } else {
      setError("No se pudo guardar los cambios.");
    }
    setGuardando(false);
  };

  const pasos = [
    { tipo: "cotizacion", activo: !!ot.cotizacion,      codigo: ot.cotizacion?.codigo },
    { tipo: "ot",         activo: true,                 codigo: ot.codigo },
    { tipo: "informe",    activo: informes.length > 0,  codigo: informes.length ? `${informes.length} av.` : "" },
    { tipo: "oc",         activo: !!oc,                 codigo: oc?.codigo },
    { tipo: "factura",    activo: !!factura,            codigo: factura?.codigo },
  ];

  const ultimoInforme = informes[informes.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-app-bg flex flex-col">
      {/* Header degradado */}
      <div className="shrink-0 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-8 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={onClose}
              className="text-sm text-white/80 hover:text-white transition flex items-center gap-1.5 group shrink-0">
              <span className="group-hover:-translate-x-0.5 transition">←</span> Órdenes de Trabajo
            </button>
            <span className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Orden de Trabajo</p>
              <h1 className="text-lg font-bold font-mono leading-tight">{ot.codigo}</h1>
              <p className="text-xs font-normal text-white/60 leading-tight">
                {ot.numeroDocumento != null && `Doc. N° ${ot.numeroDocumento}`}
              </p>
              {empresa && <p className="text-xs text-white/80 leading-tight">{empresa.alias} — {empresa.razonSocial}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={guardar} disabled={guardando}
              className="bg-white text-indigo-700 text-sm px-5 py-2 rounded-lg hover:bg-indigo-50 disabled:opacity-60 transition font-semibold shadow-sm shrink-0">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
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
              <span className="w-1.5 h-5 rounded-full bg-indigo-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Datos de la orden de trabajo</h2>
            </div>

            <PanelIngresoEquipo ie={ot.ingresoEquipo} />

            {empresa && (
              <div className="bg-surface-alt rounded-xl p-4 grid grid-cols-2 gap-3">
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

            <div className="space-y-5">
              <div>
                <label className="label">Título</label>
                <input name="titulo" value={form.titulo} onChange={handleChange} className="input-field w-full" />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className="input-field w-full resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-2">Prioridad</label>
                  <div className="flex gap-1.5">
                    {PRIORIDADES.map((p) => (
                      <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, prioridad: p }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition ${colorPrioridad(p, form.prioridad === p)}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Fecha de entrega</label>
                  <input type="date" name="fechaEntrega" value={form.fechaEntrega} onChange={handleChange} className="input-field w-full" />
                </div>
              </div>

              <div>
                <label className="label mb-2">Estado</label>
                <div className="flex gap-1.5">
                  {ESTADOS.map((e) => (
                    <button key={e} type="button" onClick={() => setForm((f) => ({ ...f, estado: e }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition whitespace-nowrap ${colorEstado(e, form.estado === e)}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Personal asignado</label>
                <select name="personalAsignado" value={form.personalAsignado} onChange={handleChange} className="input-field w-full">
                  <option value="">Sin asignar</option>
                  {personal.map((p) => (
                    <option key={p._id} value={p._id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            {puedeVerServicios && (
              <TablaServiciosExternos ot={ot} servicios={servicios} puedeEditar onCambio={cargarServicios} />
            )}

            <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Requerimientos de Material ({requerimientos.length})
                </p>
                <button type="button" onClick={() => setCrearRequerimiento(true)}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium">
                  + Nuevo requerimiento
                </button>
              </div>
              <TablaRequerimientos
                requerimientos={requerimientos}
                materiales={materiales}
                puedeAtender={puedeAtenderRQ}
                onCambio={cargarRequerimientos}
              />
            </div>
          </div>

          {/* Relaciones */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-sky-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Relaciones</h2>
            </div>

            <TarjetaRelacion tipo="cotizacion" codigo={ot.cotizacion?.codigo} numero={ot.cotizacion?.numeroCotizacion} vacio={!ot.cotizacion}
              onClick={ot.cotizacion && onNavegar ? irACotizacion : undefined} />

            <TarjetaRelacion tipo="ot" codigo={ot.codigo} actual>
              <p className="text-sm text-ink-soft line-clamp-2">{ot.titulo}</p>
            </TarjetaRelacion>

            <TarjetaRelacion
              tipo="informe"
              codigo={informes.length ? `${informes.length} avance${informes.length !== 1 ? "s" : ""}` : null}
              vacio={informes.length === 0}
              onClick={informes.length > 0 ? () => setVerInforme(true) : undefined}
              onCrear={informes.length === 0 ? () => setVerInforme(true) : undefined} crearLabel="informe">
              {ultimoInforme?.fechaHoraGuardado && (
                <p className="text-xs text-ink-soft">
                  Último: {new Date(ultimoInforme.fechaHoraGuardado).toLocaleDateString("es-PE")}
                </p>
              )}
            </TarjetaRelacion>

            {puedeEmitirGRE && (gres.length === 0 ? (
              <TarjetaRelacion tipo="gre" vacio
                onCrear={generarGRE} crearLabel="GRE" />
            ) : (
              <TarjetaRelacion tipo="gre"
                codigo={gres.length === 1 ? codigoDeGuia(gres[0]) : `${gres.length} guías`}
                onClick={gres.length === 1 ? () => setGuiaDetalle(gres[0]) : undefined}>
                {gres.length === 1 ? (
                  <Chip className={estadoComprobanteClase(gres[0].estado)}>{gres[0].estado}</Chip>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {gres.map((g) => (
                      <button key={g._id} type="button"
                        onClick={(e) => { e.stopPropagation(); setGuiaDetalle(g); }}
                        className="font-mono text-xs text-purple-700 bg-surface rounded-lg px-2 py-0.5 shadow-sm hover:underline">
                        {codigoDeGuia(g)}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); generarGRE(); }}
                  className="text-xs text-accent hover:text-accent-strong underline mt-0.5">
                  + Crear otra GRE
                </button>
              </TarjetaRelacion>
            ))}

            <TarjetaRelacion tipo="oc" codigo={oc?.codigo} vacio={!oc}
              onClick={oc && onNavegar ? () => onNavegar({ tipo: "oc", data: oc }) : undefined}>
              {oc?.monto > 0 && <p className="text-xs text-ink-soft">{money(oc.monto)}</p>}
            </TarjetaRelacion>

            <TarjetaRelacion tipo="factura" codigo={factura?.codigo} numero={factura?.numeroFactura} vacio={!factura}
              onClick={factura && onNavegar ? () => onNavegar({ tipo: "factura", data: factura }) : undefined}>
              {factura?.totalAPagar > 0 && <p className="text-xs text-ink-soft">{money(factura.totalAPagar)}</p>}
              {factura?.estadoPago && <Chip className={badgePago(factura.estadoPago)}>{factura.estadoPago}</Chip>}
            </TarjetaRelacion>
          </section>
        </div>
      </div>

      {crearRequerimiento && (
        <ModalRequerimiento
          ot={ot}
          onClose={() => setCrearRequerimiento(false)}
          onCreado={() => { setCrearRequerimiento(false); cargarRequerimientos(); }}
        />
      )}

      {verInforme && (
        <ModalInforme
          ordenTrabajo={ot}
          onClose={() => setVerInforme(false)}
          onGuardado={(informe) => {
            cargarInformes();
            if (informe.avanceOT) {
              const actualizada = { ...ot, estado: informe.avanceOT };
              setOt(actualizada);
              setForm((f) => ({ ...f, estado: informe.avanceOT }));
              onActualizada?.(actualizada);
            }
          }}
        />
      )}

      {guiaDetalle && (
        <ModalDetalleGuia guia={guiaDetalle} onClose={() => setGuiaDetalle(null)} onActualizada={cargarGres} />
      )}
    </div>
  );
}
