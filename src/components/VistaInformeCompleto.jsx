import { useState } from "react";
import { imgUrl } from "../utils/fetchAuth";
import { exportarInformeWord } from "../utils/exportarInformeWord";

const descargarImagen = async (url) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = url.split("/").pop() || "imagen.jpg";
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error("Error al descargar imagen:", err);
  }
};

const badgeAvance = (e) => {
  if (e === "entregado")   return "bg-teal-100 text-teal-700 border border-teal-200";
  if (e === "completado")  return "bg-green-100 text-green-700 border border-green-200";
  if (e === "en progreso") return "bg-blue-100 text-blue-700 border border-blue-200";
  if (e === "pendiente")   return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-gray-100 text-gray-500 border border-gray-200";
};

function Campo({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}

function AvanceCompleto({ avance, numero }) {
  const fecha = avance.fechaHoraGuardado
    ? new Date(avance.fechaHoraGuardado).toLocaleString("es-PE", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "—";

  const encargado = avance.personalEncargado?.nombre || "—";
  const subordinados =
    avance.subordinados?.length > 0
      ? avance.subordinados.map((s) => s.nombre).join(", ")
      : "—";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Cabecera numerada */}
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-800">
        <span className="w-7 h-7 rounded-full bg-white text-gray-800 text-xs flex items-center justify-center font-bold shrink-0">
          {numero}
        </span>
        <span className="text-sm text-gray-300">{fecha}</span>
        {avance.avanceOT ? (
          <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${badgeAvance(avance.avanceOT)}`}>
            {avance.avanceOT}
          </span>
        ) : (
          <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-600 text-gray-300 border border-gray-500">
            Sin cambio de estado
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className="px-6 py-5 space-y-5">

        {/* Título */}
        <Campo label="Título de la actividad">
          <p className="font-semibold text-base text-gray-800">
            {avance.titulo || <span className="text-gray-300 font-normal">Sin título</span>}
          </p>
        </Campo>

        {/* Descripción */}
        <Campo label="Descripción">
          {avance.descripcion
            ? <p className="whitespace-pre-wrap leading-relaxed">{avance.descripcion}</p>
            : <span className="text-gray-300">Sin descripción</span>
          }
        </Campo>

        {/* Horario */}
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Hora de inicio">
            <p className="font-mono text-gray-800">{avance.horaInicio || "—"}</p>
          </Campo>
          <Campo label="Hora de término">
            <p className="font-mono text-gray-800">{avance.horaTermino || "—"}</p>
          </Campo>
        </div>

        {/* Personal */}
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Personal encargado">
            <p>{encargado}</p>
          </Campo>
          <Campo label="Subordinados">
            <p>{subordinados}</p>
          </Campo>
        </div>

        {/* Ítems e imágenes */}
        {avance.items?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Ítems e imágenes
            </p>
            <div className="space-y-4">
              {avance.items.map((item, j) => (
                (item.titulo || item.imagenes?.length > 0) && (
                  <div key={j} className="bg-gray-50 rounded-xl p-4 space-y-3">
                    {item.titulo && (
                      <p className="text-sm font-semibold text-gray-700">{item.titulo}</p>
                    )}
                    {item.imagenes?.length > 0 ? (
                      <div className="flex flex-wrap gap-3 items-start">
                        {item.imagenes.map((img, k) => {
                          const url = typeof img === "string" ? img : img.url;
                          const desc = typeof img === "string" ? null : img.descripcion;
                          return (
                            <div key={k} className="flex flex-col items-center gap-1 w-36">
                              <div className="relative group w-36 h-36">
                                <img
                                  src={imgUrl(url)}
                                  alt=""
                                  onClick={() => window.open(imgUrl(url), "_blank")}
                                  className="w-36 h-36 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition shadow-sm"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); descargarImagen(imgUrl(url)); }}
                                  className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition"
                                  title="Descargar imagen"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                  </svg>
                                </button>
                              </div>
                              {desc && (
                                <p className="text-xs text-gray-500 text-center w-full leading-tight">{desc}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300">Sin imágenes</p>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {(!avance.items || avance.items.length === 0) && (
          <Campo label="Ítems e imágenes">
            <span className="text-gray-300">Sin ítems registrados</span>
          </Campo>
        )}
      </div>
    </div>
  );
}

export default function VistaInformeCompleto({ ordenTrabajo, avances, onClose, onModificar }) {
  const empresa = ordenTrabajo.empresa;

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nroInforme: "", atencion: "" });
  const [generando, setGenerando] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleGenerar = async (e) => {
    e.preventDefault();
    setGenerando(true);
    try {
      await exportarInformeWord(avances, ordenTrabajo, form);
    } finally {
      setGenerando(false);
      setMostrarForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Informe de Orden de Trabajo</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-mono text-sm text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
              {ordenTrabajo.codigo}
            </span>
            {empresa && (
              <span className="text-sm text-gray-500">
                {empresa.alias && <span className="font-medium">{empresa.alias}</span>}
                {empresa.razonSocial && <span> — {empresa.razonSocial}</span>}
              </span>
            )}
          </div>
          {ordenTrabajo.titulo && (
            <p className="text-sm text-gray-500 mt-0.5">{ordenTrabajo.titulo}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {avances.length} avance{avances.length !== 1 ? "s" : ""} registrado{avances.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-xl leading-none mt-1"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {avances.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-16">Sin avances registrados</p>
          ) : (
            avances.map((avance, i) => (
              <AvanceCompleto key={avance._id || i} avance={avance} numero={i + 1} />
            ))
          )}
        </div>
      </div>

      {/* Mini-formulario Word */}
      {mostrarForm && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center">
          <form
            onSubmit={handleGenerar}
            className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-sm space-y-4"
          >
            <h3 className="text-base font-bold text-gray-800">Datos del informe técnico</h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                N° de informe
              </label>
              <input
                name="nroInforme"
                value={form.nroInforme}
                onChange={handleChange}
                required
                placeholder="Ej: 2576"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Atención
              </label>
              <input
                name="atencion"
                value={form.atencion}
                onChange={handleChange}
                required
                placeholder="Ej: Ing. Isael Norabuena"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

<div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="flex-1 text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={generando}
                className="flex-1 text-sm bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 transition font-medium"
              >
                {generando ? "Generando…" : "Generar Word"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 px-8 py-4 flex gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="text-sm border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition"
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="text-sm bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 transition font-medium"
        >
          Exportar Word
        </button>
        <button
          type="button"
          onClick={onModificar}
          className="text-sm bg-amber-500 text-white px-5 py-2.5 rounded-lg hover:bg-amber-600 transition font-medium"
        >
          Modificar informe
        </button>
      </div>
    </div>
  );
}
