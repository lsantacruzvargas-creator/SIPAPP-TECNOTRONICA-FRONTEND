import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAuth } from "../utils/fetchAuth";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── Colores ──────────────────────────────────────────────────────────────────
const COLOR_OT = {
  pendiente:    "#f59e0b",
  "en progreso": "#3b82f6",
  completado:   "#22c55e",
};
const COLOR_FACT = {
  "sin pago":    "#ef4444",
  "pago parcial": "#f59e0b",
  pagado:        "#22c55e",
};

// ── Tooltip personalizado ────────────────────────────────────────────────────
function TooltipCustom({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-2 text-sm">
      <span className="font-medium text-gray-700 capitalize">{name}:</span>{" "}
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

// ── Tarjeta KPI ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, onClick }) {
  const colores = {
    gray:   "bg-gray-50  border-gray-100  text-gray-800",
    blue:   "bg-blue-50  border-blue-100  text-blue-800",
    amber:  "bg-amber-50 border-amber-100 text-amber-800",
    green:  "bg-green-50 border-green-100 text-green-800",
    red:    "bg-red-50   border-red-100   text-red-800",
  };
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 flex flex-col gap-1 min-w-0 ${colores[color] ?? colores.gray} ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{label}</p>
      <p className="text-xl sm:text-3xl font-bold leading-tight break-all">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Tarjeta contraste OC vs Cotizaciones ─────────────────────────────────────
function KpiContrasteCard({ totalCots, totalOCs }) {
  const navigate = useNavigate();
  const sinOC = totalCots - totalOCs;
  const pct = totalCots > 0 ? Math.round((totalOCs / totalCots) * 100) : 0;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Conversión Cotización → OC
      </p>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Cotizaciones</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">{totalCots}</p>
        </div>
        <div className="text-2xl font-light text-gray-300 pb-1">→</div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">Órdenes de Compra</p>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-700">{totalOCs}</p>
        </div>
        <div
          className="min-w-0 cursor-pointer hover:opacity-70 transition"
          onClick={() => navigate("/cotizaciones", { state: { filtroOC: "sin" } })}
        >
          <p className="text-xs text-gray-400 mb-0.5">Cotizaciones sin OC</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-500">{sinOC}</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {totalOCs} de {totalCots} cotizaciones tienen orden de compra emitida
      </p>
    </div>
  );
}

function LabelDona({ cx, cy, midAngle, innerRadius, outerRadius, value }) {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={15} fontWeight="700">
      {value}
    </text>
  );
}

