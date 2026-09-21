import { useState, useEffect } from "react";
import { fetchAuth, getUsuario } from "../utils/fetchAuth";
import { exportarCotizacionPdf } from "../utils/cotizacionPdf";
import { exportarCotizacionPdf as exportarCotizacionPdfPepsico } from "../utils/cotizacionPdf3";
import { exportarCotizacionVenta } from "../utils/cotizacionVenta";
import ModalOrdenCompra from "./ModalOrdenCompra";
import SelectorCatalogoServicios from "./SelectorCatalogoServicios";
import CeldasNumericas from "./CeldasNumericas";
import {
  calcSubtotal, INP,
  itemDesdeDb, itemVacioVenta, itemVacioServicio, itemVacioPepsico, GRUPOS_PEPSICO,
} from "../utils/cotizacionItems";
import {
  FlujoNegocio, TarjetaRelacion, Chip, badgeOT, badgePago, money,
} from "./detalleShared";

const RO = "bg-surface-alt border border-line rounded px-2 py-1.5 text-sm text-ink-soft w-full";

const ESTADOS_COT = [
  { valor: "pendiente aprobacion", label: "Por aprobar", cls: "bg-gray-100 text-gray-600" },
  { valor: "aprobada",             label: "Aprobada",             cls: "bg-emerald-50 text-emerald-700" },
  { valor: "en progreso",          label: "En progreso",          cls: "bg-blue-50 text-blue-700" },
  { valor: "a la espera de OC",    label: "A la espera de OC",    cls: "bg-amber-50 text-amber-700" },
  { valor: "en facturacion",       label: "En facturación",       cls: "bg-purple-50 text-purple-700" },
  { valor: "cerrada",              label: "Cerrada",              cls: "bg-teal-50 text-teal-700" },
  { valor: "sin ejecutar",         label: "Sin ejecutar",         cls: "bg-red-50 text-red-600" },
];

