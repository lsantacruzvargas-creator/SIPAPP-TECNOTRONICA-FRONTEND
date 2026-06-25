import { useState, useEffect, Fragment } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import { exportarCotizacionPdf } from "../utils/cotizacionPdf";
import { exportarCotizacionPdf as exportarCotizacionPdfPepsico } from "../utils/cotizacionPdf3";
import { exportarCotizacionVenta } from "../utils/cotizacionVenta";
import {
  calcSubtotal,
  itemVacioVenta,
  itemVacioServicio,
  itemVacioPepsico,
  GRUPOS_PEPSICO,
  INP,
  INP_RO,
} from "../utils/cotizacionItems";
import CeldasNumericas from "../components/CeldasNumericas";

const hoy = () => new Date().toISOString().split("T")[0];

export default function Cotizaciones() {
  const [empresas, setEmpresas] = useState([]);
  const [tipo, setTipo] = useState("venta");
  const [form, setForm] = useState({ empresa: "", condicionPago: "", fecha: hoy(), atencion: "", solped: "", referencia: "", modulo: "", tarjeta: "", equipo: "", garantia: "", plazoEntrega: "", validezOferta: "30 días calendario" });
  const [items, setItems] = useState([itemVacioVenta()]);
  const [guardado, setGuardado] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const [vienePorOT, setVienePorOT] = useState("");
  const [otsLista, setOtsLista]     = useState([]);
  const [otsSel, setOtsSel]         = useState([]);
  const [cargandoOTs, setCargandoOTs] = useState(false);

  useEffect(() => {
    fetchAuth("/empresas").then((r) => r.ok && r.json().then(setEmpresas));
  }, []);

  const handleVienePorOT = async (val) => {
    setVienePorOT(val);
    setOtsSel([]);
    if (val === "si" && otsLista.length === 0) {
      setCargandoOTs(true);
      const r = await fetchAuth("/ordenes-trabajo");
      if (r.ok) {
        const ots = await r.json();
        setOtsLista(ots.filter((o) => o.ingresoEquipo));
      }
      setCargandoOTs(false);
    }
  };

  const agregarOT = (id) => {
    const ot = otsLista.find((o) => o._id === id);
    if (!ot || otsSel.some((o) => o._id === id)) return;
    const nuevaLista = [...otsSel, ot];
    setOtsSel(nuevaLista);
    if (nuevaLista.length === 1) {
      const ie = ot.ingresoEquipo;
      setForm((f) => ({
        ...f,
        empresa: ot.empresa?._id || "",
        referencia: ie ? [ie.tipoEquipo, ie.marca, ie.modelo].filter(Boolean).join(" ") : ot.titulo,
      }));
    }
  };

  const quitarOT = (id) => setOtsSel((prev) => prev.filter((o) => o._id !== id));

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const cambiarTipo = (t) => {
    setTipo(t);
    setItems(t === "venta" ? [itemVacioVenta()] : [itemVacioServicio()]);
    if (t !== "servicio") { setVienePorOT(""); setOtsSel([]); }
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

  const baseIIIgrupos = esPepsico
    ? items.filter(i => ["I","II","III"].includes(i.grupo))
        .reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0)
    : 0;

  const subtotalBruto = esPepsico
    ? parseFloat((
        baseIIIgrupos +
        items.filter(i => i.grupo === "IV")
          .reduce((s, it) => s + it.cantidad / 100 * baseIIIgrupos, 0)
      ).toFixed(2))
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
      if (!body.empresa) delete body.empresa;
      const res = await fetchAuth("/cotizaciones", { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return setError(data.mensaje || "Error al guardar");
      if (otsSel.length > 0) {
        await Promise.all(otsSel.map((ot) =>
          fetchAuth(`/ordenes-trabajo/${ot._id}`, {
            method: "PUT",
            body: JSON.stringify({ cotizacion: data._id }),
          })
        ));
      }
      setGuardado(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const nueva = () => {
    setTipo("venta");
    setForm({ empresa: "", condicionPago: "", fecha: hoy(), atencion: "", solped: "", referencia: "", modulo: "", tarjeta: "", equipo: "", garantia: "", plazoEntrega: "", validezOferta: "30 días calendario" });
    setItems([itemVacioVenta()]);
    setGuardado(null);
    setError("");
    setVienePorOT("");
    setOtsSel([]);
  };

  const ro = !!guardado;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Nueva cotización</h2>
        {guardado && <span className="font-mono text-sm text-gray-400">{guardado.codigo}</span>}
      </div>

      {guardado && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">
          Cotización <strong>{guardado.codigo}</strong> guardada exitosamente.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Selector de tipo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 mb-5 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">Tipo de cotización:</span>
          {["venta", "servicio"].map((t) => (
            <button
              key={t} type="button" disabled={ro}
              onClick={() => cambiarTipo(t)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition ${
                tipo === t
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700"
              } disabled:cursor-not-allowed`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Origen OT — solo para servicio */}
        {tipo === "servicio" && !ro && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 mb-5 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">¿Viene de una Orden de Trabajo?</span>
              {["si", "no"].map((v) => (
                <button
                  key={v} type="button"
                  onClick={() => handleVienePorOT(v)}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition ${
                    vienePorOT === v
                      ? "bg-gray-900 text-white"
                      : "border border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700"
                  }`}
                >
                  {v === "si" ? "Sí" : "No"}
                </button>
              ))}
            </div>

            {vienePorOT === "si" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Agregar Orden de Trabajo</label>
                  <select
                    onChange={(e) => { agregarOT(e.target.value); e.target.value = ""; }}
                    defaultValue=""
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="">— {cargandoOTs ? "Cargando…" : "Seleccionar OT para agregar"} —</option>
                    {otsLista
                      .filter((o) => !otsSel.some((s) => s._id === o._id))
                      .map((o) => (
                        <option key={o._id} value={o._id}>
                          {o.codigo} — {o.ingresoEquipo?.tipoEquipo || o.titulo}
                          {o.ingresoEquipo?.planta ? ` · ${o.ingresoEquipo.planta}` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                {otsSel.map((ot) => {
                  const ie = ot.ingresoEquipo;
                  return (
                    <div key={ot._id} className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                          {ot.codigo} · <span className="font-mono">{ie?.codigo}</span>
                        </p>
                        <button type="button" onClick={() => quitarOT(ot._id)}
                          className="text-gray-400 hover:text-red-500 text-sm transition">✕</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {ie && (
                          <>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Tipo de equipo</label>
                              <input value={ie.tipoEquipo || "—"} disabled className={`w-full ${INP_RO}`} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Marca / Modelo</label>
                              <input value={[ie.marca, ie.modelo].filter(Boolean).join(" / ") || "—"} disabled className={`w-full ${INP_RO}`} />
                            </div>
                            {ie.planta && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Planta</label>
                                <input value={ie.planta} disabled className={`w-full ${INP_RO}`} />
                              </div>
                            )}
                            {ie.linea && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Línea</label>
                                <input value={ie.linea} disabled className={`w-full ${INP_RO}`} />
                              </div>
                            )}
                            {ie.voltaje && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Voltaje</label>
                                <input value={ie.voltaje} disabled className={`w-full ${INP_RO}`} />
                              </div>
                            )}
                            {ie.potencia && (
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Potencia</label>
                                <input value={ie.potencia} disabled className={`w-full ${INP_RO}`} />
                              </div>
                            )}
                            {ie.caracteristicasElectricas && (
                              <div className="col-span-2">
                                <label className="text-xs text-gray-400 block mb-1">Características eléctricas</label>
                                <input value={ie.caracteristicasElectricas} disabled className={`w-full ${INP_RO}`} />
                              </div>
                            )}
                            {ie.descripcionProblema && (
                              <div className="col-span-2">
                                <label className="text-xs text-gray-400 block mb-1">Descripción del problema</label>
                                <textarea value={ie.descripcionProblema} disabled rows={2} className={`w-full ${INP_RO} resize-none`} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cabecera */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Empresa </label>
              <select name="empresa" value={form.empresa} onChange={handleChange} disabled={ro}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500">
                <option value="">— Sin empresa —</option>
                {empresas.map((e) => (
                  <option key={e._id} value={e._id}>{e.alias} — {e.razonSocial}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Condición de pago</label>
              <input name="condicionPago" value={form.condicionPago} onChange={handleChange}
                required disabled={ro}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
              <input type="date" name="fecha" value={form.fecha} readOnly
                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Atención</label>
              <input name="atencion" value={form.atencion} onChange={handleChange} disabled={ro}
                placeholder="Nombre del destinatario"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">SOLPED</label>
              <input name="solped" value={form.solped} onChange={handleChange} disabled={ro}
                placeholder="N° SOLPED"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Referencia</label>
              <input name="referencia" value={form.referencia} onChange={handleChange}
                required disabled={ro}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
            {tipo === "venta" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tiempo de entrega</label>
                <input name="plazoEntrega" value={form.plazoEntrega} onChange={handleChange} disabled={ro}
                  placeholder="Ej. 15 días hábiles…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
            )}
            {tipo === "servicio" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Módulo</label>
                  <input name="modulo" value={form.modulo} onChange={handleChange} disabled={ro}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tarjeta</label>
                  <input name="tarjeta" value={form.tarjeta} onChange={handleChange} disabled={ro}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Equipo</label>
                  <input name="equipo" value={form.equipo} onChange={handleChange} disabled={ro}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Garantía</label>
              <input name="garantia" value={form.garantia} onChange={handleChange} disabled={ro}
                placeholder="Ej. 6 meses, 1 año…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
            </div>
          </div>
        </div>

        {esPepsico && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Plazo de entrega</label>
                <input name="plazoEntrega" value={form.plazoEntrega} onChange={handleChange} disabled={ro}
                  placeholder="ej: 30 días después de recibida la OC"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Validez de la oferta</label>
                <input name="validezOferta" value={form.validezOferta} onChange={handleChange} disabled={ro}
                  placeholder="ej: 30 días calendario"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          {esPepsico ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-500 text-white text-xs uppercase">
                    <tr>
                      <th className="px-3 py-3 text-left">Descripción</th>
                      <th className="px-3 py-3 text-center">Cantidad</th>
                      <th className="px-3 py-3 text-center">UM</th>
                      <th className="px-3 py-3 text-left">P. Unit.</th>
                      <th className="px-3 py-3 text-right">Importe</th>
                      {!ro && <th className="px-3 py-3 w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {["I","II","III","IV"].flatMap(g => {
                      const grupoItems = items.filter(i => i.grupo === g);
                      if (!grupoItems.length) return [];
                      return [
                        <tr key={`h-${g}`}>
                          <td colSpan={ro ? 5 : 6} className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600">
                            {g} — {GRUPOS_PEPSICO[g]}
                          </td>
                        </tr>,
                        ...grupoItems.map(item => {
                          const esIV = item.grupo === "IV";
                          const importe = esIV
                            ? (item.cantidad / 100 * baseIIIgrupos).toFixed(2)
                            : calcSubtotal(item).toFixed(2);
                          return (
                            <tr key={item._key} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 align-top">
                                <textarea value={item.descripcion}
                                  onChange={(e) => handleItem(item._key, "descripcion", e.target.value)}
                                  required disabled={ro} rows={3}
                                  className={`w-full resize-y ${ro ? INP_RO : INP}`} />
                              </td>
                              <td className="px-3 py-2 align-top">
                                <input type="number" min="0" step="0.01"
                                  value={item.cantidad}
                                  onChange={(e) => handleItem(item._key, "cantidad", parseFloat(e.target.value) || 0)}
                                  required disabled={ro}
                                  className={`w-16 text-center ${ro ? INP_RO : INP}`} />
                              </td>
                              <td className="px-3 py-2 align-top text-center text-sm text-gray-600">
                                {esIV ? "%" : (
                                  <input type="text"
                                    value={item.unidadMedida}
                                    onChange={(e) => handleItem(item._key, "unidadMedida", e.target.value)}
                                    disabled={ro}
                                    className={`w-14 text-center ${ro ? INP_RO : INP}`}
                                    placeholder="UN" />
                                )}
                              </td>
                              <td className="px-3 py-2 align-top">
                                {!esIV && (
                                  <input type="number" min="0" step="0.01"
                                    value={item.precio}
                                    onChange={(e) => handleItem(item._key, "precio", parseFloat(e.target.value) || 0)}
                                    required disabled={ro}
                                    className={`w-24 text-right ${ro ? INP_RO : INP}`} />
                                )}
                              </td>
                              <td className="px-3 py-2 align-top text-right font-medium text-gray-700">
                                {importe}
                              </td>
                              {!ro && (
                                <td className="px-3 py-2 align-top text-center">
                                  <button type="button" onClick={() => eliminarItem(item._key)} className="text-red-400 hover:text-red-600">✕</button>
                                </td>
                              )}
                            </tr>
                          );
                        }),
                      ];
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-xs text-gray-500">Subtotal</td>
                      <td className="px-3 py-2 text-right font-medium">{subtotalGeneral.toFixed(2)}</td>
                      {!ro && <td />}
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-xs text-gray-500">IGV 18%</td>
                      <td className="px-3 py-2 text-right font-medium">{igv.toFixed(2)}</td>
                      {!ro && <td />}
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right text-sm font-semibold text-gray-800">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900 text-base">{total.toFixed(2)}</td>
                      {!ro && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
              {!ro && (
                <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-2">
                  {["I","II","III","IV"].map(g => (
                    <button key={g} type="button" onClick={() => agregarItemPepsico(g)}
                      className="text-xs text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-800 px-3 py-1.5 rounded-lg transition">
                      + {GRUPOS_PEPSICO[g]}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-500 text-white text-xs uppercase">
                    <tr>
                      <th className="px-3 py-3 text-center w-8">#</th>
                      <th className="px-3 py-3 text-left">
                        {tipo === "servicio" ? "Título / Descripciones" : "Descripción"}
                      </th>
                      <th className="px-3 py-3 text-left">Cantidad</th>
                      {tipo === "servicio" && <th className="px-3 py-3 text-left">T. entrega</th>}
                      <th className="px-3 py-3 text-left">Precio</th>
                      <th className="px-3 py-3 text-center">Moneda</th>
                      {tipo === "servicio" && <th className="px-3 py-3 text-center">Desc. %</th>}
                      <th className="px-3 py-3 text-right">Subtotal</th>
                      {!ro && <th className="px-3 py-3 w-8"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tipo === "venta"
                      ? items.map((item, idx) => (
                          <tr key={item._key} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <input value={item.descripcion}
                                onChange={(e) => handleItem(item._key, "descripcion", e.target.value)}
                                required disabled={ro}
                                className={`w-full ${ro ? "bg-transparent border-transparent text-sm px-2 py-1" : INP}`} />
                            </td>
                            <CeldasNumericas item={item} ro={ro} onUpdate={handleItem} showFechaEntrega={false} />
                            <td className="px-3 py-2 text-right font-medium text-gray-700">
                              {calcSubtotal(item).toFixed(2)}
                            </td>
                            {!ro && (
                              <td className="px-3 py-2 text-center">
                                <button type="button" onClick={() => eliminarItem(item._key)} className="text-red-400 hover:text-red-600">✕</button>
                              </td>
                            )}
                          </tr>
                        ))
                      : items.map((item, idx) => (
                          <Fragment key={item._key}>
                            <tr className="hover:bg-gray-50/50">
                              <td className="px-3 py-2 text-center text-gray-400 align-top pt-3">{idx + 1}</td>
                              <td className="px-3 py-2">
                                <input value={item.descripcion}
                                  onChange={(e) => handleItem(item._key, "descripcion", e.target.value)}
                                  required disabled={ro} placeholder="Título del servicio"
                                  className={`w-full font-medium ${ro ? "bg-transparent border-transparent text-sm px-2 py-1" : INP}`} />
                              </td>
                              <CeldasNumericas item={item} ro={ro} onUpdate={handleItem} />
                              <td className="px-3 py-2 align-top pt-3">
                                <input type="number" min="0" max="100" step="0.01"
                                  value={item.descuento || 0}
                                  onChange={(e) => handleItem(item._key, "descuento", parseFloat(e.target.value) || 0)}
                                  disabled={ro}
                                  className={`w-16 text-center ${ro ? INP_RO : INP}`} />
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-gray-700 align-top pt-3">
                                {(calcSubtotal(item) * (1 - (item.descuento || 0) / 100)).toFixed(2)}
                              </td>
                              {!ro && (
                                <td className="px-3 py-2 text-center align-top pt-2.5">
                                  <button type="button" onClick={() => eliminarItem(item._key)} className="text-red-400 hover:text-red-600">✕</button>
                                </td>
                              )}
                            </tr>
                            {item.subItems.map((sub) => (
                              <tr key={sub._subKey} className="bg-gray-50/40">
                                <td></td>
                                <td className="px-3 py-1 pl-9">
                                  {ro ? (
                                    <span className="text-gray-500 text-sm">• {sub.texto}</span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-300 select-none text-xs">•</span>
                                      <input value={sub.texto}
                                        onChange={(e) => handleSubItem(item._key, sub._subKey, e.target.value)}
                                        placeholder="Descripción del trabajo"
                                        className="flex-1 border border-gray-200 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                                      <button type="button" onClick={() => eliminarSubItem(item._key, sub._subKey)}
                                        className="text-red-300 hover:text-red-500 text-xs shrink-0">✕</button>
                                    </div>
                                  )}
                                </td>
                                <td colSpan={ro ? 7 : 8}></td>
                              </tr>
                            ))}
                            {!ro && (
                              <tr className="bg-gray-50/40">
                                <td></td>
                                <td className="px-3 py-1.5 pl-9">
                                  <button type="button" onClick={() => agregarSubItem(item._key)}
                                    className="text-xs text-gray-400 hover:text-gray-700 transition">
                                    + agregar descripción
                                  </button>
                                </td>
                                <td colSpan={tipo === "venta" ? 5 : 8}></td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td colSpan={tipo === "venta" ? 5 : 8} className="px-4 py-2 text-right text-xs text-gray-500">Subtotal</td>
                      <td className="px-3 py-2 text-right font-medium">{subtotalBruto.toFixed(2)}</td>
                      {!ro && <td />}
                    </tr>
                    {descuentoTotal > 0 && <>
                      <tr>
                        <td colSpan={tipo === "venta" ? 5 : 8} className="px-4 py-2 text-right text-xs text-red-400">Descuento</td>
                        <td className="px-3 py-2 text-right font-medium text-red-500">- {descuentoTotal.toFixed(2)}</td>
                        {!ro && <td />}
                      </tr>
                      <tr>
                        <td colSpan={tipo === "venta" ? 5 : 8} className="px-4 py-2 text-right text-xs text-gray-500">Total sin IGV</td>
                        <td className="px-3 py-2 text-right font-medium">{subtotalGeneral.toFixed(2)}</td>
                        {!ro && <td />}
                      </tr>
                    </>}
                    <tr>
                      <td colSpan={tipo === "venta" ? 5 : 8} className="px-4 py-2 text-right text-xs text-gray-500">IGV 18%</td>
                      <td className="px-3 py-2 text-right font-medium">{igv.toFixed(2)}</td>
                      {!ro && <td />}
                    </tr>
                    <tr>
                      <td colSpan={tipo === "venta" ? 5 : 8} className="px-4 py-2 text-right text-sm font-semibold text-gray-800">Total con IGV</td>
                      <td className="px-3 py-2 text-right font-bold text-gray-900 text-base">{total.toFixed(2)}</td>
                      {!ro && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
              {!ro && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <button type="button" onClick={agregarItem}
                    className="text-sm text-gray-500 hover:text-gray-800 transition">
                    + Agregar ítem
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          {!guardado ? (
            <button type="button" onClick={() => {
                const err = validar();
                if (err) { setError(err); return; }
                setError("");
                setConfirmando(true);
              }}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
              Guardar cotización
            </button>
          ) : (
            <>
              <button type="button" onClick={() => {
                  const cotParaPdf = { ...guardado, empresa: empresaSel || guardado.empresa };
                  const ieParaPdf = otsSel.length > 0 ? otsSel[0].ingresoEquipo : null;
                  if (esPepsico) exportarCotizacionPdfPepsico(cotParaPdf, ieParaPdf);
                  else if (tipo === "venta") exportarCotizacionVenta(cotParaPdf, ieParaPdf);
                  else exportarCotizacionPdf(cotParaPdf, ieParaPdf);
                }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                Exportar PDF
              </button>
              <button type="button" onClick={nueva}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition">
                Nueva cotización
              </button>
            </>
          )}
        </div>
      </form>

      {confirmando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">¿Guardar cotización?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Una vez guardada, los datos no podrán editarse desde esta vista.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmando(false)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={async () => { setConfirmando(false); await guardar(); }}
                disabled={cargando}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition disabled:opacity-50">
                {cargando ? "Guardando..." : "Confirmar y guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
