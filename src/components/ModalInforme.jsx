import { useState, useEffect } from "react";
import { fetchAuth, uploadAuth, imgUrl } from "../utils/fetchAuth";
import { INP } from "../utils/cotizacionItems";
import VistaInformeCompleto from "./VistaInformeCompleto";

const AVANCES = [
  { valor: "", label: "Sin cambio" },
  { valor: "pendiente", label: "Pendiente" },
  { valor: "en progreso", label: "En progreso" },
  { valor: "completado", label: "Completado" },
  { valor: "entregado", label: "Entregado" },
];

const colorAvance = (v, activo) => {
  if (!activo) return "bg-gray-100 text-gray-500 hover:bg-gray-200";
  if (v === "entregado")  return "bg-teal-600 text-white";
  if (v === "completado") return "bg-green-600 text-white";
  if (v === "en progreso") return "bg-blue-600 text-white";
  if (v === "pendiente") return "bg-amber-500 text-white";
  return "bg-gray-200 text-gray-600";
};

const badgeAvance = (e) => {
  if (e === "entregado")  return "bg-teal-50 text-teal-700";
  if (e === "completado") return "bg-green-50 text-green-700";
  if (e === "en progreso") return "bg-blue-50 text-blue-700";
  if (e === "pendiente") return "bg-amber-50 text-amber-700";
  return "";
};

const FORM_VACIO = {
  titulo: "", descripcion: "", horaInicio: "", horaTermino: "",
  personalEncargado: "", avanceOT: "",
};

