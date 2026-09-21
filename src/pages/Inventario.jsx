import { useState, useEffect } from "react";
import { fetchAuth } from "../utils/fetchAuth";
import * as XLSX from "xlsx";

const SELECT = "border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300";

export default function Inventario() {
  const [materiales, setMateriales] = useState([]);
  const [tiposComponente, setTiposComponente] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchAuth("/materiales").then((r) => r.ok ? r.json() : []),
      fetchAuth("/tipos-componente").then((r) => r.ok ? r.json() : []),
      fetchAuth("/categorias-componente").then((r) => r.ok ? r.json() : []),
    ]).then(([mats, tipos, cats]) => {
      setMateriales(mats);
      setTiposComponente(tipos);
      setCategorias(cats);
    });
  }, []);

  const categoriasFiltradas = categorias.filter((c) => !filtroTipo || c.tipoComponente?._id === filtroTipo);

  const filtrados = materiales.filter((m) => {
    const txt = busqueda.toLowerCase();
    const matchBusq = !txt || m.nombre.toLowerCase().includes(txt) || m.sku.toLowerCase().includes(txt) || m.codigo?.toLowerCase().includes(txt);
    const matchTipo = !filtroTipo || m.tipoComponente?._id === filtroTipo;
    const matchCategoria = !filtroCategoria || m.categoria?._id === filtroCategoria;
    const matchStock = !soloBajoStock || m.stock <= m.stockMinimo;
    return matchBusq && matchTipo && matchCategoria && matchStock;
  });

  const exportarExcel = () => {
    const datos = filtrados.map((m) => ({
      SKU: m.sku,
      Nombre: m.nombre,
      "Centro de costo": m.tipoMaterial,
      Unidad: m.unidad,
      Ubicación: m.ubicacion?.nombre || "—",
      "Tipo componente": m.tipoComponente?.nombre || "—",
      Categoría: m.categoria?.nombre || "—",
      Stock: m.stock,
      "Stock mínimo": m.stockMinimo,
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "inventario.xlsx");
  };

  return (
    <div className="p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Inventario</h2>
          <p className="text-xs text-gray-400 mt-0.5">{filtrados.length} de {materiales.length} materiales</p>
        </div>
        <button onClick={exportarExcel} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
          Exportar Excel
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por SKU, nombre o código…"
          className={`${SELECT} flex-1 min-w-60`} />
        <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setFiltroCategoria(""); }} className={SELECT}>
          <option value="">Todo tipo de componente</option>
          {tiposComponente.map((t) => <option key={t._id} value={t._id}>{t.nombre}</option>)}
        </select>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={SELECT}>
          <option value="">Toda categoría</option>
          {categoriasFiltradas.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={soloBajoStock} onChange={(e) => setSoloBajoStock(e.target.checked)} />
          Solo bajo stock mínimo
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-500 text-white text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Clasificación</th>
                <th className="px-4 py-3 text-left">Ubicación</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin resultados</td></tr>
              ) : filtrados.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{m.sku}</td>
                  <td className="px-4 py-3 text-gray-700">{m.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.tipoComponente?.nombre || "—"}{m.categoria?.nombre ? ` / ${m.categoria.nombre}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.ubicacion?.nombre || "—"}</td>
                  <td className={`px-4 py-3 text-right font-medium tabular-nums ${m.stock <= m.stockMinimo ? "text-red-600" : "text-gray-800"}`}>
                    {m.stock}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-500">{m.stockMinimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