// ── Card OT en curso ─────────────────────────────────────────────────────────
function OtCard({ ot, onClick }) {
  const esEnProgreso = ot.estado === "en progreso";
  const equipo = ot.ingresoEquipo?.tipoEquipo || ot.ingresoEquipo?.marca || "Sin equipo registrado";
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-gray-400">{ot.codigo}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${
          esEnProgreso ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
        }`}>
          {ot.estado}
        </span>
      </div>
      <p className="font-semibold text-gray-800 text-sm leading-tight">{equipo}</p>
      {ot.titulo && <p className="text-xs text-gray-500 leading-snug line-clamp-2">{ot.titulo}</p>}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
        {ot.empresa && (
          <span className="text-xs text-gray-400">{ot.empresa.alias || ot.empresa.razonSocial}</span>
        )}
        {ot.personalAsignado && (
          <span className="text-xs text-gray-400">{ot.personalAsignado.nombre}</span>
        )}
        {ot.fechaEntrega && (
          <span className="text-xs text-gray-400">
            Entrega: {new Date(ot.fechaEntrega).toLocaleDateString("es-PE", { timeZone: "UTC" })}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Gráfico de dona ──────────────────────────────────────────────────────────
function GraficoDona({ titulo, datos, colores, onClickSlice }) {
  const total = datos.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{titulo}</h3>
      <p className="text-xs text-gray-400 mb-4">{total} registros en total</p>
      {total === 0 ? (
        <p className="text-sm text-gray-300 text-center py-12">Sin datos</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={datos}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={<LabelDona />}
              onClick={onClickSlice ? (data) => onClickSlice(data.name) : undefined}
              style={onClickSlice ? { cursor: "pointer" } : undefined}
            >
              {datos.map((entry) => (
                <Cell key={entry.name} fill={colores[entry.name] ?? "#9ca3af"} />
              ))}
            </Pie>
            <Tooltip content={<TooltipCustom />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-gray-600 capitalize">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const SELECT = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white";

function porFecha(arr, campoFecha, ano, mes) {
  return arr.filter((item) => {
    const f = item[campoFecha] ? new Date(item[campoFecha]) : null;
    if (!f) return true;
    if (ano && f.getUTCFullYear() !== parseInt(ano)) return false;
    if (mes && f.getUTCMonth() + 1 !== parseInt(mes)) return false;
    return true;
  });
}

function porEmpresa(arr, empresaId) {
  if (!empresaId) return arr;
  return arr.filter((item) => (item.empresa?._id || item.empresa) === empresaId);
}

// ── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const usuario  = JSON.parse(localStorage.getItem("usuario") || "null");
  const navigate = useNavigate();
  const [ots, setOts]     = useState([]);
  const [facts, setFacts] = useState([]);
  const [cots, setCots]   = useState([]);
  const [ocs, setOcs]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [filtroAno, setFiltroAno]   = useState("");
  const [filtroMes, setFiltroMes]   = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  useEffect(() => {
    const cargar = () => {
      Promise.all([
        fetchAuth("/ordenes-trabajo").then((r) => r.ok ? r.json() : []),
        fetchAuth("/facturas").then((r) => r.ok ? r.json() : []),
        fetchAuth("/cotizaciones").then((r) => r.ok ? r.json() : []),
        fetchAuth("/ordenes-compra").then((r) => r.ok ? r.json() : []),
      ]).then(([o, f, c, oc]) => {
        setOts(o); setFacts(f); setCots(c); setOcs(oc);
        setCargando(false);
      });
    };
    cargar();
    const onVisible = () => { if (!document.hidden) cargar(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // ── Años disponibles (union de todos los datos) ──────────────────────────
  const anos = [...new Set([
    ...facts.map((f) => new Date(f.fechaEmision).getUTCFullYear()),
    ...cots.map((c) => c.fecha ? new Date(c.fecha).getUTCFullYear() : null),
    ...ocs.map((o) => o.fecha  ? new Date(o.fecha).getUTCFullYear()  : null),
    ...ots.map((o) => o.fecha  ? new Date(o.fecha).getUTCFullYear()  : null),
  ].filter(Boolean))].sort((a, b) => b - a);

  // ── Lista de empresas derivada de los datos ──────────────────────────────
  const empresasLista = [...new Map([
    ...cots.filter((c) => c.empresa?._id).map((c) => [c.empresa._id, c.empresa]),
    ...ots.filter((o)  => o.empresa?._id).map((o)  => [o.empresa._id,  o.empresa]),
    ...facts.filter((f) => f.empresa?._id).map((f) => [f.empresa._id, f.empresa]),
    ...ocs.filter((o)  => o.empresa?._id).map((o)  => [o.empresa._id,  o.empresa]),
  ]).values()].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));

  // ── Arrays filtrados ─────────────────────────────────────────────────────
  const otsFiltradas   = porEmpresa(porFecha(ots,   "fecha",        filtroAno, filtroMes), filtroEmpresa);
  const factsFiltradas = porEmpresa(porFecha(facts, "fechaEmision", filtroAno, filtroMes), filtroEmpresa);
  const cotsFiltradas  = porEmpresa(porFecha(cots,  "fecha",        filtroAno, filtroMes), filtroEmpresa);
  const ocsFiltradas   = porEmpresa(porFecha(ocs,   "fecha",        filtroAno, filtroMes), filtroEmpresa);

  // ── Datos para gráficos ──────────────────────────────────────────────────
  const contarPor = (arr, campo) => {
    const map = {};
    arr.forEach((item) => {
      const k = item[campo] ?? "sin definir";
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  };

  const otsEnCurso = otsFiltradas
    .filter((o) =>
      (o.estado === "en progreso" || o.estado === "pendiente") &&
      !o.ingresoEquipo?.anulada
    )
    .sort((a, b) => (a.estado === b.estado ? 0 : a.estado === "en progreso" ? -1 : 1));

  const factsVigentes = factsFiltradas.filter((f) => !f.anulada);

  const datosOT   = contarPor(otsFiltradas,  "estado");
  const datosFact = contarPor(factsVigentes, "estadoPago");

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const otsActivas     = otsFiltradas.filter((o) => o.estado !== "completado").length;
  const otsCompletadas = otsFiltradas.filter((o) => o.estado === "completado").length;
  const factAbiertas   = factsVigentes.filter((f) => f.estadoPago !== "pagado").length;
  const totalFacturado = factsVigentes.reduce((s, f) => s + (f.monto        ?? 0), 0);
  const totalAPagarSum = factsVigentes.reduce((s, f) => s + (f.totalAPagar  ?? 0), 0);
  const totalPagado    = factsVigentes.reduce((s, f) => s + (Number(f.montoPagado) || 0), 0);
  const porCobrar      = totalAPagarSum - totalPagado;

  const fmt = (n) => `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

  if (cargando) {
    return <div className="p-8 text-sm text-gray-400">Cargando dashboard…</div>;
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">

      {/* Bienvenida + filtros */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-800">
            Bienvenido, {usuario?.nombre}
          </h2>
          <p className="text-sm text-gray-400">Panel principal — SIP App Tecnotronica</p>
          <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}
            className={`${SELECT} w-72`}>
            <option value="">Toda empresa</option>
            {empresasLista.map((e) => (
              <option key={e._id} value={e._id}>
                {e.alias ? `${e.alias} — ` : ""}{e.razonSocial}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={filtroAno} onChange={(e) => setFiltroAno(e.target.value)} className={SELECT}>
            <option value="">Todos los años</option>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className={SELECT}>
            <option value="">Todos los meses</option>
            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          {(filtroAno || filtroMes || filtroEmpresa) && (
            <button
              onClick={() => { setFiltroAno(""); setFiltroMes(""); setFiltroEmpresa(""); }}
              className="text-sm text-gray-400 hover:text-gray-700 transition"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* KPIs — fila 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Cotizaciones"      value={cotsFiltradas.length} sub="total registradas"                    color="gray"
          onClick={() => navigate("/cotizaciones", { state: { filtroEmpresa } })} />
        <KpiCard label="OTs activas"       value={otsActivas}           sub={`${otsCompletadas} completadas`}      color="blue"
          onClick={() => navigate("/ordenes-trabajo", { state: { filtroEmpresa } })} />
        <KpiCard label="Facturas abiertas" value={factAbiertas}         sub={`${factsVigentes.length} vigentes`}   color="amber"
          onClick={() => navigate("/facturas", { state: { filtroEmpresa } })} />
        <KpiCard label="Total facturado"   value={fmt(totalFacturado)}  sub="suma total con IGV"                   color="gray"
          onClick={() => navigate("/facturas", { state: { filtroEmpresa } })} />
      </div>

      {/* KPIs — fila 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard label="Total pagado" value={fmt(totalPagado)} sub="suma de pagos registrados"          color="green"
          onClick={() => navigate("/facturas", { state: { filtroEmpresa } })} />
        <KpiCard label="Por cobrar"   value={fmt(porCobrar)}   sub="total a pagar menos pagos recibidos" color="red"
          onClick={() => navigate("/facturas", { state: { filtroEmpresa } })} />
      </div>

      {/* Contraste OC vs Cotizaciones */}
      <KpiContrasteCard totalCots={cotsFiltradas.length} totalOCs={ocsFiltradas.length} />

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GraficoDona
          titulo="Órdenes de Trabajo por estado"
          datos={datosOT}
          colores={COLOR_OT}
          onClickSlice={(estado) =>
            navigate("/ordenes-trabajo", { state: { filtroEstado: estado, filtroEmpresa } })
          }
        />
        <GraficoDona
          titulo="Facturas por estado de pago"
          datos={datosFact}
          colores={COLOR_FACT}
          onClickSlice={(estadoPago) =>
            navigate("/facturas", { state: { filtroEstadoPago: estadoPago, filtroEmpresa } })
          }
        />
      </div>

      {/* OTs en curso — agrupadas por estado */}
      {otsEnCurso.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">OTs en curso</h3>
            <span className="text-xs text-gray-400">
              {otsEnCurso.length} orden{otsEnCurso.length !== 1 ? "es" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                En progreso ({otsEnCurso.filter((o) => o.estado === "en progreso").length})
              </p>
              {otsEnCurso.filter((o) => o.estado === "en progreso").map((ot) => (
                <OtCard key={ot._id} ot={ot}
                  onClick={() => navigate("/ordenes-trabajo", {
                    state: { filtroEstado: ot.estado, filtroEmpresa: ot.empresa?._id || "" },
                  })} />
              ))}
              {otsEnCurso.filter((o) => o.estado === "en progreso").length === 0 && (
                <p className="text-xs text-gray-300">Sin OTs en progreso</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                Pendiente ({otsEnCurso.filter((o) => o.estado === "pendiente").length})
              </p>
              {otsEnCurso.filter((o) => o.estado === "pendiente").map((ot) => (
                <OtCard key={ot._id} ot={ot}
                  onClick={() => navigate("/ordenes-trabajo", {
                    state: { filtroEstado: ot.estado, filtroEmpresa: ot.empresa?._id || "" },
                  })} />
              ))}
              {otsEnCurso.filter((o) => o.estado === "pendiente").length === 0 && (
                <p className="text-xs text-gray-300">Sin OTs pendientes</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