// Módulo-nivel — evita pérdida de foco
function FilaItem({ item, onUpdate, onRemove, onSubirImagenes, onUpdateImgDesc, onRemoveImg, subiendo }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-white">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Ítem</span>
        <button type="button" onClick={onRemove} className="text-xs text-red-400 hover:text-red-600 transition">
          Eliminar
        </button>
      </div>
      <input
        type="text"
        value={item.titulo}
        onChange={(e) => onUpdate(item._key, e.target.value)}
        placeholder="Título del ítem"
        className={`w-full ${INP}`}
      />
      <div className="space-y-2">
        {item.imagenes.map((img, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="relative shrink-0">
              <img src={imgUrl(img.url)} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
              <button
                type="button"
                onClick={() => onRemoveImg(item._key, i)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center hover:bg-red-600"
              >✕</button>
            </div>
            <input
              type="text"
              value={img.descripcion}
              onChange={(e) => onUpdateImgDesc(item._key, i, e.target.value)}
              placeholder="Descripción de la imagen…"
              className={`flex-1 ${INP}`}
            />
          </div>
        ))}
        <label className={`w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition text-gray-400 select-none
          ${subiendo ? "opacity-50 cursor-wait border-gray-200" : "border-gray-300 hover:border-blue-400 hover:text-blue-400"}`}
        >
          <span className="text-xl leading-none">📷</span>
          <span className="text-xs mt-0.5">{subiendo ? "…" : "Foto"}</span>
          <input
            type="file" accept="image/*" multiple className="hidden"
            disabled={subiendo}
            onChange={(e) => onSubirImagenes(item._key, e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}

// Tarjeta de avance guardado
function AvanceCard({ avance, onEditar }) {
  const fecha = avance.fechaHoraGuardado
    ? new Date(avance.fechaHoraGuardado).toLocaleString("es-PE", {
        dateStyle: "short", timeStyle: "short",
      })
    : "—";

  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2.5 bg-white">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400 font-mono shrink-0">{fecha}</span>
        <div className="flex items-center gap-2">
          {avance.avanceOT && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${badgeAvance(avance.avanceOT)}`}>
              {avance.avanceOT}
            </span>
          )}
          {onEditar && (
            <button type="button" onClick={onEditar}
              className="text-xs text-blue-500 hover:text-blue-700 transition shrink-0">
              Editar
            </button>
          )}
        </div>
      </div>

      {avance.titulo && (
        <p className="font-semibold text-sm text-gray-800">{avance.titulo}</p>
      )}
      {avance.descripcion && (
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{avance.descripcion}</p>
      )}
      {(avance.horaInicio || avance.horaTermino) && (
        <p className="text-xs text-gray-400">
          ⏱ {avance.horaInicio || "?"} — {avance.horaTermino || "?"}
        </p>
      )}
      {(avance.personalEncargado || avance.subordinados?.length > 0) && (
        <p className="text-xs text-gray-500">
          {avance.personalEncargado?.nombre && `👤 ${avance.personalEncargado.nombre}`}
          {avance.subordinados?.length > 0 &&
            ` + ${avance.subordinados.map((s) => s.nombre).join(", ")}`}
        </p>
      )}
      {avance.items?.map((item, i) =>
        (item.titulo || item.imagenes?.length > 0) ? (
          <div key={i} className="space-y-1">
            {item.titulo && (
              <p className="text-xs text-gray-400 font-medium">{item.titulo}</p>
            )}
            {item.imagenes?.length > 0 && (
              <div className="flex flex-wrap gap-2 items-start">
                {item.imagenes.map((img, j) => {
                  const url = typeof img === "string" ? img : img.url;
                  const desc = typeof img === "string" ? null : img.descripcion;
                  return (
                    <div key={j} className="flex flex-col items-center gap-0.5 w-16">
                      <img src={imgUrl(url)} alt=""
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                      {desc && (
                        <p className="text-[10px] text-gray-500 w-full text-center leading-tight line-clamp-2">{desc}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null
      )}
    </div>
  );
}

export default function ModalInforme({ ordenTrabajo, onClose, onGuardado }) {
  const [avances, setAvances] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [subordinados, setSubordinados] = useState([]);
  const [items, setItems] = useState([]);
  const [subiendoKey, setSubiendoKey] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [verCompleto, setVerCompleto] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAuth("/personal/lista").then((r) => r.ok ? r.json() : []),
      fetchAuth(`/informes?ordenTrabajo=${ordenTrabajo._id}`).then((r) => r.ok ? r.json() : []),
    ]).then(([pers, data]) => {
      setPersonal(pers);
      setAvances(Array.isArray(data) ? data : []);
      setCargando(false);
    });
  }, [ordenTrabajo._id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleSubordinado = (id) =>
    setSubordinados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const agregarItem = () =>
    setItems((prev) => [
      ...prev,
      { _key: Date.now() + Math.random(), titulo: "", imagenes: [] },
    ]);

  const actualizarItem = (key, titulo) =>
    setItems((prev) => prev.map((it) => (it._key === key ? { ...it, titulo } : it)));

  const eliminarItem = (key) =>
    setItems((prev) => prev.filter((it) => it._key !== key));

  const subirImagenes = async (key, files) => {
    setSubiendoKey(key);
    const nuevas = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("imagen", file);
      const res = await uploadAuth("/informes/subir-imagen", fd);
      if (res.ok) nuevas.push({ url: (await res.json()).url, descripcion: "" });
    }
    setItems((prev) =>
      prev.map((it) =>
        it._key === key ? { ...it, imagenes: [...it.imagenes, ...nuevas] } : it
      )
    );
    setSubiendoKey(null);
  };

  const actualizarDescripcionImagen = (key, idx, descripcion) =>
    setItems((prev) =>
      prev.map((it) =>
        it._key === key
          ? { ...it, imagenes: it.imagenes.map((img, i) => i === idx ? { ...img, descripcion } : img) }
          : it
      )
    );

  const eliminarImagen = (key, idx) =>
    setItems((prev) =>
      prev.map((it) =>
        it._key === key
          ? { ...it, imagenes: it.imagenes.filter((_, i) => i !== idx) }
          : it
      )
    );

  const entrarEdicion = (avance) => {
    setForm({
      titulo: avance.titulo || "",
      descripcion: avance.descripcion || "",
      horaInicio: avance.horaInicio || "",
      horaTermino: avance.horaTermino || "",
      personalEncargado: avance.personalEncargado?._id || "",
      avanceOT: avance.avanceOT || "",
    });
    setSubordinados(avance.subordinados?.map((s) => s._id) || []);
    setItems(
      (avance.items || []).map((item) => ({
        _key: Date.now() + Math.random(),
        titulo: item.titulo || "",
        imagenes: (item.imagenes || []).map((img) =>
          typeof img === "string" ? { url: img, descripcion: "" } : img
        ),
      }))
    );
    setEditandoId(avance._id);
    setAgregando(true);
  };

  const cancelarNuevo = () => {
    setAgregando(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
    setSubordinados([]);
    setItems([]);
  };

  const guardar = async () => {
    setGuardando(true);
    const payload = {
      ordenTrabajo: ordenTrabajo._id,
      ...form,
      subordinados,
      items: items.map((it) => ({ titulo: it.titulo, imagenes: it.imagenes })),
    };
    if (!payload.personalEncargado) delete payload.personalEncargado;

    const url = editandoId ? `/informes/${editandoId}` : "/informes";
    const method = editandoId ? "PUT" : "POST";

    const res = await fetchAuth(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (editandoId) {
        setAvances((prev) => prev.map((a) => a._id === editandoId ? data : a));
      } else {
        setAvances((prev) => [...prev, data]);
      }
      cancelarNuevo();
      onGuardado(data);
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-800">Informe de avance</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{ordenTrabajo.codigo}</p>
          </div>
          <div className="flex items-center gap-3">
            {avances.length > 0 && (
              <span className="text-xs text-gray-400">
                {avances.length} avance{avances.length !== 1 ? "s" : ""}
              </span>
            )}
            <button type="button" onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {cargando ? (
            <p className="text-sm text-gray-400 text-center py-8">Cargando…</p>
          ) : (
            <>
              {/* Avances guardados — read-only */}
              {avances.length === 0 && !agregando && (
                <p className="text-sm text-gray-300 text-center py-8 border border-dashed border-gray-100 rounded-xl">
                  Sin avances registrados
                </p>
              )}
              {avances.map((a, i) => (
                <AvanceCard key={a._id || i} avance={a}
                  onEditar={!agregando ? () => entrarEdicion(a) : undefined} />
              ))}

              {/* Formulario nuevo avance */}
              {agregando && (
                <div className="border-2 border-blue-100 rounded-xl p-5 space-y-4 bg-blue-50/20">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    {editandoId ? "Editar avance" : "Nuevo avance"}
                  </p>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Título de la actividad</label>
                    <input name="titulo" value={form.titulo} onChange={handleChange}
                      className={`w-full ${INP}`} placeholder="Actividad realizada…" />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Descripción</label>
                    <textarea name="descripcion" value={form.descripcion} onChange={handleChange}
                      rows={3} className={`w-full ${INP} resize-none`}
                      placeholder="Detalle de lo realizado…" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Hora de inicio</label>
                      <input type="time" name="horaInicio" value={form.horaInicio}
                        onChange={handleChange} className={`w-full ${INP}`} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Hora de término</label>
                      <input type="time" name="horaTermino" value={form.horaTermino}
                        onChange={handleChange} className={`w-full ${INP}`} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Personal encargado</label>
                      <select name="personalEncargado" value={form.personalEncargado}
                        onChange={handleChange} className={`w-full ${INP}`}>
                        <option value="">Sin asignar</option>
                        {personal.map((p) => (
                          <option key={p._id} value={p._id}>{p.nombre}{p.cargo ? ` — ${p.cargo}` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">Avance de la OT</label>
                      <div className="flex gap-1 flex-wrap">
                        {AVANCES.map(({ valor, label }) => (
                          <button key={valor} type="button"
                            onClick={() => setForm({ ...form, avanceOT: valor })}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${colorAvance(valor, form.avanceOT === valor)}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {personal.length > 0 && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-2">Subordinados</label>
                      <div className="flex flex-wrap gap-2">
                        {personal.map((p) => (
                          <label key={p._id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                              subordinados.includes(p._id)
                                ? "border-blue-400 bg-blue-50 text-blue-700"
                                : "border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}>
                            <input type="checkbox" checked={subordinados.includes(p._id)}
                              onChange={() => toggleSubordinado(p._id)}
                              className="accent-blue-600" />
                            {p.nombre}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-500">Ítems e imágenes</label>
                      <button type="button" onClick={agregarItem}
                        className="text-xs text-gray-500 hover:text-gray-800 transition">
                        + Agregar ítem
                      </button>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <FilaItem key={item._key} item={item}
                          onUpdate={actualizarItem}
                          onRemove={() => eliminarItem(item._key)}
                          onSubirImagenes={subirImagenes}
                          onUpdateImgDesc={actualizarDescripcionImagen}
                          onRemoveImg={eliminarImagen}
                          subiendo={subiendoKey === item._key}
                        />
                      ))}
                      {items.length === 0 && (
                        <p className="text-xs text-gray-300 text-center py-3 border border-dashed border-gray-100 rounded-xl">
                          Sin ítems
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button type="button" onClick={cancelarNuevo}
                      className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                      Cancelar
                    </button>
                    <button type="button" onClick={guardar}
                      disabled={guardando || !!subiendoKey}
                      className="text-sm bg-amber-500 text-white px-5 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition font-medium">
                      {guardando ? "Guardando…" : editandoId ? "Guardar cambios" : "Guardar avance"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — solo visible cuando no se está agregando */}
        {!cargando && !agregando && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
            {avances.length > 0 && (
              <button
                type="button"
                onClick={() => setVerCompleto(true)}
                className="flex-1 text-sm bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Ver informe completo
              </button>
            )}
            <button
              type="button"
              onClick={() => setAgregando(true)}
              className={`text-sm bg-amber-500 text-white py-2.5 rounded-lg hover:bg-amber-600 transition font-medium ${avances.length > 0 ? "flex-1" : "w-full"}`}
            >
              + Nuevo avance
            </button>
          </div>
        )}
      </div>

      {verCompleto && (
        <VistaInformeCompleto
          ordenTrabajo={ordenTrabajo}
          avances={avances}
          onClose={() => setVerCompleto(false)}
          onModificar={() => setVerCompleto(false)}
        />
      )}
    </div>
  );
}
