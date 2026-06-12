import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import ModalEditarFactura from "../components/ModalEditarFactura";
import * as XLSX from "xlsx";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const FILTROS_VACIO = { empresa: "", ano: "", mes: "", estadoPago: "", estado: "", busqueda: "" };

const ESTADOS_PAGO = [
  { valor: "sin pago",    label: "Sin pago",    cls: "bg-red-50 text-red-700" },
  { valor: "pago parcial", label: "Pago parcial", cls: "bg-amber-50 text-amber-700" },
  { valor: "pagado",      label: "Pagado",      cls: "bg-green-50 text-green-700" },
];

function estadoPagoClase(v) {
  return ESTADOS_PAGO.find((e) => e.valor === v)?.cls ?? "bg-gray-100 text-gray-500";
}

function estadoVencimiento(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  const hoyMs = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const v = new Date(fecha);
  const venceMs = Date.UTC(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate());
  const dias = (venceMs - hoyMs) / (1000 * 60 * 60 * 24);
  if (dias < 0)  return "vencida";
  if (dias <= 7) return "proximo";
  return "pendiente";
}

function BadgeVencimiento({ fecha }) {
  if (!fecha) return <span className="text-gray-300 text-xs">—</span>;

  const estado = estadoVencimiento(fecha);
  const fechaStr = new Date(fecha).toLocaleDateString("es-PE", { timeZone: "UTC" });

  if (estado === "vencida") {
    return (
      <span className="inline-flex flex-col items-center gap-0.5">
        <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">Vencida</span>
        <span className="text-xs text-red-400">{fechaStr}</span>
      </span>
    );
  }
  if (estado === "proximo") {
    return (
      <span className="inline-flex flex-col items-center gap-0.5">
        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Próx. a vencer</span>
        <span className="text-xs text-amber-500">{fechaStr}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Pendiente</span>
      <span className="text-xs text-gray-400">{fechaStr}</span>
    </span>
  );
}

const SELECT = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400";

export default function ListaFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIO);
  const [seleccionada, setSeleccionada] = useState(null);

  const cargar = () =>
    fetchAuth("/facturas")
      .then((r) => r.ok ? r.json() : [])
      .then(setFacturas);

  useEffect(() => { cargar(); }, []);

  const empresasLista = [
    ...new Map(
      facturas.filter((f) => f.empresa?._id).map((f) => [f.empresa._id, f.empresa])
    ).values(),
  ].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));

  const anos = [...new Set(facturas.map((f) => new Date(f.fechaEmision).getUTCFullYear()))].sort((a, b) => b - a);

  const handleFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const filtradas = facturas.filter((f) => {
    const fecha = new Date(f.fechaEmision);
    const q = filtros.busqueda.toLowerCase();
    return (
      (!filtros.empresa || f.empresa?._id === filtros.empresa) &&
      (!filtros.ano || fecha.getUTCFullYear() === parseInt(filtros.ano)) &&
      (!filtros.mes || fecha.getUTCMonth() + 1 === parseInt(filtros.mes)) &&
      (!filtros.estadoPago || f.estadoPago === filtros.estadoPago) &&
      (!filtros.estado || (filtros.estado === "anulada" ? f.anulada : !f.anulada)) &&
      (!q ||
        f.empresa?.razonSocial?.toLowerCase().includes(q) ||
        f.empresa?.ruc?.includes(q) ||
        f.cotizacion?.titulo?.toLowerCase().includes(q) ||
        f.numeroFactura?.toLowerCase().includes(q) ||
        f.numeroOrdenCompra?.toLowerCase().includes(q))
    );
  });

  const handlePagoChange = (id, valor) =>
    setFacturas((prev) =>
      prev.map((f) => f._id === id ? { ...f, montoPagado: valor } : f)
    );

  const handlePagoBlur = (id, valor) => {
    const factura = facturas.find((f) => f._id === id);
    if (!factura) return;
    const totalAPagar = Number(factura.totalAPagar) || 0;
    const pago        = parseFloat(valor) || 0;
    let estadoPago = "sin pago";
    if (pago > 0 && pago < totalAPagar) estadoPago = "pago parcial";
    if (totalAPagar > 0 && pago >= totalAPagar) estadoPago = "pagado";
    setFacturas((prev) =>
      prev.map((f) => f._id === id ? { ...f, montoPagado: pago, estadoPago } : f)
    );
    fetchAuth(`/facturas/${id}/estado-pago`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montoPagado: pago }),
    });
  };

  const exportarExcel = () => {
    const datos = filtradas.map((f) => ({
      "Código":            f.codigo,
      "N° Factura":        f.numeroFactura    || "—",
      "Orden de compra":   f.numeroOrdenCompra || "—",
      "Empresa":           f.empresa ? `${f.empresa.alias} — ${f.empresa.razonSocial}` : "—",
      "RUC":               f.empresa?.ruc ?? "—",
      "Tipo":              f.cotizacion?.tipo ?? "—",
      "Título cotización": f.cotizacion?.titulo ?? "—",
      "Monto":             f.monto != null ? Number(f.monto).toFixed(2) : "—",
      "Detracción (12%)":  f.detraccion  ? Number(f.detraccion).toFixed(2)  : "—",
      "Retención (3%)":    f.retencion   ? Number(f.retencion).toFixed(2)   : "—",
      "Total a pagar":     f.totalAPagar != null ? Number(f.totalAPagar).toFixed(2) : "—",
      "Pago":              Number(f.montoPagado ?? 0).toFixed(2),
      "Fecha emisión":     new Date(f.fechaEmision).toLocaleDateString("es-PE", { timeZone: "UTC" }),
      "Fecha vencimiento": f.fechaVencimiento ? new Date(f.fechaVencimiento).toLocaleDateString("es-PE") : "—",
      "Guía emisión":      f.numeroGuiaEmision  || "—",
      "Guía remisión":     f.numeroGuiaRemision || "—",
      "Estado pago":       f.estadoPago,
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Facturas");
    XLSX.writeFile(wb, "facturas.xlsx");
  };

  return (
    <>
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Facturas</h2>
        <button
          onClick={exportarExcel}
          className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          Exportar Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <select name="empresa" value={filtros.empresa} onChange={handleFiltro} className={SELECT}>
          <option value="">Toda empresa</option>
          {empresasLista.map((e) => (
            <option key={e._id} value={e._id}>
              {e.alias ? `${e.alias} — ` : ""}{e.razonSocial}
            </option>
          ))}
        </select>

        <select name="ano" value={filtros.ano} onChange={handleFiltro} className={SELECT}>
          <option value="">Todos los años</option>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select name="mes" value={filtros.mes} onChange={handleFiltro} className={SELECT}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>

        <select name="estadoPago" value={filtros.estadoPago} onChange={handleFiltro} className={SELECT}>
          <option value="">Todos los estados pago</option>
          {ESTADOS_PAGO.map(({ valor, label }) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
        <select name="estado" value={filtros.estado} onChange={handleFiltro} className={SELECT}>
          <option value="">Vigentes y anuladas</option>
          <option value="vigente">Vigentes</option>
          <option value="anulada">Anuladas</option>
        </select>

        <input
          name="busqueda"
          value={filtros.busqueda}
          onChange={handleFiltro}
          placeholder="Buscar por empresa, RUC, título, N° factura u orden de compra…"
          className={`${SELECT} flex-1 min-w-52`}
        />

        {Object.values(filtros).some(Boolean) && (
          <button onClick={() => setFiltros(FILTROS_VACIO)}
            className="text-sm text-gray-400 hover:text-gray-700 transition">
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-500 text-white text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left" hidden>Código</th>
              <th className="px-4 py-3 text-left">N° Factura</th>
              <th className="px-4 py-3 text-left">Orden de compra</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-center">Tipo</th>
              <th className="px-4 py-3 text-left">Título cotización</th>
              <th className="px-4 py-3 text-center">Total con IGV</th>
              <th className="px-4 py-3 text-right">Detracción</th>
              <th className="px-4 py-3 text-right">Retención</th>
              <th className="px-4 py-3 text-right">Total a pagar</th>
              <th className="px-4 py-3 text-right">Pago</th>
              <th className="px-4 py-3 text-center">Emisión</th>
              <th className="px-4 py-3 text-center">Vencimiento</th>
              <th className="px-4 py-3 text-center">Estado pago</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-8 text-center text-gray-400">
                  {Object.values(filtros).some(Boolean)
                    ? "Sin resultados para los filtros aplicados"
                    : "Sin facturas registradas"}
                </td>
              </tr>
            ) : (
              <>
              {filtradas.map((f) => (
                <tr key={f._id} className={`hover:bg-gray-50 cursor-pointer ${f.anulada ? "opacity-50 line-through" : ""}`} onClick={() => setSeleccionada(f)} >
                  <td className="px-4 py-3 font-mono text-xs text-gray-700" hidden>{f.codigo}</td>
                  <td className="px-4 py-3 font-medium text-black-800">
                    {f.numeroFactura || <span className="text-gray-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {f.numeroOrdenCompra || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {f.empresa ? (
                      <>
                        {/* <span className="font-medium">{f.empresa.alias}</span> */}
                        <span className="text-gray-600">  {f.empresa.razonSocial}</span>
                      </>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {f.cotizacion?.tipo ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        f.cotizacion.tipo === "venta" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                      }`}>
                        {f.cotizacion.tipo}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{f.cotizacion?.titulo || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {f.monto != null ? Number(f.monto).toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {f.detraccion ? Number(f.detraccion).toFixed(2) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {f.retencion ? Number(f.retencion).toFixed(2) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {f.totalAPagar != null ? Number(f.totalAPagar).toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number" min="0" step="0.01"
                      value={f.montoPagado ?? 0}
                      onChange={(e) => handlePagoChange(f._id, e.target.value)}
                      onBlur={(e) => handlePagoBlur(f._id, e.target.value)}
                      className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {new Date(f.fechaEmision).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <BadgeVencimiento fecha={f.fechaVencimiento} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${estadoPagoClase(f.estadoPago)}`}>
                      {f.estadoPago}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {f.anulada
                      ? <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Anulada</span>
                      : <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Vigente</span>
                    }
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-sm">
                {(() => {
                  const vigentes = filtradas.filter(f => !f.anulada);
                  return (<>
                <td hidden />
                <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase tracking-wide text-gray-400">
                  Totales ({vigentes.length} vigente{vigentes.length !== 1 ? "s" : ""})
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {vigentes.reduce((s, f) => s + (f.monto ?? 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {vigentes.reduce((s, f) => s + (Number(f.detraccion) || 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {vigentes.reduce((s, f) => s + (Number(f.retencion) || 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {vigentes.reduce((s, f) => s + (Number(f.totalAPagar) || 0), 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-800">
                  {vigentes.reduce((s, f) => s + (Number(f.montoPagado) || 0), 0).toFixed(2)}
                </td>
                <td colSpan={3} />
                  </>);
                })()}
              </tr>
              </>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>

    {seleccionada && (
      <ModalEditarFactura
        factura={seleccionada}
        onClose={() => setSeleccionada(null)}
        onGuardada={(actualizada) => {
          setFacturas((prev) => prev.map((f) => (f._id === actualizada._id ? actualizada : f)));
          setSeleccionada(actualizada);
          cargar();
        }}
      />
    )}
    </>
  );
}
