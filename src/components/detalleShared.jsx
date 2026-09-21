import { Fragment, useState } from "react";

/* ─── Iconos SVG (stroke, currentColor) ─────────────────────────── */
const svg = "w-5 h-5";
export const IconCotizacion = () => (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" /><path d="M9 9h1M9 13h6M9 17h6" />
  </svg>
);
export const IconOT = () => (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.3L3 18v3h3l6.4-6.3a4 4 0 0 0 5.3-5.4l-2.6 2.6-2.3-.3-.3-2.3z" />
  </svg>
);
export const IconInforme = () => (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" />
  </svg>
);
export const IconOC = () => (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
);
export const IconFactura = () => (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" /><path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
export const IconCheck = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const IconComprobante = () => (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2h6l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="m9 14 2 2 4-4" />
  </svg>
);
export const IconGRE = () => (
  <svg className={svg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 16V6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v10M3 16h11m0 0h2.5m-2.5 0V9h3.5L21 12.5V16h-2.5M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
);

/* ─── Paletas por entidad ───────────────────────────────────────────
   Colores de acento literales (no tokens): estos NO cambian con el tema
   — solo los neutrales (surface/ink/line) lo hacen. */
export const TEMAS = {
  cotizacion:  { icon: IconCotizacion,  ring: "ring-sky-200",     dot: "bg-sky-500",     soft: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-100",     label: "Cotización" },
  ot:          { icon: IconOT,          ring: "ring-indigo-200",  dot: "bg-indigo-500",  soft: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-100",  label: "Orden de Trabajo" },
  informe:     { icon: IconInforme,     ring: "ring-violet-200",  dot: "bg-violet-500",  soft: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-100",  label: "Informe" },
  oc:          { icon: IconOC,          ring: "ring-blue-200",    dot: "bg-blue-500",    soft: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-100",    label: "Orden de Compra" },
  factura:     { icon: IconFactura,     ring: "ring-emerald-200", dot: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", label: "Factura" },
  comprobante: { icon: IconComprobante, ring: "ring-teal-200",    dot: "bg-teal-500",    soft: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-100",    label: "Comprobante SUNAT" },
  gre:         { icon: IconGRE,         ring: "ring-purple-200",  dot: "bg-purple-500",  soft: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-100",  label: "Guía de Remisión" },
};

/* ─── Stepper del flujo de negocio ──────────────────────────────── */
export function FlujoNegocio({ pasos }) {
  return (
    <div className="flex items-start w-full">
      {pasos.map((p, i) => {
        const t = TEMAS[p.tipo];
        const Icon = t.icon;
        const activo = p.activo;
        return (
          <Fragment key={p.tipo}>
            <div className="flex flex-col items-center text-center shrink-0 w-24">
              <div className={`relative w-11 h-11 rounded-full flex items-center justify-center transition
                ${activo ? `${t.soft} ${t.text} ring-4 ${t.ring}` : "bg-surface-alt text-ink-muted ring-4 ring-surface-alt"}`}>
                <Icon />
                {activo && (
                  <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${t.dot} text-white flex items-center justify-center border-2 border-surface`}>
                    <IconCheck />
                  </span>
                )}
              </div>
              <span className={`mt-2 text-[11px] font-semibold ${activo ? "text-ink" : "text-ink-muted"}`}>{t.label}</span>
              <span className={`text-[11px] font-mono ${activo ? t.text : "text-ink-muted"}`}>{p.codigo || "—"}</span>
            </div>
            {i < pasos.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[22px] rounded-full ${pasos[i + 1].activo && activo ? t.dot : "bg-line"}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ─── Tarjeta de relación ───────────────────────────────────────── */
export function TarjetaRelacion({ tipo, codigo, numero, children, vacio, actual, onClick, cargando, onCrear, crearLabel }) {
  const t = TEMAS[tipo];
  const Icon = t.icon;
  if (actual) {
    return (
      <div className="relative border border-line bg-surface-alt rounded-2xl p-5 min-h-[112px] opacity-80">
        <span className="absolute top-4 right-4 text-[10px] font-semibold text-ink-muted uppercase tracking-wide">Actual</span>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-surface-hover text-ink-muted flex items-center justify-center shrink-0">
            <Icon />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">{t.label}</p>
            <p className="font-mono text-sm font-bold text-ink-soft truncate">{codigo || "—"}</p>
          </div>
        </div>
        {numero && (
          <p className="inline-block font-mono text-base font-extrabold text-ink-soft bg-surface-hover rounded-lg px-2.5 py-1 mb-1 tracking-wide">
            {numero}
          </p>
        )}
        <div className="space-y-1">{children}</div>
      </div>
    );
  }
  if (vacio) {
    return (
      <div className="border border-dashed border-line rounded-2xl p-5 flex items-center gap-3 min-h-[112px] opacity-70">
        <div className="w-10 h-10 rounded-xl bg-surface-alt text-ink-muted flex items-center justify-center shrink-0">
          <Icon />
        </div>
        <div>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">{t.label}</p>
          {onCrear ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCrear(); }}
              className="text-xs text-accent hover:text-accent-strong underline mt-0.5"
            >
              + Crear {crearLabel || t.label}
            </button>
          ) : (
            <p className="text-xs text-ink-muted mt-0.5">No vinculada</p>
          )}
        </div>
      </div>
    );
  }
  const clickable = typeof onClick === "function";
  return (
    <div
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter") onClick(e); } : undefined}
      className={`relative border ${t.border} ${t.soft} rounded-2xl p-5 min-h-[112px] hover:shadow-md hover:-translate-y-0.5 transition
        ${clickable ? "cursor-pointer" : ""} ${cargando ? "opacity-60 pointer-events-none" : ""}`}>
      {clickable && (
        <span className="absolute top-4 right-4 text-ink-muted">→</span>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-surface ${t.text} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon />
        </div>
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold ${t.text} uppercase tracking-wide`}>{t.label}</p>
          <p className="font-mono text-sm font-bold text-ink truncate">{codigo || "—"}</p>
        </div>
      </div>
      {numero && (
        <p className={`inline-block font-mono text-base font-extrabold ${t.text} bg-surface rounded-lg px-2.5 py-1 mb-1 shadow-sm tracking-wide`}>
          {numero}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

/* ─── Chip de estado genérico ───────────────────────────────────── */
export function Chip({ children, className }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${className}`}>
      {children}
    </span>
  );
}

export const badgePago = (e) => {
  if (e === "pagado")       return "bg-green-100 text-green-700";
  if (e === "pago parcial") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
};
export const badgeOT = (e) => {
  if (e === "entregado")   return "bg-teal-100 text-teal-700";
  if (e === "completado")  return "bg-green-100 text-green-700";
  if (e === "en progreso") return "bg-blue-100 text-blue-700";
  if (e === "pendiente")   return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
};
export const badgeEstadoOC = (e) => {
  if (e === "aprobada")  return "bg-green-100 text-green-700";
  if (e === "rechazada") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
};
export const estadoComprobanteClase = (e) => {
  if (e === "ACEPTADO")  return "bg-green-100 text-green-700";
  if (e === "RECHAZADO" || e === "ERROR") return "bg-red-100 text-red-700";
  if (e === "ANULADO")   return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-500";
};

export const money = (v) =>
  "S/ " + Number(v ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 });

/* ─── Anulación reversible (toggle) — convención de Tecnotronica, distinta
   de la irreversible-con-motivo de Huaquian/Imaquitec (ver
   feedback_anular_toggle.md): botón rojo "Anular"/verde "Reactivar" con
   confirmación, PUT { anulada: !anulada }, sin campo de motivo. */
export function BotonAnular({ anulada, onToggle, light }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando]       = useState(false);

  const confirmar = async () => {
    setEnviando(true);
    await onToggle();
    setEnviando(false);
    setConfirmando(false);
  };

  return (
    <>
      <button onClick={() => setConfirmando(true)}
        className={`text-xs underline transition ${
          light
            ? (anulada ? "text-white/70 hover:text-white" : "text-white/70 hover:text-white")
            : (anulada ? "text-green-600 hover:text-green-800" : "text-red-500 hover:text-red-700")
        }`}>
        {anulada ? "Reactivar documento" : "Anular documento"}
      </button>

      {confirmando && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h4 className="font-semibold text-ink">{anulada ? "¿Reactivar documento?" : "¿Anular documento?"}</h4>
            <p className="text-sm text-ink-soft">
              {anulada
                ? "El documento volverá a estar vigente."
                : "El documento quedará marcado como anulado — puedes reactivarlo después si fue un error."}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmando(false)} disabled={enviando} className="btn-secondary disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmar} disabled={enviando}
                className={`text-sm text-white px-5 py-2 rounded-lg disabled:opacity-50 transition font-medium ${
                  anulada ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                }`}>
                {enviando ? "Guardando…" : (anulada ? "Confirmar reactivación" : "Confirmar anulación")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function BannerAnulado({ fecha }) {
  return (
    <div className="bg-danger-soft border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-red-500 text-lg leading-none">⚠</span>
      <div>
        <p className="text-sm font-semibold text-red-700">Documento anulado</p>
        {fecha && <p className="text-xs text-red-400 mt-1">{new Date(fecha).toLocaleString("es-PE")}</p>}
      </div>
    </div>
  );
}
