import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuth } from "../utils/fetchAuth";
import {
  calcSubtotal,
  itemVacioVenta,
  itemVacioServicio,
  itemVacioPepsico,
  GRUPOS_PEPSICO,
  INP,
} from "../utils/cotizacionItems";
import CeldasNumericas from "../components/CeldasNumericas";
import SelectorEmpresas from "../components/SelectorEmpresas";
import SelectorCatalogoServicios from "../components/SelectorCatalogoServicios";
import { FlujoNegocio, TarjetaRelacion, SeccionCotizacion, BuscadorEmpresaTexto } from "../components/detalleShared";

const hoy = () => new Date().toISOString().split("T")[0];

const FORM_VACIO = {
  empresa: "", condicionPago: "", fecha: hoy(), atencion: "", solped: "", referencia: "",
  modulo: "", tarjeta: "", equipo: "", garantia: "", plazoEntrega: "", validezOferta: "30 días calendario",
  moneda: "PEN", utilidadPorcentaje: "20", costosAdministrativosPorcentaje: "6", costosFinancierosPorcentaje: "4.5",
};

// Vista de creación de cotización — mismo shell (header degradado + stepper +
// panel de Relaciones) que DetalleCotizacion.jsx, para que crear y ver/editar
// se sientan como la misma pantalla (mismo criterio que SIPAPP-HUAQUIAN).
// Al guardar con éxito se cierra y vuelve a la lista — no se queda en un
// modo "solo lectura" post-guardado como antes; para seguir editando (o
// crear/vincular una OT) se reabre desde la lista, que ya usa
// DetalleCotizacion.jsx para eso.
export default function Cotizaciones({ onClose, onCreada }) {
  const navigate = useNavigate();
  const cerrar = onClose || (() => navigate("/cotizaciones"));
  const notificarCreada = onCreada || (() => navigate("/cotizaciones"));

  const [empresas, setEmpresas] = useState([]);
  const [tipo, setTipo] = useState("venta");
  const [form, setForm] = useState(FORM_VACIO);
  const [items, setItems] = useState([itemVacioVenta()]);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Empresa como texto libre además del selector — ver BuscadorEmpresaTexto.
  const [busquedaEmpresa, setBusquedaEmpresa] = useState("");
  const [empresasOpen, setEmpresasOpen] = useState(false);

  const [catalogoOpen, setCatalogoOpen] = useState(false);
  const [catalogoTarget, setCatalogoTarget] = useState(null);

  const cargarEmpresas = () =>
    fetchAuth("/empresas").then((r) => r.ok && r.json()).then((d) => d && setEmpresas(d));

  useEffect(() => { cargarEmpresas(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const cambiarBusquedaEmpresa = (texto) => {
    setBusquedaEmpresa(texto);
    if (form.empresa) setForm((f) => ({ ...f, empresa: "" }));
  };

  const seleccionarEmpresa = (e) => {
    setForm((f) => ({ ...f, empresa: e._id }));
    setBusquedaEmpresa(e.alias ? `${e.alias} — ${e.razonSocial}` : e.razonSocial);
  };

  const cambiarTipo = (t) => {
    setTipo(t);
    setItems(t === "venta" ? [itemVacioVenta()] : [itemVacioServicio()]);
  };

  const handleItem = (key, campo, valor) =>
    setItems(items.map((i) => (i._key === key ? { ...i, [campo]: valor } : i)));

  const agregarItem = () =>
    setItems([...items, tipo === "venta" ? itemVacioVenta() : itemVacioServicio()]);

  const eliminarItem = (key) => setItems(items.filter((i) => i._key !== key));

  const agregarItemPepsico = (grupo) => setItems([...items, itemVacioPepsico(grupo)]);

  const empresaSel = empresas.find(e => e._id === form.empresa);
  const esPepsico = Boolean(
    empresaSel?.razonSocial?.toLowerCase().includes("pepsico") ||
    empresaSel?.alias?.toLowerCase().includes("pepsico")
  );

  const agregarSubItem = (key) =>
    setItems(items.map((i) =>
      i._key === key
        ? { ...i, subItems: [...i.subItems, { _subKey: Date.now() + Math.random(), texto: "" }] }
        : i
    ));

  const eliminarSubItem = (key, subKey) =>
    setItems(items.map((i) =>
      i._key === key
        ? { ...i, subItems: i.subItems.filter((s) => s._subKey !== subKey) }
        : i
    ));

  const handleSubItem = (key, subKey, valor) =>
    setItems(items.map((i) =>
      i._key === key
        ? { ...i, subItems: i.subItems.map((s) => (s._subKey === subKey ? { ...s, texto: valor } : s)) }
        : i
    ));

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

  const baseIIIgrupos = esPepsico
    ? items.filter(i => ["I","II","III"].includes(i.grupo))
        .reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0)
    : 0;

  // Reemplaza al viejo "Grupo IV" (tabla libre de ítems con % a mano) — 3
  // campos fijos (Utilidad/Costos Administrativos/Costos Financieros),
  // exclusivos de Pepsico, cada uno % de baseIIIgrupos (pedido del usuario,
  // 2026-09-21).
  const utilidadMonto             = esPepsico ? baseIIIgrupos * (Number(form.utilidadPorcentaje) || 0) / 100 : 0;
  const costosAdministrativosMonto = esPepsico ? baseIIIgrupos * (Number(form.costosAdministrativosPorcentaje) || 0) / 100 : 0;
  const costosFinancierosMonto    = esPepsico ? baseIIIgrupos * (Number(form.costosFinancierosPorcentaje) || 0) / 100 : 0;

  const subtotalBruto = esPepsico
    ? parseFloat((baseIIIgrupos + utilidadMonto + costosAdministrativosMonto + costosFinancierosMonto).toFixed(2))
    : parseFloat(items.reduce((acc, i) => acc + calcSubtotal(i), 0).toFixed(2));

  const descuentoTotal = esPepsico
    ? 0
    : parseFloat(items.reduce((s, it) => s + calcSubtotal(it) * ((it.descuento || 0) / 100), 0).toFixed(2));

  const subtotalGeneral = parseFloat((subtotalBruto - descuentoTotal).toFixed(2));
  const igv   = parseFloat((subtotalGeneral * 0.18).toFixed(2));
  const total = parseFloat((subtotalGeneral * 1.18).toFixed(2));

  const validar = () => {
    if (!form.referencia?.trim()) return "La referencia es requerida.";
    for (const item of items) {
      if (!item.descripcion.trim()) return "Todos los ítems deben tener descripción.";
      if (!item.cantidad || Number(item.cantidad) <= 0) return "La cantidad de cada ítem debe ser mayor a 0.";
      if (item.precio === "" || item.precio === null || Number(item.precio) < 0) return "El precio de cada ítem debe ser un valor válido.";
    }
    return null;
  };

  const guardar = async () => {
    if (cargando) return;
    setCargando(true);
    setError("");
    try {
      const body = {
        ...form,
        tipo,
        items: items.map((i) => {
          const precioFinal = i.grupo === "IV"
            ? parseFloat((i.cantidad / 100 * baseIIIgrupos).toFixed(2))
            : i.precio;
          const item = {
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            unidadMedida: i.unidadMedida || "UN",
            precio: precioFinal,
            descuento: i.descuento || 0,
            moneda: i.moneda,
            grupo: i.grupo || "I",
            subtotal: i.grupo === "IV"
              ? precioFinal
              : parseFloat((calcSubtotal(i) * (1 - (i.descuento || 0) / 100)).toFixed(2)),
          };
          if (i.fechaEntrega) item.fechaEntrega = i.fechaEntrega;
          if (tipo === "servicio" && i.subItems?.length > 0)
            item.subItems = i.subItems.map((s) => s.texto).filter(Boolean);
          return item;
        }),
        subtotal: subtotalGeneral,
        igv,
        total,
      };
      if (!form.empresa && busquedaEmpresa.trim()) body.empresaNombre = busquedaEmpresa.trim();
      if (!body.empresa) delete body.empresa;
      const res = await fetchAuth("/cotizaciones", { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return setError(data.mensaje || "Error al guardar");
      notificarCreada(data);
      cerrar();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const pasos = [
    { tipo: "cotizacion", activo: true, codigo: "Nueva" },
    { tipo: "ot",         activo: false },
    { tipo: "informe",    activo: false },
    { tipo: "oc",         activo: false },
    { tipo: "factura",    activo: false },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-app-bg flex flex-col">
      {/* Header degradado */}
      <div className="shrink-0 bg-gradient-to-r from-sky-600 to-cyan-700 text-white">
        <div className="max-w-6xl mx-auto px-8 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={cerrar}
              className="text-sm text-white/80 hover:text-white transition flex items-center gap-1.5 group shrink-0">
              <span className="group-hover:-translate-x-0.5 transition">←</span> Cotizaciones
            </button>
            <span className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Cotización</p>
              <h1 className="text-lg font-bold font-mono leading-tight">Nueva cotización</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => {
                const err = validar();
                if (err) { setError(err); return; }
                setError("");
                setConfirmando(true);
              }}
              disabled={cargando}
              className="bg-white text-sky-700 text-sm px-5 py-2 rounded-lg hover:bg-sky-50 disabled:opacity-60 transition font-semibold shadow-sm shrink-0">
              {cargando ? "Guardando…" : "Crear cotización"}
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
        <form onSubmit={(e) => e.preventDefault()} className="max-w-6xl mx-auto px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Formulario editable */}
            <div className="lg:col-span-2 space-y-6">

              {/* Datos del cliente */}
              <SeccionCotizacion titulo="Datos del cliente" color="bg-blue-500">
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Empresa</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <BuscadorEmpresaTexto
                        empresas={empresas}
                        texto={busquedaEmpresa}
                        empresaId={form.empresa}
                        onTexto={cambiarBusquedaEmpresa}
                        onSeleccionar={seleccionarEmpresa}
                      />
                    </div>
                    <button type="button" onClick={() => setEmpresasOpen(true)}
                      className="shrink-0 text-xs border border-line-strong px-3 rounded-lg hover:bg-surface-hover transition">
                      Empresas
                    </button>
                  </div>
                </div>
              </SeccionCotizacion>

              {/* Detalle de cotización */}
              <SeccionCotizacion titulo="Detalle de cotización" color="bg-sky-500">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Condición de pago</label>
                    <input name="condicionPago" value={form.condicionPago} onChange={handleChange}
                      required className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Fecha</label>
                    <input type="date" name="fecha" value={form.fecha} onChange={handleChange} className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Moneda</label>
                    <select name="moneda" value={form.moneda} onChange={handleChange} className={`w-full ${INP}`}>
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Atención</label>
                    <input name="atencion" value={form.atencion} onChange={handleChange}
                      placeholder="Nombre del destinatario" className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">N° de solicitud de pedido (SOLPED)</label>
                    <input name="solped" value={form.solped} onChange={handleChange}
                      placeholder="N° SOLPED" className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Referencia</label>
                    <input name="referencia" value={form.referencia} onChange={handleChange}
                      required className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Tiempo de entrega</label>
                    <input name="plazoEntrega" value={form.plazoEntrega} onChange={handleChange}
                      placeholder="Ej. 15 días hábiles…" className={`w-full ${INP}`} />
                  </div>
                  {esPepsico && (
                    <div>
                      <label className="block text-xs text-ink-muted mb-1">Validez de la oferta</label>
                      <input name="validezOferta" value={form.validezOferta} onChange={handleChange}
                        placeholder="ej: 30 días calendario" className={`w-full ${INP}`} />
                    </div>
                  )}
                </div>
              </SeccionCotizacion>

              <SeccionCotizacion titulo="Otros datos" color="bg-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Tipo</label>
                    <select value={tipo} onChange={(e) => cambiarTipo(e.target.value)} className={`w-full ${INP}`}>
                      <option value="venta">Venta</option>
                      <option value="servicio">Servicio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Módulo</label>
                    <input name="modulo" value={form.modulo} onChange={handleChange} className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Tarjeta</label>
                    <input name="tarjeta" value={form.tarjeta} onChange={handleChange} className={`w-full ${INP}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Equipo</label>
                    <input name="equipo" value={form.equipo} onChange={handleChange} className={`w-full ${INP}`} />
                  </div>
                </div>
              </SeccionCotizacion>

              <SeccionCotizacion titulo="Términos y condiciones" color="bg-amber-500">
                <div>
                  <label className="block text-xs text-ink-muted mb-1">Tiempo de garantía</label>
                  <input name="garantia" value={form.garantia} onChange={handleChange}
                    placeholder="Ej. 6 meses, 1 año…" className={`w-full ${INP}`} />
                </div>
              </SeccionCotizacion>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}
            </div>

            {/* Relaciones */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-cyan-500" />
                <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Relaciones</h2>
              </div>

              <TarjetaRelacion tipo="cotizacion" codigo="Nueva" actual>
                <p className="text-sm text-ink-soft line-clamp-2">{form.referencia || "—"}</p>
              </TarjetaRelacion>
              <TarjetaRelacion tipo="ot" vacio />
              <TarjetaRelacion tipo="informe" vacio />
              <TarjetaRelacion tipo="oc" vacio />
              <TarjetaRelacion tipo="factura" vacio />
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
                    {["I","II","III"].flatMap(g => {
                      const grupoItems = items.filter(i => i.grupo === g);
                      if (!grupoItems.length) return [];
                      return [
                        <tr key={`h-${g}`}>
                          <td colSpan={6} className="px-3 py-1.5 bg-surface-hover text-xs font-semibold text-ink-soft">
                            {g} — {GRUPOS_PEPSICO[g]}
                          </td>
                        </tr>,
                        ...grupoItems.map(item => {
                          const importe = calcSubtotal(item).toFixed(2);
                          return (
                            <tr key={item._key}>
                              <td className="px-3 py-2 align-top w-[72%]">
                                <textarea value={item.descripcion}
                                  onChange={(e) => handleItem(item._key, "descripcion", e.target.value)}
                                  required rows={6}
                                  className={`w-full resize-y ${INP}`} />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <input type="number" min="0" step="0.01"
                                  value={item.cantidad}
                                  onChange={(e) => handleItem(item._key, "cantidad", parseFloat(e.target.value) || 0)}
                                  required className={`w-16 text-center ${INP}`} />
                              </td>
                              <td className="px-3 py-2 align-top text-center text-sm text-ink-soft">
                                <input type="text"
                                  value={item.unidadMedida}
                                  onChange={(e) => handleItem(item._key, "unidadMedida", e.target.value)}
                                  className={`w-14 text-center ${INP}`}
                                  placeholder="UN" />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <input type="number" min="0" step="0.01"
                                  value={item.precio}
                                  onChange={(e) => handleItem(item._key, "precio", parseFloat(e.target.value) || 0)}
                                  required className={`w-24 text-right ${INP}`} />
                              </td>
                              <td className="px-3 py-2 align-top text-right font-medium text-ink-soft">
                                {importe}
                              </td>
                              <td className="px-3 py-2 align-top">
                                <button type="button" onClick={() => eliminarItem(item._key)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                              </td>
                            </tr>
                          );
                        }),
                      ];
                    })}
                    {/* IV — Utilidad + gastos administrativos: 3 filas fijas (no editables en
                        descripción ni eliminables), % en la columna Cant., importe calculado
                        sobre baseIIIgrupos en vez de leído de un ítem. */}
                    <tr>
                      <td colSpan={6} className="px-3 py-1.5 bg-surface-hover text-xs font-semibold text-ink-soft">
                        IV — Utilidad + gastos administrativos
                      </td>
                    </tr>
                    {[
                      { label: "Utilidad", name: "utilidadPorcentaje", monto: utilidadMonto },
                      { label: "Costos Administrativos", name: "costosAdministrativosPorcentaje", monto: costosAdministrativosMonto },
                      { label: "Costos Financieros", name: "costosFinancierosPorcentaje", monto: costosFinancierosMonto },
                    ].map((campo) => (
                      <tr key={campo.name}>
                        <td className="px-3 py-2 align-top w-[72%] text-ink">{campo.label}</td>
                        <td className="px-3 py-2 align-top">
                          <input type="number" min="0" step="0.1" name={campo.name}
                            value={form[campo.name]} onChange={handleChange}
                            className={`w-16 text-center ${INP}`} />
                        </td>
                        <td className="px-3 py-2 align-top text-center text-sm text-ink-soft">%</td>
                        <td className="px-3 py-2 align-top text-center text-ink-muted">—</td>
                        <td className="px-3 py-2 align-top text-right font-medium text-ink-soft">{campo.monto.toFixed(2)}</td>
                        <td className="px-3 py-2 align-top"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-line bg-surface-alt">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-xs text-ink-muted">Subtotal</td>
                      <td className="px-3 py-2 text-right font-medium">{subtotalGeneral.toFixed(2)}</td>
                      <td />
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-xs text-ink-muted">IGV 18%</td>
                      <td className="px-3 py-2 text-right font-medium">{igv.toFixed(2)}</td>
                      <td />
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-sm font-semibold text-ink">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-ink text-base">{total.toFixed(2)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <table className="w-full text-sm min-w-[1000px]">
                  <thead className="bg-surface-alt text-ink-muted text-xs">
                    <tr>
                      <th className="px-3 py-2 text-center w-8">#</th>
                      <th className="px-3 py-2 text-left">
                        {tipo === "servicio" ? "Título / Descripciones" : "Descripción"}
                      </th>
                      <th className="px-3 py-2 text-left">Cantidad</th>
                      {tipo === "servicio" && <th className="px-3 py-2 text-left">T. entrega</th>}
                      <th className="px-3 py-2 text-left">Precio</th>
                      {tipo === "servicio" && <th className="px-3 py-2 text-center">Desc. %</th>}
                      <th className="px-3 py-2 text-right">Subtotal</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tipo === "venta"
                      ? items.map((item, idx) => (
                          <tr key={item._key}>
                            <td className="px-3 py-2 text-center text-ink-muted align-top pt-3">{idx + 1}</td>
                            <td className="px-3 py-2 align-top w-[60%]">
                              <textarea value={item.descripcion}
                                onChange={(e) => handleItem(item._key, "descripcion", e.target.value)}
                                required rows={2}
                                className={`w-full resize-y ${INP}`} />
                            </td>
                            <CeldasNumericas item={item} ro={false} onUpdate={handleItem} showFechaEntrega={false} />
                            <td className="px-3 py-2 text-right font-medium text-ink-soft align-top pt-3">
                              {calcSubtotal(item).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center align-top pt-2.5">
                              <button type="button" onClick={() => eliminarItem(item._key)} className="text-red-400 hover:text-red-600">✕</button>
                            </td>
                          </tr>
                        ))
                      : items.map((item, idx) => (
                          <Fragment key={item._key}>
                            <tr>
                              <td className="px-3 py-2 text-center text-ink-muted align-top pt-3">{idx + 1}</td>
                              <td className="px-3 py-2 align-top w-[60%]">
                                <textarea value={item.descripcion}
                                  onChange={(e) => handleItem(item._key, "descripcion", e.target.value)}
                                  required placeholder="Título del servicio" rows={4}
                                  className={`w-full resize-y font-medium ${INP}`} />
                              </td>
                              <CeldasNumericas item={item} ro={false} onUpdate={handleItem} />
                              <td className="px-3 py-2 text-center align-middle">
                                <input type="number" min="0" max="100" step="0.01"
                                  value={item.descuento || 0}
                                  onChange={(e) => handleItem(item._key, "descuento", parseFloat(e.target.value) || 0)}
                                  className={`w-16 text-center ${INP}`} />
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-ink-soft align-middle">
                                {(calcSubtotal(item) * (1 - (item.descuento || 0) / 100)).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-center align-top pt-2.5">
                                <button type="button" onClick={() => eliminarItem(item._key)} className="text-red-400 hover:text-red-600">✕</button>
                              </td>
                            </tr>
                            {item.subItems.map((sub) => (
                              <tr key={sub._subKey} className="bg-surface-alt/40">
                                <td></td>
                                <td className="px-3 py-1 pl-9">
                                  <div className="flex items-start gap-2">
                                    <span className="text-ink-muted select-none text-xs mt-1.5">•</span>
                                    <textarea value={sub.texto}
                                      onChange={(e) => handleSubItem(item._key, sub._subKey, e.target.value)}
                                      placeholder="Descripción del trabajo" rows={3}
                                      className={`flex-1 resize-y ${INP} text-sm`} />
                                    <button type="button" onClick={() => eliminarSubItem(item._key, sub._subKey)}
                                      className="text-red-300 hover:text-red-500 text-xs shrink-0 mt-1">✕</button>
                                  </div>
                                </td>
                                <td colSpan={6}></td>
                              </tr>
                            ))}
                            <tr className="bg-surface-alt/40">
                              <td></td>
                              <td className="px-3 py-1.5 pl-9 flex items-center gap-3">
                                <button type="button" onClick={() => agregarSubItem(item._key)}
                                  className="text-xs text-ink-muted hover:text-ink transition">
                                  + agregar descripción
                                </button>
                                <button type="button" onClick={() => abrirCatalogo(item._key)}
                                  className="text-xs text-ink-muted hover:text-accent transition">
                                  + elegir del catálogo
                                </button>
                              </td>
                              <td colSpan={tipo === "venta" ? 4 : 6}></td>
                            </tr>
                          </Fragment>
                        ))}
                  </tbody>
                  <tfoot className="border-t-2 border-line bg-surface-alt">
                    <tr>
                      <td colSpan={tipo === "venta" ? 4 : 6} className="px-4 py-2 text-right text-xs text-ink-muted">Subtotal</td>
                      <td className="px-3 py-2 text-right font-medium">{subtotalBruto.toFixed(2)}</td>
                      <td />
                    </tr>
                    {descuentoTotal > 0 && <>
                      <tr>
                        <td colSpan={tipo === "venta" ? 4 : 6} className="px-4 py-2 text-right text-xs text-red-400">Descuento</td>
                        <td className="px-3 py-2 text-right font-medium text-red-500">- {descuentoTotal.toFixed(2)}</td>
                        <td />
                      </tr>
                      <tr>
                        <td colSpan={tipo === "venta" ? 4 : 6} className="px-4 py-2 text-right text-xs text-ink-muted">Total sin IGV</td>
                        <td className="px-3 py-2 text-right font-medium">{subtotalGeneral.toFixed(2)}</td>
                        <td />
                      </tr>
                    </>}
                    <tr>
                      <td colSpan={tipo === "venta" ? 4 : 6} className="px-4 py-2 text-right text-xs text-ink-muted">IGV 18%</td>
                      <td className="px-3 py-2 text-right font-medium">{igv.toFixed(2)}</td>
                      <td />
                    </tr>
                    <tr>
                      <td colSpan={tipo === "venta" ? 4 : 6} className="px-4 py-2 text-right text-sm font-semibold text-ink">Total con IGV</td>
                      <td className="px-3 py-2 text-right font-bold text-ink text-base">{total.toFixed(2)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {esPepsico ? (
              <div className="flex gap-2 flex-wrap">
                {["I","II","III"].map(g => (
                  <button key={g} type="button" onClick={() => agregarItemPepsico(g)}
                    className="text-xs text-ink-soft border border-line-strong hover:border-ink-muted hover:text-ink px-3 py-1.5 rounded-lg transition">
                    + {GRUPOS_PEPSICO[g]}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button type="button" onClick={agregarItem}
                  className="text-sm text-ink-soft hover:text-ink transition">
                  + Agregar ítem
                </button>
                {tipo === "servicio" && (
                  <button type="button" onClick={() => abrirCatalogo()}
                    className="text-sm text-accent hover:text-accent-strong transition">
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
          </div>
        </form>
      </div>

      {confirmando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface rounded-xl p-6 shadow-2xl w-80">
            <p className="text-sm text-ink mb-4">¿Crear esta cotización?</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmando(false)} className="btn-secondary">Cancelar</button>
              <button type="button" onClick={guardar} disabled={cargando}
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition">
                {cargando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {empresasOpen && (
        <SelectorEmpresas
          empresas={empresas}
          onClose={() => setEmpresasOpen(false)}
          onSeleccionar={(e) => {
            seleccionarEmpresa(e);
            setEmpresasOpen(false);
          }}
          onCambio={async (guardada, { esNueva }) => {
            await cargarEmpresas();
            if (esNueva) seleccionarEmpresa(guardada);
          }}
        />
      )}
    </div>
  );
}
