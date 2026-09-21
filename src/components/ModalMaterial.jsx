import { useState } from "react";
import { fetchAuth } from "../utils/fetchAuth";

const INP = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full";

export default function ModalMaterial({ material, ubicaciones, tiposComponente, categorias, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre: material?.nombre || "",
    descripcion: material?.descripcion || "",
    codigo: material?.codigo || "",
    unidad: material?.unidad || "und",
    stockMinimo: material?.stockMinimo ?? 0,
    tipoMaterial: material?.tipoMaterial || "repuesto",
    ubicacion: material?.ubicacion?._id || "",
    tipoComponente: material?.tipoComponente?._id || "",
    categoria: material?.categoria?._id || "",
    activo: material?.activo ?? true,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "tipoComponente" ? { categoria: "" } : {}),
    }));
  };

  const categoriasFiltradas = categorias.filter((c) => c.tipoComponente?._id === form.tipoComponente);

  const guardar = async () => {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!form.tipoMaterial) return setError("El centro de costo es obligatorio.");
    setError("");
    setGuardando(true);

    const payload = { ...form, stockMinimo: Number(form.stockMinimo) || 0 };
    const url = material ? `/materiales/${material._id}` : "/materiales";
    const res = await fetchAuth(url, {
      method: material ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onGuardado(await res.json());
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.mensaje || "No se pudo guardar el material.");
    }
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-800">{material ? `Editar ${material.sku}` : "Nuevo Material (SKU)"}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className={INP} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className={`${INP} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Código de clasificación</label>
              <input name="codigo" value={form.codigo} onChange={handleChange} placeholder="Opcional" className={INP} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Unidad</label>
              <input name="unidad" value={form.unidad} onChange={handleChange} className={INP} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Centro de costo *</label>
              <select name="tipoMaterial" value={form.tipoMaterial} onChange={handleChange} className={INP}>
                <option value="repuesto">Repuesto</option>
                <option value="consumible">Consumible</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Stock mínimo</label>
              <input type="number" min="0" name="stockMinimo" value={form.stockMinimo} onChange={handleChange} className={INP} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Ubicación</label>
            <select name="ubicacion" value={form.ubicacion} onChange={handleChange} className={INP}>
              <option value="">Sin ubicación</option>
              {ubicaciones.map((u) => <option key={u._id} value={u._id}>{u.codigo} — {u.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tipo de componente</label>
              <select name="tipoComponente" value={form.tipoComponente} onChange={handleChange} className={INP}>
                <option value="">Sin clasificar</option>
                {tiposComponente.map((t) => <option key={t._id} value={t._id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Categoría</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} disabled={!form.tipoComponente} className={INP}>
                <option value="">Sin categoría</option>
                {categoriasFiltradas.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          {material && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
              Activo
            </label>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando}
            className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
