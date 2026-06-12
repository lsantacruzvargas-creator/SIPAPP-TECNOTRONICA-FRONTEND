import { useState, useEffect } from "react";
import { fetchAuth, uploadAuth, imgUrl } from "../utils/fetchAuth";
import ModalEditarOrdenCompra from "../components/ModalEditarOrdenCompra";

const badgeOT = (estado) => {
  if (estado === "entregado")   return "bg-teal-50 text-teal-700";
  if (estado === "completado")  return "bg-green-50 text-green-700";
  if (estado === "en progreso") return "bg-blue-50 text-blue-700";
  if (estado === "pendiente")   return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-400";
};

const badgePago = (estado) => {
  if (estado === "pagado")       return "bg-green-50 text-green-700";
  if (estado === "pago parcial") return "bg-amber-50 text-amber-700";
  if (estado === "sin pago")     return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-400";
};

const ESTADOS_OT = ["", "pendiente", "en progreso", "completado"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export default function ListaOrdenesCompra() {
  const hoy = new Date();
  const [ordenes, setOrdenes]       = useState([]);
  const [otMap, setOtMap]           = useState({});
  const [factMap, setFactMap]       = useState({});
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [estadoOT, setEstadoOT] = useState("");
  const [estadoAnulada, setEstadoAnulada] = useState("");
  const [anio, setAnio]         = useState(hoy.getFullYear());
  const [mes, setMes]           = useState(hoy.getMonth() + 1);

  const cargar = () =>
    Promise.all([
      fetchAuth("/ordenes-compra").then((r) => r.ok ? r.json() : []),
      fetchAuth("/ordenes-trabajo").then((r) => r.ok ? r.json() : []),
      fetchAuth("/facturas").then((r) => r.ok ? r.json() : []),
    ]).then(([ocs, ots, facts]) => {
      setOrdenes(ocs);
      const otM = {};
      ots.forEach((ot) => {
        const cotId = ot.cotizacion?._id || ot.cotizacion;
        if (cotId) otM[cotId] = ot.estado;
      });
      setOtMap(otM);
      const factM = {};
      facts.forEach((f) => {
        const cotId = f.cotizacion?._id || f.cotizacion;
        if (cotId && !factM[cotId]) factM[cotId] = f;
      });
      setFactMap(factM);
    });

  useEffect(() => { cargar(); }, []);

  const anios = [...new Set(ordenes.map((o) => new Date(o.fecha).getUTCFullYear()))].sort((a, b) => b - a);

  const filtradas = ordenes.filter((o) => {
    const fecha = new Date(o.fecha);
    const matchAnio  = fecha.getUTCFullYear() === anio;
    const matchMes   = fecha.getUTCMonth() + 1 === mes;
    const txt = busqueda.toLowerCase();
    const matchBusq  = !txt
      || o.numeroOrden?.toLowerCase().includes(txt)
      || o.titulo?.toLowerCase().includes(txt)
      || o.empresa?.razonSocial?.toLowerCase().includes(txt)
      || o.empresa?.ruc?.includes(txt)
      || o.cotizacion?.codigo?.toLowerCase().includes(txt);
    const cotId      = o.cotizacion?._id || o.cotizacion;
    const estadoActual = otMap[cotId];
    const matchEstado = !estadoOT || estadoActual === estadoOT;
    const matchAnulada = !estadoAnulada || (estadoAnulada === "anulada" ? o.anulada : !o.anulada);
    return matchAnio && matchMes && matchBusq && matchEstado && matchAnulada;
  });

  const hayFiltro = busqueda || estadoOT || anio !== hoy.getFullYear() || mes !== hoy.getMonth() + 1;

  const subirDocumento = async (id, file) => {
    const fd = new FormData();
    fd.append("documento", file);
    const res = await uploadAuth(`/ordenes-compra/${id}/documento`, fd);
    if (res.ok) {
      const actualizada = await res.json();
      setOrdenes((prev) => prev.map((o) => o._id === id ? { ...o, documento: actualizada.documento } : o));
    }
  };

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Órdenes de Compra</h2>
          <p className="text-xs text-gray-400 mt-0.5">{filtradas.length} orden{filtradas.length !== 1 ? "es" : ""}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {anios.length === 0
            ? <option value={anio}>{anio}</option>
            : anios.map((a) => <option key={a} value={a}>{a}</option>)
          }
        </select>
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {MESES.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por N° orden, empresa, RUC, título o cotización…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-60 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <select
          value={estadoOT}
          onChange={(e) => setEstadoOT(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {ESTADOS_OT.map((e) => (
            <option key={e} value={e}>{e ? e.charAt(0).toUpperCase() + e.slice(1) : "Todo estado OT"}</option>
          ))}
        </select>
        <select
          value={estadoAnulada}
          onChange={(e) => setEstadoAnulada(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">Vigentes y anuladas</option>
          <option value="vigente">Vigentes</option>
          <option value="anulada">Anuladas</option>
        </select>
        {hayFiltro && (
          <button
            onClick={() => { setBusqueda(""); setEstadoOT(""); setAnio(hoy.getFullYear()); setMes(hoy.getMonth() + 1); }}
            className="text-sm text-gray-400 hover:text-gray-700 transition"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-500 text-white text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">N° Orden de Compra</th>
              <th className="px-4 py-3 text-left">Cotización</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-right">Total con IGV (S/)</th>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-center">Estado OT</th>
              <th className="px-4 py-3 text-center">N° Factura</th>
              <th className="px-4 py-3 text-center">Estado Pago</th>
              <th className="px-4 py-3 text-center">Documento</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtradas.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sin órdenes de compra</td></tr>
            ) : filtradas.map((o) => {
              const cotId = o.cotizacion?._id || o.cotizacion;
              const estadoActual = otMap[cotId];
              const factura = factMap[cotId];
              return (
                <tr key={o._id} className={`hover:bg-gray-50 cursor-pointer ${o.anulada ? "opacity-50 line-through" : ""}`} onClick={() => setOrdenSeleccionada(o)}>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.numeroOrden || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{o.cotizacion?.codigo || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{o.empresa?.razonSocial || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{o.titulo}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {Number(o.monto).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {new Date(o.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {estadoActual ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgeOT(estadoActual)}`}>
                        {estadoActual}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">Sin OT</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-ms text-gray-700">
                    {factura?.numeroFactura || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {factura?.estadoPago ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgePago(factura.estadoPago)}`}>
                        {factura.estadoPago}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <label className="cursor-pointer inline-flex flex-col items-center gap-1">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => { if (e.target.files[0]) subirDocumento(o._id, e.target.files[0]); e.target.value = ""; }}
                      />
                      {o.documento ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={imgUrl(o.documento)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                          >
                            Ver PDF
                          </a>
                          <span className="text-gray-300">|</span>
                          <span className="text-xs text-gray-400 hover:text-gray-600 underline">Reemplazar</span>
                        </div>
                      ) : (
                        <span className="text-xs text-blue-500 hover:text-blue-700 underline">Subir PDF</span>
                      )}
                    </label>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {o.anulada
                      ? <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Anulada</span>
                      : <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Vigente</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {ordenSeleccionada && (
        <ModalEditarOrdenCompra
          orden={ordenSeleccionada}
          onClose={() => setOrdenSeleccionada(null)}
          onGuardada={(actualizada) => {
            setOrdenes((prev) => prev.map((o) => o._id === actualizada._id ? actualizada : o));
            setOrdenSeleccionada(actualizada);
            cargar();
          }}
        />
      )}
    </div>
  );
}
