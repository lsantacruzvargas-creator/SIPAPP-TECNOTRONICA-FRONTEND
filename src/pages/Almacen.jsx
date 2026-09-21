import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import ModalMaterial from "../components/ModalMaterial";
import ModalMovimiento from "../components/ModalMovimiento";
import TablaRequerimientos from "../components/TablaRequerimientos";

const INP = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";
const TABS = [
  { id: "materiales", label: "Materiales" },
  { id: "movimientos", label: "Movimientos" },
  { id: "requerimientos", label: "Requerimientos" },
  { id: "ubicaciones", label: "Ubicaciones" },
  { id: "clasificacion", label: "Clasificación" },
  { id: "categoriasCompra", label: "Categorías de Compra" },
];

const campoVacio = () => ({ nombre: "", clave: "", tipo: "texto", opciones: [], requerido: false });

function PanelCategoriasMaterial({ categoriasMaterial, onCambio }) {
  const [nombre, setNombre] = useState("");
  const [campos, setCampos] = useState([campoVacio()]);
  const [guardando, setGuardando] = useState(false);

  const actualizarCampo = (i, clave, valor) =>
    setCampos((prev) => prev.map((c, idx) => idx === i ? { ...c, [clave]: valor } : c));

  const guardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    const camposValidos = campos.filter((c) => c.nombre.trim() && c.clave.trim());
    const res = await fetchAuth("/categorias-material", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, campos: camposValidos }),
    });
    if (res.ok) { setNombre(""); setCampos([campoVacio()]); onCambio(); }
    setGuardando(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase">Nueva categoría</p>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la categoría" className={`${INP} w-full`} />
        <div className="space-y-2">
          {campos.map((c, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input value={c.nombre} onChange={(e) => actualizarCampo(i, "nombre", e.target.value)} placeholder="Campo" className={`${INP} flex-1`} />
              <input value={c.clave} onChange={(e) => actualizarCampo(i, "clave", e.target.value)} placeholder="clave" className={`${INP} w-24`} />
              <select value={c.tipo} onChange={(e) => actualizarCampo(i, "tipo", e.target.value)} className={INP}>
                <option value="texto">Texto</option>
                <option value="numero">Número</option>
                <option value="select">Select</option>
              </select>
              {c.tipo === "select" && (
                <input value={c.opciones.join(",")} onChange={(e) => actualizarCampo(i, "opciones", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="op1,op2" className={`${INP} w-28`} />
              )}
            </div>
          ))}
          <button onClick={() => setCampos((prev) => [...prev, campoVacio()])} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            + Agregar campo
          </button>
        </div>
        <button onClick={guardar} disabled={guardando} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
          Crear categoría
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase">Categorías existentes</p>
        <ul className="text-sm divide-y divide-gray-50">
          {categoriasMaterial.map((c) => (
            <li key={c._id} className="py-2 text-gray-700">
              <span className="font-medium">{c.nombre}</span>
              {c.campos.length > 0 && (
                <span className="text-xs text-gray-400 block">{c.campos.map((f) => f.nombre).join(", ")}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PanelUbicaciones({ ubicaciones, onCambio }) {
  const [form, setForm] = useState({ nombre: "", descripcion: "" });
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    const url = editando ? `/ubicaciones/${editando}` : "/ubicaciones";
    const res = await fetchAuth(url, {
      method: editando ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ nombre: "", descripcion: "" }); setEditando(null); onCambio(); }
    setGuardando(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">Nombre</label>
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={`${INP} w-full`} />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 block mb-1">Descripción</label>
          <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className={`${INP} w-full`} />
        </div>
        <button onClick={guardar} disabled={guardando}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
          {editando ? "Guardar" : "+ Agregar"}
        </button>
        {editando && (
          <button onClick={() => { setEditando(null); setForm({ nombre: "", descripcion: "" }); }}
            className="text-sm text-gray-400 hover:text-gray-700">Cancelar</button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
          <tr><th className="text-left py-2">Código</th><th className="text-left py-2">Nombre</th><th className="text-left py-2">Descripción</th><th></th></tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ubicaciones.map((u) => (
            <tr key={u._id}>
              <td className="py-2 font-mono text-xs text-gray-600">{u.codigo}</td>
              <td className="py-2 text-gray-700">{u.nombre}</td>
              <td className="py-2 text-gray-500">{u.descripcion || "—"}</td>
              <td className="py-2 text-right">
                <button onClick={() => { setEditando(u._id); setForm({ nombre: u.nombre, descripcion: u.descripcion || "" }); }}
                  className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PanelClasificacion({ tiposComponente, categorias, onCambio }) {
  const [nombreTipo, setNombreTipo] = useState("");
  const [nombreCat, setNombreCat] = useState("");
  const [tipoParaCat, setTipoParaCat] = useState("");
  const [guardando, setGuardando] = useState(false);

  const agregarTipo = async () => {
    if (!nombreTipo.trim()) return;
    setGuardando(true);
    const res = await fetchAuth("/tipos-componente", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreTipo }),
    });
    if (res.ok) { setNombreTipo(""); onCambio(); }
    setGuardando(false);
  };

  const agregarCategoria = async () => {
    if (!nombreCat.trim() || !tipoParaCat) return;
    setGuardando(true);
    const res = await fetchAuth("/categorias-componente", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreCat, tipoComponente: tipoParaCat }),
    });
    if (res.ok) { setNombreCat(""); onCambio(); }
    setGuardando(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase">Tipos de Componente</p>
        <div className="flex gap-2">
          <input value={nombreTipo} onChange={(e) => setNombreTipo(e.target.value)} placeholder="Nombre" className={`${INP} flex-1`} />
          <button onClick={agregarTipo} disabled={guardando} className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">+</button>
        </div>
        <ul className="text-sm divide-y divide-gray-50">
          {tiposComponente.map((t) => <li key={t._id} className="py-1.5 text-gray-700">{t.nombre}</li>)}
        </ul>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase">Categorías</p>
        <div className="flex gap-2">
          <select value={tipoParaCat} onChange={(e) => setTipoParaCat(e.target.value)} className={`${INP} w-32`}>
            <option value="">Tipo…</option>
            {tiposComponente.map((t) => <option key={t._id} value={t._id}>{t.nombre}</option>)}
          </select>
          <input value={nombreCat} onChange={(e) => setNombreCat(e.target.value)} placeholder="Nombre" className={`${INP} flex-1`} />
          <button onClick={agregarCategoria} disabled={guardando} className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">+</button>
        </div>
        <ul className="text-sm divide-y divide-gray-50">
          {categorias.map((c) => (
            <li key={c._id} className="py-1.5 text-gray-700">{c.nombre} <span className="text-xs text-gray-400">({c.tipoComponente?.nombre})</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Almacen() {
  const [tab, setTab] = useState("materiales");
  const [materiales, setMateriales] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [tiposComponente, setTiposComponente] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [categoriasMaterial, setCategoriasMaterial] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [materialEditar, setMaterialEditar] = useState(null);
  const [crearMaterial, setCrearMaterial] = useState(false);
  const [crearMovimiento, setCrearMovimiento] = useState(null);

  const cargar = () =>
    Promise.all([
      fetchAuth("/materiales?todas=true").then((r) => r.ok ? r.json() : []),
      fetchAuth("/ubicaciones").then((r) => r.ok ? r.json() : []),
      fetchAuth("/tipos-componente").then((r) => r.ok ? r.json() : []),
      fetchAuth("/categorias-componente").then((r) => r.ok ? r.json() : []),
      fetchAuth("/movimientos-almacen").then((r) => r.ok ? r.json() : []),
      fetchAuth("/ordenes-trabajo").then((r) => r.ok ? r.json() : []),
      fetchAuth("/requerimientos").then((r) => r.ok ? r.json() : []),
      fetchAuth("/categorias-material?todas=true").then((r) => r.ok ? r.json() : []),
    ]).then(([mats, ubis, tipos, cats, movs, ots, rqs, catsCompra]) => {
      setMateriales(mats);
      setUbicaciones(ubis);
      setTiposComponente(tipos);
      setCategorias(cats);
      setMovimientos(movs);
      setOrdenesTrabajo(ots.filter((o) => !o.anulada));
      setRequerimientos(rqs);
      setCategoriasMaterial(catsCompra);
    });

  useEffect(() => { cargar(); }, []);

  const materialesFiltrados = materiales.filter((m) => {
    const txt = busqueda.toLowerCase();
    return !txt || m.nombre.toLowerCase().includes(txt) || m.sku.toLowerCase().includes(txt) || m.codigo?.toLowerCase().includes(txt);
  });

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Almacén</h2>
          <p className="text-xs text-gray-400 mt-0.5">{materiales.length} SKU{materiales.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "materiales" && (
        <>
          <div className="flex gap-3 mb-4">
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por SKU, nombre o código…"
              className={`${INP} flex-1 min-w-60`} />
            <button onClick={() => setCrearMaterial(true)}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
              + Nuevo material
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-500 text-white text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Centro de costo</th>
                    <th className="px-4 py-3 text-left">Ubicación</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materialesFiltrados.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin materiales</td></tr>
                  ) : materialesFiltrados.map((m) => (
                    <tr key={m._id} className={`hover:bg-gray-50 ${!m.activo ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{m.sku}</td>
                      <td className="px-4 py-3 text-gray-700">{m.nombre}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{m.tipoMaterial}</td>
                      <td className="px-4 py-3 text-gray-500">{m.ubicacion?.nombre || "—"}</td>
                      <td className={`px-4 py-3 text-right font-medium tabular-nums ${m.stock <= m.stockMinimo ? "text-red-600" : "text-gray-800"}`}>
                        {m.stock}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${m.activo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {m.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setMaterialEditar(m)} className="text-xs text-blue-600 hover:text-blue-800">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "movimientos" && (
        <>
          <div className="flex gap-3 mb-4">
            <button onClick={() => setCrearMovimiento("ingreso")}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium">
              + Ingreso
            </button>
            <button onClick={() => setCrearMovimiento("egreso")}
              className="text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition font-medium">
              + Egreso
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-500 text-white text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Código</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                    <th className="px-4 py-3 text-left">Material</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-left">Lote</th>
                    <th className="px-4 py-3 text-left">OT</th>
                    <th className="px-4 py-3 text-center">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movimientos.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin movimientos</td></tr>
                  ) : movimientos.map((mv) => (
                    <tr key={mv._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{mv.codigo}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          mv.tipo === "ingreso" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        }`}>{mv.tipo}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{mv.material?.sku} — {mv.material?.nombre}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-800">{mv.cantidad}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{mv.lote || mv.loteOrigen || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{mv.ordenTrabajo?.codigo || "—"}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{new Date(mv.fecha).toLocaleDateString("es-PE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "requerimientos" && (
        <TablaRequerimientos requerimientos={requerimientos} materiales={materiales.filter((m) => m.activo)} puedeAtender onCambio={cargar} />
      )}

      {tab === "ubicaciones" && <PanelUbicaciones ubicaciones={ubicaciones} onCambio={cargar} />}
      {tab === "clasificacion" && <PanelClasificacion tiposComponente={tiposComponente} categorias={categorias} onCambio={cargar} />}
      {tab === "categoriasCompra" && <PanelCategoriasMaterial categoriasMaterial={categoriasMaterial} onCambio={cargar} />}

      {(crearMaterial || materialEditar) && (
        <ModalMaterial
          material={materialEditar}
          ubicaciones={ubicaciones}
          tiposComponente={tiposComponente}
          categorias={categorias}
          onClose={() => { setCrearMaterial(false); setMaterialEditar(null); }}
          onGuardado={() => { setCrearMaterial(false); setMaterialEditar(null); cargar(); }}
        />
      )}

      {crearMovimiento && (
        <ModalMovimiento
          tipoInicial={crearMovimiento}
          materiales={materiales.filter((m) => m.activo)}
          ordenesTrabajo={ordenesTrabajo}
          onClose={() => setCrearMovimiento(null)}
          onCreado={() => { setCrearMovimiento(null); cargar(); }}
        />
      )}
    </div>
  );
}
