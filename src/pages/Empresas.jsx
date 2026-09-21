import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";

const FORM_VACIO = {
  razonSocial: "", ruc: "", direccion: "", alias: "",
  requiereHes: false, requiereActaConformidad: false,
  plantas: [],
};

const plantaVacia = () => ({ nombre: "", ubigeo: "", direccion: "", contactos: [] });
const contactoVacio = () => ({ nombre: "", telefono: "", correo: "" });

// Primer contacto disponible entre todas las plantas — solo para la vista
// resumida de la tabla, la edición real es por planta.
const primerContacto = (empresa) => {
  for (const p of empresa.plantas || []) {
    if (p.contactos?.length) return p.contactos[0];
  }
  return null;
};

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [buscandoRuc, setBuscandoRuc] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const res = await fetchAuth("/empresas");
    if (res.ok) setEmpresas(await res.json());
  };

  const empresasFiltradas = empresas.filter((e) => {
    const q = filtro.toLowerCase();
    return e.razonSocial.toLowerCase().includes(q) || e.ruc.includes(q);
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const buscarRuc = async (ruc) => {
    if (ruc.length !== 11) return;
    setBuscandoRuc(true);
    try {
      const res = await fetchAuth(`/sunat/ruc/${ruc}`);
      if (!res.ok) { setError("RUC no encontrado en SUNAT"); return; }
      const data = await res.json();
      setForm((f) => ({
        ...f,
        razonSocial: data.razonSocial || f.razonSocial,
        direccion:   data.direccion   || f.direccion,
      }));
      setError("");
    } catch {
      setError("Error al consultar SUNAT");
    } finally {
      setBuscandoRuc(false);
    }
  };

  const agregarPlanta = () =>
    setForm((f) => ({ ...f, plantas: [...f.plantas, plantaVacia()] }));

  const quitarPlanta = (idx) =>
    setForm((f) => ({ ...f, plantas: f.plantas.filter((_, i) => i !== idx) }));

  const actualizarPlanta = (idx, campo, valor) =>
    setForm((f) => ({
      ...f,
      plantas: f.plantas.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p)),
    }));

  const agregarContacto = (idxPlanta) =>
    setForm((f) => ({
      ...f,
      plantas: f.plantas.map((p, i) => (i === idxPlanta ? { ...p, contactos: [...p.contactos, contactoVacio()] } : p)),
    }));

  const quitarContacto = (idxPlanta, idxContacto) =>
    setForm((f) => ({
      ...f,
      plantas: f.plantas.map((p, i) =>
        i === idxPlanta ? { ...p, contactos: p.contactos.filter((_, j) => j !== idxContacto) } : p
      ),
    }));

  const actualizarContacto = (idxPlanta, idxContacto, campo, valor) =>
    setForm((f) => ({
      ...f,
      plantas: f.plantas.map((p, i) =>
        i === idxPlanta
          ? { ...p, contactos: p.contactos.map((c, j) => (j === idxContacto ? { ...c, [campo]: valor } : c)) }
          : p
      ),
    }));

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setModal(true);
  };

  const abrirEditar = (empresa) => {
    setEditando(empresa);
    setForm({
      razonSocial: empresa.razonSocial,
      ruc: empresa.ruc,
      direccion: empresa.direccion || "",
      alias: empresa.alias || "",
      requiereHes: empresa.requiereHes || false,
      requiereActaConformidad: empresa.requiereActaConformidad || false,
      plantas: (empresa.plantas || []).map((p) => ({
        nombre: p.nombre || "",
        ubigeo: p.ubigeo || "",
        direccion: p.direccion || "",
        contactos: p.contactos || [],
      })),
    });
    setError("");
    setModal(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.razonSocial.trim() || !form.ruc.trim()) {
      setError("Razón social y RUC son obligatorios.");
      return;
    }
    setCargando(true);
    setError("");
    try {
      const res = await fetchAuth(
        editando ? `/empresas/${editando._id}` : "/empresas",
        { method: editando ? "PUT" : "POST", body: JSON.stringify(form) }
      );
      const data = await res.json();
      if (!res.ok) return setError(data.mensaje || "Error al guardar");
      await cargar();
      setModal(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 m-0">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Empresas</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o RUC…"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            onClick={abrirNuevo}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
          >
            + Nueva empresa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-500 text-white text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Alias</th>
              <th className="px-4 py-3 text-left">Razón social</th>
              <th className="px-4 py-3 text-left">RUC</th>
              <th className="px-4 py-3 text-left">Contacto</th>
              <th className="px-4 py-3 text-center">HES / Acta</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {filtro ? "Sin resultados para la búsqueda" : "Sin empresas registradas"}
                </td>
              </tr>
            ) : (
              empresasFiltradas.map((e) => {
                const contacto = primerContacto(e);
                return (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-400 text-xs">{e.codigo}</td>
                  <td className="px-4 py-3 font-medium">{e.alias}</td>
                  <td className="px-4 py-3">{e.razonSocial}</td>
                  <td className="px-4 py-3">{e.ruc}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {contacto ? `${contacto.nombre}${contacto.telefono ? ` · ${contacto.telefono}` : ""}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.requiereHes && <span className="inline-block px-1.5 py-0.5 mr-1 rounded bg-amber-50 text-amber-700 text-[10px] font-medium">HES</span>}
                    {e.requiereActaConformidad && <span className="inline-block px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-medium">Acta</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirEditar(e)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4">
              {editando ? "Editar empresa" : "Nueva empresa"}
            </h3>

            {error && (
              <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1" >
                  Razón social
                </label>
                <input
                  disabled
                  name="razonSocial"
                  value={form.razonSocial}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  RUC
                  {buscandoRuc && <span className="ml-2 text-gray-400 font-normal">Consultando SUNAT…</span>}
                </label>
                <input
                  name="ruc"
                  value={form.ruc}
                  onChange={handleChange}
                  onBlur={(e) => buscarRuc(e.target.value)}
                  required
                  maxLength={11}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Alias</label>
                <input
                  name="alias"
                  value={form.alias}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1" >
                  Dirección
                </label>
                <input
                  disabled
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
              </div>
              {/* Requisitos de facturación */}
              <div className="col-span-2 flex gap-6 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" name="requiereHes" checked={form.requiereHes} onChange={handleChange} className="accent-gray-800 w-4 h-4" />
                  Exige HES antes de facturar
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" name="requiereActaConformidad" checked={form.requiereActaConformidad} onChange={handleChange} className="accent-gray-800 w-4 h-4" />
                  Exige Acta de Conformidad
                </label>
              </div>

              {/* Plantas + contactos */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-gray-600">Plantas</label>
                  <button
                    type="button"
                    onClick={agregarPlanta}
                    className="text-xs text-gray-500 hover:text-gray-800 transition"
                  >
                    + Agregar planta
                  </button>
                </div>
                {form.plantas.length === 0 && (
                  <p className="text-xs text-gray-300 text-center py-3 border border-dashed border-gray-100 rounded-lg">
                    Sin plantas registradas
                  </p>
                )}
                <div className="space-y-3">
                  {form.plantas.map((planta, idxPlanta) => (
                    <div key={idxPlanta} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={planta.nombre}
                          onChange={(e) => actualizarPlanta(idxPlanta, "nombre", e.target.value)}
                          placeholder="Nombre de la planta"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => quitarPlanta(idxPlanta)}
                          className="text-gray-400 hover:text-red-500 transition text-base leading-none px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={planta.direccion}
                          onChange={(e) => actualizarPlanta(idxPlanta, "direccion", e.target.value)}
                          placeholder="Dirección de la planta"
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                        <input
                          value={planta.ubigeo}
                          onChange={(e) => actualizarPlanta(idxPlanta, "ubigeo", e.target.value)}
                          placeholder="Ubigeo (6 dígitos)"
                          maxLength={6}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>

                      <div className="pl-2 space-y-1.5">
                        {planta.contactos.map((contacto, idxContacto) => (
                          <div key={idxContacto} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 items-center">
                            <input
                              value={contacto.nombre}
                              onChange={(e) => actualizarContacto(idxPlanta, idxContacto, "nombre", e.target.value)}
                              placeholder="Nombre"
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                            <input
                              value={contacto.telefono}
                              onChange={(e) => actualizarContacto(idxPlanta, idxContacto, "telefono", e.target.value)}
                              placeholder="Teléfono"
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                            <input
                              value={contacto.correo}
                              onChange={(e) => actualizarContacto(idxPlanta, idxContacto, "correo", e.target.value)}
                              placeholder="Correo"
                              className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => quitarContacto(idxPlanta, idxContacto)}
                              className="text-gray-300 hover:text-red-500 transition text-sm leading-none"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => agregarContacto(idxPlanta)}
                          className="text-xs text-gray-400 hover:text-gray-700 transition"
                        >
                          + Agregar contacto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition disabled:opacity-50"
                >
                  {cargando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
