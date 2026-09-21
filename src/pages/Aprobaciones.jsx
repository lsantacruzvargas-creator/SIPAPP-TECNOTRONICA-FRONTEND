import { useState, useEffect } from "react";
import { fetchAuth, getUsuario } from "../utils/fetchAuth";
import DetalleDocumento from "../components/DetalleDocumento";

const money = (v) => "S/ " + Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 });

function TablaCotizaciones({ titulo, acento, cotizaciones, onSelect, onToggleAprobar, puedeAprobar, mostrarAprobacion, vacioMsg }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-5 rounded-full ${acento}`} />
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{titulo}</h3>
        <span className="text-xs text-gray-400">({cotizaciones.length})</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-500 text-white text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Empresa</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Fecha</th>
                {mostrarAprobacion && <th className="px-4 py-3 text-left">Aprobado por</th>}
                <th className="px-4 py-3 text-center">Aprobar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cotizaciones.length === 0 ? (
                <tr><td colSpan={mostrarAprobacion ? 7 : 6} className="px-4 py-8 text-center text-gray-400">{vacioMsg}</td></tr>
              ) : cotizaciones.map((c) => (
                <tr key={c._id} className={`hover:bg-gray-50 cursor-pointer ${c.anulada ? "opacity-50" : ""}`} onClick={() => onSelect(c)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {c.codigo}
                    {c.anulada && (
                      <span title={c.motivoAnulacion} className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 uppercase">Anulada</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.empresa?.razonSocial || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-700">{c.titulo}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">{money(c.total)}</td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {c.fecha ? new Date(c.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" }) : "—"}
                  </td>
                  {mostrarAprobacion && (
                    <td className="px-4 py-3 text-gray-500">
                      {c.aprobadoPor || "—"}
                      {c.fechaAprobacion && <span className="block text-xs text-gray-400">{new Date(c.fechaAprobacion).toLocaleDateString("es-PE")}</span>}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={c.aprobado} disabled={c.anulada || !puedeAprobar}
                      onChange={() => onToggleAprobar(c)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400 disabled:opacity-40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Aprobaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const usuario = getUsuario();
  const puedeAprobar = usuario?.rol === "admin";

  const cargar = () => {
    fetchAuth("/cotizaciones").then((r) => r.ok && r.json()).then((d) => setCotizaciones(d || []));
  };

  useEffect(() => { cargar(); }, []);

  const toggleAprobar = async (cot) => {
    if (!puedeAprobar) return;
    const res = await fetchAuth(`/cotizaciones/${cot._id}/aprobar`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprobado: !cot.aprobado }),
    });
    if (res.ok) {
      const actualizada = await res.json();
      setCotizaciones((prev) => prev.map((c) => (c._id === actualizada._id ? actualizada : c)));
    }
  };

  const coincideBusqueda = (c) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return c.codigo?.toLowerCase().includes(q) || c.titulo?.toLowerCase().includes(q) || c.empresa?.razonSocial?.toLowerCase().includes(q);
  };

  const pendientes = cotizaciones.filter((c) => !c.aprobado && coincideBusqueda(c));
  const aprobadas  = cotizaciones.filter((c) => c.aprobado && coincideBusqueda(c));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Aprobación de Cotizaciones</h2>
          <span className="text-sm text-gray-400">{cotizaciones.length} cotización{cotizaciones.length !== 1 ? "es" : ""}</span>
        </div>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, empresa o título…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-full max-w-xs"
        />
      </div>

      <TablaCotizaciones
        titulo="Pendientes de aprobar"
        acento="bg-amber-500"
        cotizaciones={pendientes}
        onSelect={setSeleccionada}
        onToggleAprobar={toggleAprobar}
        puedeAprobar={puedeAprobar}
        mostrarAprobacion={false}
        vacioMsg="Sin cotizaciones pendientes de aprobar"
      />

      <TablaCotizaciones
        titulo="Aprobadas"
        acento="bg-green-500"
        cotizaciones={aprobadas}
        onSelect={setSeleccionada}
        onToggleAprobar={toggleAprobar}
        puedeAprobar={puedeAprobar}
        mostrarAprobacion={true}
        vacioMsg="Sin cotizaciones aprobadas"
      />

      {seleccionada && (
        <DetalleDocumento
          tipo="cotizacion"
          data={seleccionada}
          onClose={() => { setSeleccionada(null); cargar(); }}
          onCotizacionGuardada={(actualizada) => {
            setCotizaciones((prev) => prev.map((c) => (c._id === actualizada._id ? actualizada : c)));
          }}
        />
      )}
    </div>
  );
}
