import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchAuth } from "../utils/fetchAuth";
import ModalCotizacion from "../components/ModalCotizacion";
import * as XLSX from "xlsx";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const FILTROS_VACIO = { empresa: "", planta: "", ano: "", mes: "", tipo: "", oc: "", busqueda: "" };

const codigosOTs = (ots) =>
  ots?.length ? ots.map((o) => o.codigo).join(", ") : null;

const badgeEstadoCot = (estado) => {
  const map = {
    "pendiente aprobacion": "bg-gray-100 text-gray-600",
    "aprobada":             "bg-emerald-50 text-emerald-700",
    "en progreso":          "bg-blue-50 text-blue-700",
    "a la espera de OC":    "bg-amber-50 text-amber-700",
    "en facturacion":       "bg-purple-50 text-purple-700",
    "cerrada":              "bg-teal-50 text-teal-700",
    "sin ejecutar":         "bg-red-50 text-red-600",
  };
  const labelMap = {
    "pendiente aprobacion": "Pend. aprobación",
    "aprobada":             "Aprobada",
    "en progreso":          "En progreso",
    "a la espera de OC":    "Espera OC",
    "en facturacion":       "En facturación",
    "cerrada":              "Cerrada",
    "sin ejecutar":         "Sin ejecutar",
  };
  const cls = map[estado] || "bg-gray-100 text-gray-500";
  const label = labelMap[estado] || estado || "—";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
};

