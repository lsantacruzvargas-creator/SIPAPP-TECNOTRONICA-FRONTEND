import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import { exportarCotizacionPdf } from "../utils/cotizacionPdf";
import { exportarCotizacionPdf as exportarCotizacionPdfPepsico } from "../utils/cotizacionPdf3";
import { exportarCotizacionVenta } from "../utils/cotizacionVenta";
import ModalCrearOT from "./ModalCrearOT";
import ModalOrdenCompra from "./ModalOrdenCompra";
import {
  calcSubtotal, INP, INP_RO,
  itemDesdeDb, itemVacioVenta, itemVacioServicio, itemVacioPepsico, GRUPOS_PEPSICO,
} from "../utils/cotizacionItems";
import CeldasNumericas from "./CeldasNumericas";

// Módulo-nivel: evita desmontaje/remontaje en cada render (previene pérdida de foco)
function FilaDescripcionEditable({ item, tipo, onUpdate, onAddSub, onUpdateSub, onDeleteSub }) {
  return (
    <td className="px-3 py-2 align-top">
      <input
        type="text"
        value={item.descripcion}
        onChange={(e) => onUpdate(item._key, "descripcion", e.target.value)}
        required
        className={`w-full ${INP}`}
        placeholder="Descripción"
      />
      {tipo === "servicio" && (
        <div className="mt-1 space-y-1 pl-2">
          {item.subItems.map((sub) => (
            <div key={sub._subKey} className="flex gap-1 items-center">
              <span className="text-gray-400 text-xs">•</span>
              <input
                type="text"
                value={sub.texto}
                onChange={(e) => onUpdateSub(item._key, sub._subKey, e.target.value)}
                className={`flex-1 ${INP} text-xs`}
                placeholder="Sub-ítem"
              />
              <button
                type="button"
                onClick={() => onDeleteSub(item._key, sub._subKey)}
                className="text-red-400 hover:text-red-600 text-xs px-1 leading-none"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onAddSub(item._key)}
            className="text-xs text-gray-400 hover:text-gray-600 mt-1"
          >
            + sub-ítem
          </button>
        </div>
      )}
    </td>
  );
}

function PanelIngresoEquipo({ ie }) {
  if (!ie) return null;
  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4 space-y-3 mb-5">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
        Ingreso de equipo · <span className="font-mono">{ie.codigo}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
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
        {ie.fechaIngreso && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha de ingreso</label>
            <input value={new Date(ie.fechaIngreso).toLocaleDateString("es-PE", { timeZone: "UTC" })} disabled className={`w-full ${INP_RO}`} />
          </div>
        )}
        {ie.caracteristicasElectricas && (
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Características eléctricas</label>
            <input value={ie.caracteristicasElectricas} disabled className={`w-full ${INP_RO}`} />
          </div>
        )}
        {ie.accesorios && (
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Accesorios</label>
            <input value={ie.accesorios} disabled className={`w-full ${INP_RO}`} />
          </div>
        )}
        {ie.descripcionProblema && (
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Descripción del problema</label>
            <textarea value={ie.descripcionProblema} disabled rows={2} className={`w-full ${INP_RO} resize-none`} />
          </div>
        )}
        {ie.numeroGuiaEmision && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">N° guía de remisión</label>
            <input value={ie.numeroGuiaEmision} disabled className={`w-full ${INP_RO} font-mono`} />
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

function VistaDetalle({ cot, ie }) {
  const esPepsico = Boolean(
    cot.empresa?.razonSocial?.toLowerCase().includes("pepsico") ||
    cot.empresa?.alias?.toLowerCase().includes("pepsico")
  );

  return (
    <div>
      <PanelIngresoEquipo ie={ie} />
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Empresa</p>
          {cot.empresa ? (
            <p className="text-sm font-medium">
              {cot.empresa.alias} — {cot.empresa.razonSocial}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Sin empresa</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Condición de pago</p>
          <p className="text-sm">{cot.condicionPago}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Fecha</p>
          <p className="text-sm">{new Date(cot.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" })}</p>
        </div>
        {cot.atencion && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Atención</p>
            <p className="text-sm">{cot.atencion}</p>
          </div>
        )}
        {cot.solped && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">SOLPED</p>
            <p className="text-sm font-mono">{cot.solped}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Referencia</p>
          <p className="text-sm font-medium">{cot.referencia || cot.titulo}</p>
        </div>
        {cot.modulo && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Módulo</p>
            <p className="text-sm">{cot.modulo}</p>
          </div>
        )}
        {cot.tarjeta && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Tarjeta</p>
            <p className="text-sm">{cot.tarjeta}</p>
          </div>
        )}
        {cot.equipo && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Equipo</p>
            <p className="text-sm">{cot.equipo}</p>
          </div>
        )}
        {cot.garantia && (
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Garantía</p>
            <p className="text-sm">{cot.garantia}</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto mb-5">
        {esPepsico ? (
          <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-3 py-2 text-center">Item</th>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-center">Cant.</th>
                <th className="px-3 py-2 text-center">UM</th>
                <th className="px-3 py-2 text-right">P. Unit.</th>
                <th className="px-3 py-2 text-right">Importe Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(() => {
                const baseIIIgrupos = cot.items
                  .filter(i => ["I","II","III"].includes(i.grupo))
                  .reduce((s, i) => s + Number(i.cantidad) * Number(i.precio), 0);
                return ["I", "II", "III", "IV"].flatMap(g => {
                  const grupoItems = cot.items.filter(i => i.grupo === g);
                  if (!grupoItems.length) return [];
                  return [
                    <tr key={`h-${g}`} className="bg-gray-100">
                      <td className="px-3 py-1.5 text-center font-bold text-xs">{g}</td>
                      <td colSpan={5} className="px-3 py-1.5 font-bold text-xs">{GRUPOS_PEPSICO[g]}</td>
                    </tr>,
                    ...grupoItems.map((item, idx) => {
                      const importe = item.grupo === "IV"
                        ? (Number(item.cantidad) / 100 * baseIIIgrupos).toFixed(2)
                        : (Number(item.cantidad) * Number(item.precio)).toFixed(2);
                      return (
                        <tr key={`${g}-${idx}`}>
                          <td className="px-3 py-2 text-center text-gray-400">—</td>
                          <td className="px-3 py-2">{item.descripcion}</td>
                          <td className="px-3 py-2 text-center">{item.cantidad}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{item.unidadMedida || "UN"}</td>
                          <td className="px-3 py-2 text-right">{item.grupo !== "IV" ? Number(item.precio).toFixed(2) : "—"}</td>
                          <td className="px-3 py-2 text-right font-medium">{importe}</td>
                        </tr>
                      );
                    }),
                  ];
                });
              })()}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-center">Cant.</th>
                <th className="px-3 py-2 text-center">T. de entrega</th>
                <th className="px-3 py-2 text-right">Precio</th>
                <th className="px-3 py-2 text-center">Mon.</th>
                {cot.tipo !== "venta" && <th className="px-3 py-2 text-center">Desc. %</th>}
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cot.items.map((item, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-800">{item.descripcion}</p>
                    {item.subItems?.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.subItems.map((s, j) => (
                          <li key={j} className="text-xs text-gray-500 flex gap-1.5">
                            <span>•</span><span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">{item.cantidad}</td>
                  <td className="px-3 py-2 text-center text-gray-500">{item.fechaEntrega || "—"}</td>
                  <td className="px-3 py-2 text-right">{Number(item.precio).toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">{item.moneda === "PEN" ? "S/" : "$"}</td>
                  {cot.tipo !== "venta" && <td className="px-3 py-2 text-center text-gray-500">{item.descuento ? `${item.descuento}%` : "—"}</td>}
                  <td className="px-3 py-2 text-right font-medium">{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(() => {
        const bruto       = parseFloat(cot.items.reduce((s, i) => s + (Number(i.descuento) > 0 ? Number(i.cantidad) * Number(i.precio) : Number(i.subtotal)), 0).toFixed(2));
        const desc        = parseFloat((bruto - Number(cot.subtotal)).toFixed(2));
        const igvVista    = parseFloat((Number(cot.subtotal) * 0.18).toFixed(2));
        const totalVista  = parseFloat((Number(cot.subtotal) * 1.18).toFixed(2));
        return (
          <div className="flex justify-end gap-8 text-sm border-t border-gray-100 pt-4">
            <div className="text-right space-y-1 text-gray-500">
              <p>Subtotal</p>
              {desc > 0 && <p>Descuento</p>}
              {desc > 0 && <p>Total sin IGV</p>}
              <p>IGV 18%</p>
              <p className="font-semibold text-gray-800 text-base">Total con IGV</p>
            </div>
            <div className="text-right space-y-1">
              <p>{bruto.toFixed(2)}</p>
              {desc > 0 && <p className="text-red-500">- {desc.toFixed(2)}</p>}
              {desc > 0 && <p>{Number(cot.subtotal).toFixed(2)}</p>}
              <p>{igvVista.toFixed(2)}</p>
              <p className="font-semibold text-gray-800 text-base">{totalVista.toFixed(2)}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function ModalCotizacion({ cotizacion: inicial, onClose, onSaved }) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [cot, setCot] = useState(inicial);
  const [crearOT, setCrearOT] = useState(false);
  const [otCreada, setOtCreada] = useState(false);
  const [confirmarOC, setConfirmarOC] = useState(false);
  const [crearOC, setCrearOC]         = useState(false);
  const [form, setForm] = useState({});
  const [items, setItems] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [ie, setIe] = useState(null);

  useEffect(() => {
    const empresaId = cot.empresa?._id || cot.empresa;
    if (empresaId) {
      fetchAuth(`/empresas/${empresaId}`).then((r) => r.ok && r.json()).then((emp) => {
        if (emp) setCot((prev) => ({ ...prev, empresa: emp }));
      });
    }

    fetchAuth("/ordenes-trabajo").then((r) => r.ok && r.json()).then((ots) => {
      if (!ots) return;
      const ot = ots.find((o) => o.cotizacion?._id === cot._id && o.ingresoEquipo);
      setIe(ot?.ingresoEquipo || null);
    });
  }, [cot._id]);

  const entrarEdicion = () => {
    fetchAuth("/empresas").then((r) => r.ok && r.json().then(setEmpresas));
    setForm({
      tipo: cot.tipo,
      empresa: cot.empresa?._id || "",
      condicionPago: cot.condicionPago,
      fecha: cot.fecha ? new Date(cot.fecha).toISOString().split("T")[0] : "",
      titulo:    cot.titulo || "",
      referencia: cot.referencia || cot.titulo || "",
      atencion:  cot.atencion || "",
      solped:    cot.solped || "",
      modulo:    cot.modulo || "",
      tarjeta:   cot.tarjeta || "",
      equipo:    cot.equipo || "",
      garantia:  cot.garantia || "",
    });
    setItems((cot.items || []).map(itemDesdeDb));
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setConfirmando(false);
  };

  const handleForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const actualizarItem = (key, campo, valor) =>
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, [campo]: valor } : it)));

  const agregarSubItem = (key) =>
    setItems((prev) =>
      prev.map((it) =>
        it._key === key
          ? { ...it, subItems: [...it.subItems, { _subKey: Date.now() + Math.random(), texto: "" }] }
          : it
      )
    );

  const actualizarSubItem = (key, subKey, texto) =>
    setItems((prev) =>
      prev.map((it) =>
        it._key === key
          ? { ...it, subItems: it.subItems.map((s) => (s._subKey === subKey ? { ...s, texto } : s)) }
          : it
      )
    );

  const eliminarSubItem = (key, subKey) =>
    setItems((prev) =>
      prev.map((it) =>
        it._key === key
          ? { ...it, subItems: it.subItems.filter((s) => s._subKey !== subKey) }
          : it
      )
    );

  const agregarItem = () =>
    setItems((prev) => [
      ...prev,
      form.tipo === "servicio" ? itemVacioServicio() : itemVacioVenta(),
    ]);

  const eliminarItem = (key) => setItems((prev) => prev.filter((it) => it._key !== key));

  const agregarItemPepsico = (grupo) => setItems((prev) => [...prev, itemVacioPepsico(grupo)]);

  const esPepsico = Boolean(
    cot.empresa?.razonSocial?.toLowerCase().includes("pepsico") ||
    cot.empresa?.alias?.toLowerCase().includes("pepsico")
  );

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
    : parseFloat(items.reduce((s, it) => s + calcSubtotal(it), 0).toFixed(2));

  const descuentoTotal = esPepsico
    ? 0
    : parseFloat(items.reduce((s, it) => s + calcSubtotal(it) * ((it.descuento || 0) / 100), 0).toFixed(2));

  const subtotal = parseFloat((subtotalBruto - descuentoTotal).toFixed(2));
  const igv = parseFloat((subtotal * 0.18).toFixed(2));
  const total = parseFloat((subtotal + igv).toFixed(2));

  const guardar = async () => {
    setGuardando(true);
    setConfirmando(false);
    const payload = {
      ...form,
      items: items.map((it) => {
        const precioFinal = it.grupo === "IV"
          ? parseFloat((it.cantidad / 100 * baseIIIgrupos).toFixed(2))
          : it.precio;
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
          subtotal: it.grupo === "IV"
            ? precioFinal
            : parseFloat((calcSubtotal(it) * (1 - (it.descuento || 0) / 100)).toFixed(2)),
        };
      }),
      subtotal,
      igv,
      total,
    };
    if (!payload.empresa) delete payload.empresa;

    const res = await fetchAuth(`/cotizaciones/${cot._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const actualizada = await res.json();
      setCot(actualizada);
      setEditando(false);
      onSaved(actualizada);
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-500">{cot.codigo}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                cot.tipo === "venta"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-purple-50 text-purple-700"
              }`}
            >
              {cot.tipo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {otCreada && cot.tipo === "servicio" && (
              <span className="text-xs text-emerald-600 font-medium">✓ OT creada</span>
            )}
            <button
              type="button"
              onClick={() => {
                const _esPepsico = Boolean(
                  cot.empresa?.razonSocial?.toLowerCase().includes("pepsico") ||
                  cot.empresa?.alias?.toLowerCase().includes("pepsico")
                );
                if (_esPepsico) exportarCotizacionPdfPepsico(cot, ie);
                else if (cot.tipo === "venta") exportarCotizacionVenta(cot, ie);
                else exportarCotizacionPdf(cot, ie);
              }}
              className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              Exportar PDF
            </button>
            {!editando && (
              <>
                <button
                  type="button"
                  onClick={entrarEdicion}
                  className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition"
                >
                  Editar
                </button>
                {/* {cot.tipo === "servicio" && (
                  <button
                    type="button"
                    onClick={() => setCrearOT(true)}
                    className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium"
                  >
                    + Crear OT
                  </button>
                )} */}
                <button
                  type="button"
                  onClick={() => setConfirmarOC(true)}
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Orden de Compra
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 ml-1 text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {!editando ? (
            <VistaDetalle cot={cot} ie={ie} />
          ) : (
            <form onSubmit={(e) => e.preventDefault()}>
              <PanelIngresoEquipo ie={ie} />
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                  <select
                    name="empresa"
                    value={form.empresa}
                    onChange={handleForm}
                    className={`w-full ${INP}`}
                  >
                    <option value="">Sin empresa</option>
                    {empresas.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.alias} — {e.razonSocial}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Condición de pago</label>
                  <input
                    name="condicionPago"
                    value={form.condicionPago}
                    onChange={handleForm}
                    className={`w-full ${INP}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleForm}
                    className={`w-full ${INP}`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Atención</label>
                  <input name="atencion" value={form.atencion} onChange={handleForm} placeholder="Nombre del destinatario" className={`w-full ${INP}`} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">SOLPED</label>
                  <input name="solped" value={form.solped} onChange={handleForm} placeholder="N° SOLPED" className={`w-full ${INP}`} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Referencia</label>
                  <input name="referencia" value={form.referencia} onChange={handleForm} className={`w-full ${INP}`} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Módulo</label>
                  <input name="modulo" value={form.modulo} onChange={handleForm} className={`w-full ${INP}`} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tarjeta</label>
                  <input name="tarjeta" value={form.tarjeta} onChange={handleForm} className={`w-full ${INP}`} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Equipo</label>
                  <input name="equipo" value={form.equipo} onChange={handleForm} className={`w-full ${INP}`} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Garantía</label>
                  <input name="garantia" value={form.garantia} onChange={handleForm} placeholder="Ej. 6 meses, 1 año…" className={`w-full ${INP}`} />
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                {esPepsico ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left">Descripción</th>
                        <th className="px-3 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-center">UM</th>
                        <th className="px-3 py-2 text-right">P. Unit.</th>
                        <th className="px-3 py-2 text-right">Importe</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {["I", "II", "III", "IV"].flatMap(g => {
                        const grupoItems = items.filter(i => i.grupo === g);
                        if (!grupoItems.length) return [];
                        return [
                          <tr key={`h-${g}`}>
                            <td colSpan={6} className="px-3 py-1.5 bg-gray-100 text-xs font-semibold text-gray-600">
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
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={item.descripcion}
                                    onChange={(e) => actualizarItem(item._key, "descripcion", e.target.value)}
                                    required
                                    className={`w-full ${INP}`}
                                    placeholder="Descripción"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number" min="0" step="0.01"
                                    value={item.cantidad}
                                    onChange={(e) => actualizarItem(item._key, "cantidad", parseFloat(e.target.value) || 0)}
                                    required
                                    className={`w-16 text-center ${INP}`}
                                  />
                                </td>
                                <td className="px-3 py-2 text-center text-sm text-gray-600">
                                  {esIV ? "%" : (
                                    <input
                                      type="text"
                                      value={item.unidadMedida}
                                      onChange={(e) => actualizarItem(item._key, "unidadMedida", e.target.value)}
                                      className={`w-14 text-center ${INP}`}
                                      placeholder="UN"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {!esIV && (
                                    <input
                                      type="number" min="0" step="0.01"
                                      value={item.precio}
                                      onChange={(e) => actualizarItem(item._key, "precio", parseFloat(e.target.value) || 0)}
                                      required
                                      className={`w-24 text-right ${INP}`}
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-gray-700">
                                  {importe}
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    onClick={() => eliminarItem(item._key)}
                                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                                  >×</button>
                                </td>
                              </tr>
                            );
                          }),
                        ];
                      })}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs">
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
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <tr key={item._key}>
                          <FilaDescripcionEditable
                            item={item}
                            tipo={form.tipo}
                            onUpdate={actualizarItem}
                            onAddSub={agregarSubItem}
                            onUpdateSub={actualizarSubItem}
                            onDeleteSub={eliminarSubItem}
                          />
                          <CeldasNumericas item={item} ro={false} onUpdate={actualizarItem} />
                          {form.tipo !== "venta" && (
                            <td className="px-3 py-2">
                              <input
                                type="number" min="0" max="100" step="0.01"
                                value={item.descuento || 0}
                                onChange={(e) => actualizarItem(item._key, "descuento", parseFloat(e.target.value) || 0)}
                                className={`w-16 text-center ${INP}`}
                              />
                            </td>
                          )}
                          <td className="px-3 py-2 text-right font-medium">
                            {form.tipo !== "venta"
                              ? (calcSubtotal(item) * (1 - (item.descuento || 0) / 100)).toFixed(2)
                              : calcSubtotal(item).toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => eliminarItem(item._key)}
                              className="text-red-400 hover:text-red-600 text-lg leading-none"
                            >×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {esPepsico ? (
                <div className="flex gap-2 mb-5">
                  {["I", "II", "III", "IV"].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => agregarItemPepsico(g)}
                      className="text-xs text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-800 px-3 py-1.5 rounded-lg transition"
                    >
                      + {GRUPOS_PEPSICO[g]}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={agregarItem}
                  className="text-sm text-gray-500 hover:text-gray-800 mb-5 transition"
                >
                  + Agregar ítem
                </button>
              )}

              <div className="flex justify-end gap-8 text-sm border-t border-gray-100 pt-4 mb-5">
                <div className="text-right space-y-1 text-gray-500">
                  <p>Subtotal</p>
                  {descuentoTotal > 0 && <p>Descuento</p>}
                  {descuentoTotal > 0 && <p>Total sin IGV</p>}
                  <p>IGV 18%</p>
                  <p className="font-semibold text-gray-800 text-base">Total con IGV</p>
                </div>
                <div className="text-right space-y-1">
                  <p>{subtotalBruto.toFixed(2)}</p>
                  {descuentoTotal > 0 && <p className="text-red-500">- {descuentoTotal.toFixed(2)}</p>}
                  {descuentoTotal > 0 && <p>{subtotal.toFixed(2)}</p>}
                  <p>{igv.toFixed(2)}</p>
                  <p className="font-semibold text-gray-800 text-base">{total.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmación orden de compra */}
      {confirmarOC && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h4 className="font-semibold text-gray-800">¿Crear orden de compra?</h4>
            <p className="text-sm text-gray-500">
              Se generará una orden de compra a partir de la cotización <span className="font-mono font-medium">{cot.codigo}</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmarOC(false)}
                className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmarOC(false); setCrearOC(true); }}
                className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {crearOC && (
        <ModalOrdenCompra
          cotizacion={cot}
          onClose={() => setCrearOC(false)}
          onCreada={() => setCrearOC(false)}
        />
      )}

      {/* Modal crear OT — solo para tipo servicio */}
      {crearOT && cot.tipo === "servicio" && (
        <ModalCrearOT
          cotizacion={cot}
          onClose={() => setCrearOT(false)}
          onCreada={() => {
            setCrearOT(false);
            setOtCreada(true);
            setTimeout(() => setOtCreada(false), 3000);
          }}
        />
      )}

      {/* Modal de confirmación */}
      {confirmando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-2xl w-80">
            <p className="text-sm text-gray-700 mb-4">
              ¿Confirmar los cambios en la cotización?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
              >
                {guardando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