// Módulo-nivel: evita desmontaje/remontaje en cada render (previene pérdida de foco)
function FilaDescripcionEditable({ item, tipo, onUpdate, onAddSub, onUpdateSub, onDeleteSub, onOpenCatalogo }) {
  return (
    <td className="px-3 py-2 align-top w-[65%]">
      <textarea
        value={item.descripcion}
        onChange={(e) => onUpdate(item._key, "descripcion", e.target.value)}
        required rows={tipo === "servicio" ? 6 : 5}
        className={`w-full resize-y ${INP}`}
        placeholder="Descripción"
      />
      {tipo === "servicio" && (
        <div className="mt-1 space-y-1 pl-2">
          {item.subItems.map((sub) => (
            <div key={sub._subKey} className="flex gap-1 items-start">
              <span className="text-ink-muted text-xs mt-1.5">•</span>
              <textarea
                value={sub.texto}
                onChange={(e) => onUpdateSub(item._key, sub._subKey, e.target.value)}
                rows={3}
                className={`flex-1 resize-y ${INP} text-xs`}
                placeholder="Sub-ítem"
              />
              <button
                type="button"
                onClick={() => onDeleteSub(item._key, sub._subKey)}
                className="text-red-400 hover:text-red-600 text-xs px-1 leading-none mt-1"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3 mt-1">
            <button type="button" onClick={() => onAddSub(item._key)} className="text-xs text-ink-muted hover:text-ink-soft">
              + sub-ítem
            </button>
            <button type="button" onClick={() => onOpenCatalogo(item._key)} className="text-xs text-ink-muted hover:text-accent">
              + elegir del catálogo
            </button>
          </div>
        </div>
      )}
    </td>
  );
}

function SeccionCotizacion({ titulo, color, children }) {
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-5 rounded-full ${color}`} />
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

function PanelOT({ ot }) {
  const ie = ot.ingresoEquipo;
  const info = ie
    ? [ie.tipoEquipo, [ie.marca, ie.modelo].filter(Boolean).join("/"), ie.planta].filter(Boolean).join(" · ")
    : ot.titulo || "";
  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-lg px-4 py-2 flex items-center gap-3">
      <span className="text-xs font-semibold shrink-0 text-blue-600">OT · {ot.codigo}</span>
      {ie && <span className="text-xs font-mono text-ink-muted shrink-0">IE · {ie.codigo}</span>}
      {info && <span className="text-xs text-ink-soft truncate">{info}</span>}
      {ie?.garantia && (
        <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full shrink-0 ml-auto">
          Garantía
        </span>
      )}
    </div>
  );
}

// Reemplaza al acceso directo a ModalCotizacion cuando se navega desde el
// panel de Relaciones de otro documento — a diferencia de la versión anterior
// (resumen de solo lectura + botón "Editar" que abría ModalCotizacion), acá
// todos los campos del formulario, la tabla de ítems y el export a PDF viven
// directamente en esta vista, igual que DetalleOrdenTrabajo/DetalleOrdenCompra/
// DetalleFactura — sin un segundo paso de "ver" antes de poder editar.
export default function DetalleCotizacion({ cotizacion: inicial, onClose, onSaved, onNavegar }) {
  const [cot, setCot] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const [estadoCot, setEstadoCot] = useState(inicial.estado || "pendiente aprobacion");
  const [form, setForm] = useState({
    numeroCotizacion: inicial.numeroCotizacion || "",
    tipo: inicial.tipo,
    empresa: inicial.empresa?._id || "",
    condicionPago: inicial.condicionPago || "",
    moneda: inicial.moneda || "PEN",
    fecha: inicial.fecha ? new Date(inicial.fecha).toISOString().split("T")[0] : "",
    titulo:     inicial.titulo || "",
    referencia: inicial.referencia || inicial.titulo || "",
    atencion:   inicial.atencion || "",
    solped:     inicial.solped || "",
    modulo:     inicial.modulo || "",
    tarjeta:    inicial.tarjeta || "",
    equipo:     inicial.equipo || "",
    garantia:   inicial.garantia || "",
  });
  const [items, setItems] = useState((inicial.items || []).map(itemDesdeDb));
  const [empresas, setEmpresas] = useState([]);
  const [ie, setIe] = useState(null);
  const [otsParaVincular, setOtsParaVincular] = useState([]);
  const [otVinculadaId, setOtVinculadaId] = useState("");
  const [otOriginalId, setOtOriginalId] = useState("");
  const [otsVinculadas, setOtsVinculadas] = useState([]);
  const [aDesvincular, setADesvincular] = useState(new Set());

  const [informes, setInformes] = useState([]);
  const [oc, setOc]             = useState(null);
  const [factura, setFactura]   = useState(null);

  const [confirmarOC, setConfirmarOC] = useState(false);
  const [crearOC, setCrearOC]         = useState(false);

  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [catalogoTarget, setCatalogoTarget] = useState(null);

  const cargarOts = (otsData) => {
    if (!otsData) return;
    const vinculadas = otsData.filter((o) => (o.cotizacion?._id || o.cotizacion) === cot._id);
    setOtsVinculadas(vinculadas);
    const otConIE = vinculadas.find((o) => o.ingresoEquipo);
    setIe(otConIE?.ingresoEquipo || null);
    setOtOriginalId(otConIE?._id || "");
    setOtVinculadaId(otConIE?._id || "");

    if (vinculadas.length > 0) {
      Promise.all(
        vinculadas.map((o) => fetchAuth(`/informes?ordenTrabajo=${o._id}`).then((r) => r.ok ? r.json() : []))
      ).then((listas) => setInformes(listas.flat()));
    } else {
      setInformes([]);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchAuth("/empresas").then((r) => r.ok && r.json()),
      fetchAuth("/ordenes-trabajo").then((r) => r.ok && r.json()),
      fetchAuth("/ordenes-compra").then((r) => r.ok ? r.json() : []),
      fetchAuth("/facturas").then((r) => r.ok ? r.json() : []),
    ]).then(([emps, otsData, ocs, facts]) => {
      if (emps) setEmpresas(emps);
      if (otsData) {
        setOtsParaVincular(otsData.filter((o) => o.ingresoEquipo));
        cargarOts(otsData);
      }
      setOc(ocs.find((o) => (o.cotizacion?._id || o.cotizacion) === cot._id) || null);
      setFactura(facts.find((f) => (f.cotizacion?._id || f.cotizacion) === cot._id) || null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cot._id]);

  const toggleDesvincular = (otId) => {
    setADesvincular((prev) => {
      const next = new Set(prev);
      if (next.has(otId)) next.delete(otId); else next.add(otId);
      return next;
    });
  };

  const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const actualizarItem = (key, campo, valor) =>
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, [campo]: valor } : it)));

  const agregarSubItem = (key) =>
    setItems((prev) => prev.map((it) =>
      it._key === key ? { ...it, subItems: [...it.subItems, { _subKey: Date.now() + Math.random(), texto: "" }] } : it
    ));

  const actualizarSubItem = (key, subKey, texto) =>
    setItems((prev) => prev.map((it) =>
      it._key === key ? { ...it, subItems: it.subItems.map((s) => (s._subKey === subKey ? { ...s, texto } : s)) } : it
    ));

  const eliminarSubItem = (key, subKey) =>
    setItems((prev) => prev.map((it) =>
      it._key === key ? { ...it, subItems: it.subItems.filter((s) => s._subKey !== subKey) } : it
    ));

  const agregarItem = () => setItems((prev) => [...prev, form.tipo === "servicio" ? itemVacioServicio() : itemVacioVenta()]);
  const eliminarItem = (key) => setItems((prev) => prev.filter((it) => it._key !== key));
  const agregarItemPepsico = (grupo) => setItems((prev) => [...prev, itemVacioPepsico(grupo)]);

  const abrirCatalogo = (targetKey = null) => { setCatalogoTarget(targetKey); setCatalogoOpen(true); };
  const cerrarCatalogo = () => { setCatalogoOpen(false); setCatalogoTarget(null); };

  const agregarTextosDesdeCatalogo = (grupo, textos) => {
    const nuevosSubItems = textos.map((texto) => ({ _subKey: Date.now() + Math.random(), texto }));
    if (catalogoTarget) {
      setItems((prev) => prev.map((it) =>
        it._key === catalogoTarget ? { ...it, subItems: [...it.subItems, ...nuevosSubItems] } : it
      ));
      cerrarCatalogo();
      return;
    }
    setItems((prev) => {
      const ultimo = prev[prev.length - 1];
      if (ultimo && ultimo.descripcion === grupo) {
        return prev.map((it, i) => (i === prev.length - 1 ? { ...it, subItems: [...it.subItems, ...nuevosSubItems] } : it));
      }
      return [...prev, { ...itemVacioServicio(), descripcion: grupo, subItems: nuevosSubItems }];
    });
    cerrarCatalogo();
  };
  const agregarDesdeCatalogo = (grupo, texto) => agregarTextosDesdeCatalogo(grupo, [texto]);
  const agregarGrupoCompletoDesdeCatalogo = (grupo, textos) => agregarTextosDesdeCatalogo(grupo, textos);

  const validarItems = () => {
    if (!form.referencia?.trim()) return "La referencia es requerida.";
    for (const item of items) {
      if (!item.descripcion?.trim()) return "Todos los ítems deben tener descripción.";
      if (!item.cantidad || Number(item.cantidad) <= 0) return "La cantidad de cada ítem debe ser mayor a 0.";
      if (item.precio === "" || item.precio === null || Number(item.precio) < 0) return "El precio de cada ítem debe ser un valor válido.";
    }
    return null;
  };

  // Empresa seleccionada AHORA en el formulario (no la que tenía la cotización
  // al abrirse) — así la tabla de ítems y el PDF cambian en vivo apenas se
  // elige otra empresa, sin necesidad de guardar primero (mismo criterio que
  // empresaSel en SIPAPP-HUAQUIAN).
  const empresaSel = empresas.find((e) => e._id === form.empresa) || cot.empresa;

  const esPepsico = Boolean(
    empresaSel?.razonSocial?.toLowerCase().includes("pepsico") ||
    empresaSel?.alias?.toLowerCase().includes("pepsico")
  );

  const baseIIIgrupos = esPepsico
    ? items.filter(i => ["I","II","III"].includes(i.grupo)).reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0)
    : 0;

  const subtotalBruto = esPepsico
    ? parseFloat((baseIIIgrupos + items.filter(i => i.grupo === "IV").reduce((s, it) => s + it.cantidad / 100 * baseIIIgrupos, 0)).toFixed(2))
    : parseFloat(items.reduce((s, it) => s + calcSubtotal(it), 0).toFixed(2));

  const descuentoTotal = esPepsico
    ? 0
    : parseFloat(items.reduce((s, it) => s + calcSubtotal(it) * ((it.descuento || 0) / 100), 0).toFixed(2));

  const subtotal = parseFloat((subtotalBruto - descuentoTotal).toFixed(2));
  const igv = parseFloat((subtotal * 0.18).toFixed(2));
  const total = parseFloat((subtotal + igv).toFixed(2));

  // Compartido entre guardar() y datosParaPdf() — ambos necesitan los ítems
  // en el mismo shape "de base de datos" (grupo IV resuelto a un precio fijo,
  // subItems aplanados a texto).
  const itemsParaGuardar = () => items.map((it) => {
    const precioFinal = it.grupo === "IV" ? parseFloat((it.cantidad / 100 * baseIIIgrupos).toFixed(2)) : it.precio;
    return {
      descripcion: it.descripcion,
      subItems: (it.subItems || []).map((s) => s.texto).filter(Boolean),
      cantidad: it.cantidad,
      unidadMedida: it.unidadMedida || "UN",
      fechaEntrega: it.fechaEntrega || null,
      precio: precioFinal,
      descuento: it.descuento || 0,
      moneda: it.moneda,
      grupo: it.grupo || "I",
      subtotal: it.grupo === "IV" ? precioFinal : parseFloat((calcSubtotal(it) * (1 - (it.descuento || 0) / 100)).toFixed(2)),
    };
  });

  const guardar = async () => {
    setGuardando(true);
    setConfirmando(false);
    const payload = {
      ...form,
      items: itemsParaGuardar(),
      subtotal, igv, total,
    };
    if (!payload.empresa) delete payload.empresa;

    const res = await fetchAuth(`/cotizaciones/${cot._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const actualizada = await res.json();

      if (otVinculadaId && otVinculadaId !== otOriginalId) {
        await fetchAuth(`/ordenes-trabajo/${otVinculadaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cotizacion: cot._id }),
        });
        setOtOriginalId(otVinculadaId);
      }
      if (!otVinculadaId && otOriginalId) {
        await fetchAuth(`/ordenes-trabajo/${otOriginalId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cotizacion: "" }),
        });
        setOtOriginalId("");
      }
      if (aDesvincular.size > 0) {
        await Promise.all(
          [...aDesvincular].map((otId) =>
            fetchAuth(`/ordenes-trabajo/${otId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cotizacion: "" }),
            })
          )
        );
        const nuevas = otsVinculadas.filter((o) => !aDesvincular.has(o._id));
        setOtsVinculadas(nuevas);
        const otPrincipal = nuevas.find((o) => o.ingresoEquipo);
        setIe(otPrincipal?.ingresoEquipo || null);
        setOtOriginalId(otPrincipal?._id || "");
        setOtVinculadaId(otPrincipal?._id || "");
        setADesvincular(new Set());
      }

      onSaved?.(actualizada);
      setGuardando(false);
      onClose();
      return;
    } else {
      setError((await res.json().catch(() => null))?.mensaje || "No se pudo guardar los cambios.");
    }
    setGuardando(false);
  };

  const cambiarEstado = async (nuevoEstado) => {
    setEstadoCot(nuevoEstado);
    const res = await fetchAuth(`/cotizaciones/${cot._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado, noEjecutado: nuevoEstado === "sin ejecutar" }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setCot(actualizada);
      onSaved?.(actualizada);
    }
  };

  const rolUsuario = getUsuario()?.rol;
  const puedeAprobar = rolUsuario === "admin";

  const toggleAprobacion = async (ruta, campo, valorActual) => {
    const res = await fetchAuth(`/cotizaciones/${cot._id}/${ruta}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: !valorActual }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setCot(actualizada);
      onSaved?.(actualizada);
    }
  };

  // Refleja el formulario tal como está EN PANTALLA (empresa/tipo/ítems sin
  // guardar todavía), no el último estado guardado — mismo criterio que
  // datosParaPdf() en SIPAPP-HUAQUIAN, para que cambiar de empresa o de tipo
  // actualice el PDF sin tener que guardar primero.
  const datosParaPdf = () => ({
    ...cot,
    empresa: empresaSel,
    tipo: form.tipo,
    numeroCotizacion: form.numeroCotizacion,
    condicionPago: form.condicionPago,
    moneda: form.moneda,
    fecha: form.fecha,
    referencia: form.referencia,
    modulo: form.modulo,
    tarjeta: form.tarjeta,
    equipo: form.equipo,
    garantia: form.garantia,
    atencion: form.atencion,
    solped: form.solped,
    items: itemsParaGuardar(),
    subtotal, igv, total,
  });

  const exportarPdf = () => {
    const datos = datosParaPdf();
    if (esPepsico) exportarCotizacionPdfPepsico(datos, ie);
    else if (form.tipo === "venta") exportarCotizacionVenta(datos, ie);
    else exportarCotizacionPdf(datos, ie);
  };

  const pasos = [
    { tipo: "cotizacion", activo: true,                  codigo: cot.codigo },
    { tipo: "ot",         activo: otsVinculadas.length > 0, codigo: otsVinculadas.length > 1 ? `${otsVinculadas.length} OTs` : otsVinculadas[0]?.codigo },
    { tipo: "informe",    activo: informes.length > 0,    codigo: informes.length ? `${informes.length} av.` : "" },
    { tipo: "oc",         activo: !!oc,                   codigo: oc?.codigo },
    { tipo: "factura",    activo: !!factura,              codigo: factura?.codigo },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-app-bg flex flex-col">
      {/* Header degradado */}
      <div className="shrink-0 bg-gradient-to-r from-sky-600 to-cyan-700 text-white">
        <div className="max-w-6xl mx-auto px-8 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={onClose}
              className="text-sm text-white/80 hover:text-white transition flex items-center gap-1.5 group shrink-0">
              <span className="group-hover:-translate-x-0.5 transition">←</span> Cotizaciones
            </button>
            <span className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Cotización</p>
              <h1 className="text-lg font-bold font-mono leading-tight">{form.numeroCotizacion || cot.codigo}</h1>
              <p className="text-xs font-normal text-white/60 leading-tight">
                {cot.codigo}{cot.numeroDocumento != null && ` · Doc. N° ${cot.numeroDocumento}`}
              </p>
              {empresaSel && <p className="text-xs text-white/80 leading-tight">{empresaSel.alias} — {empresaSel.razonSocial}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={estadoCot}
              onChange={(e) => cambiarEstado(e.target.value)}
              className={`text-sm border-0 px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none transition font-medium ${
                ESTADOS_COT.find((e) => e.valor === estadoCot)?.cls || "bg-gray-100 text-gray-600"
              }`}
            >
              {ESTADOS_COT.map(({ valor, label }) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </select>
            <button onClick={exportarPdf}
              className="bg-white/10 border border-white/30 text-white text-sm px-4 py-2 rounded-lg hover:bg-white/20 transition font-medium shrink-0">
              Exportar PDF
            </button>
            <button onClick={() => {
                const err = validarItems();
                if (err) { setError(err); return; }
                setError("");
                setConfirmando(true);
              }}
              disabled={guardando}
              className="bg-white text-sky-700 text-sm px-5 py-2 rounded-lg hover:bg-sky-50 disabled:opacity-60 transition font-semibold shadow-sm shrink-0">
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* Aprobación — capa formal con auditoría, independiente del select de estado de arriba */}
        <div className="flex items-center justify-center gap-2 px-8 pb-3 flex-wrap">
          <button type="button" disabled={!puedeAprobar}
            onClick={() => toggleAprobacion("aprobar", "aprobado", cot.aprobado)}
            title={cot.aprobado ? `Aprobado por ${cot.aprobadoPor}` : "Solo un administrador puede aprobar"}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
              cot.aprobado ? "bg-white text-emerald-700" : "bg-white/20 text-white"
            } ${puedeAprobar ? "hover:opacity-80 cursor-pointer" : "cursor-not-allowed opacity-80"}`}>
            {cot.aprobado ? "✓ Aprobada" : "Sin aprobar"}
          </button>
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
        <form onSubmit={(e) => e.preventDefault()} className="max-w-6xl mx-auto px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Formulario editable — agrupado en secciones, igual que SIPAPP-HUAQUIAN */}
            <div className="lg:col-span-2 space-y-6">
              {otsVinculadas.length > 0 && (
                <div className="space-y-1.5">
                  {otsVinculadas.map((ot) => <PanelOT key={ot._id} ot={ot} />)}
                </div>
              )}

              <SeccionCotizacion titulo="Datos del cliente" color="bg-blue-500">
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Empresa</label>
                  <select name="empresa" value={form.empresa} onChange={handleForm} className={`w-full ${INP}`}>
                    <option value="">Sin empresa</option>
                    {empresas.map((e) => (
                      <option key={e._id} value={e._id}>{e.alias} — {e.razonSocial}</option>
                    ))}
                  </select>
                </div>
              </SeccionCotizacion>

              <SeccionCotizacion titulo="Detalle de cotización" color="bg-sky-500">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-ink-muted block mb-1">N° Cotización</label>
                    <input name="numeroCotizacion" value={form.numeroCotizacion} onChange={handleForm}
                      placeholder="—" className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Fecha</label>
                    <input type="date" name="fecha" value={form.fecha} onChange={handleForm} className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Tipo</label>
                    <select name="tipo" value={form.tipo} onChange={handleForm} className={`w-full ${INP}`}>
                      <option value="venta">Venta</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Moneda</label>
                    <select name="moneda" value={form.moneda || "PEN"} onChange={handleForm} className={`w-full ${INP}`}>
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Condición de pago</label>
                    <input name="condicionPago" value={form.condicionPago} onChange={handleForm} className={`w-full ${INP}`} />
                  </div>
                </div>
              </SeccionCotizacion>

              <SeccionCotizacion titulo="Otros datos" color="bg-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Atención</label>
                    <input name="atencion" value={form.atencion} onChange={handleForm} placeholder="Nombre del destinatario" className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">N° de solicitud de pedido (SOLPED)</label>
                    <input name="solped" value={form.solped} onChange={handleForm} placeholder="N° SOLPED" className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Referencia</label>
                    <input name="referencia" value={form.referencia} onChange={handleForm} className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Módulo</label>
                    <input name="modulo" value={form.modulo} onChange={handleForm} className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Tarjeta</label>
                    <input name="tarjeta" value={form.tarjeta} onChange={handleForm} className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Equipo (OT vinculada)</label>
                    <select
                      value={otVinculadaId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setOtVinculadaId(id);
                        const ot = otsParaVincular.find((o) => o._id === id);
                        setIe(ot?.ingresoEquipo || null);
                        setForm((f) => ({ ...f, equipo: ot?.ingresoEquipo?.tipoEquipo || "" }));
                      }}
                      className={`w-full ${INP}`}
                    >
                      <option value="">Sin OT vinculada</option>
                      {otsParaVincular.map((o) => (
                        <option key={o._id} value={o._id}>{o.codigo} — {o.ingresoEquipo?.tipoEquipo || o.titulo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SeccionCotizacion>

              <SeccionCotizacion titulo="Términos y condiciones" color="bg-amber-500">
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Tiempo de garantía</label>
                  <input name="garantia" value={form.garantia} onChange={handleForm} placeholder="Ej. 6 meses, 1 año…" className={`w-full ${INP}`} />
                </div>
              </SeccionCotizacion>

              {otsVinculadas.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Desvincular OT</p>
                  {otsVinculadas.map((ot) => (
                    <div key={ot._id} className={`border rounded-lg px-4 py-2 flex items-center gap-3 transition ${
                      aDesvincular.has(ot._id) ? "border-red-200 bg-red-50/30" : "border-line bg-surface-alt"
                    }`}>
                      <span className={`text-xs font-semibold shrink-0 ${aDesvincular.has(ot._id) ? "text-red-400 line-through" : "text-ink-soft"}`}>
                        OT · {ot.codigo}
                      </span>
                      <button type="button" onClick={() => toggleDesvincular(ot._id)}
                        className={`text-xs border px-2.5 py-1 rounded-lg transition shrink-0 ml-auto ${
                          aDesvincular.has(ot._id)
                            ? "border-line-strong text-ink-soft hover:bg-surface-hover"
                            : "border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50"
                        }`}>
                        {aDesvincular.has(ot._id) ? "Cancelar" : "Desvincular"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Relaciones */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-cyan-500" />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Relaciones</h2>
              </div>

              <TarjetaRelacion tipo="cotizacion" codigo={cot.codigo} numero={cot.numeroCotizacion} actual>
                <Chip className={ESTADOS_COT.find((e) => e.valor === cot.estado)?.cls || "bg-gray-100 text-gray-500"}>
                  {ESTADOS_COT.find((e) => e.valor === cot.estado)?.label || cot.estado}
                </Chip>
              </TarjetaRelacion>

              {otsVinculadas.length === 0 ? (
                <TarjetaRelacion tipo="ot" vacio />
              ) : (
                otsVinculadas.map((o) => (
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
                onClick={oc && onNavegar ? () => onNavegar({ tipo: "oc", data: oc }) : undefined}
                onCrear={!oc ? () => setConfirmarOC(true) : undefined} crearLabel="orden de compra">
                {oc?.monto > 0 && <p className="text-xs text-ink-soft">{money(oc.monto)}</p>}
              </TarjetaRelacion>

              <TarjetaRelacion tipo="factura" codigo={factura?.codigo} numero={factura?.numeroFactura} vacio={!factura}
                onClick={factura && onNavegar ? () => onNavegar({ tipo: "factura", data: factura }) : undefined}>
                {factura?.totalAPagar > 0 && <p className="text-xs text-ink-soft">{money(factura.totalAPagar)}</p>}
                {factura?.estadoPago && <Chip className={badgePago(factura.estadoPago)}>{factura.estadoPago}</Chip>}
              </TarjetaRelacion>
            </section>
          </div>

          {/* Ítems — card aparte, 80vw (se sale del max-w-6xl del form) para que las columnas respiren */}
          <div className="w-[80vw] max-w-[80vw] relative left-1/2 -translate-x-1/2 bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-sky-500" />
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Ítems</h2>
            </div>

            <div className="overflow-x-auto">
              {esPepsico ? (
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-surface-alt text-ink-muted text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-center">UM</th>
                      <th className="px-3 py-2 text-right">P. Unit.</th>
                      <th className="px-3 py-2 text-right">Importe</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {["I", "II", "III", "IV"].flatMap(g => {
                      const grupoItems = items.filter(i => i.grupo === g);
                      if (!grupoItems.length) return [];
                      return [
                        <tr key={`h-${g}`}>
                          <td colSpan={6} className="px-3 py-1.5 bg-surface-hover text-xs font-semibold text-ink-soft">
                            {g} — {GRUPOS_PEPSICO[g]}
                          </td>
                        </tr>,
                        ...grupoItems.map(item => {
                          const esIV = item.grupo === "IV";
                          const importe = esIV
                            ? (item.cantidad / 100 * baseIIIgrupos).toFixed(2)
                            : calcSubtotal(item).toFixed(2);
                          return (
                            <tr key={item._key}>
                              <td className="px-3 py-2 align-top w-[72%]">
                                <textarea
                                  value={item.descripcion}
                                  onChange={(e) => actualizarItem(item._key, "descripcion", e.target.value)}
                                  required rows={6}
                                  className={`w-full resize-y ${INP}`}
                                  placeholder="Descripción"
                                />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <input type="number" min="0" step="0.01" value={item.cantidad}
                                  onChange={(e) => actualizarItem(item._key, "cantidad", parseFloat(e.target.value) || 0)}
                                  required className={`w-16 text-center ${INP}`} />
                              </td>
                              <td className="px-3 py-2 align-top text-center text-sm text-ink-soft">
                                {esIV ? "%" : (
                                  <input type="text" value={item.unidadMedida}
                                    onChange={(e) => actualizarItem(item._key, "unidadMedida", e.target.value)}
                                    className={`w-14 text-center ${INP}`} placeholder="UN" />
                                )}
                              </td>
                              <td className="px-3 py-2 align-top">
                                {!esIV && (
                                  <input type="number" min="0" step="0.01" value={item.precio}
                                    onChange={(e) => actualizarItem(item._key, "precio", parseFloat(e.target.value) || 0)}
                                    required className={`w-24 text-right ${INP}`} />
                                )}
                              </td>
                              <td className="px-3 py-2 align-top text-right font-medium text-ink-soft">{importe}</td>
                              <td className="px-3 py-2 align-top">
                                <button type="button" onClick={() => eliminarItem(item._key)}
                                  className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                              </td>
                            </tr>
                          );
                        }),
                      ];
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm min-w-[1000px]">
                  <thead className="bg-surface-alt text-ink-muted text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-center">T. de entrega</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-center">Mon.</th>
                      {form.tipo !== "venta" && <th className="px-3 py-2 text-center">Desc. %</th>}
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {items.map((item) => (
                      <tr key={item._key}>
                        <FilaDescripcionEditable
                          item={item}
                          tipo={form.tipo}
                          onUpdate={actualizarItem}
                          onAddSub={agregarSubItem}
                          onUpdateSub={actualizarSubItem}
                          onDeleteSub={eliminarSubItem}
                          onOpenCatalogo={abrirCatalogo}
                        />
                        <CeldasNumericas item={item} ro={false} onUpdate={actualizarItem} />
                        {form.tipo !== "venta" && (
                          <td className="px-3 py-2">
                            <input type="number" min="0" max="100" step="0.01" value={item.descuento || 0}
                              onChange={(e) => actualizarItem(item._key, "descuento", parseFloat(e.target.value) || 0)}
                              className={`w-16 text-center ${INP}`} />
                          </td>
                        )}
                        <td className="px-3 py-2 text-right font-medium">
                          {form.tipo !== "venta"
                            ? (calcSubtotal(item) * (1 - (item.descuento || 0) / 100)).toFixed(2)
                            : calcSubtotal(item).toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => eliminarItem(item._key)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {esPepsico ? (
              <div className="flex gap-2 flex-wrap">
                {["I", "II", "III", "IV"].map(g => (
                  <button key={g} type="button" onClick={() => agregarItemPepsico(g)}
                    className="text-xs text-ink-soft border border-line-strong hover:border-ink-muted hover:text-ink px-3 py-1.5 rounded-lg transition">
                    + {GRUPOS_PEPSICO[g]}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button type="button" onClick={agregarItem} className="text-sm text-ink-soft hover:text-ink transition">
                  + Agregar ítem
                </button>
                {form.tipo === "servicio" && (
                  <button type="button" onClick={() => abrirCatalogo()} className="text-sm text-accent hover:text-accent-strong transition">
                    + Agregar ítem de plantilla
                  </button>
                )}
              </div>
            )}

            {catalogoOpen && (
              <SelectorCatalogoServicios
                onSeleccionar={agregarDesdeCatalogo}
                onSeleccionarGrupo={agregarGrupoCompletoDesdeCatalogo}
                onClose={cerrarCatalogo}
              />
            )}

            <div className="flex justify-end gap-8 text-sm border-t border-line pt-4">
              <div className="text-right space-y-1 text-ink-soft">
                <p>Subtotal</p>
                {descuentoTotal > 0 && <p>Descuento</p>}
                {descuentoTotal > 0 && <p>Total sin IGV</p>}
                <p>IGV 18%</p>
                <p className="font-semibold text-ink text-base">Total con IGV</p>
              </div>
              <div className="text-right space-y-1">
                <p>{subtotalBruto.toFixed(2)}</p>
                {descuentoTotal > 0 && <p className="text-red-500">- {descuentoTotal.toFixed(2)}</p>}
                {descuentoTotal > 0 && <p>{subtotal.toFixed(2)}</p>}
                <p>{igv.toFixed(2)}</p>
                <p className="font-semibold text-ink text-base">{total.toFixed(2)}</p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
            )}
          </div>
        </form>
      </div>

      {/* Confirmación orden de compra */}
      {confirmarOC && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h4 className="font-semibold text-ink">¿Crear orden de compra?</h4>
            <p className="text-sm text-ink-soft">
              Se generará una orden de compra a partir de la cotización <span className="font-mono font-medium">{cot.codigo}</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmarOC(false)} className="btn-secondary">Cancelar</button>
              <button onClick={() => { setConfirmarOC(false); setCrearOC(true); }}
                className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {crearOC && (
        <ModalOrdenCompra cotizacion={cot} onClose={() => setCrearOC(false)}
          onCreada={(nuevaOC) => { setCrearOC(false); setOc(nuevaOC); }} />
      )}

      {/* Confirmación guardar cambios */}
      {confirmando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl p-6 shadow-2xl w-80">
            <p className="text-sm text-ink mb-4">¿Confirmar los cambios en la cotización?</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmando(false)} className="btn-secondary">Cancelar</button>
              <button type="button" onClick={guardar} disabled={guardando}
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition">
                {guardando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