export default function ListaCotizaciones() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [filtros, setFiltros] = useState({
    ...FILTROS_VACIO,
    oc:      location.state?.filtroOC      || "",
    empresa: location.state?.filtroEmpresa || "",
  });
  const [seleccionada, setSeleccionada] = useState(null);
  const [otsPorCot, setOtsPorCot] = useState(new Map());
  const [ocPorCot, setOcPorCot] = useState(new Map());

  const buildOtsMap = (ots) => {
    const m = new Map();
    ots.forEach((o) => {
      if (!o.cotizacion?._id) return;
      const id = o.cotizacion._id;
      if (!m.has(id)) m.set(id, []);
      m.get(id).push(o);
    });
    return m;
  };

  const buildOcMap = (ocs) => {
    const m = new Map();
    ocs.forEach((oc) => {
      const id = oc.cotizacion?._id || oc.cotizacion;
      if (id && !m.has(id)) m.set(id, oc);
    });
    return m;
  };

  const cargar = () =>
    Promise.all([
      fetchAuth("/cotizaciones").then((r) => r.ok ? r.json() : []),
      fetchAuth("/ordenes-trabajo").then((r) => r.ok ? r.json() : []),
      fetchAuth("/ordenes-compra").then((r) => r.ok ? r.json() : []),
    ]).then(([cots, ots, ocs]) => {
      setCotizaciones(cots);
      setOtsPorCot(buildOtsMap(ots));
      setOcPorCot(buildOcMap(ocs));
    });

  useEffect(() => { cargar(); }, []);

  const anos = [...new Set(cotizaciones.map((c) => new Date(c.fecha).getUTCFullYear()))].sort(
    (a, b) => b - a
  );

  const empresasLista = [
    ...new Map(
      cotizaciones.filter((c) => c.empresa?._id).map((c) => [c.empresa._id, c.empresa])
    ).values(),
  ].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));

  const plantasLista = [...new Set(
    [...otsPorCot.values()].flat()
      .map((o) => o.ingresoEquipo?.planta)
      .filter(Boolean)
  )].sort();

  const handleFiltro = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  const filtradas = cotizaciones.filter((c) => {
    const fecha = new Date(c.fecha);
    const q = filtros.busqueda.toLowerCase();
    return (
      (!filtros.empresa || c.empresa?._id === filtros.empresa) &&
      (!filtros.planta  || otsPorCot.get(c._id)?.some((o) => o.ingresoEquipo?.planta === filtros.planta)) &&
      (!filtros.ano || fecha.getUTCFullYear() === parseInt(filtros.ano)) &&
      (!filtros.mes || fecha.getUTCMonth() + 1 === parseInt(filtros.mes)) &&
      (!filtros.tipo || c.tipo === filtros.tipo) &&
      (!filtros.oc  || (filtros.oc === "con" ? ocPorCot.has(c._id) : !ocPorCot.has(c._id))) &&
      (!q ||
        c.codigo?.toLowerCase().includes(q) ||
        c.titulo?.toLowerCase().includes(q) ||
        c.empresa?.razonSocial?.toLowerCase().includes(q) ||
        c.empresa?.ruc?.includes(q))
    );
  });

  const exportarExcel = () => {
    const datos = filtradas.map((c) => {
      const codigos = codigosOTs(otsPorCot.get(c._id));
      const oc      = ocPorCot.get(c._id);
      return {
        "Código":              c.codigo,
        "Tipo":                c.tipo,
        "N° OT":               codigos || "—",
        "Empresa":             c.empresa ? `${c.empresa.alias} — ${c.empresa.razonSocial}` : "",
        "RUC":                 c.empresa?.ruc ?? "",
        "Título":              c.titulo,
        "Fecha":               new Date(c.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" }),
        "Total - IGV":         (Number(c.total) / 1.18).toFixed(2),
        "N° Orden de Compra":  oc?.numeroOrden || "—",
      };
    });
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotizaciones");
    XLSX.writeFile(wb, "cotizaciones.xlsx");
  };

  const SELECT =
    "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400";

  return (
    <>
    <div className="p-6 ">
      <div className="d-flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Cotizaciones</h2>
        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Exportar Excel
          </button>
          <button
            onClick={() => navigate("/cotizaciones/nueva")}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
          >
            + Nueva cotización
          </button>
        </div>
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

         {plantasLista.length > 0 && (
          <select name="planta" value={filtros.planta} onChange={handleFiltro} className={SELECT}>
            <option value="">Toda planta</option>
            {plantasLista.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}

        <select name="ano" value={filtros.ano} onChange={handleFiltro} className={SELECT}>
          <option value="">Todos los años</option>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select name="mes" value={filtros.mes} onChange={handleFiltro} className={SELECT}>
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>

        <select name="tipo" value={filtros.tipo} onChange={handleFiltro} className={SELECT}>
          <option value="">Venta y Servicio</option>
          <option value="venta">Venta</option>
          <option value="servicio">Servicio</option>
        </select>

        <select name="oc" value={filtros.oc} onChange={handleFiltro} className={SELECT}>
          <option value="">Con y sin OC</option>
          <option value="con">Con OC</option>
          <option value="sin">Sin OC</option>
        </select>



        <input
          name="busqueda"
          value={filtros.busqueda}
          onChange={handleFiltro}
          placeholder="Buscar por código, empresa, RUC o título…"
          className={`${SELECT} flex-1 min-w-52`}
        />

        {Object.values(filtros).some(Boolean) && (
          <button
            onClick={() => setFiltros(FILTROS_VACIO)}
            className="text-sm text-gray-400 hover:text-gray-700 transition"
          >
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
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-center">N° OT</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-center">Fecha</th>
              <th className="px-4 py-3 text-right">Total sin IGV</th>
              <th className="px-4 py-3 text-center">N° Orden de Compra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  {Object.values(filtros).some(Boolean)
                    ? "Sin resultados para los filtros aplicados"
                    : "Sin cotizaciones registradas"}
                </td>
              </tr>
            ) : (
              filtradas.map((c) => {
                const ots    = otsPorCot.get(c._id) || [];
                const oc     = ocPorCot.get(c._id);
                const noEjec = c.noEjecutado;
                const rowCls = `hover:bg-gray-50 cursor-pointer ${noEjec ? "opacity-50" : ""}`;
                const tdCls  = noEjec ? "line-through" : "";

                const tipoBadge = (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    c.tipo === "venta" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                  } ${noEjec ? "opacity-60" : ""}`}>{c.tipo}</span>
                );

                const ocCell = oc?.numeroOrden
                  ? <span className={`font-mono text-gray-700 ${tdCls}`}>{oc.numeroOrden}</span>
                  : <span className="text-gray-300">—</span>;

                // Columna N° OT: todos los códigos separados por coma
                const otsCodigos = codigosOTs(ots);

                // Columna Equipo: primer OT con ingresoEquipo, o primer ítem de la cotización
                const primerOTconIE = ots.find((o) => o.ingresoEquipo);
                let equipoTxt;
                if (primerOTconIE) {
                  const ie = primerOTconIE.ingresoEquipo;
                  equipoTxt = [ie.planta, ie.tipoEquipo, [ie.marca, ie.modelo].filter(Boolean).join("/")]
                    .filter(Boolean).join(" · ");
                } else {
                  const primerItem = c.tipo === "servicio"
                    ? (c.items?.find((i) => i.grupo === "I") || c.items?.[0])
                    : c.items?.[0];
                  equipoTxt = primerItem?.descripcion || null;
                }

                return (
                  <tr key={c._id} className={rowCls} onClick={() => setSeleccionada(c)}>
                    <td className={`px-4 py-3 font-mono text-sm text-black ${tdCls}`}>{c.codigo}</td>
                    <td className="px-4 py-3">{tipoBadge}</td>
                    <td className={`px-4 py-3 text-center font-mono text-xs text-emerald-700 ${tdCls}`}>
                      {otsCodigos || <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 text-gray-600 ${tdCls}`}>
                      {c.empresa?.razonSocial || <span className="text-gray-400">Sin empresa</span>}
                    </td>
                    <td className="px-4 py-3 text-center">{badgeEstadoCot(c.estado)}</td>
                    <td className={`px-4 py-3 text-xs text-gray-500 ${tdCls}`}>
                      {equipoTxt
                        ? equipoTxt.length > 60 ? equipoTxt.slice(0, 60) + "…" : equipoTxt
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`px-4 py-3 text-center text-gray-500 ${tdCls}`}>
                      {new Date(c.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" })}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${tdCls}`}>
                      {(Number(c.total) / 1.18).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">{ocCell}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>

    {seleccionada && (
      <ModalCotizacion
        cotizacion={seleccionada}
        onClose={() => setSeleccionada(null)}
        onSaved={(actualizada) => {
          setCotizaciones((prev) =>
            prev.map((c) => (c._id === actualizada._id ? actualizada : c))
          );
          setSeleccionada(actualizada);
          fetchAuth("/ordenes-trabajo").then((r) => r.ok && r.json())
            .then((ots) => { if (ots) setOtsPorCot(buildOtsMap(ots)); });
        }}
      />
    )}
    </>
  );
}

